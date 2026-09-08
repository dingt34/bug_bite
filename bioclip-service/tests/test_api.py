import base64
import io
import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["BIOCLIP_API_KEY"] = "test-secret"

import app as service


def image_base64() -> str:
    buffer = io.BytesIO()
    Image.new("RGB", (64, 64), "green").save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def test_health_exposes_catalog_without_loading_model():
    response = TestClient(service.app).get("/health")
    assert response.status_code == 200
    assert response.json()["catalogSize"] == 45
    assert response.json()["version"] == "2.0.0"


def test_liveness_does_not_depend_on_model_readiness():
    response = TestClient(service.app).get("/health/live")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_identify_requires_api_key():
    response = TestClient(service.app).post("/v1/identify", json={"imageBase64": image_base64()})
    assert response.status_code == 401


def test_identify_maps_supported_predictions(monkeypatch):
    labels = list(service.runtime.by_label)
    monkeypatch.setattr(service.runtime, "load", lambda: None)
    monkeypatch.setattr(
        service.runtime,
        "predict_ranked",
        lambda image: [
            {"classification": labels[0], "score": 0.82},
            {"classification": labels[1], "score": 0.10},
            {"classification": service.NEGATIVE_LABELS[0], "score": 0.02},
        ],
    )
    response = TestClient(service.app).post(
        "/v1/identify",
        headers={"Authorization": "Bearer test-secret"},
        json={"imageBase64": image_base64()},
    )
    assert response.status_code == 200
    assert response.json()["candidates"][0]["objectId"] == service.runtime.catalog[0]["objectId"]


def test_identify_rejects_negative_prediction(monkeypatch):
    label = next(iter(service.runtime.by_label))
    monkeypatch.setattr(service.runtime, "load", lambda: None)
    monkeypatch.setattr(
        service.runtime,
        "predict_ranked",
        lambda image: [
            {"classification": service.NEGATIVE_LABELS[0], "score": 0.52},
            {"classification": label, "score": 0.31},
        ],
    )
    response = TestClient(service.app).post(
        "/v1/identify",
        headers={"Authorization": "Bearer test-secret"},
        json={"imageBase64": image_base64()},
    )
    assert response.status_code == 200
    assert response.json()["uncertain"] is True
    assert response.json()["candidates"] == []
