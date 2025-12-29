# Graphiti MCP Server Dockerfile
# Based on official Zep Graphiti implementation

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Clone the official Graphiti repository
RUN git clone https://github.com/getzep/graphiti.git /app/graphiti

WORKDIR /app/graphiti/mcp_server

# Install dependencies using uv
RUN uv sync

# Create data directory
RUN mkdir -p /app/data

# Expose port for HTTP transport
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with HTTP transport (SSE) for n8n integration
CMD ["uv", "run", "src/graphiti_mcp_server.py", "--transport", "sse"]
