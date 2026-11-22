import json
import os

import httpx
from pydantic import BaseModel, Field, field_validator


class TranslationRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=80)
    source_language: str = Field(default="auto", min_length=2, max_length=12)
    target_language: str = Field(default="pt-BR", min_length=2, max_length=12)
    context: str = Field(default="", max_length=2000)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        if any(not value for value in cleaned):
            raise ValueError("Os textos não podem estar vazios.")
        if any(len(value) > 2000 for value in cleaned):
            raise ValueError("Cada trecho deve ter no máximo 2.000 caracteres.")
        if sum(map(len, cleaned)) > 12000:
            raise ValueError("A soma dos textos não pode ultrapassar 12.000 caracteres.")
        return cleaned


class TranslationUnavailable(Exception):
    pass


class TranslationProviderError(Exception):
    pass


async def translate_texts(request: TranslationRequest) -> dict:
    """Translate text regions through an OpenAI-compatible Chat Completions API.

    Credentials and provider configuration are read only from backend environment
    variables; they are never accepted from the browser extension.
    """
    api_key = os.getenv("MANGA_TRANSLATION_API_KEY", "").strip()
    endpoint = os.getenv(
        "MANGA_TRANSLATION_API_URL",
        "https://api.openai.com/v1/chat/completions",
    ).strip()
    model = os.getenv("MANGA_TRANSLATION_MODEL", "gpt-4o-mini").strip()
    if not api_key:
        raise TranslationUnavailable(
            "Tradução não configurada. Defina MANGA_TRANSLATION_API_KEY no ambiente do backend."
        )
    if not endpoint.startswith("https://") and not endpoint.startswith("http://127.0.0.1"):
        raise TranslationUnavailable("A URL do provedor deve usar HTTPS (ou localhost para testes).")

    system_prompt = (
        "Você é tradutor profissional de mangá, manhwa e quadrinhos. "
        "Traduza cada trecho preservando sentido, personalidade, tom e concisão. "
        "Mantenha nomes próprios e honoríficos quando fizer sentido. "
        "Não acrescente explicações. Retorne somente JSON válido no formato "
        '{"translations":["..."]}, mantendo exatamente a quantidade e a ordem dos trechos.'
    )
    user_payload = {
        "source_language": request.source_language,
        "target_language": request.target_language,
        "context": request.context,
        "texts": request.texts,
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
            response = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.TimeoutException as exc:
        raise TranslationProviderError("O provedor de tradução demorou demais para responder.") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        raise TranslationProviderError(f"O provedor de tradução retornou HTTP {status}.") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise TranslationProviderError("Não foi possível comunicar com o provedor de tradução.") from exc

    try:
        content = payload["choices"][0]["message"]["content"]
        result = json.loads(content)
        translations = result["translations"]
        if (
            not isinstance(translations, list)
            or len(translations) != len(request.texts)
            or any(not isinstance(item, str) or not item.strip() for item in translations)
        ):
            raise ValueError("Formato de tradução inválido.")
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise TranslationProviderError("O provedor retornou uma resposta fora do formato esperado.") from exc

    return {
        "source_language": request.source_language,
        "target_language": request.target_language,
        "translations": [item.strip() for item in translations],
        "model": model,
    }
