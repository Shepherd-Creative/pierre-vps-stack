# Pierre Gallet Portfolio Site - V3 Roadmap (Lovable + Submodule)

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT                            │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │    Lovable.dev  │◄──►│     GitHub      │               │
│  │  (AI builder)   │    │   (website repo) │               │
│  └─────────────────┘    └────────┬────────┘               │
│                                  │                         │
│                                  ▼                         │
│  ┌───────────────────────────────────────────────────────┐│
│  │              pierre-vps-dev (local)                    ││
│  │  ┌─────────────────────────────────────────────────┐  ││
│  │  │  personal-website/ ← Git Submodule              │  ││
│  │  │  (points to GitHub website repo)                │  ││
│  │  └─────────────────────────────────────────────────┘  ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ││
│  │  │ ai-context/ │  │ website-    │  │ docker-apps/│   ││
│  │  │ (AI rules)  │  │ templates/  │  │ (VPS infra) │   ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘   ││
│  └───────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ git push / deploy
┌─────────────────────────────────────────────────────────────┐
│                         VPS                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  n8n Chat Endpoint                                   │   │
│  │  URL: https://n8n.brandiron.co.za/webhook/.../chat   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────┐  ┌────────▼───┐  ┌──────────┐  ┌──────────┐ │
│  │ Graphiti │  │  n8n RAG   │  │ LightRAG │  │ Supabase │ │
│  │ Memory   │◄─┤   Agent    ├─►│  Graph   │  │ pgvector │ │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## REPOSITORY STRUCTURE

### Parent Repo: `pierre-vps-dev` (Infrastructure)

```
pierre-vps-dev/
├── personal-website/         ← Git submodule → Lovable's GitHub repo
│   ├── src/
│   ├── public/
│   ├── .env                  ← Local only (never committed)
│   ├── .env.example          ← Template (committed)
│   └── package.json
├── ai-context/               ← AI assistant context (not in website)
│   ├── AI_ASSISTANT_RULES.md
│   ├── PROJECT_CONTEXT.md
│   ├── README.md
│   └── SECURITY_PROTOCOL.md
├── website-templates/        ← Security templates for website setup
│   ├── pre-commit-hook.sh
│   ├── env.example
│   └── gitignore-additions
├── portfolio-content/        ← RAG content for ingestion
│   ├── pierre-facts.csv
│   └── narrative-docs/
├── docker-apps/              ← VPS Docker configurations
├── caddy/                    ← Reverse proxy
├── graphiti/                 ← Graph memory system
├── lightrag/                 ← Knowledge graph RAG
└── supabase/                 ← Database configurations
```

### Website Repo: `personal-website` (Lovable-managed)

Syncs bidirectionally with Lovable.dev:
- Edit in Lovable → pushes to GitHub → pull locally
- Edit locally → push to GitHub → appears in Lovable

---

## WORKFLOW: Lovable ↔ GitHub ↔ Local

### Initial Setup (One-time)

```bash
# 1. Connect Lovable to GitHub (do this in Lovable.dev UI)
#    - Settings → Connectors → GitHub
#    - Let Lovable create repo OR connect existing
#    - Repo name: "personal-website" or similar

# 2. Add as submodule to pierre-vps-dev
cd ~/Documents/pierre-vps-dev
rm -rf personal-website/  # Remove empty folder first
git submodule add https://github.com/YOUR-USERNAME/personal-website.git personal-website

# 3. Install security hooks
cp website-templates/pre-commit-hook.sh personal-website/.git/hooks/pre-commit
chmod +x personal-website/.git/hooks/pre-commit

# 4. Set up environment variables
cp website-templates/env.example personal-website/.env.example
cp personal-website/.env.example personal-website/.env
# Edit personal-website/.env with real values

# 5. Commit submodule addition
git add .gitmodules personal-website
git commit -m "Add personal-website as Lovable submodule"
git push
```

### Daily Workflow A: Edit in Lovable

```bash
# Pull changes from Lovable (via GitHub)
cd ~/Documents/pierre-vps-dev/personal-website
git pull

# Test locally
npm install
npm run dev

# Update parent repo's submodule pointer
cd ..
git add personal-website
git commit -m "Update website: [description of Lovable changes]"
git push
```

### Daily Workflow B: Edit Locally (Cursor/VS Code)

```bash
# Make changes in personal-website/
cd ~/Documents/pierre-vps-dev/personal-website

# Test locally
npm run dev

# Commit and push (goes to GitHub → Lovable sees it)
git add .
git commit -m "Update: [what changed]"
git push

# Update parent repo
cd ..
git add personal-website
git commit -m "Update website submodule pointer"
git push
```

### Deploy to VPS

```bash
# SSH to VPS
ssh your-vps

# Pull updates
cd ~/pierre-vps-dev
git pull
git submodule update --init --recursive

# Build and deploy website
cd personal-website
npm install
npm run build
# Copy dist/ to web server location or restart Docker
```

