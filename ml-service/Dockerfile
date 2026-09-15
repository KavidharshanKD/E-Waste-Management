# Production Dockerfile for Smart E-Waste Machine Learning Inference Service
# Python 3.11-slim base image for minimal footprint and fast container startup
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application, schemas, datasets, and training pipeline
COPY app/ ./app/
COPY src/ ./src/
COPY data/processed/ ./data/processed/

# Train and serialize production model pipelines inside the image
# This ensures zero binary models need to be stored in Git while guaranteeing reproducible containers
RUN python src/export_production_models.py

# Expose service port
EXPOSE 8000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start production uvicorn ASGI server with configurable PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
