import os
import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import FileResponse
from groq import Groq as GroqClient
from app.config import get_settings
from app.core.ingestion.parser import parse_file
from app.core.ingestion.chunker import chunk_pages
from app.core.ingestion.embedder import embed_chunks
from app.core.retrieval.vector_store import upsert_chunks, delete_document, clear_namespace
from app.models.document import DocumentUploadResponse

logger   = logging.getLogger(__name__)
router   = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()

UPLOAD_DIR = "uploads"
SUPPORTED  = {".pdf", ".txt", ".md", ".docx"}
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _generate_doc_intelligence(chunks: list[dict]) -> tuple[str, list[str]]:
    """Generate a 2-sentence summary and 5 suggested questions from first chunks."""
    context = "\n\n".join([c["text"] for c in chunks[:4]])[:3000]

    prompt = f"""You are a document analyst. Read the document content below carefully.

Then respond with ONLY a valid JSON object — no explanation, no markdown, just the JSON.

The JSON must have this exact structure:
{{
  "summary": "First sentence about what this document is. Second sentence about its main topics or purpose.",
  "questions": [
    "First specific question about this document",
    "Second specific question about this document",
    "Third specific question about this document",
    "Fourth specific question about this document",
    "Fifth specific question about this document"
  ]
}}

Write a REAL summary based on the actual document content below.
Write REAL questions that are specific to this document's content.
Do NOT use placeholder text.

Document content:
{context}"""

    try:
        client   = GroqClient(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model    = settings.llm_model,
            messages = [{"role": "user", "content": prompt}],
            temperature = 0.2,
            max_tokens  = 600,
        )
        text = response.choices[0].message.content.strip()

        # Strip markdown fences if present
        if "```" in text:
            parts = text.split("```")
            text  = parts[1] if len(parts) > 1 else parts[0]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        data      = json.loads(text)
        summary   = str(data.get("summary", "")).strip()
        questions = [str(q).strip() for q in data.get("questions", [])][:5]

        # Guard against placeholder text slipping through
        placeholder_words = ["placeholder", "sentence describing", "question here", "<"]
        if any(w in summary.lower() for w in placeholder_words):
            summary = ""
        questions = [
            q for q in questions
            if not any(w in q.lower() for w in placeholder_words)
        ]

        return summary, questions

    except Exception as e:
        logger.warning(f"Document intelligence generation failed: {e}")
        return "", []


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file:         UploadFile = File(...),
    x_session_id: str        = Header(default="default"),
):
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in SUPPORTED:
        raise HTTPException(400, f"'{ext}' not supported. Use: PDF, TXT, MD, DOCX")

    contents = await file.read()

    with open(os.path.join(UPLOAD_DIR, file.filename), "wb") as f:
        f.write(contents)

    pages = parse_file(contents, source_name=file.filename)
    if not pages:
        raise HTTPException(400, "No text found. File may be blank or scanned.")

    chunks = chunk_pages(pages)
    chunks = embed_chunks(chunks)
    count  = upsert_chunks(chunks, namespace=x_session_id)

    summary, suggestions = _generate_doc_intelligence(chunks)

    logger.info(
        f"[{x_session_id}] '{file.filename}' → "
        f"{len(pages)} pages, {count} vectors, {len(suggestions)} suggestions"
    )

    return DocumentUploadResponse(
        filename    = file.filename,
        pages       = len(pages),
        chunks      = count,
        message     = f"Processed {len(pages)} pages into {count} chunks.",
        summary     = summary,
        suggestions = suggestions,
    )


@router.delete("/clear-session")
async def clear_session(x_session_id: str = Header(default="default")):
    clear_namespace(x_session_id)
    return {"message": f"Session '{x_session_id}' cleared."}


@router.get("/{filename}/view")
async def view_document(filename: str):
    """
    Serve uploaded files.
    PDFs open inline in the browser.
    DOCX / TXT / MD trigger a download.
    """
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(404, f"'{filename}' not found.")

    ext = os.path.splitext(filename.lower())[1]

    if ext == ".pdf":
        return FileResponse(
            path,
            media_type = "application/pdf",
            headers    = {"Content-Disposition": f"inline; filename={filename}"},
        )
    else:
        # All other formats: trigger a download
        return FileResponse(
            path,
            media_type = "application/octet-stream",
            headers    = {"Content-Disposition": f"attachment; filename={filename}"},
        )


@router.delete("/{filename}")
async def remove_document(
    filename:     str,
    x_session_id: str = Header(default="default"),
):
    delete_document(filename, namespace=x_session_id)
    path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(path):
        os.remove(path)
    return {"message": f"Deleted '{filename}'"}