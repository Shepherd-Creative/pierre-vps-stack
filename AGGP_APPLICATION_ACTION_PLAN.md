# Pierre Gallet - AGGP AI Engineer Application: Action Plan & Context

## OBJECTIVE
Secure an interview for the **Intermediate AI Engineer** position at Allan & Gill Gray Philanthropies (AGGP) in Cape Town. Application deadline: **January 19, 2026** (19 days from Dec 29, 2025).

---

## STRATEGIC CONTEXT

### The Role
- **Position**: Intermediate AI Engineer (Fixed-term Contract)
- **Focus**: Hands-on implementation of AI-powered workflows, assistants, internal tools
- **Tech Stack**: Python/JS, LLM APIs (OpenAI, Anthropic), cloud services (Azure/AWS), Git, CI/CD
- **Key Requirement**: "Bachelor's degree... **or equivalent practical experience**" ← This is Pierre's entry point

### Pierre's Position (Honest Assessment)
- **Chance of interview**: 15-25% as-is → **35-50% with interactive portfolio**
- **Strengths**: 
  - Already built sophisticated AI infrastructure (hybrid RAG, MCP servers, Graphiti memory)
  - 18 years business/client experience (rare in engineers)
  - Published MCP server on Glama (Obsidian-MCP, 13 stars)
  - Deep understanding of AI adoption challenges from business perspective
- **Gaps**:
  - No formal CS degree or professional dev experience
  - Python skills still foundational (3/16 IBM courses)
  - No cloud infrastructure experience (Azure/AWS)
  - No Git/CI-CD experience

### Key Strategic Insight
> "Most junior devs applying will have academic knowledge but weak stakeholder communication and no business context. Pierre's angle: He's the candidate who's **already doing the work** at a practical level, understands **why AI adoption fails** in organisations, and can **actually ship things** that non-technical teams use."

---

## PIERRE'S EXISTING TECHNICAL ASSETS (Don't Undersell These)

### 1. Hybrid RAG System (SOTA RAG v2.3.2)
- **Architecture**: Supabase pgvector + LightRAG knowledge graph + Zep long-term memory
- **Features**: 
  - Smart chunking with document hierarchy
  - Dynamic hybrid search (dense, sparse, ilike, fuzzy with tunable weights)
  - Context expansion via parent/sibling chunks
  - 7 agent tools for multi-modal retrieval
- **LLM**: Claude Sonnet 4.5
- **Orchestration**: n8n workflows (132 nodes in ingestion, 21 in agent)

### 2. Published MCP Server
- **Obsidian-MCP**: Listed on Glama, 13 stars, MIT licensed
- **GitHub**: Shepherd-Creative

### 3. Graphiti Memory System
- LLM-agnostic knowledge graph for persistent biographical memory
- Running locally on Neo4j
- Contains facts about Pierre's skills, projects, career history

### 4. VPS Infrastructure
- Full Docker stack: n8n, Neo4j, LightRAG, Supabase, Qdrant, Chonkie, monitoring
- Production RAG system operational

---

## THE PORTFOLIO STRATEGY

### Core Concept
Build a **public-facing AI assistant** that interviewers can interact with to learn about Pierre's experience. This demonstrates:
1. Working AI implementation (not just theory)
2. RAG architecture skills (exactly what the job requires)
3. Ability to ship functional products

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                    VPS                               │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐                 │
│  │  Graphiti   │◄──►│   n8n RAG   │                 │
│  │  (Memory)   │    │  Agent      │                 │
│  │  NEW TOOL   │    │  (existing) │                 │
│  └─────────────┘    └─────────────┘                 │
│         ▲                  ▲                        │
│         └──────────────────┼────────────────────────┤
│                            │                        │
│                    ┌───────▼───────┐                │
│                    │   Web UI      │                │
│                    │  (Streamlit)  │                │
│                    └───────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Key Discovery: Integration Architecture
Pierre's existing n8n agent already has:
- **Zep** for conversational memory (chat history context)
- **Supabase pgvector** for document retrieval
- **LightRAG** for document knowledge graph

**Graphiti serves a different purpose**: biographical facts about Pierre (skills, projects, experience). It should be added as **Tool #8** to the existing agent, not replace anything.

