import base64
import io
import json
import logging
import os
import secrets
import threading
import uuid
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
SERVICE_VERSION = "2.0.0"
NEGATIVE_LABELS = [
    "a photograph without a visible animal",
    "a skin lesion without a visible arthropod",
    "an unclear or severely blurred arthropod",
    "an arthropod outside the supported species catalog",
]

logger = logging.getLogger("bugbite.bioclip")


class IdentifyRequest(BaseModel):
    imageBase64: str = Field(min_length=16)


class ModelRuntime:
    def __init__(self) -> None:
        self.catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        self.by_label = {item["modelLabel"]: item for item in self.catalog}
        if len(self.by_label) != len(self.catalog):
            raise RuntimeError("species.json contains duplicate modelLabel values")
        self.device = os.getenv("BIOCLIP_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
        self.top_k = max(1, min(5, int(os.getenv("BIOCLIP_TOP_K", "3"))))
        self.min_score = float(os.getenv("BIOCLIP_MIN_SCORE", "0.18"))
        self.min_margin = float(os.getenv("BIOCLIP_MIN_MARGIN", "0.03"))
        self.max_image_bytes = int(os.getenv("BIOCLIP_MAX_IMAGE_BYTES", str(6 * 1024 * 1024)))
        self.max_image_pixels = int(os.getenv("BIOCLIP_MAX_IMAGE_PIXELS", str(24 * 1024 * 1024)))
        self.text_weight = min(1.0, max(0.0, float(os.getenv("BIOCLIP_TEXT_WEIGHT", "0.35"))))
        self.reference_root = Path(os.getenv(
            "BIOCLIP_REFERENCE_ROOT",
            str(SERVICE_DIR.parent / "miniprogram" / "images" / "insect-guide"),
        ))
        self.labels = list(self.by_label) + NEGATIVE_LABELS
        self.classifier = None
        self.prototype_embeddings: dict[str, torch.Tensor] = {}
        self.load_error = ""
        self.load_lock = threading.Lock()
        self.inference_lock = threading.Lock()

    @property
    def ready(self) -> bool:
        return self.classifier is not None and len(self.prototype_embeddings) == len(self.catalog)

    def load(self) -> None:
        if self.ready:
            return
        with self.load_lock:
            if self.ready:
                return
            self.classifier = None
            self.prototype_embeddings = {}
            self.load_error = ""
            try:
                from bioclip.predict import CustomLabelsClassifier

                classifier = CustomLabelsClassifier(
                    cls_ary=self.labels,
                    model_str=MODEL_NAME,
                    device=self.device,
                )
                prototypes = self._load_prototypes(classifier)
                if len(prototypes) != len(self.catalog):
                    missing = sorted(set(self.by_label) - set(prototypes))
                    raise RuntimeError(f"missing reference images for {len(missing)} catalog entries")
                self.classifier = classifier
                self.prototype_embeddings = prototypes
            except Exception as exc:
                self.classifier = None
                self.prototype_embeddings = {}
                self.load_error = str(exc)
                logger.exception("BioCLIP model loading failed")
                raise

    def _load_prototypes(self, classifier: Any) -> dict[str, torch.Tensor]:
        prototypes: dict[str, torch.Tensor] = {}
        for item in self.catalog:
            images = []
            for value in item.get("referenceImages", []):
                path = self.reference_root / value
                if path.is_file():
                    with Image.open(path) as image:
                        images.append(image.convert("RGB"))
            if not images:
                continue
            features = classifier.create_image_features(images)
            prototype = features.mean(dim=0)
            prototypes[item["modelLabel"]] = torch.nn.functional.normalize(prototype, dim=0)
        return prototypes

    def predict_ranked(self, image: Image.Image) -> list[dict[str, float | str]]:
        if not self.classifier:
            raise RuntimeError("BioCLIP model is not ready")
        image_feature = self.classifier.create_image_features([image])[0]
        text_similarities = image_feature @ self.classifier.txt_embeddings
        similarities = []
        for index, label in enumerate(self.labels):
            text_similarity = text_similarities[index]
            prototype = self.prototype_embeddings.get(label)
            similarity = text_similarity if prototype is None else (
                self.text_weight * text_similarity + (1.0 - self.text_weight) * (image_feature @ prototype)
            )
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
            if image.width * image.height > self.max_image_pixels:
                raise HTTPException(status_code=413, detail="image has too many pixels")
            image.load()
        except HTTPException:
            raise
        except (UnidentifiedImageError, OSError) as exc:
            raise HTTPException(status_code=400, detail="unsupported image") from exc
        if image.width < 32 or image.height < 32:
            raise HTTPException(status_code=400, detail="image is too small")
        return image.convert("RGB")

    def identify(self, image: Image.Image) -> dict[str, Any]:
        if not self.ready:
            self.load()
        with self.inference_lock, torch.inference_mode():
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
            "requestId": str(uuid.uuid4()),
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
    try:
        runtime.load()
    except Exception:
        pass
    yield


app = FastAPI(title="虫咬识途 BioCLIP 2 Service", version=SERVICE_VERSION, lifespan=lifespan)


def require_api_key(authorization: str = Header(default="")) -> None:
    expected = os.getenv("BIOCLIP_API_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="BIOCLIP_API_KEY is not configured")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not supplied or not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="invalid API key")


def health_payload() -> dict[str, Any]:
    return {
        "ok": runtime.ready,
        "ready": runtime.ready,
        "version": SERVICE_VERSION,
        "model": "BioCLIP 2",
        "device": runtime.device,
        "cudaAvailable": torch.cuda.is_available(),
        "catalogSize": len(runtime.catalog),
        "prototypeCount": len(runtime.prototype_embeddings),
        "error": runtime.load_error or None,
    }


@app.get("/health/live")
def live() -> dict[str, Any]:
    return {"ok": True, "version": SERVICE_VERSION}


@app.get("/health")
@app.get("/health/ready")
def health() -> dict[str, Any]:
    return health_payload()


@app.post("/admin/reload", dependencies=[Depends(require_api_key)])
def reload_model() -> dict[str, Any]:
    runtime.classifier = None
    runtime.prototype_embeddings = {}
    runtime.load()
    return health_payload()


@app.post("/v1/identify", dependencies=[Depends(require_api_key)])
def identify(request: IdentifyRequest) -> dict[str, Any]:
    try:
        image = runtime.decode_image(request.imageBase64)
        return runtime.identify(image)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"BioCLIP unavailable: {exc}") from exc
