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

# Install Chonkie with core dependencies only
RUN pip install --user chonkie sentence-transformers

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "chonkie_api_enhanced:app", "--host", "0.0.0.0", "--port", "8000"]