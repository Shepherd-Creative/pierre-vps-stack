# External Integrations

**Analysis Date:** 2026-02-20

## APIs & External Services

**AI Chat:**
- n8n - Workflow automation and chat interface
  - SDK/Client: Fetch API (via proxy)
  - Auth: Basic Auth (credentials injected server-side via nginx)
  - Endpoint: n8n:5678 (Docker) → n8n.brandiron.co.za (production)
  - Webhook: `/webhook/{N8N_CHAT_WEBHOOK_UUID}/chat`

**Embedding & LLM Providers:**
- OpenAI - Language model and embeddings
  - Auth: `OPENAI_API_KEY` (environment variable)
  - Used by: Graphiti (config: `graphiti/config/config.yaml`)
  - Used by: Chonkie visualizer (embedding provider)

- Cohere - Alternative embedding provider
  - Used by: Chonkie visualizer (optional embedding provider)

- Gemini - Alternative LLM provider
  - Used by: Chonkie visualizer (optional)

- Jina - Embedding service
  - Used by: Chonkie visualizer (optional)

- Voyage - Embedding service
  - Used by: Chonkie visualizer (optional)

**Social & External Links:**
- GitHub (Shepherd-Creative organization)
  - Links: Portfolio projects, code repositories
- LinkedIn (personal profile)
- Email: user@example.com

## Data Storage

**Databases:**
- Neo4j 5.26.2
  - Connection: `bolt://neo4j:7687` (Docker) / Environment: `NEO4J_PASSWORD`, `NEO4J_USER`
  - Used by: LightRAG (knowledge graph), Graphiti (graph database)
  - Client: Python driver / Graphiti ORM
  - Plugins: APOC (graph algorithms)

