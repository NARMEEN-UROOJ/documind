import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


def chunk_pages(
    pages: list[dict],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[dict]:
    """
    Split each page's text into overlapping chunks.

    Why overlap? A sentence at the edge of a chunk won't lose
    its surrounding context — the 200-char overlap carries it
    into the next chunk too.

    Args:
        pages: Output from parse_pdf()
        chunk_size: Max characters per chunk
        chunk_overlap: Characters shared between adjacent chunks

    Returns:
        List of chunk dicts:
        [{ text, source, page_num, chunk_index }, ...]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        # Order matters — tries to split at paragraph breaks first,
        # then sentences, then words, then characters
        separators=["\n\n", "\n", ".", " ", ""],
        length_function=len,
    )

    chunks = []

    for page in pages:
        page_chunks = splitter.split_text(page["text"])

        for i, chunk_text in enumerate(page_chunks):
            chunks.append({
                "text": chunk_text,
                "source": page["source"],
                "page_num": page["page_num"],
                "chunk_index": i,
            })

    logger.info(
        f"Chunked {len(pages)} pages → {len(chunks)} chunks "
        f"(size={chunk_size}, overlap={chunk_overlap})"
    )

    return chunks