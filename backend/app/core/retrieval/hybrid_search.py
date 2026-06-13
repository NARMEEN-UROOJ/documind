import logging
from rank_bm25 import BM25Okapi
from app.core.retrieval.vector_store import query_index

logger = logging.getLogger(__name__)


def hybrid_search(
    query: str,
    query_embedding: list[float],
    top_k: int = 20,
    namespace: str = "default",
) -> list[dict]:
    """
    Combines semantic (Pinecone) + keyword (BM25) search
    via Reciprocal Rank Fusion inside the caller's namespace.
    """
    # 1. Semantic search
    candidates = query_index(query_embedding, top_k=top_k * 2, namespace=namespace)

    if not candidates:
        return []

    # 2. BM25 on candidates
    texts     = [c["text"] for c in candidates]
    tokenized = [t.lower().split() for t in texts]
    bm25      = BM25Okapi(tokenized)
    bm25_scores = bm25.get_scores(query.lower().split())

    bm25_ranked = sorted(
        range(len(bm25_scores)),
        key=lambda i: bm25_scores[i],
        reverse=True,
    )

    # 3. Reciprocal Rank Fusion
    K = 60
    rrf: dict[str, dict] = {}

    for rank, chunk in enumerate(candidates):
        key = chunk["text"]
        if key not in rrf:
            rrf[key] = {"chunk": chunk, "score": 0.0}
        rrf[key]["score"] += 1.0 / (K + rank + 1)

    for rank, idx in enumerate(bm25_ranked):
        key = candidates[idx]["text"]
        if key not in rrf:
            rrf[key] = {"chunk": candidates[idx], "score": 0.0}
        rrf[key]["score"] += 1.0 / (K + rank + 1)

    merged  = sorted(rrf.values(), key=lambda x: x["score"], reverse=True)
    results = [item["chunk"] for item in merged[:top_k]]

    logger.info(
        f"Hybrid search (ns='{namespace}'): "
        f"{len(candidates)} candidates → {len(results)} after RRF"
    )
    return results