**Tool description for agent**:
> "Search Pierre's biographical knowledge graph for factual information about his skills, experience, projects, certifications, and professional history. Use for questions about who Pierre is, what he's built, his qualifications, and his background."

---

## TODO LIST

### Phase 1: Infrastructure (Days 1-4) ✅ PARTIALLY COMPLETE

#### ✅ DONE: Local VPS Clone Structure Created
Location: `/Users/pierregallet/Documents/pierre-vps-dev/`

Files created:
- `docker-compose.yml` - Stack with Graphiti added, Flowise removed, Certbot fixed
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `README.md` - Documentation
- `graphiti/Dockerfile` - Graphiti container build
- `nginx/conf.d/graphiti.conf` - Reverse proxy config
- `scripts/sync-from-vps.sh` - Pull VPS configs locally
- `scripts/deploy-to-vps.sh` - Push changes to VPS

#### 🔲 TODO: Sync Existing Configs from VPS
```bash
cd /Users/pierregallet/Documents/pierre-vps-dev

# Edit sync script with your VPS IP
nano scripts/sync-from-vps.sh
# Change YOUR_VPS_IP to actual IP

# Make executable and run
chmod +x scripts/*.sh
./scripts/sync-from-vps.sh
```

#### 🔲 TODO: Initialize Git & Create GitHub Repo
```bash
cd /Users/pierregallet/Documents/pierre-vps-dev
git init
git add .
git commit -m "Initial commit: VPS stack with Graphiti"

# Create private repo
gh repo create pierre-vps-stack --private --source=. --push
```

#### 🔲 TODO: Set Up VPS to Pull from GitHub
```bash
ssh pierre_sudo_user@46.202.128.120
cd ~/docker-apps
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d)
git init
git remote add origin git@github.com:YOUR_USERNAME/pierre-vps-stack.git
git fetch origin
git reset --hard origin/main
```

#### 🔲 TODO: Deploy Graphiti to VPS
```bash
cd ~/docker-apps
docker compose up -d --build graphiti
docker compose logs -f graphiti
curl http://localhost:8000/health
```

#### 🔲 TODO: Add SSL for Graphiti
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d graphiti.brandiron.co.za --expand
docker compose restart nginx
```

### Phase 2: Graphiti Integration (Days 5-8)

#### 🔲 TODO: Add Graphiti as n8n Agent Tool
Add HTTP Request tool to existing SOTA RAG Agent v2.3:
- **Tool Name**: `search_biographical_memory`
- **URL**: `http://graphiti:8000/sse` (internal Docker network)
- **Method**: POST
- **Body**: JSON-RPC format for `search_memory_facts`

Update agent system prompt decision framework:
```
**Priority 0 - Biographical Queries**: Questions about Pierre's 
experience, skills, background, qualifications → Use 
`search_biographical_memory`, optionally combined with 
Hybrid Search for supporting documentation.
```

#### 🔲 TODO: Ingest Biographical Data into Graphiti
Content to ingest:
- CV/resume
- Course completions & certificates
- Project documentation (n8n workflows, MCP server READMEs)
- Career transition strategy documents
- Code samples from GitHub
- Creative briefs / client work samples
- Anthropic interview transcript (vision for AI integration)

#### 🔲 TODO: Migrate Local Graphiti Data to VPS
Either:
- Export Neo4j data and import to VPS
- Re-ingest from source documents

### Phase 3: Web Interface (Days 9-12)

#### 🔲 TODO: Build Streamlit Frontend
Simple interface connecting to n8n RAG webhook:
```python
import streamlit as st
import requests

st.title("Ask Pierre's AI")
query = st.text_input("What would you like to know?")

if query:
    response = requests.post(
        "https://n8n.brandiron.co.za/webhook/pierre-portfolio",
        json={"query": query}
    )
    st.write(response.json()["answer"])
```

#### 🔲 TODO: Add UX Polish
- Suggested questions ("Ask me about my RAG architecture")
- Architecture diagram visual
- Skills chart
- Test with someone who doesn't know Pierre

#### 🔲 TODO: Documentation
- README for portfolio project
- Architecture overview document
- 3-minute walkthrough video