- PostgreSQL (via Supabase cloud)
  - Note: Self-hosted Supabase containers REMOVED from docker-compose
  - Currently using: supabase.com cloud instance
  - Auth: `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (environment variables)
  - Future: May support personal-website database features

**File Storage:**
- Local filesystem only
  - LightRAG: `./lightrag/data/rag_storage/` (vector storage)
  - LightRAG: `./lightrag/data/inputs/` (documents)
  - Graphiti: `./graphiti-data:/app/data` (graph data)

**Caching:**
- Redis - Not detected
- In-memory - React Query uses memory caching for API state

**Vector Store:**
- Qdrant 0.13.8
  - Container: qdrant
  - Port: 6333 (API)
  - Used by: LightRAG (semantic search storage)
  - Volumes: `qdrant-data:/qdrant/storage`

## Authentication & Identity

**Frontend:**
- No authentication on personal-website
- n8n chat requires Basic Auth (handled server-side in nginx)
- Session management: Browser sessionStorage for chat session ID (`chat_session_id`)

**Backend:**
- n8n authentication: Basic Auth (credentials from environment)
- Nginx proxy adds auth headers before forwarding to n8n
- Variables used: `N8N_CHAT_WEBHOOK_UUID`, `N8N_CHAT_AUTH_BASE64`

## Monitoring & Observability

**Error Tracking:**
- Client-side: Console logging in React components
- No centralized error tracking service detected

**Logs:**
- Docker container logs (via `docker logs`)
- n8n logs available in container
- Neo4j logs available in container
- LightRAG logs available in container
- Prometheus metrics (see Monitoring section)

**Metrics & Dashboards:**
- Prometheus 3.2.0
  - Container: prometheus
  - Port: 9090
  - Scrapes metrics from: cadvisor, node-exporter, grafana
  - Config: `./monitoring/prometheus/prometheus.yml`

- Grafana 11.4.0
  - Container: grafana
  - Port: 3000
  - Domain: monitoring.brandiron.co.za
  - Admin: `${GRAFANA_USER}` / `${GRAFANA_PASSWORD}`
  - Provisioning: `./monitoring/grafana/provisioning/`

**System Monitoring:**
- cAdvisor 0.50.0 - Container metrics
- node-exporter 1.6.1 - Host system metrics

## CI/CD & Deployment

**Hosting:**
- Docker Compose on VPS (brandiron.co.za)
- Infrastructure: self-managed VPS
- DNS: DNS managed externally (brandiron.co.za domain)

**Web Server:**
- Nginx Alpine - Reverse proxy, SSL termination, SPA routing
  - Port: 80 (HTTP, redirects to HTTPS)
  - Port: 443 (HTTPS with TLS 1.2/1.3)
  - SSL Certificates: Let's Encrypt via Certbot

**SSL/TLS Management:**
- Certbot - Automatic certificate renewal
  - Certificate renewal: Manual profile `certbot-renew`
  - Certificates location: `/etc/letsencrypt/live/`
  - WWW root: `/var/www/certbot/`

**CI Pipeline:**
- Not detected (manual deployments)
- GitHub Actions available in `.github/` but configuration not present

## Environment Configuration

**Required env vars (personal-website):**
- `VITE_ENABLE_CHAT` - Enable/disable chat widget (boolean)
- Optional: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (for future features)

**Required env vars (n8n chat proxy):**
- `N8N_CHAT_WEBHOOK_UUID` - n8n webhook UUID for chat endpoint
- `N8N_CHAT_AUTH_BASE64` - Base64-encoded credentials for n8n Basic Auth

**Required env vars (infrastructure):**
- `NEO4J_PASSWORD` - Neo4j database password
- `SUPABASE_JWT_SECRET` - JWT signing key
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key (for Graphiti)
- `SMTP_*` - Email configuration (Gmail SMTP)
- `GRAFANA_USER`, `GRAFANA_PASSWORD` - Monitoring access

**Secrets location:**
- `.env` file (local development only, .gitignore'd)
- Environment variables injected at container startup
- Production: Secrets managed on VPS directly (not in git)

## Webhooks & Callbacks

**Incoming:**
- n8n webhook: `/webhook/{N8N_CHAT_WEBHOOK_UUID}/chat`
  - Receives: Chat messages from personal-website frontend
  - Returns: AI-generated responses
  - Auth: Basic Auth (via nginx proxy)
  - Protocol: POST, JSON body `{ action, sessionId, chatInput }`

**Outgoing:**
- None detected
- n8n may have outgoing webhooks configured in workflow (not visible in codebase)

## Service Communication

**Within Docker Network:**
- Docker network: `docker-apps-network`
- Service discovery: Docker DNS (127.0.0.11:53)
- n8n communicates with: Neo4j (for graph persistence), OpenAI (for LLM)
- LightRAG communicates with: Neo4j, Qdrant
- Graphiti communicates with: Neo4j, OpenAI
- nginx proxies to: personal-website (port 80), n8n (port 5678)

**Frontend to Backend:**
- personal-website → nginx (reverse proxy)
- nginx `/api/chat` → n8n (with Basic Auth)
- n8n webhook → n8n internal chat workflow

## Domains & URLs

**Primary:**
- `pierre.brandiron.co.za` - Personal portfolio website
- Root redirect: `brandiron.co.za` → `https://pierre.brandiron.co.za`

**Supporting Services (internal only, no public HTTPS):**
- `n8n.brandiron.co.za` - n8n workflow automation dashboard
- `lightrag.brandiron.co.za` - LightRAG knowledge graph (if accessible)
- `graphiti.brandiron.co.za` - Graphiti graph database interface
- `qdrant.brandiron.co.za` - Qdrant vector database
- `monitoring.brandiron.co.za` - Prometheus/Grafana monitoring dashboard
- `chonkie.brandiron.co.za` - Chonkie document chunking visualizer
- `reading.brandiron.co.za` - Reading fluency application
- `deepeval.brandiron.co.za` - DeepEval evaluation framework

---

*Integration audit: 2026-02-20*