---

## SECURITY: Environment Variables

### Variables Required

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `VITE_CHAT_WEBHOOK_URL` | n8n chat agent endpoint | `.env` (local only) |
| `VITE_SUPABASE_URL` | Supabase project URL | `.env` (local only) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `.env` (local only) |
| `VITE_ENABLE_CHAT` | Feature flag | `.env` (local only) |

### File Locations

```
personal-website/
├── .env              ← NEVER commit (contains real secrets)
├── .env.example      ← Commit (contains placeholders only)
└── .gitignore        ← Must include .env
```

### Code Pattern

```typescript
// ✅ CORRECT - Always use environment variables
const chatWebhookUrl = import.meta.env.VITE_CHAT_WEBHOOK_URL;

// ❌ WRONG - Never hardcode secrets
const chatWebhookUrl = "https://n8n.brandiron.co.za/webhook/abc-123/chat";
```

### Pre-commit Hook

Automatically checks for secrets before every commit:
- Blocks `.env` files
- Detects API key patterns (`sk-`, `pk_`, etc.)
- Warns about webhook URLs with UUIDs

See `website-templates/pre-commit-hook.sh` for full implementation.

---

## AI ASSISTANT INTEGRATION

### For Cursor/Antigravity

Copy `ai-context/AI_ASSISTANT_RULES.md` into:
- Cursor: `.cursorrules` file in project root
- Antigravity: Workspace configuration or system prompt

### For Claude

Include relevant files from `ai-context/` in conversation or project knowledge.

### Key Rules

1. **Never hardcode secrets** - Use `import.meta.env.VITE_*`
2. **Never display secrets** - Even in AI responses
3. **Remind about .env** - When adding features that need secrets
4. **Check before commit** - Run secret detection grep

---

## PHASE CHECKLIST

### Phase 1: Setup (Current)

- [ ] Clean up duplicate folders (`website-security/`, `website/`)
- [ ] Connect Lovable to GitHub
- [ ] Add as submodule to `pierre-vps-dev`
- [ ] Install pre-commit hook
- [ ] Set up `.env` files
- [ ] Test local development

### Phase 2: Website Development (In Lovable)

- [ ] Build hero section with chat
- [ ] Build About section
- [ ] Build Projects section
- [ ] Build Qualifications section
- [ ] Build Contact section
- [ ] Responsive design
- [ ] Chat widget integration

### Phase 3: RAG Content Preparation

- [ ] Create `pierre-facts.csv` spreadsheet
- [ ] Write narrative markdown docs
- [ ] Ingest into RAG system
- [ ] Update agent routing
- [ ] Test response quality

### Phase 4: Integration & Polish

- [ ] Connect chat to n8n webhook
- [ ] Test end-to-end flow
- [ ] Performance optimization
- [ ] Mobile testing

### Phase 5: Deploy

- [ ] Build for production
- [ ] Deploy to VPS
- [ ] SSL certificate
- [ ] DNS configuration
- [ ] Final testing

---

## TIMELINE

**Application Deadline:** January 19, 2026
**Target Completion:** January 16, 2026 (3-day buffer)

| Phase | Est. Time | Deadline |
|-------|-----------|----------|
| 1. Setup | 2 hours | Dec 31 |
| 2. Website Dev | 8-10 hours | Jan 5 |
| 3. RAG Content | 4-6 hours | Jan 10 |
| 4. Integration | 4-6 hours | Jan 13 |
| 5. Deploy | 2-3 hours | Jan 15 |

---

## CHAT ENDPOINT

**URL:** `https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat`

**Workflow:** SOTA RAG Agent - v2.3 (ID: `VRSp3P1rRufZXedR`)

**Status:** Active ✅

**Connected Tools:**
- Graphiti Memory Search
- Dynamic Hybrid Search
- Query Knowledge Graph (LightRAG)
- Query Tabular Rows (SQL)
- Context Expansion

---

## DESIGN REFERENCE

See `PORTFOLIO_SITE_ROADMAP_V2.md` for:
- Design vision (webild.io inspiration)
- Color palette and CSS variables
- Glassmorphism card styles
- Chat hero → widget transition
- Section layouts
- Responsive breakpoints

---

## SUCCESS CRITERIA

### Must Have
- [ ] Chat interface works end-to-end
- [ ] Can answer questions about Pierre's experience
- [ ] Professional appearance
- [ ] Mobile responsive
- [ ] Deployed to public URL

### Should Have
- [ ] Projects showcase
- [ ] Qualifications display
- [ ] Fast response times (<5s)
- [ ] Smooth animations

### Nice to Have
- [ ] Chat navigates to sections
- [ ] Dark mode
- [ ] Architecture diagrams
- [ ] Blog/insights section

---

*Document Version: 3.0*
*Last Updated: December 2024*
*Approach: Lovable.dev + Git Submodule*
