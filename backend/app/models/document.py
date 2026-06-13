from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    filename:    str
    pages:       int
    chunks:      int
    message:     str
    summary:     str        = ""
    suggestions: list[str]  = []