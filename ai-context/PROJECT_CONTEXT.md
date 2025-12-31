# Project Context: Pierre Gallet Portfolio Website

> **For AI Assistants**: This document provides context about the project structure, goals, and technical decisions to help you provide better assistance.

---

## Project Overview

**What**: Personal portfolio website with an AI-powered chat assistant
**Who**: Pierre Gallet - Creative Director transitioning to AI Strategy & Implementation
**Purpose**: Demonstrate technical capabilities to potential employers, specifically for the AGGP AI Engineer position

---

## Repository Structure

This project spans two connected repositories:

### 1. Infrastructure Repo: `pierre-vps-dev` (Private)

Contains VPS infrastructure, Docker configurations, and development tooling.

```
pierre-vps-dev/
├── personal-website/         ← Git submodule (website code from Lovable)
├── ai-context/               ← AI assistant context files
│   ├── SECURITY_PROTOCOL.md
│   ├── AI_ASSISTANT_RULES.md
│   └── PROJECT_CONTEXT.md    ← This file
├── website-templates/        ← Security templates for website setup
│   ├── pre-commit-hook.sh
│   ├── env.example
│   └── gitignore-template
├── docker-apps/              ← Docker configurations for VPS services
├── caddy/                    ← Reverse proxy configuration
├── graphiti/                 ← Graph memory system
├── lightrag/                 ← Knowledge graph RAG
├── supabase/                 ← Database configurations
└── scripts/                  ← Utility scripts
```

### 2. Website Repo: `personal-website` (Submodule)

Contains the frontend code, managed via Lovable.dev.

```
personal-website/             ← Syncs with Lovable.dev
├── src/
│   ├── components/
│   ├── pages/
│   └── ...
├── public/
├── .env                      ← Local only, never committed
├── .env.example              ← Template with placeholders
└── package.json
```

---

## Technical Stack

### Frontend (personal-website)
- **Framework**: React + Vite (via Lovable.dev)
- **Styling**: Tailwind CSS
- **Chat Widget**: n8n embedded chat

### Backend Infrastructure (pierre-vps-dev)
- **VPS**: Ubuntu server with Docker
- **Reverse Proxy**: Caddy (auto SSL)
- **AI Agent**: n8n workflow with Claude
- **RAG System**: 
  - Supabase pgvector (vector store)
  - LightRAG (knowledge graph)
  - Graphiti (biographical memory)
- **Database**: Supabase (PostgreSQL)

---

## Key Integrations

### Chat Widget → n8n Agent

The website includes a chat widget that connects to an n8n workflow.

```
User → Chat Widget → n8n Webhook → Claude Agent → RAG Tools → Response
```

**Environment Variable**: `VITE_CHAT_WEBHOOK_URL`

### Lovable.dev ↔ GitHub ↔ Local Development

```
Lovable.dev ←→ GitHub Repo ←→ Local (personal-website/)
                    ↓
              pierre-vps-dev (as submodule)
```

---

## Development Workflows

### Editing in Lovable
1. Make changes in Lovable.dev
2. Lovable pushes to GitHub
3. Pull changes locally: `cd personal-website && git pull`
4. Update submodule pointer: `cd .. && git add personal-website && git commit`

### Editing Locally (Cursor/VS Code)
1. Make changes in `personal-website/`
2. Test locally: `npm run dev`
3. Commit and push: `git add . && git commit && git push`
4. Lovable sees changes automatically
5. Update parent repo: `cd .. && git add personal-website && git commit && git push`

### Deploying to VPS
```bash
ssh vps
cd ~/pierre-vps-dev
git pull
git submodule update --init --recursive
cd personal-website && npm install && npm run build
# Restart services as needed
```

---

## Security Considerations

### Never Commit
- `.env` files with real values
- API keys or tokens
- Webhook URLs with UUIDs
- Personal contact information

### Always Use
- Environment variables (`import.meta.env.VITE_*`)
- `.env.example` with placeholder values
- Pre-commit hooks to catch secrets

### See Also
- `SECURITY_PROTOCOL.md` - Full security documentation
- `AI_ASSISTANT_RULES.md` - Condensed rules for AI assistants

---

## Current Goals

### Primary: AGGP Application (Deadline: Jan 19, 2026)
- Functional portfolio website with AI chat
- Demonstrates: RAG systems, n8n automation, full-stack deployment
- Shows: Technical depth + business understanding

### Secondary: Ongoing Portfolio
- Expandable for future opportunities
- Showcases evolving AI implementation skills

---

## Common Tasks for AI Assistants

### "Add a new feature to the chat"
1. Work in `personal-website/src/`
2. Use environment variables for any secrets
3. Test locally before committing

### "Update the RAG system"
1. Work in `pierre-vps-dev/` (not the submodule)
2. Modify n8n workflows or Docker configs
3. Deploy changes to VPS

### "Fix a styling issue"
1. Work in `personal-website/src/`
2. Use Tailwind classes
3. Changes sync to Lovable automatically

### "Add new content/copy"
1. If static content: edit in `personal-website/`
2. If dynamic/RAG content: ingest documents via n8n workflow

---

## Contact & Resources

- **GitHub**: github.com/pierre-gallet (or Shepherd-Creative)
- **n8n Instance**: n8n.brandiron.co.za
- **VPS Domain**: brandiron.co.za

---

*Last Updated: December 2024*
