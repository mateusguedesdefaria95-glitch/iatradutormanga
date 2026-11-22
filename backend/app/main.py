import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .ocr import decode_image, run_ocr, OCRUnavailable, InvalidImage
from .translation import (
    TranslationRequest,
    TranslationUnavailable,
    TranslationProviderError,
    translate_texts,
)

API_VERSION = "0.7.0"

app = FastAPI(title="MangaTradutor AI API", version=API_VERSION, description="Backend local para OCR e tradução de páginas de mangá.")
# Por padrão nenhuma origem web é liberada: a extensão chama o backend pelo service worker,
# que não depende de CORS para 127.0.0.1:8765. Libere origens explicitamente (separadas por
# vírgula) apenas se precisar, por exemplo MANGA_ALLOWED_ORIGINS=chrome-extension://<id>.
allowed_origins = [origin.strip() for origin in os.getenv("MANGA_ALLOWED_ORIGINS", "").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

class OCRRequest(BaseModel):
    image_data_url: str
    language: str = Field(default="ja", pattern="^(ja|ko|zh|en)$")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "MangaTradutor AI API",
        "version": API_VERSION,
        "capabilities": ["image-ocr", "text-translation"],
        "translation_configured": bool(os.getenv("MANGA_TRANSLATION_API_KEY", "").strip()),
    }

@app.get("/")
async def root():
    return {"name": "MangaTradutor AI", "message": "API local ativa.", "docs": "/docs"}

@app.post("/ocr")
async def ocr(request: OCRRequest):
    try:
        image = decode_image(request.image_data_url)
        return {"status": "ok", "result": run_ocr(image, request.language)}
    except InvalidImage as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OCRUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

@app.post("/translate")
async def translate(request: TranslationRequest):
    try:
        result = await translate_texts(request)
        return {"status": "ok", "result": result}
    except TranslationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except TranslationProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
