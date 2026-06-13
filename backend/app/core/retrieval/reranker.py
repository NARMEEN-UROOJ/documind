import logging
from sentence_transformers import CrossEncoder
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_reranker = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        logger.info("Loading reranker model...")
        _reranker = CrossEncoder(settings.reranker_model)
        logger.info("Reranker ready.")
    return _reranker


def rerank(query: str, chunks: list[dict], top_k: int = 8) -> list[dict]:
    """
    Re-score chunks with a cross-encoder.
    top_k raised to 8 for better multi-document coverage.
    """
    if not chunks:
        return []

    reranker = get_reranker()
    pairs    = [(query, chunk["text"]) for chunk in chunks]
    scores   = reranker.predict(pairs)

    for chunk, score in zip(chunks, scores):
        chunk["rerank_score"] = float(score)

    ranked = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)
    top    = ranked[:top_k]

    logger.info(
        f"Reranked {len(chunks)} → {len(top)} chunks | "
        f"top score: {top[0]['rerank_score']:.4f}"
    )
    return top