# ⚙️ DocAnalyst Backend

FastAPI-powered asynchronous backend implementing a Retrieval-Augmented Generation (RAG) pipeline with ChromaDB and Google Gemini.

---

## 🌟 Architecture & Features

- **Document Processing**: Extracts text per-page using `pypdf` with sliding window chunking (2000 chars size, 1500 chars step).
- **Local Embeddings**: Uses ChromaDB's default ONNX embedding function, eliminating external embedding API latency and rate limits.
- **RAG & Synthesis**: Leverages Google GenAI with automatic model fallback (`gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.5-flash-lite`) and exponential backoff retry for resilience against rate limits.
- **Real-Time Streaming**: Server-Sent Events (`/stream`) delivering response tokens as they are generated.
- **Authentication**: JWT bearer token authentication with bcrypt password hashing via `passlib`.

---

## 🚀 Setup & Execution

### 1. Requirements

- Python 3.10+
- Google Gemini API key

### 2. Environment Variables

Create `.env` inside `backend/` or in the project root:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Installation

```bash
# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

---

## 📋 API Endpoints Summary

- `POST /register`: Register user (`username`, `password`)
- `POST /login`: Log in and receive JWT token
- `POST /upload`: Upload PDF (`multipart/form-data`) -> returns chunk count, summary, and suggested questions
- `POST /query`: Non-streaming question answering
- `POST /stream`: Streaming question answering via SSE
- `DELETE /document/{filename}`: Delete document from vector database and storage
