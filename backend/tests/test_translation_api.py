import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app import translation

client = TestClient(app)


def test_translate_requires_provider_key(monkeypatch):
    monkeypatch.delenv("MANGA_TRANSLATION_API_KEY", raising=False)
    response = client.post("/translate", json={"texts": ["こんにちは"], "target_language": "pt-BR"})
    assert response.status_code == 503
    assert "não configurada" in response.json()["detail"]


def test_translate_rejects_empty_text():
    response = client.post("/translate", json={"texts": ["  "], "target_language": "pt-BR"})
    assert response.status_code == 422


def test_translate_rejects_too_many_regions():
    response = client.post("/translate", json={"texts": ["a"] * 81})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_translate_texts_validates_provider_payload(monkeypatch):
    monkeypatch.setenv("MANGA_TRANSLATION_API_KEY", "test-key")
    monkeypatch.setenv("MANGA_TRANSLATION_API_URL", "https://provider.example/v1/chat/completions")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": '{"translations":["Olá","Tudo bem?"]}'}}]}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setattr(translation.httpx, "AsyncClient", FakeClient)
    request = translation.TranslationRequest(texts=["こんにちは", "元気ですか"], target_language="pt-BR")
    result = await translation.translate_texts(request)
    assert result["translations"] == ["Olá", "Tudo bem?"]
    assert result["target_language"] == "pt-BR"
