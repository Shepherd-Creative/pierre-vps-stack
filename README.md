# Pierre VPS Docker Stack

Personal VPS infrastructure for AI tools, RAG systems, and portfolio projects.

## Architecture

- **nginx**: Reverse proxy with SSL termination
- **n8n**: Workflow automation (RAG agent, ingestion pipelines)
- **Neo4j**: Graph database (LightRAG + Graphiti)
- **LightRAG**: Document knowledge graph
- **Graphiti**: Biographical memory/knowledge graph (NEW)
- **Supabase**: PostgreSQL + pgvector for RAG
- **Qdrant**: Vector database
- **Chonkie**: Text chunking service
- **Monitoring**: Prometheus + Grafana

## Quick Start (Local)

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Start the stack
docker compose up -d

# Check status
docker compose ps
docker compose logs -f graphiti
```

## Graphiti Integration

Graphiti provides biographical memory for the portfolio chatbot. It's accessible via HTTP at port 8000.

### n8n Tool Configuration

Add as HTTP Request tool in your n8n agent:

```
URL: http://graphiti:8000/sse
Method: POST
Body (JSON-RPC):
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_memory_facts",
    "arguments": {
      "query": "{{ $json.query }}",
      "max_facts": 8
    }
  },
  "id": 1
}
```

## Deployment to VPS

```bash
# Commit changes
git add .
git commit -m "feat: add graphiti service"
git push origin main

# SSH to VPS and pull
ssh pierre_sudo_user@YOUR_VPS
cd ~/docker-apps
git pull origin main
docker compose up -d --build graphiti
```

## Services & URLs

| Service | URL | Auth |
|---------|-----|------|
| n8n | https://n8n.brandiron.co.za | Built-in |
| Supabase | https://supabase.brandiron.co.za | Built-in |
| LightRAG | https://lightrag.brandiron.co.za | HTTP Basic |
| Graphiti | https://graphiti.brandiron.co.za | HTTP Basic |
| Qdrant | https://qdrant.brandiron.co.za | HTTP Basic |
| Grafana | https://monitoring.brandiron.co.za | Built-in |

## Certificate Renewal

```bash
docker compose --profile certbot-renew run certbot
docker compose restart nginx
```

## Backup

Data volumes are managed separately from config. This repo contains only configuration files.

Backup volumes on VPS:
```bash
./scripts/backup.sh
```
