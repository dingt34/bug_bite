FROM pytorch/pytorch:2.11.0-cuda12.8-cudnn9-runtime

WORKDIR /app
COPY bioclip-service/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cu128 -r requirements.txt

COPY bioclip-service/app.py bioclip-service/species.json ./
COPY miniprogram/images/insect-guide ./reference-images
ENV BIOCLIP_REFERENCE_ROOT=/app/reference-images
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
