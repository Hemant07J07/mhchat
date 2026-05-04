import os
from typing import Optional

MAX_TEXT_CHARS = 4000


def _read_text_file(path: str) -> str:
    with open(path, "rb") as handle:
        raw = handle.read(MAX_TEXT_CHARS * 2)
    try:
        return raw.decode("utf-8", errors="ignore")[:MAX_TEXT_CHARS]
    except Exception:
        return ""


def _read_pdf(path: str) -> str:
    try:
        from pypdf import PdfReader
    except Exception:
        return ""

    try:
        reader = PdfReader(path)
        text_parts = []
        for page in reader.pages[:5]:
            page_text = page.extract_text() or ""
            if page_text:
                text_parts.append(page_text)
            if sum(len(t) for t in text_parts) >= MAX_TEXT_CHARS:
                break
        return "\n".join(text_parts)[:MAX_TEXT_CHARS]
    except Exception:
        return ""


def _read_image(path: str) -> str:
    try:
        from PIL import Image
        import pytesseract
    except Exception:
        return ""

    try:
        with Image.open(path) as img:
            text = pytesseract.image_to_string(img)
            return (text or "").strip()[:MAX_TEXT_CHARS]
    except Exception:
        return ""


def extract_text_from_attachment(path: str, content_type: str, file_name: str) -> str:
    """Best-effort text extraction for attachments.

    Supported (when deps are installed):
    - text/* and common text files
    - application/pdf via pypdf
    - images via pytesseract + pillow
    """
    if not path or not os.path.exists(path):
        return ""

    lower_name = (file_name or "").lower()
    ct = (content_type or "").lower()

    if ct.startswith("text/") or lower_name.endswith((".txt", ".md", ".csv", ".json")):
        return _read_text_file(path)

    if ct in ("application/pdf",) or lower_name.endswith(".pdf"):
        return _read_pdf(path)

    if ct.startswith("image/") or lower_name.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")):
        return _read_image(path)

    return ""
