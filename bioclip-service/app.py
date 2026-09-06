import base64
import io
import json
import os
import secrets
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field


SERVICE_DIR = Path(__file__).resolve().parent
CATALOG_PATH = SERVICE_DIR / "species.json"
MODEL_NAME = "hf-hub:imageomics/bioclip-2"
NEGATIVE_LABELS = [
    "a photograph without a visible animal",
    "a skin lesion without a visible arthropod",
    "an unclear or severely blurred arthropod",
    "an arthropod outside the supported species catalog",
]


class IdentifyRequest(BaseModel):
    imageBase64: str = Field(min_length=16)


class ModelRuntime:
    def __init__(self) -> None:
        self.catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        self.by_label = {item["modelLabel"]: item for item in self.catalog}
        self.device = os.getenv("BIOCLIP_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
        self.top_k = max(1, min(5, int(os.getenv("BIOCLIP_TOP_K", "3"))))
        self.min_score = float(os.getenv("BIOCLIP_MIN_SCORE", "0.18"))
        self.min_margin = float(os.getenv("BIOCLIP_MIN_MARGIN", "0.03"))
        self.max_image_bytes = int(os.getenv("BIOCLIP_MAX_IMAGE_BYTES", str(6 * 1024 * 1024)))
        self.text_weight = min(1.0, max(0.0, float(os.getenv("BIOCLIP_TEXT_WEIGHT", "0.35"))))
        self.reference_root = Path(os.getenv(
            "BIOCLIP_REFERENCE_ROOT",
            str(SERVICE_DIR.parent / "miniprogram" / "images" / "insect-guide"),
        ))
        self.labels = list(self.by_label) + NEGATIVE_LABELS
        self.classifier = None
        self.prototype_embeddings: dict[str, torch.Tensor] = {}
        self.load_error = ""
        self.lock = threading.Lock()

    def load(self) -> None:
        if self.classifier is not None:
            return
        try:
            from bioclip.predict import CustomLabelsClassifier

            self.classifier = CustomLabelsClassifier(cls_ary=self.labels, model_str=MODEL_NAME, device=self.device)
            self._load_prototypes()
        except Exception as exc:  # surfaced through health endpoint
            self.load_error = str(exc)
            raise

    def _load_prototypes(self) -> None:
        for item in self.catalog:
            paths = [self.reference_root / value for value in item.get("referenceImages", [])]
            images = []
            for path in paths:
                if path.is_file():
                    with Image.open(path) as image:
                        images.append(image.convert("RGB"))
            if not images:
                continue
            features = self.classifier.create_image_features(images)
            prototype = features.mean(dim=0)
            self.prototype_embeddings[item["modelLabel"]] = torch.nn.functional.normalize(prototype, dim=0)

    def predict_ranked(self, image: Image.Image) -> list[dict[str, float | str]]:
        image_feature = self.classifier.create_image_features([image])[0]
        text_similarities = image_feature @ self.classifier.txt_embeddings
        similarities = []
        for index, label in enumerate(self.labels):
            text_similarity = text_similarities[index]
            prototype = self.prototype_embeddings.get(label)
            if prototype is None:
                similarity = text_similarity
            else:
                visual_similarity = image_feature @ prototype
                similarity = self.text_weight * text_similarity + (1.0 - self.text_weight) * visual_similarity
            similarities.append(similarity)
        probabilities = torch.softmax(torch.stack(similarities) * 20.0, dim=0)
        return sorted(
            [
                {"classification": label, "score": float(probabilities[index].item())}
                for index, label in enumerate(self.labels)
            ],
            key=lambda item: float(item["score"]),
            reverse=True,
        )

    def decode_image(self, encoded: str) -> Image.Image:
        payload = encoded.split(",", 1)[-1]
        try:
            raw = base64.b64decode(payload, validate=True)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="invalid image base64") from exc
        if len(raw) > self.max_image_bytes:
            raise HTTPException(status_code=413, detail="image is too large")
        try:
            image = Image.open(io.BytesIO(raw))
            image.load()
        except (UnidentifiedImageError, OSError) as exc:
            raise HTTPException(status_code=400, detail="unsupported image") from exc
        if image.width < 32 or image.height < 32:
            raise HTTPException(status_code=400, detail="image is too small")
        return image.convert("RGB")

    def identify(self, image: Image.Image) -> dict[str, Any]:
        self.load()
        with self.lock, torch.inference_mode():
            ranked = self.predict_ranked(image)
        supported = [item for item in ranked if item.get("classification") in self.by_label]
        negatives = [item for item in ranked if item.get("classification") in NEGATIVE_LABELS]
        best = supported[0] if supported else None
        runner_up_score = float(supported[1]["score"]) if len(supported) > 1 else 0.0
        best_score = float(best["score"]) if best else 0.0
        negative_score = float(negatives[0]["score"]) if negatives else 0.0
        uncertain = (
            not best
            or best_score < self.min_score
            or best_score - runner_up_score < self.min_margin
            or negative_score >= best_score
        )
        candidates = [] if uncertain else [
            {
                "objectId": self.by_label[item["classification"]]["objectId"],
                "name": self.by_label[item["classification"]]["name"],
                "scientificName": self.by_label[item["classification"]]["scientificName"],
                "score": round(float(item["score"]), 6),
            }
            for item in supported[: self.top_k]
        ]
        return {
            "candidates": candidates,
            "uncertain": uncertain,
            "topScore": round(best_score, 6),
            "margin": round(best_score - runner_up_score, 6),
            "model": "BioCLIP 2",
            "device": self.device,
        }


runtime = ModelRuntime()


@asynccontextmanager
async def lifespan(_: FastAPI):
    runtime.load()
    yield


app = FastAPI(title="虫咬识途 BioCLIP 2 Service", version="1.0.0", lifespan=lifespan)


def require_api_key(authorization: str = Header(default="")) -> None:
    expected = os.getenv("BIOCLIP_API_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="BIOCLIP_API_KEY is not configured")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not supplied or not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="invalid API key")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": not runtime.load_error,
        "ready": runtime.classifier is not None,
        "model": "BioCLIP 2",
        "device": runtime.device,
        "catalogSize": len(runtime.catalog),
        "prototypeCount": len(runtime.prototype_embeddings),
        "error": runtime.load_error or None,
    }


@app.post("/v1/identify", dependencies=[Depends(require_api_key)])
def identify(request: IdentifyRequest) -> dict[str, Any]:
    image = runtime.decode_image(request.imageBase64)
    return runtime.identify(image)
