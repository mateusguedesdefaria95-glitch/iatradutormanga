"""Optional OCR adapters for Japanese manga and multilingual comic text."""
from __future__ import annotations
import base64, binascii, io
from functools import lru_cache
from typing import Any
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_BYTES = 12 * 1024 * 1024
SUPPORTED_LANGUAGES = {"ja", "ko", "zh", "en"}

class OCRUnavailable(RuntimeError):
    pass

class InvalidImage(ValueError):
    pass

def decode_image(data_url: str) -> Image.Image:
    if not isinstance(data_url, str) or not data_url.startswith("data:image/") or "," not in data_url:
        raise InvalidImage("Envie uma imagem no formato data:image/...;base64,...")
    header, encoded = data_url.split(",", 1)
    if ";base64" not in header:
        raise InvalidImage("A imagem precisa estar codificada em base64.")
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise InvalidImage("Conteúdo base64 inválido.") from None
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise InvalidImage("Imagem vazia ou maior que o limite de 12 MB.")
    try:
        image = Image.open(io.BytesIO(raw))
        image.verify()
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        raise InvalidImage("O arquivo enviado não é uma imagem válida.") from None
    if image.width > 10000 or image.height > 16000:
        raise InvalidImage("Dimensões da imagem excedem o limite de processamento.")
    return image

@lru_cache(maxsize=1)
def _manga_ocr():
    try:
        from manga_ocr import MangaOcr
    except ImportError as exc:
        raise OCRUnavailable("OCR japonês não instalado. Instale o extra: pip install -r backend/requirements-ocr-ja.txt") from exc
    return MangaOcr()

@lru_cache(maxsize=4)
def _easy_reader(language: str):
    try:
        import easyocr
    except ImportError as exc:
        raise OCRUnavailable("OCR multilíngue não instalado. Instale o extra: pip install -r backend/requirements-ocr-multilingual.txt") from exc
    code = {"ko": "ko", "zh": "ch_sim", "en": "en"}[language]
    return easyocr.Reader([code, "en"] if code != "en" else ["en"], gpu=False)

def run_ocr(image: Image.Image, language: str) -> dict[str, Any]:
    if language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Idioma OCR não suportado: {language}")
    if language == "ja":
        engine = _manga_ocr()
        text = engine(image)
        regions = [{"text": text, "confidence": None, "box": [[0,0],[image.width,0],[image.width,image.height],[0,image.height]]}] if text.strip() else []
        engine_name = "manga-ocr"
    else:
        results = _easy_reader(language).readtext(image, detail=1, paragraph=False)
        regions = []
        for box, text, confidence in results:
            regions.append({"text": text, "confidence": round(float(confidence), 4), "box": [[round(float(x)),round(float(y))] for x,y in box]})
        engine_name = "easyocr"
    return {"language": language, "engine": engine_name, "image": {"width": image.width, "height": image.height}, "regions": regions, "text": "\n".join(r["text"] for r in regions)}
