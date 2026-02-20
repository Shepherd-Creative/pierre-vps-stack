# Architecture

**Analysis Date:** 2026-02-20

## Pattern Overview

**Overall:** Microservices with Docker Compose orchestration

**Key Characteristics:**
- Container-based deployment with docker-compose
- Reverse proxy (nginx) for routing and SSL termination
- Multiple independent services communicating over internal Docker network
- Frontend served as single-page application (SPA) via nginx
- Backend services expose REST APIs and webhooks
- Service isolation with resource limits (memory, CPU)

## Layers

**Presentation Layer:**
- Purpose: Client-facing user interface
- Location: `personal-website/src/`
- Contains: React components, hooks, styling, pages
- Depends on: Node.js runtime, Vite build system
- Used by: End users via HTTPS, nginx reverse proxy

**Reverse Proxy & Routing:**
- Purpose: SSL termination, domain routing, request proxying
- Location: `nginx/conf.d/`, `nginx/scripts/`
- Contains: nginx configuration, SSL certificates, authentication files
- Depends on: LetsEncrypt (certbot), upstream services
- Used by: Public internet, all service requests

**Workflow Automation & Chat:**
- Purpose: RAG-powered chatbot, n8n automation flows
- Location: n8n container (orchestrated via docker-compose.yml)
- Contains: Workflow definitions, webhook handlers, authentication
- Depends on: Graphiti (memory), LightRAG (knowledge), Neo4j
- Used by: Personal website `/api/chat` endpoint

**Evaluation & Quality Assurance:**
- Purpose: LLM output evaluation using DeepEval library
- Location: `deepeval/app/`
- Contains: FastAPI application, evaluation metrics, job processing
- Depends on: OpenAI API, LLM providers
- Used by: Internal testing, automated evaluation pipelines

**Knowledge Graphs & Memory:**
- Purpose: Structured knowledge storage and retrieval
- Location: Graphiti (container), LightRAG (container)
- Contains: Entity relationships, biographical facts, document embeddings
- Depends on: Neo4j database, OpenAI embeddings
- Used by: n8n workflows for context enrichment

**Data Persistence:**
- Purpose: Durable storage for data, embeddings, configurations
- Location: Docker volumes (mounted via docker-compose.yml)
- Contains: Neo4j data, LightRAG embeddings, n8n workflows, cache
- Depends on: Docker volume drivers
- Used by: All services requiring state

## Data Flow

**Chat Query Flow:**

1. User sends message via `personal-website` chat widget
2. Browser sends POST to `/api/chat` (nginx endpoint)
3. nginx proxies to n8n webhook `/webhook/{UUID}/chat`
4. n8n workflow:
   - Receives user query + session context
   - Calls Graphiti to retrieve biographical memory facts
   - Calls LightRAG to retrieve document context
   - Constructs prompt with context
   - Calls LLM provider (OpenAI)
   - Returns response to browser
5. Browser renders response in chat widget

**Evaluation Flow:**

1. Client sends evaluation request to `/evaluate` endpoint (FastAPI)
2. DeepEvalService processes test case and metrics
3. Calls external LLM providers (OpenAI, Anthropic, etc.)
4. Stores job metadata in-memory (no persistent DB)
5. Returns evaluation results to client

**State Management:**
- Chat session ID persists in browser sessionStorage (`personal-website/src/hooks/useChatbot.ts`)
- Knowledge graphs persist in Neo4j volumes
- n8n workflows stored in n8n-data volume
- Deployment configuration in `.env` file (environment variables)

## Key Abstractions

**Service Containerization:**
- Purpose: Isolate dependencies, enable independent deployment
- Examples: `deepeval/Dockerfile`, `graphiti/Dockerfile`, `chonkie/Dockerfile`
- Pattern: Each service has own Dockerfile, exposes port via `docker-compose.yml`

**nginx as API Gateway:**
- Purpose: Single entry point, SSL termination, authentication proxy
- Examples: `nginx/conf.d/pierre.brandiron.co.za.conf.template`, `nginx/conf.d/graphiti.conf`
- Pattern: Location blocks map URLs to upstream services, proxy headers manage security

