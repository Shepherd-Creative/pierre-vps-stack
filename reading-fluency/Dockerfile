FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements_clean.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout=120 -r requirements_clean.txt

# Copy application files
COPY reading_fluency_app_production.py app.py
COPY templates/ templates/
COPY static/ static/
COPY .env .env

# Create directory for logs
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run the application
CMD ["python", "app.py"]