from pydantic import BaseModel


class ChatRequest(BaseModel):
    question:     str
    chat_history: list[dict] = []
    session_id:   str        = "default"


class Citation(BaseModel):
    source:   str
    page_num: int
    snippet:  str = ""