**React Component Hierarchy:**
- Purpose: Reusable UI building blocks
- Examples: `personal-website/src/components/ChatWidget.tsx`, `HeroSection.tsx`, `Navigation.tsx`
- Pattern: Components use shadcn/ui library, accept state via props

**Hook-based State Management:**
- Purpose: Encapsulate stateful logic
- Examples: `personal-website/src/hooks/useChatbot.ts`, `useScrollPosition.ts`
- Pattern: React hooks managing chat state, scroll position, suggested questions

## Entry Points

**Personal Website (Frontend):**
- Location: `personal-website/src/main.tsx`
- Triggers: User navigates to https://pierre.brandiron.co.za
- Responsibilities: Bootstrap React app, setup providers (QueryClient, BrowserRouter, Toaster)

**nginx Reverse Proxy:**
- Location: docker-compose.yml service `nginx`
- Triggers: Request to any domain on ports 80/443
- Responsibilities: Route traffic, SSL termination, proxy to upstream services

**n8n Webhook Handler:**
- Location: n8n chat webhook (configured in workflows)
- Triggers: POST to `/api/chat` from personal website
- Responsibilities: Execute RAG workflow, call LLMs, return chat response

**DeepEval API:**
- Location: `deepeval/app/main.py` FastAPI app
- Triggers: HTTP requests to `/evaluate*` endpoints
- Responsibilities: Validate requests, run evaluations, track jobs, return results

**Graphiti HTTP Server:**
- Location: Graphiti container (port 8000)
- Triggers: HTTP POST from n8n with JSON-RPC method calls
- Responsibilities: Store/retrieve biographical facts, search memory

## Error Handling

**Strategy:** Layered error handling with logging

**Patterns:**

- **Frontend**: Error boundaries in React, toast notifications via Sonner/Toaster
  - Example: `personal-website/src/components/ChatWidget.tsx` catches API errors, shows user-friendly messages

- **API Layer**: HTTP status codes + JSON error responses
  - Example: `deepeval/app/main.py` global exception handler returns 500 with error details
  - Example: `deepeval/app/api/evaluation.py` returns 500 with descriptive messages

- **Service Layer**: Try/catch with logging to console
  - Example: `deepeval/app/main.py` lifespan function logs startup failures, continues gracefully
  - Example: `deepeval/app/services/deepeval_service.py` catches DeepEval errors, wraps in consistent format

- **Logging**: Structured logging with level control via `LOG_LEVEL` env var
  - Format: `"%(asctime)s - %(name)s - %(levelname)s - %(message)s"` (defined in `deepeval/app/config.py`)

## Cross-Cutting Concerns

**Logging:**
- Framework: Python logging (deepeval), console.log (frontend)
- Configuration: `LOG_LEVEL` env var controls verbosity
- Location: stdout/stderr captured by Docker

**Validation:**
- Frontend: react-hook-form + zod schemas
  - Example: `personal-website/` uses zod for form validation
- Backend: Pydantic models for request/response validation
  - Example: `deepeval/app/models/evaluation.py` defines strict schemas

**Authentication:**
- Frontend: Session ID in sessionStorage, passed as header to API
- Backend: JWT Bearer or API Key via X-API-Key header
  - Implementation: `deepeval/app/auth.py` validates tokens, extracts user context
  - Nginx: Basic Auth for internal service access (e.g., LightRAG, Graphiti via `.htpasswd`)

**CORS:**
- Frontend: Requests proxied through nginx (no CORS needed)
- Backend: CORS configured in FastAPI with wildcard origins (should be restricted in production)
  - Location: `deepeval/app/main.py` CORSMiddleware setup

**Request/Response Timing:**
- Middleware: All FastAPI services include X-Process-Time header
  - Implementation: `deepeval/app/main.py` middleware adds timing metadata
  - Used for performance monitoring

---

*Architecture analysis: 2026-02-20*
