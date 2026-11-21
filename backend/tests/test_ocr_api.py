import base64, io
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def png_data_url():
    image = Image.new("RGB", (64, 64), "white")
    buffer = io.BytesIO(); image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()

def test_health_exposes_ocr_capability():
    response = client.get("/health")
    assert response.status_code == 200
    assert "image-ocr" in response.json()["capabilities"]

def test_ocr_rejects_invalid_data_url():
    response = client.post("/ocr", json={"image_data_url": "not-an-image", "language": "ja"})
    assert response.status_code == 400

def test_ocr_rejects_unsupported_language():
    response = client.post("/ocr", json={"image_data_url": png_data_url(), "language": "xx"})
    assert response.status_code == 422
