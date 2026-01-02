# Portfolio Content - Action Plan

## Overview

This plan outlines how to prepare and ingest content about Pierre into the RAG system for the portfolio chatbot.

---

## Phase 1: Structured Data (Google Sheet)

### Step 1.1: Create Google Sheet

1. Go to Google Drive (the folder watched by RAG ingestion)
2. Create new Google Sheet: `Pierre_Facts_Database`
3. Create tabs as defined in `PIERRE_FACTS_SHEET_STRUCTURE.md`:
   - Certifications
   - Skills
   - Projects
   - Work_History
   - Education
   - Achievements
   - Client_Projects

### Step 1.2: Populate the Sheet

**Certifications to add:**
- [ ] IBM AI Engineering Professional Certificate (status?)
- [ ] UCT Advanced Project Management
- [ ] Prompt Engineering Bootcamp (LangChain, RAG, Agentic)
- [ ] MIT Applied Agentic AI (in progress, Feb 2026)
- [ ] Red & Yellow Creative School - Account Leadership
- [ ] Any other certifications

**Skills to add:**
- [ ] RAG System Architecture (Advanced)
- [ ] n8n Workflow Automation (Advanced)
- [ ] Python (Foundational/Intermediate)
- [ ] Knowledge Graphs (Intermediate)
- [ ] Docker/VPS Management (Intermediate)
- [ ] MCP Protocol (Intermediate)
- [ ] Client Delivery (Advanced - 18 years)
- [ ] Project Management (Advanced)
- [ ] Stakeholder Communication (Advanced)

**Projects to add:**
- [ ] SOTA RAG v2.3.2
- [ ] Obsidian-MCP Server
- [ ] Graphiti Memory Integration
- [ ] VPS Docker Infrastructure
- [ ] Portfolio Chatbot (this project!)

**Work History:**
- [ ] Brand Iron (2007-Present)
- [ ] Any prior roles

**Achievements:**
- [ ] Published MCP on Glama (13 stars)
- [ ] UNHCR partnership
- [ ] RCL Foods HQ project
- [ ] COP17 work

### Step 1.3: Verify Ingestion

After uploading:
1. Check n8n execution logs for ingestion workflow
2. Verify data appears in `tabular_document_rows` table
3. Test SQL query via agent: "What certifications does Pierre have?"

---

## Phase 2: Narrative Documents (Markdown)

### Step 2.1: Review Templates

Review and customize these files in `/portfolio-content/`:
- [ ] `pierre-professional-background.md` - Edit for accuracy
- [ ] `sota-rag-project.md` - Add specific details
- [ ] `obsidian-mcp-project.md` - Verify details
- [ ] `ai-implementation-philosophy.md` - Personalize voice

### Step 2.2: Add Additional Documents (Optional)

Consider creating:
- [ ] `vps-infrastructure.md` - Docker stack details
- [ ] `graphiti-memory-system.md` - Memory architecture
- [ ] `career-transition-story.md` - Personal narrative

### Step 2.3: Upload to Google Drive

1. Upload .md files to RAG ingestion folder
2. Monitor ingestion workflow
3. Verify documents appear in vector store
4. Test queries: "Tell me about Pierre's RAG system"

---

## Phase 3: Optimize Agent Routing

### Step 3.1: Update System Prompt

Modify the agent's system prompt to prioritize:

```
<rule priority="0" type="factual">
Questions asking for specific facts (certifications, dates, counts, lists)
→ Use SQL Query tools first (Get datasets, Query Tabular Rows)
Examples: "What certifications?", "How many years?", "List skills"
</rule>

<rule priority="1" type="biographical">  
Questions about Pierre's background, story, philosophy
→ Use Hybrid Search on narrative documents
Examples: "Tell me about Pierre", "What's his background?"
</rule>

<rule priority="2" type="project">
Questions about specific projects or technical work
→ Use Hybrid Search + Knowledge Graph
Examples: "How does the RAG system work?", "What's the architecture?"
</rule>
```

### Step 3.2: Consider Model Switch

For faster responses, consider switching from Claude Opus 4.5 to Claude Sonnet 4.5:
- Sonnet is significantly faster
- Still highly capable for RAG tasks
- Opus might be overkill for retrieval + synthesis

---

## Phase 4: Testing & Iteration

### Test Queries to Validate

**Factual (should hit SQL):**
- "What certifications does Pierre have?"
- "How many years of experience does Pierre have?"
- "List Pierre's technical skills"
- "What projects has Pierre built in 2025?"

**Narrative (should hit vector search):**
- "Tell me about Pierre's background"
- "Why is Pierre transitioning careers?"
- "What's Pierre's philosophy on AI implementation?"

**Technical (should hit hybrid + graph):**
- "How does Pierre's RAG system work?"
- "What technologies does the SOTA RAG use?"
- "Explain the architecture of Pierre's infrastructure"

### Measure Response Times

Before and after optimization:
- [ ] Average response time for factual queries
- [ ] Average response time for narrative queries
- [ ] Number of tool calls per query

---

## Timeline

| Task | Estimated Time |
|------|----------------|
| Create & populate Google Sheet | 2-3 hours |
| Review & customize markdown docs | 1-2 hours |
| Upload & verify ingestion | 30 mins |
| Update agent system prompt | 30 mins |
| Testing & iteration | 1-2 hours |

**Total: ~6-8 hours of focused work**

---

## Files Created

```
/Users/pierregallet/Documents/pierre-vps-dev/portfolio-content/
├── PIERRE_FACTS_SHEET_STRUCTURE.md   # Google Sheet template
├── pierre-professional-background.md  # Career narrative
├── sota-rag-project.md                # RAG system documentation
├── obsidian-mcp-project.md            # MCP server documentation
├── ai-implementation-philosophy.md    # Thought leadership
└── ACTION_PLAN.md                     # This file
```

---

## Decision: What About Graphiti?

**Keep Graphiti for now, but deprioritize it.**

Current role:
- Conversational memory from chats
- Evolving insights not in documents

After this optimization:
- Most factual queries → SQL (fast)
- Most narrative queries → Vector search (good quality)
- Graphiti becomes supplementary, not primary

If response times are still slow after Phase 3, consider:
- Removing Graphiti tool from agent entirely
- Using Graphiti only for ongoing memory capture, not retrieval
