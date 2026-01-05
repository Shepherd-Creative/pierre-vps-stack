FROM python:3.11-slim

WORKDIR /home/chonkie

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install FastAPI and essential dependencies first
RUN pip install --no-cache-dir fastapi uvicorn

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash chonkie
RUN chown -R chonkie:chonkie /home/chonkie

# Copy API script
COPY chonkie_api_enhanced.py /home/chonkie/chonkie_api_enhanced.py
RUN chown chonkie:chonkie /home/chonkie/chonkie_api_enhanced.py

USER chonkie

# Install packages WITHOUT downloading models
RUN pip install --user --no-cache-dir chonkie sentence-transformers httpx

# Set cache directory to volume mount (models download at runtime, not build time)
ENV TRANSFORMERS_CACHE=/home/chonkie/data/models
ENV SENTENCE_TRANSFORMERS_HOME=/home/chonkie/data/models

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "chonkie_api_enhanced:app", "--host", "0.0.0.0", "--port", "8000"]
