import os
from dotenv import load_dotenv
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import aiofiles

from auth import (
    create_user, get_user, verify_password,
    create_access_token, get_current_user
)
from rag_pipeline import RAGPipeline, UPLOAD_DIR

app = FastAPI(title="DocAnalyst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = RAGPipeline()


# ---------- auth schemas ----------

class AuthRequest(BaseModel):
    username: str
    password: str


# ---------- auth endpoints ----------

@app.post("/register")
def register(req: AuthRequest):
    if len(req.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not create_user(req.username.strip(), req.password):
        raise HTTPException(status_code=409, detail="Username already taken.")
    token = create_access_token(req.username.strip())
    return {"access_token": token, "token_type": "bearer", "username": req.username.strip()}


@app.post("/login")
def login(req: AuthRequest):
    user = get_user(req.username.strip())
    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_access_token(req.username.strip())
    return {"access_token": token, "token_type": "bearer", "username": req.username.strip()}


# ---------- protected endpoints ----------

class QueryRequest(BaseModel):
    question: str


@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    try:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=3) as ex:
            f_chunks = ex.submit(pipeline.process_pdf, file_path)
            f_summary = ex.submit(pipeline.summarize, file_path)
            f_suggestions = ex.submit(pipeline.suggest_questions, file_path)
            num_chunks = f_chunks.result()
            summary = f_summary.result()
            suggestions = f_suggestions.result()
        return {
            "filename": file.filename,
            "chunks": num_chunks,
            "status": "Indexed",
            "summary": summary,
            "suggestions": suggestions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def ask_question(
    request: QueryRequest,
    current_user: str = Depends(get_current_user),
):
    try:
        return pipeline.query(request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stream")
def stream_question(
    request: QueryRequest,
    current_user: str = Depends(get_current_user),
):
    return StreamingResponse(
        pipeline.query_stream(request.question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.delete("/document/{filename}")
def delete_document(
    filename: str,
    current_user: str = Depends(get_current_user),
):
    try:
        pipeline.delete_document(filename)
        # Remove file from disk if it exists
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        return {"status": "deleted", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
