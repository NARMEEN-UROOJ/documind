from app.core.ingestion.parser import parse_pdf
from app.core.ingestion.chunker import chunk_pages
from app.core.ingestion.embedder import embed_chunks
from app.core.retrieval.vector_store import upsert_chunks, query_index

PDF_FILE = r"C:\Users\DELL\agentic rag\documind\backend\FedRansom_Research_Paper_.pdf"   # ← your PDF filename here

print("\n── Step 1: Parse ─────────────────────────────────────")
pages = parse_pdf(PDF_FILE)

if not pages:
    print("❌ No text found — PDF is scanned/image-based. Try another.")
    exit()

print(f"✅ Pages extracted: {len(pages)}")

print("\n── Step 2: Chunk ─────────────────────────────────────")
chunks = chunk_pages(pages)
print(f"✅ Chunks created: {len(chunks)}")

print("\n── Step 3: Embed ─────────────────────────────────────")
chunks = embed_chunks(chunks)          # embeds ALL chunks, not just 3
print(f"✅ Embedding dim: {len(chunks[0]['embedding'])}")

print("\n── Step 4: Store in Pinecone ─────────────────────────")
count = upsert_chunks(chunks)
print(f"✅ Vectors stored: {count}")

print("\n── Step 5: Query to verify ───────────────────────────")
results = query_index(chunks[0]["embedding"], top_k=3)
print(f"✅ Query returned: {len(results)} results")
print(f"   Top match : {results[0]['text'][:80]}...")
print(f"   Source    : {results[0]['source']}")
print(f"   Page      : {results[0]['page_num']}")
print(f"   Score     : {results[0]['score']:.4f}")

print("\n🎉 Full pipeline working — parse → chunk → embed → store → query")

# ── Step 6: Hybrid search + rerank ────────────────────────────
from app.core.retrieval.hybrid_search import hybrid_search
from app.core.retrieval.reranker import rerank

query = "How does FedRansom detect ransomware?"
query_embedding = chunks[0]["embedding"]  # reuse from earlier

hybrid_results = hybrid_search(query, query_embedding, top_k=20)
print(f"\n✅ Hybrid search: {len(hybrid_results)} results")

final = rerank(query, hybrid_results, top_k=5)
print(f"✅ After rerank: {len(final)} results")
print(f"   Best chunk  : {final[0]['text'][:100]}...")
print(f"   Source      : {final[0]['source']} | Page {final[0]['page_num']}")
print(f"   Rerank score: {final[0]['rerank_score']:.4f}")
print("\n🎉 Retrieval pipeline complete!")

# ── Step 7: Full agent test ────────────────────────────────────
from app.core.agent.graph import agent
from app.core.agent.state import AgentState

print("\n── Step 7: Agent ─────────────────────────────────────")

result = agent.invoke(AgentState(
    question         = "How does FedRansom detect ransomware?",
    documents        = [],
    generation       = "",
    needs_web_search = False,
    chat_history     = [],
    sources          = [],
))

print(f"✅ Answer:\n{result['generation']}")
print(f"\n✅ Sources used:")
for s in result["sources"]:
    print(f"   → {s['source']}  |  Page {s['page_num']}")
print("\n🎉 Agent working!")