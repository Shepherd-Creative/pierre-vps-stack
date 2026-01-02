# Obsidian-MCP Server

## Project Overview

An open-source Model Context Protocol (MCP) server that enables AI assistants to interact with Obsidian vaults. Published on the Glama MCP marketplace.

## Key Details

- **Repository:** github.com/Shepherd-Creative/obsidian-mcp
- **Marketplace:** Listed on Glama.ai
- **Stars:** 13+ on GitHub
- **License:** MIT
- **Author:** Pierre Gallet

## What It Does

The Obsidian-MCP server allows AI assistants (like Claude) to:

1. **Read notes** from an Obsidian vault
2. **Search notes** by content or tags
3. **Create new notes** with proper frontmatter
4. **Update existing notes**
5. **Navigate the vault structure**

## Why This Matters

This project demonstrates Pierre's ability to:

1. **Understand the MCP protocol** - The emerging standard for AI tool integration
2. **Ship production-quality tools** - Listed on a public marketplace
3. **Write developer documentation** - Clear README and usage instructions
4. **Contribute to open source** - MIT licensed for community use
5. **Build practical integrations** - Solves a real workflow need

## Technical Implementation

### MCP Protocol
- JSON-RPC based communication
- Supports stdio transport (local) and SSE transport (server)
- Tool definitions for vault operations
- Resource exposure for vault structure

### Integration Points
- Claude Desktop via claude_desktop_config.json
- Any MCP-compatible AI assistant
- Custom applications via MCP client libraries

## Use Cases

1. **Personal Knowledge Management:** AI assistant that knows your notes
2. **Research Workflows:** Query and synthesize information from vault
3. **Content Creation:** AI-assisted writing with context from existing notes
4. **Task Management:** Interact with task notes and project documentation

## Development Process

Pierre built this to solve his own workflow needs:
- Using Obsidian for Zettelkasten-style note-taking
- Wanting Claude to have context about his knowledge base
- Learning MCP protocol through practical implementation

## Community Reception

The server's listing on Glama and GitHub stars indicate:
- Useful to other developers
- Quality implementation
- Active community interest in Obsidian + AI integration

## Related Skills Demonstrated

- TypeScript/JavaScript development
- API design
- Documentation writing
- Open source contribution
- Understanding of AI assistant architectures
