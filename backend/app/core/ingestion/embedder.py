import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Loads once, stays in memory — ~80MB download on first run
_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("Loading embedding model (downloading ~80MB on first run)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model ready.")
    return _model


def embed_chunks(chunks: list[dict]) -> list[dict]:
    """
    Generate 384-dim embeddings using all-MiniLM-L6-v2.
    Runs locally — no API key, no cost, no rate limits.

    Args:
        chunks: Output from chunk_pages()

    Returns:
        Same chunks with 'embedding' key added.
    """
    model = get_model()
    texts = [chunk["text"] for chunk in chunks]

    logger.info(f"Embedding {len(texts)} chunks locally...")

    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        batch_size=32,
    )

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding.tolist()  # numpy → plain list

    logger.info(f"Done — dim: {len(embeddings[0])}")
    return chunks