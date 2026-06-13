import logging
import uuid
from pinecone import Pinecone
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

pc    = Pinecone(api_key=settings.pinecone_api_key)
index = pc.Index(settings.pinecone_index)


def upsert_chunks(chunks: list[dict], namespace: str = "default") -> int:
    vectors = []
    for chunk in chunks:
        vectors.append({
            "id":     str(uuid.uuid4()),
            "values": chunk["embedding"],
            "metadata": {
                "text":        chunk["text"],
                "source":      chunk["source"],
                "page_num":    chunk["page_num"],
                "chunk_index": chunk["chunk_index"],
            }
        })

    batch_size = 100
    total = 0
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)
        total += len(batch)
        logger.info(f"Upserted {total}/{len(vectors)} vectors → namespace '{namespace}'")

    logger.info(f"Stored {total} vectors in namespace '{namespace}'")
    return total


def query_index(
    query_embedding: list[float],
    top_k: int = 20,
    namespace: str = "default",
) -> list[dict]:
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        namespace=namespace,
    )

    return [
        {
            "text":     m.metadata.get("text", ""),
            "source":   m.metadata.get("source", ""),
            "page_num": m.metadata.get("page_num", 0),
            "score":    m.score,
        }
        for m in results.matches
    ]


def delete_document(source_name: str, namespace: str = "default") -> None:
    index.delete(
        filter={"source": {"$eq": source_name}},
        namespace=namespace,
    )
    logger.info(f"Deleted vectors for '{source_name}' in namespace '{namespace}'")


def clear_namespace(namespace: str) -> None:
    """Wipe every vector in a session namespace."""
    try:
        index.delete(delete_all=True, namespace=namespace)
        logger.info(f"Cleared namespace '{namespace}'")
    except Exception as e:
        logger.warning(f"Could not clear namespace '{namespace}': {e}")