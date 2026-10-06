import os
import re
import json
import time
import chromadb
from chromadb.utils import embedding_functions
from concurrent.futures import ThreadPoolExecutor
from google import genai
from pypdf import PdfReader

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BACKEND_DIR, "chroma_db")
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploaded_docs")
COLLECTION_NAME = "documents"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Local embedding using chromadb's built-in ONNX model (no tensorflow, no API calls)
_chroma_ef = embedding_functions.DefaultEmbeddingFunction()


def get_client():
    return genai.Client(api_key=os.environ["GOOGLE_API_KEY"])


def clean_text(text: str) -> str:
    """Remove markdown asterisk formatting Gemini sometimes outputs."""
    import re
    # Convert **bold** to UPPERCASE bold word (keep readable)
    text = re.sub(r'\*\*(.+?)\*\*', lambda m: m.group(1).upper(), text)
    # Convert *italic* → plain
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    # Convert lone * bullets → - bullets
    text = re.sub(r'^\* ', '- ', text, flags=re.MULTILINE)
    return text


class RAGPipeline:
    def __init__(self):
        self.chroma = chromadb.PersistentClient(path=CHROMA_PATH)
        self.collection = self.chroma.get_or_create_collection(COLLECTION_NAME)
        self.active_source: str | None = None

    # ---------- internal helpers ----------

    def _embed(self, texts: list[str]) -> list[list[float]]:
        result = _chroma_ef(texts)
        return [list(map(float, v)) for v in result]

    def _embed_query(self, text: str) -> list[float]:
        result = _chroma_ef([text])
        return list(map(float, result[0]))

    def _generate(self, prompt: str) -> str:
        """Call Gemini with retry + model fallback."""
        client = get_client()
        models_to_try = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"]
        last_error = None
        for model in models_to_try:
            for attempt in range(4):
                try:
                    response = client.models.generate_content(model=model, contents=prompt)
                    return response.text
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        wait = [3, 6, 12, 20][attempt]
                        time.sleep(wait)
                        continue
                    if "503" in err_str or "UNAVAILABLE" in err_str:
                        time.sleep(2)
                        continue
                    break
        raise Exception(str(last_error))

    def _extract_sample(self, file_path: str, max_chars: int = 3000) -> str:
        reader = PdfReader(file_path)
        sample = ""
        for page in reader.pages:
            sample += (page.extract_text() or "")
            if len(sample) >= max_chars:
                break
        return sample[:max_chars]

    def process_pdf(self, file_path: str) -> int:
        base = os.path.basename(file_path)

        # Skip re-embedding if already indexed
        existing = self.collection.get(where={"source": base})
        if existing["ids"]:
            self.active_source = base
            return len(existing["ids"])

        reader = PdfReader(file_path)
        chunks, metadatas, ids = [], [], []

        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            step, size = 1500, 2000
            for i, start in enumerate(range(0, max(len(text), 1), step)):
                chunk = text[start: start + size]
                if chunk.strip():
                    chunks.append(chunk)
                    metadatas.append({"source": base, "page": page_num})
                    ids.append(f"{base}_p{page_num}_c{i}")

        if not chunks:
            self.active_source = base
            return 0

        # All chunks embedded locally in one fast batch — pass directly to chroma
        self.collection.upsert(
            ids=ids,
            documents=chunks,
            metadatas=metadatas,
            embeddings=self._embed(chunks),
        )
        self.active_source = base
        return len(chunks)

    def summarize(self, file_path: str) -> str:
        """One-paragraph executive summary of the document."""
        sample = self._extract_sample(file_path)
        prompt = (
            "You are a professional document analyst. "
            "Write a single concise paragraph (3-5 sentences) summarizing the key points of the following document. "
            "Be specific and professional. Do not use bullet points.\n\n"
            f"Document:\n{sample}"
        )
        return clean_text(self._generate(prompt))

    def suggest_questions(self, file_path: str) -> list[str]:
        """Generate 4 insightful questions about the document."""
        sample = self._extract_sample(file_path)
        prompt = (
            "Based on the document below, generate exactly 4 specific and insightful questions "
            "a reader would want answered. "
            'Return ONLY a JSON array of 4 strings, nothing else. Example: ["Q1","Q2","Q3","Q4"]\n\n'
            f"Document:\n{sample}"
        )
        raw = self._generate(prompt)
        match = re.search(r'\[.*?\]', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())[:4]
            except Exception:
                pass
        lines = [l.strip().lstrip('-•*0123456789.)').strip().strip('"') for l in raw.splitlines() if l.strip()]
        return [l for l in lines if l][:4]

    def delete_document(self, filename: str):
        """Remove all chunks for a given filename from the vector store."""
        results = self.collection.get(where={"source": filename})
        ids = results.get("ids", [])
        if ids:
            self.collection.delete(ids=ids)
        if self.active_source == filename:
            self.active_source = None

    def query_stream(self, question: str):
        """
        Generator that yields SSE-formatted events:
          - First: 'sources' event with JSON array
          - Then: 'token' events, one per chunk of text
          - Finally: 'done' event
        """
        if not self.active_source:
            yield "event: error\ndata: Please upload a document first.\n\n"
            return

        active_docs = self.collection.get(where={"source": self.active_source})
        count = len(active_docs["ids"])
        if count == 0:
            yield "event: error\ndata: System empty. Please upload a document first.\n\n"
            return

        query_embedding = self._embed_query(question)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(4, count),
            include=["documents", "metadatas"],
            where={"source": self.active_source},
        )
        docs = results["documents"][0]
        metas = results["metadatas"][0]

        sources = [
            {"source": m.get("source", "Unknown"), "page": m.get("page", 0) + 1, "preview": d[:100] + "..."}
            for d, m in zip(docs, metas)
        ]
        yield f"event: sources\ndata: {json.dumps(sources)}\n\n"

        context = "\n\n---\n\n".join(docs)
        prompt = (
            "You are a professional assistant helping a user understand a document.\n"
            "Use the document context below as your PRIMARY source. "
            "If the context partially answers the question, use it and supplement with your own knowledge to give a complete, useful answer. "
            "If the context has no relevant information at all, answer from your general knowledge and mention that the document did not cover this topic.\n"
            "Never say you cannot answer — always provide the most helpful response possible.\n"
            "Format your response using plain text only. For bullet points use '- ' (dash space). Do NOT use asterisks (*) for bullets or bold text. Use CAPS for emphasis instead.\n\n"
            f"Document context:\n{context}\n\nQuestion: {question}"
        )

        client = get_client()
        models_to_try = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"]
        last_error = None
        for model in models_to_try:
            for attempt in range(4):
                try:
                    for chunk in client.models.generate_content_stream(model=model, contents=prompt):
                        text = chunk.text or ""
                        if text:
                            cleaned = clean_text(text)
                            escaped = cleaned.replace("\n", "\\n")
                            yield f"event: token\ndata: {escaped}\n\n"
                    yield "event: done\ndata: \n\n"
                    return
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        wait = [3, 6, 12, 20][attempt]
                        time.sleep(wait)
                        continue
                    if "503" in err_str or "UNAVAILABLE" in err_str:
                        time.sleep(2)
                        continue
                    break  # non-retryable, try next model

        err_str = str(last_error)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            friendly = "Rate limit reached. You've exceeded the free tier quota (20 requests/min). Please wait a moment and try again."
        else:
            friendly = err_str
        yield f"event: error\ndata: {friendly}\n\n"

    def query(self, question: str) -> dict:
        if not self.active_source:
            return {"answer": "Please upload a document first.", "sources": []}

        # Count only chunks belonging to the active document
        active_docs = self.collection.get(where={"source": self.active_source})
        count = len(active_docs["ids"])
        if count == 0:
            return {"answer": "System empty. Please upload a document first.", "sources": []}

        query_embedding = self._embed_query(question)

        # Filter to only the currently active document
        where_filter = {"source": self.active_source} if self.active_source else None

        query_kwargs = dict(
            query_embeddings=[query_embedding],
            n_results=min(4, count),
            include=["documents", "metadatas"],
        )
        if where_filter:
            query_kwargs["where"] = where_filter

        results = self.collection.query(**query_kwargs)
        docs = results["documents"][0]
        metas = results["metadatas"][0]

        context = "\n\n---\n\n".join(docs)
        sources = [
            {
                "source": m.get("source", "Unknown"),
                "page": m.get("page", 0) + 1,
                "preview": d[:100] + "...",
            }
            for d, m in zip(docs, metas)
        ]

        prompt = (
            "You are a professional assistant helping a user understand a document.\n"
            "Use the document context below as your PRIMARY source. "
            "If the context partially answers the question, use it and supplement with your own knowledge to give a complete, useful answer. "
            "If the context has no relevant information at all, answer from your general knowledge and mention that the document did not cover this topic.\n"
            "Never say you cannot answer — always provide the most helpful response possible.\n"
            "Format your response using plain text only. For bullet points use '- ' (dash space). Do NOT use asterisks (*) for bullets or bold text. Use CAPS for emphasis instead.\n\n"
            f"Document context:\n{context}\n\nQuestion: {question}"
        )
        answer = self._generate(prompt)
        return {"answer": clean_text(answer), "sources": sources}
