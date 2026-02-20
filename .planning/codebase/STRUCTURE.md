# Codebase Structure

**Analysis Date:** 2026-02-20

## Directory Layout

```
pierre-vps-dev/                    ← Root monorepo
├── personal-website/              ← React SPA (Vite + shadcn/ui)
│   ├── src/
│   │   ├── components/            # React components + 51 shadcn/ui primitives
│   │   ├── hooks/                 # Custom hooks (chat, scroll, questions)
│   │   ├── pages/                 # Route pages (Index, NotFound)
│   │   ├── lib/                   # Utilities (cn() for Tailwind)
│   │   ├── assets/                # Images, icons
│   │   ├── App.tsx                # Root with routing
│   │   ├── main.tsx               # Bootstrap
│   │   └── index.css              # Global styles + Tailwind
│   ├── public/                    # Static assets
│   ├── package.json               # Dependencies (React, Vite, shadcn/ui)
│   ├── tsconfig.json              # TypeScript config (@ alias)
│   ├── vite.config.ts             # Build config
│   └── .env                       # Local secrets (DO NOT COMMIT)
│
├── deepeval/                      ← FastAPI evaluation service
│   ├── app/
│   │   ├── main.py                # FastAPI app setup, lifespan, middleware
│   │   ├── config.py              # Settings (from env vars)
│   │   ├── auth.py                # JWT + API key validation
│   │   ├── api/                   # Route handlers (evaluation, auth, metrics, jobs, health)
│   │   ├── models/                # Pydantic models (test cases, metrics, results)
│   │   └── services/              # Business logic (deepeval, jobs, auth)
│   ├── Dockerfile                 # Container build
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # API keys (DO NOT COMMIT)
│
├── chonkie/                       ← Text chunking service (Python)
│   ├── chonkie_api_enhanced.py    # FastAPI wrapper for chonkie library
│   ├── chonkie-visualizer/        # Next.js UI for visualizing chunks
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── Dockerfile                 # Container build
│
├── graphiti/                      ← Knowledge graph memory system
│   ├── config/                    # Configuration files
│   └── Dockerfile                 # Container build (compiled binary)
│
├── lightrag/                      ← Document knowledge graph
│   ├── data/
│   │   ├── inputs/                # Documents to process
│   │   ├── rag_storage/           # Embeddings storage
│   │   └── tiktoken/              # Token counter cache
│   └── .env                       # LightRAG config (DO NOT COMMIT)
│
├── nginx/                         ← Reverse proxy configuration
│   ├── conf.d/                    # Domain configs
│   │   ├── pierre.brandiron.co.za.conf.template  # Main website (with envsubst)
│   │   ├── n8n.brandiron.co.za.conf              # n8n admin panel
│   │   ├── graphiti.conf                         # Knowledge graph API
│   │   ├── qdrant.brandiron.co.za.conf           # Vector DB admin
│   │   └── brandiron.co.za.conf                  # Root redirect
│   ├── auth/                      # HTTP Basic auth files (.htpasswd)
│   ├── certbot/                   # SSL certificates (LetsEncrypt)
│   │   ├── conf/                  # Certificate storage
│   │   └── www/                   # Challenge directory
│   ├── scripts/                   # Docker entrypoint (envsubst templates)
│   ├── html/                      # Static fallback pages
│   └── .htpasswd                  # HTTP Basic credentials
│
├── scripts/                       ← Deployment automation
│   ├── deploy-to-vps.sh           # SSH + pull + docker compose restart
│   ├── sync-from-vps.sh           # Pull VPS state to local
│   ├── cleanup-git-history.sh     # Git history rewriting
│   └── setup-cicd.sh              # CI/CD initialization
│
├── monitoring/                    ← Prometheus + Grafana
│   ├── prometheus/                # Metrics scrape config
│   └── grafana/provisioning/      # Dashboard definitions
│
├── supabase/                      ← Vector DB (cloud hosted, local backup)
│   └── volumes/                   # Local database backups
│
├── ai-context/                    ← AI agent documentation
│   ├── GIT_WORKFLOW.md            # Deployment workflows
│   └── SECURITY_PROTOCOL.md       # AI security rules
│
├── docker-compose.yml             ← Service orchestration (641 lines)
├── .env                           ← Secrets (DO NOT COMMIT)
├── .env.example                   ← Template for secrets
├── .gitignore                     ← Files to exclude from git
├── .gitleaks.toml                 ← Secret scanning config
└── README.md                      ← Quick start guide
```

