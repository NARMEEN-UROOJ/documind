import json
import logging
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from langchain_core.messages import HumanMessage, AIMessage
from app.core.agent.graph import agent
from app.core.agent.state import AgentState
from app.models.chat import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    history = []
    for msg in request.chat_history:
        if msg.get("role") == "human":
            history.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            history.append(AIMessage(content=msg["content"]))

    async def event_stream():
        result = await run_in_threadpool(
            agent.invoke,
            AgentState(
                question         = request.question,
                documents        = [],
                generation       = "",
                needs_web_search = False,
                chat_history     = history,
                sources          = [],
                session_id       = request.session_id,
            )
        )

        answer = result["generation"]

        seen, sources = set(), []
        for s in result.get("sources", []):
            key = (s["source"], s.get("page_num", 0))
            if key not in seen:
                seen.add(key)
                sources.append(s)

        for word in answer.split(" "):
            payload = json.dumps({"type": "token", "content": word + " "})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.02)

        yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )