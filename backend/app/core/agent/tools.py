import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def web_search(query: str) -> list[dict]:
    """
    Fallback web search via Tavily.
    Returns empty list gracefully if API key is missing or invalid.
    """
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=settings.tavily_api_key)
        response = client.search(query=query, max_results=3)

        results = []
        for r in response.get("results", []):
            results.append({
                "text":         r.get("content", ""),
                "source":       r.get("url", "web search"),
                "page_num":     0,
                "rerank_score": r.get("score", 0.0),
            })

        logger.info(f"Web search returned {len(results)} results")
        return results

    except Exception as e:
        logger.warning(f"Web search unavailable: {e} — answering from documents only")
        return []