## Directory Purposes

**personal-website:**
- Purpose: Production frontend for portfolio
- Contains: React components, TypeScript, Tailwind CSS, forms
- Key files: `src/App.tsx`, `src/pages/Index.tsx`, `src/hooks/useChatbot.ts`
- Build output: `dist/` (created by Vite)
- Access: https://pierre.brandiron.co.za (via nginx proxy)

**deepeval:**
- Purpose: REST API for LLM evaluation metrics
- Contains: FastAPI application, Pydantic models, evaluation logic
- Key files: `app/main.py` (FastAPI setup), `app/services/deepeval_service.py` (metric logic)
- Docker image: Custom built from `Dockerfile`
- Access: Internal Docker network on port 8000

**chonkie:**
- Purpose: Text chunking service + visualization
- Contains: Python FastAPI + Next.js UI
- Key files: `chonkie_api_enhanced.py` (service), `chonkie-visualizer/` (UI)
- Docker: Two containers (API + visualizer)

**graphiti:**
- Purpose: Biographical memory/knowledge graph
- Contains: Compiled binary, config files
- Docker: Single container, managed externally
- Access: http://graphiti:8000 (n8n integration)

**lightrag:**
- Purpose: Document-based knowledge retrieval
- Contains: LightRAG service (external container)
- Key files: `data/inputs/` (source documents), `data/rag_storage/` (embeddings)
- Access: https://lightrag.brandiron.co.za (HTTP Basic auth)

**nginx:**
- Purpose: Reverse proxy, SSL termination, routing
- Contains: nginx configuration files, SSL certs, auth credentials
- Key files: `conf.d/pierre.brandiron.co.za.conf.template` (main domain), `scripts/docker-entrypoint.sh` (template processing)
- Pattern: All configs are templates (use envsubst for secrets injection)

**scripts:**
- Purpose: Deployment automation
- Contains: Bash scripts for VPS operations
- Key files: `deploy-to-vps.sh` (push changes to server), `setup-cicd.sh` (GitHub Actions config)

**monitoring:**
- Purpose: Infrastructure observability
- Contains: Prometheus scrape configs, Grafana dashboards
- Access: https://monitoring.brandiron.co.za

## Key File Locations

**Entry Points:**
- `personal-website/src/main.tsx`: React app bootstrap (createRoot)
- `personal-website/src/App.tsx`: Root component with routing
- `deepeval/app/main.py`: FastAPI application with middleware setup
- `docker-compose.yml`: Service orchestration entry point

**Configuration:**
- `.env`: Environment variables (secrets, API keys, passwords)
- `.env.example`: Template showing required variables
- `deepeval/app/config.py`: Settings loaded from env vars
- `personal-website/tsconfig.json`: TypeScript config with @ path alias
- `personal-website/vite.config.ts`: Vite build configuration
- `docker-compose.yml`: Container setup, volumes, networks

**Core Logic:**
- `personal-website/src/hooks/useChatbot.ts`: Chat state management, API calls
- `deepeval/app/services/deepeval_service.py`: DeepEval metric instantiation + evaluation
- `deepeval/app/api/evaluation.py`: REST endpoint handlers for /evaluate*
- `nginx/conf.d/pierre.brandiron.co.za.conf.template`: Request routing (chat proxy, website proxy)

**Testing:**
- No test files present (testing patterns not established)
- `deepeval/` has evaluation capabilities but not traditional unit tests

## Naming Conventions

**Files:**
- React components: PascalCase, .tsx extension (e.g., `ChatWidget.tsx`, `HeroSection.tsx`)
- Hooks: camelCase, use* prefix, .ts extension (e.g., `useChatbot.ts`, `useScrollPosition.ts`)
- Utilities: camelCase, .ts extension (e.g., `utils.ts`)
- Python services: snake_case, .py extension (e.g., `deepeval_service.py`, `job_service.py`)
- Python models: snake_case files, PascalCase classes (e.g., `evaluation.py` contains `EvaluationRequest`)
- Config files: lowercase with domain/purpose (e.g., `pierre.brandiron.co.za.conf`)

