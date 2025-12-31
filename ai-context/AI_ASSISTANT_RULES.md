# AI ASSISTANT SECURITY RULES - PORTFOLIO WEBSITE
# ================================================
# Include this file in your AI assistant's context/rules
# when working on the portfolio website project.
#
# Project folder: pierre-vps-dev/personal-website/

## CRITICAL: Never Include These in Code Files

1. **Webhook URLs** - Any URL containing `/webhook/` and a UUID
2. **API Keys** - Patterns: `sk-*`, `pk_*`, `sbp_*`, `eyJ*` (JWT)
3. **Connection strings** - Database URLs with credentials
4. **Personal contact info** - Phone numbers, personal email, address

## Required Pattern: Environment Variables

```typescript
// ✅ ALWAYS use this pattern
const webhookUrl = import.meta.env.VITE_CHAT_WEBHOOK_URL;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// ❌ NEVER hardcode secrets
const webhookUrl = "https://n8n.example.com/webhook/abc-123/chat";
```

## When User Shares a Secret

If user pastes an API key, webhook URL, or other secret:

1. DO NOT include it in any code you generate
2. Instruct user to add it to their `.env` file
3. Reference it via `import.meta.env.VITE_*` in code

Example response:
```
I see you've shared a webhook URL. Add this to your `.env` file:
VITE_CHAT_WEBHOOK_URL=<your-url-here>

I'll reference it in code as: import.meta.env.VITE_CHAT_WEBHOOK_URL
```

## Before Generating Code That Needs Secrets

Always ask yourself:
1. Does this feature need an API key or webhook URL?
2. Am I using environment variables (not hardcoding)?
3. Have I reminded the user to update their `.env` file?

## File Rules

| File | Rule |
|------|------|
| `.env` | NEVER commit, NEVER display contents |
| `.env.example` | OK to commit with PLACEHOLDER values only |
| `src/**/*.ts(x)` | Use `import.meta.env.VITE_*` for secrets |
| `*.config.js` | Review for hardcoded values before commit |

## Logging Rules

```typescript
// ✅ OK - Boolean check
console.log('Webhook configured:', !!import.meta.env.VITE_CHAT_WEBHOOK_URL);

// ❌ NEVER - Exposes secret
console.log('Webhook URL:', import.meta.env.VITE_CHAT_WEBHOOK_URL);
```

## Pre-Commit Reminder

Before any git commit in `personal-website/`, remind user to run:
```bash
git diff --cached | grep -E "(sk-|webhook/[a-f0-9-]{36})"
```

If this returns results, secrets may be staged for commit.

## Project-Specific Variables

| Variable | Purpose |
|----------|---------|
| `VITE_CHAT_WEBHOOK_URL` | n8n chat agent endpoint |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_ENABLE_CHAT` | Feature flag for chat widget |

## Project Structure

```
pierre-vps-dev/
├── personal-website/         ← Lovable submodule (website code)
├── ai-context/               ← This folder (AI rules, not in website)
├── website-templates/        ← Security templates (not in website)
├── docker-apps/              ← VPS infrastructure
└── caddy/                    ← Reverse proxy config
```

---
*This is a condensed security protocol. Full version: SECURITY_PROTOCOL.md*