### Phase 4: Application Materials (Days 13-16)

#### 🔲 TODO: CV Rewrite
**New positioning** (not "Creative Director transitioning to AI"):
> "AI Implementation Specialist | 18 Years Translating Complex Solutions into Business Value | Building RAG Systems, Workflow Automation & AI-Enabled Tools"

Structure:
1. AI Projects & Technical Skills (lead with portfolio project)
2. Relevant Certifications
3. Transferable Experience (framed for tech)
4. Traditional Work History (condensed)

#### 🔲 TODO: Cover Letter
**Opening hook**:
> "Most candidates for this role will tell you they understand AI technically. I can tell you why AI adoption actually fails in organisations - and show you the tools I've built to solve that."

Key beats:
1. Been in rooms where AI tools get rejected (18 years client delivery)
2. Already building AI-powered tools (cite portfolio)
3. Understand AGGP's nonprofit context (UNHCR, COP17 work)
4. Rapid learner with receipts (certifications while running business)

**Acknowledge gap directly**:
> "I don't have a CS degree or five years of production engineering. What I have is a track record of rapidly acquiring skills, delivering under pressure, and building things that actually get used. I've attached [portfolio URL] as evidence."

### Phase 5: Optional Enhancements (Days 17-19)

#### 🔲 OPTIONAL: Azure AI-900 Certification
- Quick cert showing cloud AI landscape understanding
- Free learning path, ~$165 exam
- 2-3 days to complete

#### 🔲 OPTIONAL: Git Basics + Public Repository
- Ensure GitHub profile (Shepherd-Creative) is presentable
- Portfolio project in public repo with proper README

---

## KEY TECHNICAL NOTES

### Graphiti HTTP Transport
The existing Graphiti MCP server supports HTTP/SSE transport (not just stdio):
```bash
uv run graphiti_mcp_server.py --transport sse
# Exposes on port 8000
```

### Docker Compose Changes Made
1. **Flowise removed** (commented out) - not in use
2. **Certbot fixed** - now uses `profiles: [certbot-renew]`, only runs manually
3. **Graphiti added** - new service with proper Neo4j healthcheck dependency
4. **Neo4j healthcheck** - ensures Graphiti waits for database
5. **Environment variables** - extracted to `.env` for security

### n8n Agent Tool Architecture
Current tools (7):
1. Dynamic Hybrid Search (Supabase pgvector)
2. Query Knowledge Graph (LightRAG)
3. Get datasets from record_manager
4. Query Tabular Rows (SQL)
5. Fetch Document Hierarchy
6. Context Expansion

**Add Tool #8**: `search_biographical_memory` (Graphiti)

### Memory Systems Distinction
| System | Purpose | Source |
|--------|---------|--------|
| **Zep** | Conversational memory, chat history | Conversation persistence |
| **LightRAG** | Document knowledge graph | Document ingestion |
| **Supabase pgvector** | Semantic document search | Document ingestion |
| **Graphiti** | Biographical facts about Pierre | Explicit memory additions |

---

## FILES LOCATION

### Local Development
`/Users/pierregallet/Documents/pierre-vps-dev/`

### VPS Production  
`/home/pierre_sudo_user/docker-apps/`

### Existing n8n Workflows
- SOTA RAG Agent v2.3: Workflow ID `VRSp3P1rRufZXedR`
- SOTA RAG Ingestion v2.3.2: Workflow ID `2lyT3yKTDTTf1jHB`

---

## SUCCESS METRICS

1. **Graphiti running on VPS** with HTTP endpoint accessible
2. **Graphiti integrated** as tool in n8n RAG agent
3. **Biographical data ingested** (Pierre's experience, projects, skills)
4. **Web interface live** at public URL
5. **Application submitted** with portfolio link by Jan 16, 2026

---

## REMINDER: The Pitch

Cover letter ending:
> "I've attached my CV, but I'd rather show you what I can build. At **[portfolio-url]**, you'll find an AI assistant I built in the past three weeks. It runs on a hybrid RAG architecture (pgvector + LightRAG + Graphiti), orchestrated through n8n, and can answer questions about my skills and experience. Ask it anything."

This is **dramatically more compelling** than any certification or CV bullet point.