**Directories:**
- Component folders: PascalCase matching component name (e.g., `ChatWidget/`)
- Service folders: lowercase, descriptive (e.g., `services/`, `api/`, `models/`)
- Package directories: lowercase with underscores (e.g., `docker-apps-network` in compose)

**TypeScript/React:**
- Component props: PascalCase interface suffix "Props" (e.g., `ChatWidgetProps`)
- Custom types: PascalCase (e.g., `Message`, `LLMTestCase`)
- API responses: PascalCase suffix "Response" (e.g., `EvaluationResponse`)

**Python:**
- Class names: PascalCase (e.g., `DeepEvalService`, `JobService`)
- Functions: snake_case (e.g., `evaluate_single`, `create_job`)
- Constants: UPPER_SNAKE_CASE (e.g., `GREETING_MESSAGES`)
- Env vars: UPPER_SNAKE_CASE (e.g., `SECRET_KEY`, `OPENAI_API_KEY`)

## Where to Add New Code

**New Frontend Feature:**
- Primary code: `personal-website/src/components/{FeatureName}.tsx`
- Custom logic: `personal-website/src/hooks/use{Feature}.ts`
- Styling: Inline Tailwind classes or `personal-website/src/index.css`
- Tests: Create `{component}.test.tsx` next to component (if testing established)

**New API Endpoint:**
- Route handler: `deepeval/app/api/{resource}.py` (new file per resource)
- Pydantic models: `deepeval/app/models/{resource}.py`
- Business logic: `deepeval/app/services/{service_name}.py`
- Import into `deepeval/app/main.py` and include router

**New nginx Configuration:**
- Domain config: `nginx/conf.d/{domain}.conf` or `{domain}.conf.template` (if using env vars)
- Template variables: Use `${VAR_NAME}` syntax, process with `envsubst` in docker-entrypoint.sh
- Auth files: Add `.htpasswd` entries in `nginx/auth/` if needed

**New Service/Container:**
1. Create service directory at repo root (e.g., `my-service/`)
2. Add `Dockerfile` and configuration files
3. Define service in `docker-compose.yml` with environment, volumes, networks
4. Add nginx config block if external access needed
5. Update README.md with service URL and access method

**Utilities:**
- Shared helper functions: `personal-website/src/lib/utils.ts` (currently only has `cn()`)
- Python utilities: Create module in service directory or `app/utils.py`

## Special Directories

**node_modules:**
- Purpose: npm dependencies cache
- Generated: Yes (by npm install)
- Committed: No (.gitignore'd)
- Manage: `personal-website/package.json` + `package-lock.json`

**dist/:**
- Purpose: Built frontend (production output)
- Generated: Yes (by Vite build)
- Committed: No (.gitignore'd)
- Manage: Vite build process (npm run build)

**Docker volumes:**
- `n8n-data`: n8n workflow definitions, execution history
- `neo4j-data`: Neo4j database files (Graphiti + LightRAG)
- `graphiti-data`: Graphiti memory storage
- Committed: No (data, not code)
- Manage: Docker volume commands, backup scripts

**.planning/codebase/:**
- Purpose: Architecture and structure documentation
- Generated: No (hand-written by analysis agent)
- Committed: Yes (reference documents)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**.next/, .turbo/, .vite/:**
- Purpose: Build system caches
- Generated: Yes (by build tools)
- Committed: No (.gitignore'd)
- Manage: Automatic, can safely delete to force rebuild

**.env files:**
- Purpose: Local secrets (API keys, passwords, database URLs)
- Generated: No (manually created from .env.example)
- Committed: No (CRITICAL - .gitignore'd)
- Contains: Secrets that should never be in git

**certbot/:**
- Purpose: SSL certificate storage
- Generated: Yes (by Let's Encrypt renewal)
- Committed: No (.gitignore'd, synced via backup scripts)
- Contains: Live certs for all domains

---

*Structure analysis: 2026-02-20*
