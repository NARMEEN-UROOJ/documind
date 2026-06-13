from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── LLM Providers ─────────────────────────────────────────
    openai_api_key: str
    groq_api_key: str = ""

    # ── Vector Database ────────────────────────────────────────
    pinecone_api_key: str
    pinecone_index: str = "documind"
    pinecone_host: str = ""

    # ── CRAG Web Search ────────────────────────────────────────
    tavily_api_key: str

    # ── Model names ────────────────────────────────────────────
    embedding_model: str = "all-MiniLM-L6-v2"
    llm_model: str = "llama-3.1-8b-instant"    # Groq — free and fast
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # ── RAG settings ───────────────────────────────────────────
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_retrieval: int = 20   # retrieve top 20, rerank down to top 5
    top_k_rerank: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()