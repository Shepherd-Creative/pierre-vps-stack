# Stage 1: Build and download models
FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install packages and download models
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    "chonkie[openai]" \
    sentence-transformers \
    httpx \
    accelerate

# Pre-download the default model to bake into image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Stage 2: Runtime image (clean)
FROM python:3.11-slim

WORKDIR /home/chonkie

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages and models from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /root/.cache /root/.cache

# Create non-root user
RUN useradd --create-home --shell /bin/bash chonkie && \
    chown -R chonkie:chonkie /home/chonkie

# Copy API script
COPY chonkie_api_enhanced.py /home/chonkie/chonkie_api_enhanced.py
RUN chown chonkie:chonkie /home/chonkie/chonkie_api_enhanced.py

USER chonkie

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "chonkie_api_enhanced:app", "--host", "0.0.0.0", "--port", "8000"]
