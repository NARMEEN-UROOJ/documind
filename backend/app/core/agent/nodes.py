import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.config import get_settings
from app.core.agent.state import AgentState
from app.core.retrieval.hybrid_search import hybrid_search
from app.core.retrieval.reranker import rerank
from app.core.ingestion.embedder import get_model

logger = logging.getLogger(__name__)
settings = get_settings()

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model=settings.llm_model,
    temperature=0,
    streaming=True,
)


def retrieve_docs(state: AgentState) -> AgentState:
    question   = state["question"]
    session_id = state.get("session_id", "default")
    logger.info(f"[{session_id}] Retrieving docs for: '{question}'")

    model           = get_model()
    query_embedding = model.encode(question).tolist()

    candidates = hybrid_search(
        question, query_embedding, top_k=20, namespace=session_id
    )
    ranked = rerank(question, candidates, top_k=8)

    return {**state, "documents": ranked}


def generate_answer(state: AgentState) -> AgentState:
    question  = state["question"]
    documents = state["documents"]
    history   = state.get("chat_history", [])

    # No documents found at all
    if not documents:
        return {
            **state,
            "generation": (
                "I could not find any relevant information in your uploaded documents. "
                "Please make sure a document is attached and try rephrasing your question."
            ),
            "sources": [],
        }

    # Identify which documents are in context
    unique_sources = list({doc["source"] for doc in documents})
    doc_count      = len(unique_sources)

    if doc_count == 1:
        doc_note = f"You have one document in context: **{unique_sources[0]}**"
    else:
        listed   = ", ".join(f"**{s}**" for s in unique_sources)
        doc_note = f"You have {doc_count} documents in context: {listed}"

    # Build context string with clear source labels
    context = "\n\n".join([
        f"[Document: {doc['source']} | Page {int(doc['page_num'])}]\n{doc['text']}"
        for doc in documents
    ])

    system_content = f"""You are DocuMind, an intelligent multi-document assistant.
{doc_note}

Rules you must follow:
1. Answer ONLY from the context provided below — never use outside knowledge or make things up.
2. If the answer exists in ONE document: answer from that document and cite its name and page number.
3. If the answer exists in MULTIPLE documents: present what each document says separately, \
note where they agree or differ, and cite each one with name and page.
4. If documents give CONFLICTING information: present both sides clearly with their sources.
5. If the question cannot be answered from any document: respond with exactly — \
"I could not find this information in the uploaded documents."
6. Every claim you make must include a citation: document name and page number.
7. Format your response using markdown — bold key terms, use bullet points and numbered lists.

Context from uploaded documents:
{{context}}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_content),
        *history,
        ("human", "{question}"),
    ])

    response = (prompt | llm).invoke({
        "context":  context,
        "question": question,
    })

    sources = [
        {
            "source":   doc["source"],
            "page_num": int(doc["page_num"]),
            "snippet":  doc.get("text", "")[:180].strip(),
        }
        for doc in documents
    ]

    logger.info(f"Answer generated — {doc_count} source document(s) used")
    return {**state, "generation": response.content, "sources": sources}