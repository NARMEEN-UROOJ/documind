from typing import TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    question:         str
    documents:        list[dict]
    generation:       str
    chat_history:     list[BaseMessage]
    sources:          list[dict]
    session_id:       str