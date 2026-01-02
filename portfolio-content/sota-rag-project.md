# SOTA RAG System v2.3.2

## Project Overview

A state-of-the-art Retrieval-Augmented Generation system built by Pierre Gallet, designed for intelligent document retrieval and conversational AI applications.

## Architecture

### Core Components

1. **Vector Store:** Supabase pgvector
   - Stores document embeddings for semantic search
   - OpenAI text-embedding-3-small model
   - Supports hybrid search (dense + sparse)

2. **Knowledge Graph:** LightRAG
   - Extracts entities and relationships from documents
   - Enables relationship-based queries
   - Connected to Neo4j for graph storage

3. **Biographical Memory:** Graphiti
   - Stores facts about users/entities
   - MCP server integration
   - Separate from document knowledge

4. **Orchestration:** n8n
   - Visual workflow automation
   - 132 nodes in ingestion workflow
   - 21 nodes in agent workflow

### Search Capabilities

**Dynamic Hybrid Search** with tunable weights:
- **Dense (semantic):** Vector similarity for conceptual queries
- **Sparse (lexical):** BM25-style keyword matching
- **iLike:** Exact pattern matching for IDs/codes
- **Fuzzy:** Typo-tolerant matching

Weights are dynamically adjusted based on query type, summing to 1.0.

## Ingestion Pipeline

### Supported File Types
- PDF (via LlamaParse with OCR)
- Word documents (.docx)
- Google Docs
- Markdown (.md)
- Text files (.txt)
- CSV → Tabular data
- Excel (.xlsx) → Tabular data
- Google Sheets → Tabular data
- Images (multimodal processing)

### Processing Steps

1. **Trigger:** Google Drive watch or webhook
2. **Hash Check:** Detect new vs. updated documents
3. **Text Extraction:** Format-specific processing
4. **Smart Chunking:** Preserves document hierarchy
5. **Metadata Enrichment:** LLM extracts structured fields
6. **Embedding:** OpenAI embeddings generated
7. **Vector Storage:** Inserted into Supabase pgvector
8. **Knowledge Graph:** LightRAG extracts entities/relationships
9. **Record Manager:** Tracks document status and versions

### Document Hierarchy

The system preserves document structure:
- Section detection and range tracking
- Parent/child chunk relationships
- Context expansion via sibling/parent retrieval

## Agent Tools

The RAG agent has access to 8 specialized tools:

1. **Dynamic Hybrid Search** - Tunable semantic/lexical search
2. **Query Knowledge Graph** - LightRAG entity/relationship queries
3. **Get Datasets** - List available tabular data sources
4. **Query Tabular Rows** - SQL queries on structured data
5. **Fetch Document Hierarchy** - Get document structure map
6. **Context Expansion** - Retrieve surrounding chunks
7. **Graphiti Memory Search** - Biographical fact retrieval
8. **Search Nodes/Facts** - MCP-based memory queries

## Technical Specifications

### Infrastructure
- **Hosting:** Self-hosted VPS (Ubuntu 24.04)
- **Container Orchestration:** Docker Compose
- **Database:** Supabase (Postgres 15 + pgvector)
- **Graph Database:** Neo4j 5.26.2
- **LLM:** Claude Sonnet/Opus via Anthropic API
- **Embeddings:** OpenAI text-embedding-3-small

### Performance Optimizations
- Batch embedding generation
- Connection pooling
- Chunked vector insertion
- Async knowledge graph updates

## Key Differentiators

1. **Hybrid Search:** Not just vector similarity - combines multiple search strategies
2. **Document Hierarchy:** Maintains structure for intelligent context expansion
3. **Knowledge Graph Integration:** Entity relationships enhance retrieval
4. **Tabular Data Support:** SQL queries for structured data
5. **Production Ready:** Running in production with monitoring

## Lessons Learned

Building this system taught Pierre:

- The importance of chunking strategy for retrieval quality
- Why hybrid search outperforms pure semantic search
- How knowledge graphs complement vector stores
- The operational complexity of multi-component AI systems
- The value of proper document hierarchy preservation

## Future Enhancements

- Streaming responses for better UX
- Multi-tenant support
- Advanced reranking
- Query routing optimization
- Caching layer for common queries
