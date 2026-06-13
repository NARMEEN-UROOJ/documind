import logging
from langgraph.graph import StateGraph, END
from app.core.agent.state import AgentState
from app.core.agent.nodes import retrieve_docs, generate_answer

logger = logging.getLogger(__name__)


def build_graph():
    """
    Simplified RAG graph — no web search fallback.
    Always answers from uploaded documents only.
    retrieve → generate → END
    """
    graph = StateGraph(AgentState)

    graph.add_node("retrieve", retrieve_docs)
    graph.add_node("generate", generate_answer)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)

    return graph.compile()


agent = build_graph()