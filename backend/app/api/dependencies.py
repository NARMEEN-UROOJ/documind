from app.core.ingestion.embedder import get_model
from app.core.retrieval.reranker import get_reranker

def preload_models():
    """Pre-load both ML models so the first request isn't slow."""
    get_model()
    get_reranker()