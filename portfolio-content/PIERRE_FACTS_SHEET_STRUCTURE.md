# Pierre Facts - Google Sheet Structure

## Instructions
1. Create a new Google Sheet in your RAG ingestion Google Drive folder
2. Name it: `Pierre_Facts_Database`
3. Create these tabs (sheets) within the workbook

---

## Tab 1: Certifications

| Column | Type | Example |
|--------|------|---------|
| cert_name | text | IBM AI Engineering Professional Certificate |
| issuer | text | IBM / Coursera |
| date_earned | date | 2025-06-15 |
| status | text | Completed / In Progress / Planned |
| credential_url | text | https://coursera.org/verify/... |
| skills_covered | text | Python, Machine Learning, Deep Learning |
| relevance_to_ai_role | text | Core technical foundation for AI implementation |

---

## Tab 2: Skills

| Column | Type | Example |
|--------|------|---------|
| skill_name | text | RAG System Architecture |
| category | text | AI/ML, Development, Business, Design |
| proficiency | text | Advanced / Intermediate / Foundational |
| years_experience | number | 1.5 |
| evidence | text | Built SOTA RAG v2.3.2 with hybrid search |
| tools_used | text | n8n, Supabase, LightRAG, Neo4j |

---

## Tab 3: Projects

| Column | Type | Example |
|--------|------|---------|
| project_name | text | SOTA RAG System v2.3.2 |
| category | text | AI Infrastructure / MCP Server / Client Work |
| description | text | Hybrid RAG with pgvector, LightRAG, Graphiti |
| date_completed | date | 2025-10-21 |
| tech_stack | text | n8n, Supabase, Neo4j, Claude API |
| github_url | text | https://github.com/Shepherd-Creative/... |
| key_features | text | Smart chunking, dynamic hybrid search, context expansion |
| metrics | text | 132-node ingestion workflow, 8 agent tools |
| status | text | Production / Development / Archived |

---

## Tab 4: Work_History

| Column | Type | Example |
|--------|------|---------|
| company | text | Brand Iron |
| role | text | Creative Director / Founder |
| start_date | date | 2007-01-01 |
| end_date | date | Present |
| location | text | Cape Town, South Africa |
| description | text | Environmental branding and experiential production |
| key_achievements | text | UNHCR partnership, RCL Foods HQ transformation |
| skills_developed | text | Client delivery, project management, stakeholder communication |
| relevance_to_ai | text | 18 years translating complex solutions to business value |

---

## Tab 5: Education

| Column | Type | Example |
|--------|------|---------|
| institution | text | MIT (via GetSmarter) |
| program | text | Applied Agentic AI |
| start_date | date | 2025-10-01 |
| end_date | date | 2026-02-28 |
| status | text | In Progress / Completed |
| key_learnings | text | Agentic workflows, multi-agent systems |
| credential_url | text | https://... |

---

## Tab 6: Achievements

| Column | Type | Example |
|--------|------|---------|
| achievement | text | Published MCP Server on Glama |
| category | text | Open Source / Client Work / Recognition |
| date | date | 2025-09-01 |
| description | text | Obsidian-MCP server with 13+ GitHub stars |
| evidence_url | text | https://glama.ai/mcp/servers/obsidian-mcp |
| impact | text | Demonstrates ability to ship production tools |

---

## Tab 7: Client_Projects (Legacy Brand Iron Work)

| Column | Type | Example |
|--------|------|---------|
| client | text | RCL Foods |
| project | text | Rainbow Chicken HQ Transformation |
| year | number | 2019 |
| description | text | 90,000 wooden spoons arranged into artistic installations |
| category | text | Environmental Branding / Experiential / Signage |
| scale | text | Large-scale corporate headquarters |
| outcome | text | Successfully delivered high-stakes one-shot installation |

---

## How This Will Be Used

When you upload this Google Sheet to your RAG ingestion folder:

1. Each tab becomes queryable via SQL
2. Agent can answer: "What certifications does Pierre have?" → Direct SQL query
3. Agent can answer: "What projects use Neo4j?" → SQL with WHERE clause
4. Much faster than graph traversal for factual lookups

---

## Sample Queries the Agent Will Run

```sql
-- What certifications does Pierre have?
SELECT cert_name, issuer, date_earned, status 
FROM certifications 
ORDER BY date_earned DESC;

-- What AI/ML skills does Pierre have?
SELECT skill_name, proficiency, evidence 
FROM skills 
WHERE category = 'AI/ML';

-- What projects has Pierre completed in 2025?
SELECT project_name, description, tech_stack 
FROM projects 
WHERE date_completed >= '2025-01-01';
```
