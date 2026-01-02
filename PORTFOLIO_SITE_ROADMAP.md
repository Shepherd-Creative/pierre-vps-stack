# Pierre Gallet Portfolio Chat Site - Development Roadmap

## PROJECT OVERVIEW

Build a portfolio website with an AI chat interface that connects to Pierre's existing n8n RAG agent. The chat allows visitors (particularly job interviewers) to ask questions about Pierre's skills, experience, and projects.

**Primary Goal:** Working chat interface that queries Pierre's knowledge graph
**Secondary Goal:** Professional portfolio wrapper (projects, bio, CV)

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Astro)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │ Projects │  │   Chat   │  │    CV    │   │
│  │   Bio    │  │ Gallery  │  │ Embedded │  │   Page   │   │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────┘   │
└────────────────────────────────────┼────────────────────────┘
                                     │ 
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      VPS BACKEND                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  n8n Chat Endpoint (Embedded Chat)                   │   │
│  │  URL: https://n8n.brandiron.co.za/webhook/           │   │
│  │       5e442826-4547-4647-8d24-1641210f2a8e/chat      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────┐  ┌────────▼───┐  ┌──────────┐  ┌──────────┐ │
│  │ Graphiti │  │  n8n RAG   │  │ LightRAG │  │ Supabase │ │
│  │ Memory   │◄─┤   Agent    ├─►│  Graph   │  │ pgvector │ │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## TECH STACK

- **Framework:** Astro (static site generator)
- **Chat Component:** n8n Embedded Chat (native integration)
- **Styling:** Tailwind CSS
- **Deployment:** Pierre's VPS (Docker container behind nginx)
- **Backend:** n8n Chat Trigger (already configured)

---

## N8N CHAT ENDPOINT (CONFIGURED)

**Chat URL:** `https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat`

**Workflow:** SOTA RAG Agent - v2.3 (ID: `VRSp3P1rRufZXedR`)

**Authentication:** None (public access)

**Connected Tools:**
- Graphiti Memory Search (biographical info about Pierre)
- Dynamic Hybrid Search (document retrieval)
- Query Knowledge Graph (LightRAG)
- Query Tabular Rows (SQL data)
- Fetch Document Hierarchy
- Context Expansion

---

## PHASE 1: EMBED CHAT & TEST (Day 1)

### Step 1.1: Create minimal test page

Create a simple HTML file to test the embedded chat works:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat with Pierre's AI</title>
  <link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    #n8n-chat {
      max-width: 800px;
      margin: 0 auto;
      height: 600px;
    }
  </style>
</head>
<body>
  <h1>Ask Pierre's AI Assistant</h1>
  <div id="n8n-chat"></div>
  
  <script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
    
    createChat({
      webhookUrl: 'https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat',
      target: '#n8n-chat',
      mode: 'fullscreen',
      showWelcomeScreen: true,
      initialMessages: [
        'Hi! I\'m Pierre\'s AI assistant. I can answer questions about his skills, projects, and experience.',
        'Try asking: "What RAG systems has Pierre built?" or "Tell me about Pierre\'s background"'
      ],
      i18n: {
        en: {
          title: 'Chat with Pierre\'s AI',
          subtitle: 'Ask me anything about Pierre\'s skills and experience',
          inputPlaceholder: 'Type your question...',
        },
      },
    });
  </script>
</body>
</html>
```

### Step 1.2: Test locally

1. Save the HTML file
2. Open it in a browser
3. Test these questions:
   - "What skills does Pierre have?"
   - "Tell me about Pierre's RAG system"
   - "What MCP servers has Pierre built?"

### Step 1.3: Verify n8n workflow is active

**IMPORTANT:** The workflow must be activated for the chat to work.

Current status: `"active": false` - **YOU NEED TO ACTIVATE IT**

In n8n, toggle the workflow to active.

---

## PHASE 2: ASTRO PORTFOLIO WRAPPER (Days 2-3)

### Step 2.1: Initialize Astro project

```bash
npm create astro@latest pierre-portfolio
cd pierre-portfolio
npx astro add tailwind
```

### Step 2.2: Create page structure

```
src/
├── layouts/
│   └── BaseLayout.astro      # Common header, nav, footer
├── pages/
│   ├── index.astro           # Home - bio and intro
│   ├── projects.astro        # Project gallery
│   ├── chat.astro            # Chat interface
│   └── cv.astro              # CV/Resume page
├── components/
│   ├── Navigation.astro      # Site navigation
│   ├── ProjectCard.astro     # Project display card
│   ├── ChatEmbed.astro       # n8n chat wrapper
│   └── Footer.astro          # Site footer
└── content/
    └── projects/             # Project markdown files
        ├── sota-rag.md
        ├── obsidian-mcp.md
        └── graphiti-memory.md
