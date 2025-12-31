# AI Assistant Context Files

This folder contains context files and rules for AI coding assistants (Cursor, Antigravity, Claude) when working on Pierre's projects.

## Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `SECURITY_PROTOCOL.md` | Full security documentation | When handling secrets, API keys, or environment variables |
| `AI_ASSISTANT_RULES.md` | Condensed security rules | Include in AI system prompt for all coding tasks |
| `PROJECT_CONTEXT.md` | Project overview and structure | When AI needs context about the overall project |
| `GIT_WORKFLOW.md` | Git commands for syncing | When user asks to sync, commit, push, or deploy |

## Quick Reference for AI Assistants

### User wants to sync/commit/push?
→ See `GIT_WORKFLOW.md`

### User is adding code that needs API keys?
→ See `SECURITY_PROTOCOL.md` and `AI_ASSISTANT_RULES.md`

### User asks about project structure?
→ See `PROJECT_CONTEXT.md`

## Usage

### For Cursor
Add to `.cursorrules` in project root, or reference in Cursor settings.

### For Antigravity
Include in workspace configuration or paste into system prompt.

### For Claude (Desktop/API)
Include relevant files in conversation or project knowledge.

## Important

These files are part of the `pierre-vps-dev` infrastructure repo, NOT the website submodule. This keeps AI context separate from deployed code.

---

## Directory Structure

```
pierre-vps-dev/
├── ai-context/               ← This folder
│   ├── AI_ASSISTANT_RULES.md
│   ├── GIT_WORKFLOW.md       ← NEW: Sync/commit/push commands
│   ├── PROJECT_CONTEXT.md
│   ├── README.md             ← This file
│   └── SECURITY_PROTOCOL.md
├── personal-website/         ← Lovable submodule
├── website-templates/        ← Security templates
└── ...
```
