import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import documents, chat
from app.api.dependencies import preload_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DocuMind API — pre-loading models...")
    preload_models()
    logger.info("All models ready. Server is live.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title       = "DocuMind API",
    description = "Agentic RAG pipeline — hybrid search, reranking, CRAG",
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "DocuMind API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}