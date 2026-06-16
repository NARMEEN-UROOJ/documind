# DocuMind

**Multi-document intelligence platform powered by RAG.**  
Upload any document, ask questions in natural language, and get cited answers that reference the exact source and page.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-F55036?style=flat-square)

---

## Features

- **Hybrid search** — BM25 keyword matching combined with semantic vector search, merged via Reciprocal Rank Fusion
- **Cross-encoder reranking** — retrieved chunks are re-scored by a second neural model for higher precision
- **Multi-document intelligence** — upload several files and ask questions across all of them simultaneously; the LLM synthesises answers from whichever documents contain the relevant information
- **Cited answers** — every response includes the source document name and page number, clickable to open the original file
- **Auto-suggested questions** — after each upload, 5 relevant questions are generated automatically so you know where to start
- **Document summary** — a 2-sentence summary appears instantly after uploading so you know what the file contains
- **Multi-format support** — PDF, DOCX, TXT, and Markdown
- **Session isolation** — each browser session gets a private Pinecone namespace; documents are never mixed between users
- **Streaming responses** — answers stream word by word in real time
- **Dark and light mode**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| LLM | Groq (llama-3.1-8b-instant) |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 (local) |
| Vector database | Pinecone |
| Reranker | cross-encoder/ms-marco-MiniLM-L-6-v2 (local) |
| BM25 | rank-bm25 |
| Document parsing | PyMuPDF, python-docx |
| RAG framework | LangChain, LangGraph |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Getting Started

### Prerequisites

- Python 3.11
- Node.js 18+
- Pinecone account (free tier)
- Groq API key (free tier)
- Tavily API key (free tier, optional — used for web fallback)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/documind.git
cd documind
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
OPENAI_API_KEY=sk-...          # optional, not used in current setup
GROQ_API_KEY=gsk_...
PINECONE_API_KEY=...
PINECONE_INDEX=documind
TAVILY_API_KEY=tvly-...
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pinecone index setup

Go to [app.pinecone.io](https://app.pinecone.io) and create an index with:

| Setting | Value |
|---|---|
| Name | `documind` |
| Dimensions | `384` |
| Metric | `cosine` |

---

## How it works

```
Upload document
      │
      ▼
Parse (PyMuPDF / python-docx)
      │
      ▼
Chunk (1000 chars, 200 overlap)
      │
      ▼
Embed (sentence-transformers, 384-dim)
      │
      ▼
Store in Pinecone (session namespace)
      │
      ▼
User asks question
      │
      ▼
Hybrid search — BM25 + semantic (top 40)
      │
      ▼
Cross-encoder reranker (top 8)
      │
      ▼
Groq LLM generates cited answer
      │
      ▼
Stream tokens → frontend
```

---

## Project structure

```
documind/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # documents, chat endpoints
│   │   ├── core/
│   │   │   ├── ingestion/     # parser, chunker, embedder
│   │   │   ├── retrieval/     # vector store, hybrid search, reranker
│   │   │   └── agent/         # LangGraph graph, nodes, state
│   │   ├── models/            # Pydantic schemas
│   │   └── main.py
│   └── requirements.txt
│
└── frontend/
    ├── app/                   # Next.js App Router pages
    ├── components/            # React UI components
    └── lib/                   # API client, types, hooks
```

---

## Deployment

### Backend → Railway

1. Push code to GitHub
2. Create a new Railway project and connect the repo
3. Set the root directory to `backend`
4. Add all environment variables from `.env`
5. Railway detects the `Dockerfile` automatically

### Frontend → Vercel

1. Create a new Vercel project and connect the repo
2. Set the root directory to `frontend`
3. Add one environment variable: `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy

---

## License

MIT