```

### Step 2.3: Chat page with n8n embed

```astro
---
// src/pages/chat.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Chat with Pierre's AI">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-4">Ask Me Anything</h1>
    <p class="text-gray-600 mb-8">
      This AI assistant knows about my skills, projects, and experience. 
      It's powered by a RAG system I built myself.
    </p>
    
    <div id="n8n-chat" class="h-[600px]"></div>
  </div>
  
  <script type="module">
    import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
    
    createChat({
      webhookUrl: 'https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat',
      target: '#n8n-chat',
      mode: 'fullscreen',
      showWelcomeScreen: false,
      initialMessages: [
        'Hi! I\'m Pierre\'s AI assistant. Ask me about his skills, projects, or experience.'
      ],
    });
  </script>
</BaseLayout>
```

### Step 2.4: Home page content

**Key elements:**
- Short bio (2-3 paragraphs)
- Profile photo (optional)
- Quick links to Chat and Projects
- Tagline: "AI Implementation Specialist | 18 Years Translating Complex Solutions into Business Value"

### Step 2.5: Projects page

**Projects to showcase:**

1. **SOTA RAG System v2.3.2**
   - Hybrid architecture: pgvector + LightRAG + Graphiti
   - 132-node n8n ingestion workflow
   - Smart chunking, dynamic hybrid search
   - Screenshot of n8n workflow

2. **Obsidian-MCP Server**
   - Published on Glama (13 stars)
   - GitHub link: Shepherd-Creative/obsidian-mcp
   - MIT licensed

3. **Graphiti Memory System**
   - Biographical knowledge graph
   - Neo4j backend
   - MCP server integration

4. **VPS Infrastructure**
   - Full Docker stack
   - Services: n8n, Neo4j, LightRAG, Supabase, Qdrant, monitoring
   - Architecture diagram

5. **Brand Iron Portfolio** (Legacy work)
   - Environmental branding
   - UNHCR, RCL Foods projects
   - Physical installation photos

---

## PHASE 3: DEPLOY & POLISH (Days 4-5)

### Step 3.1: Docker deployment

Create Dockerfile for Astro static build:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

Add to VPS docker-compose.yml:
```yaml
portfolio:
  build: ./portfolio
  container_name: portfolio
  restart: unless-stopped
  expose:
    - 80
  networks:
    - docker-apps-network
```

### Step 3.2: Nginx config

Add nginx config for portfolio.brandiron.co.za:

```nginx
server {
    listen 443 ssl;
    server_name portfolio.brandiron.co.za;

    ssl_certificate /etc/letsencrypt/live/brandiron.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brandiron.co.za/privkey.pem;

    location / {
        proxy_pass http://portfolio:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name portfolio.brandiron.co.za;
    return 301 https://$server_name$request_uri;
}
```

### Step 3.3: Suggested questions

Add to chat interface:
- "What RAG architecture experience do you have?"
- "Tell me about your MCP server projects"
- "What's your background in client delivery?"
- "How do you approach AI implementation?"

### Step 3.4: SSL certificate

Once certbot is fixed, add cert for portfolio.brandiron.co.za

---

## IMPORTANT CONTEXT

### VPS Access

```
Host: 46.202.128.120
User: pierre_sudo_user
Docker apps: ~/docker-apps/
```

### Git Repository

```
Repo: https://github.com/Shepherd-Creative/pierre-vps-stack
Branch: main
```

### Existing n8n Workflows

- SOTA RAG Agent v2.3: Workflow ID `VRSp3P1rRufZXedR`
- SOTA RAG Ingestion v2.3.2: Workflow ID `2lyT3yKTDTTf1jHB`

### Graphiti Configuration

- Group ID: `main`
- Endpoint: `http://graphiti:8000/sse` (internal Docker network)

---

## SUCCESS CRITERIA

### Minimum Viable (Must have):
- [ ] n8n workflow activated
- [ ] Chat interface works end-to-end
- [ ] Can answer questions about Pierre's experience
- [ ] Deployed to public URL

### Good (Should have):
- [ ] Portfolio wrapper with projects page
- [ ] Professional styling
- [ ] Mobile responsive

### Great (Nice to have):
- [ ] CV page
- [ ] Blog post about building the system
- [ ] Architecture diagram on projects page
- [ ] Dark mode

---

## DEADLINE

**Application deadline:** January 19, 2026
**Target completion:** January 16, 2026 (3 days buffer)

---

## NEXT IMMEDIATE STEPS

1. **ACTIVATE THE WORKFLOW** in n8n (currently inactive)
2. Test the chat URL directly: https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat
3. Create test HTML page and verify chat works
4. Then proceed to Astro build in IDE

---

## QUESTIONS FOR PIERRE

1. Do you have a profile photo to use?
2. Any specific color scheme preference?
3. Do you want the chat on homepage or separate page?
4. Which legacy Brand Iron projects should we showcase (photos available)?
