# Security Protocol for Portfolio Website Development

> **PURPOSE**: This document defines security rules for AI coding assistants (Cursor, Antigravity, Claude) and human developers when working on the portfolio website. Following these rules prevents accidental exposure of API keys, webhook URLs, and other sensitive data.

## Project Structure Reference

```
pierre-vps-dev/                    ← Infrastructure repo (private)
├── personal-website/              ← Submodule → Lovable's repo
│   ├── src/
│   ├── .env                       ← Never committed
│   └── .env.example               ← Committed (placeholders)
├── ai-context/                    ← AI assistant context files (this folder)
│   ├── SECURITY_PROTOCOL.md       ← This file
│   ├── AI_ASSISTANT_RULES.md      ← Condensed rules
│   └── PROJECT_CONTEXT.md         ← Project overview
├── website-templates/             ← Security templates & hooks
│   ├── pre-commit-hook.sh
│   ├── env.example
│   └── gitignore-template
├── docker-apps/
└── caddy/
```

---

## 🚨 CRITICAL RULE: NEVER COMMIT SECRETS

**Before ANY git operation, verify no secrets are being committed.**

Secrets include:
- API keys (OpenAI, Anthropic, Supabase, etc.)
- Webhook URLs (n8n endpoints)
- Database connection strings
- JWT tokens or session secrets
- Any URL containing UUIDs that grant access
- Personal contact information (phone, personal email, address)

---

## File Classification System

### 🔴 RED FILES - Never Commit (in .gitignore)

These files contain secrets and must NEVER be committed to git:

```
.env
.env.local
.env.development
.env.production
.env.staging
.env*.local
*.pem
*.key
secrets.json
config.local.js
```

**Rule**: If creating or editing a RED file, the AI assistant must:
1. Verify the file is in `.gitignore`
2. Never display full secret values in responses
3. Use placeholder syntax: `your-api-key-here` or `<REDACTED>`

### 🟡 YELLOW FILES - Commit with Caution

These files are committed but must be reviewed for accidental secrets:

```
.env.example          # Template only - placeholder values
docker-compose.yml    # May reference env vars
caddy/Caddyfile      # May contain domain info
*.config.js          # Build configs
```

**Rule**: Before committing YELLOW files, search for:
- Anything starting with `sk-`, `pk_`, `sbp_`, `eyJ`
- URLs containing `/webhook/` followed by UUIDs
- 32+ character alphanumeric strings (likely keys)

### 🟢 GREEN FILES - Safe to Commit

```
src/**/*.tsx         # React components
src/**/*.ts          # TypeScript logic
src/**/*.css         # Styles
public/**/*          # Static assets
package.json         # Dependencies
README.md            # Documentation
```

**Rule**: GREEN files should ONLY reference secrets via environment variables:
```typescript
// ✅ CORRECT
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ WRONG - Never do this
const apiUrl = "https://n8n.brandiron.co.za/webhook/5e442826-...";
```

---

## Environment Variable Naming Convention

All environment variables exposed to the frontend MUST use the `VITE_` prefix (Vite requirement).

### Required Variables for This Project

| Variable Name | Purpose | Example Placeholder |
|--------------|---------|---------------------|
| `VITE_CHAT_WEBHOOK_URL` | n8n chat agent endpoint | `https://your-n8n-instance.com/webhook/your-webhook-id/chat` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `your-anon-key-here` |

### File Templates

**.env.example** (committed - contains placeholders only):
```bash
# Chat Integration
VITE_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id/chat

# Supabase (if needed)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Feature Flags
VITE_ENABLE_CHAT=true
```

**.env** (never committed - contains real values):
```bash
# Chat Integration
VITE_CHAT_WEBHOOK_URL=https://n8n.example.com/webhook/ACTUAL-UUID-HERE/chat

# Supabase
VITE_SUPABASE_URL=https://actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=actual-key-here

# Feature Flags
VITE_ENABLE_CHAT=true
```

---

## Code Patterns: Do's and Don'ts

### Accessing Environment Variables in Code

```typescript
// ✅ CORRECT - Use import.meta.env
const chatWebhookUrl = import.meta.env.VITE_CHAT_WEBHOOK_URL;

// ✅ CORRECT - With fallback for development
const chatWebhookUrl = import.meta.env.VITE_CHAT_WEBHOOK_URL || '';

// ✅ CORRECT - Type-safe with validation
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
};

// ❌ WRONG - Hardcoded secret
const chatWebhookUrl = "https://n8n.brandiron.co.za/webhook/5e442826-4547-4647-8d24-1641210f2a8e/chat";

// ❌ WRONG - process.env doesn't work in Vite frontend
const chatWebhookUrl = process.env.CHAT_WEBHOOK_URL;
```

### Logging and Debugging

```typescript
// ✅ CORRECT - Log that a variable exists, not its value
console.log('Chat webhook configured:', !!import.meta.env.VITE_CHAT_WEBHOOK_URL);

// ✅ CORRECT - Partial reveal for debugging
const url = import.meta.env.VITE_CHAT_WEBHOOK_URL;
console.log('Webhook URL starts with:', url?.substring(0, 30) + '...');

// ❌ WRONG - Exposes full secret in console/logs
console.log('Webhook URL:', import.meta.env.VITE_CHAT_WEBHOOK_URL);
```

### Error Messages

```typescript
// ✅ CORRECT - Generic error, no secret exposure
if (!webhookUrl) {
  throw new Error('Chat webhook URL not configured. Check environment variables.');
}

// ❌ WRONG - Could expose URL in error logs
throw new Error(`Failed to connect to ${webhookUrl}`);
```

---

## Git Workflow Safety Checks

### Before Every Commit

Run this checklist (AI assistants should prompt for this):

```bash
# 1. Check what's staged
git status

# 2. Search staged files for secrets
git diff --cached | grep -E "(sk-|pk_|sbp_|eyJ|webhook/[a-f0-9-]{36})"

# 3. Verify .env is not staged
git diff --cached --name-only | grep -E "^\.env"
# Should return nothing

# 4. Review the actual diff
git diff --cached
```

### Pre-commit Hook Installation

Install the pre-commit hook after setting up the submodule:

```bash
# From pierre-vps-dev root
cp website-templates/pre-commit-hook.sh personal-website/.git/hooks/pre-commit
chmod +x personal-website/.git/hooks/pre-commit
```

---

## AI Assistant Instructions

When working on this project, AI assistants must:

### 1. Before Writing Code That Needs Secrets

Ask: "Does this feature need an API key, webhook URL, or other secret?"

If yes:
- Use environment variable pattern
- Add to `.env.example` with placeholder
- Remind user to add real value to `.env`

### 2. When User Asks to Add a URL or Key

```
User: "Add the n8n webhook URL to the chat component"

AI Response:
"I'll add support for the webhook URL using an environment variable.

1. First, add this to your `.env` file (never committed):
   ```
   VITE_CHAT_WEBHOOK_URL=your-actual-webhook-url
   ```

2. I'll update `.env.example` with a placeholder.

3. Here's the code change:
   [code using import.meta.env.VITE_CHAT_WEBHOOK_URL]

⚠️ Remember: Never paste the actual webhook URL in code files."
```

### 3. When Reviewing Code

Flag any of these patterns as security issues:
- Hardcoded URLs containing `/webhook/`
- Strings matching API key patterns (`sk-`, `pk_`, etc.)
- Direct use of `process.env` in frontend code
- Console.log statements that might expose secrets
- .env files in git staging area

### 4. When User Pastes a Secret

```
User: "Here's my webhook URL: https://n8n.brandiron.co.za/webhook/5e442826-..."

AI Response:
"I see you've shared a webhook URL. I'll reference it as an environment variable 
rather than including it in code.

Add this to your local `.env` file:
```
VITE_CHAT_WEBHOOK_URL=<paste your URL here>
```

I won't include the actual URL in any code I generate."
```

---

## Incident Response

### If a Secret Was Accidentally Committed

1. **Don't panic, but act fast**

2. **Rotate the exposed secret immediately**
   - Generate new API keys
   - Create new webhook URLs
   - Update your `.env` with new values

3. **Remove from git history**
   ```bash
   # Install git-filter-repo if needed
   pip install git-filter-repo
   
   # Remove the file from all history
   git filter-repo --path .env --invert-paths
   
   # Force push (coordinate with team)
   git push --force
   ```

4. **Check for exposure**
   - GitHub will often alert you about exposed secrets
   - Check if the repo was public during the exposure window
   - Review access logs for your services

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY QUICK CHECK                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Use: import.meta.env.VITE_*                             │
│  ❌ Avoid: Hardcoded URLs, keys, or tokens                  │
│                                                             │
│  ✅ Commit: .env.example (placeholders only)                │
│  ❌ Never commit: .env, .env.local, .env.production         │
│                                                             │
│  ✅ Log: "Webhook configured: true/false"                   │
│  ❌ Never log: Actual secret values                         │
│                                                             │
│  Before commit, always run:                                 │
│  git diff --cached | grep -E "(sk-|webhook/[a-f0-9-]{36})"  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project-Specific Secrets Inventory

| Secret | Env Variable | Where Used | Rotation Procedure |
|--------|--------------|------------|-------------------|
| n8n Chat Webhook | `VITE_CHAT_WEBHOOK_URL` | Chat component | Regenerate in n8n workflow settings |
| Supabase URL | `VITE_SUPABASE_URL` | API calls | N/A (public) |
| Supabase Anon Key | `VITE_SUPABASE_ANON_KEY` | API calls | Regenerate in Supabase dashboard |

---

*Document Version: 1.1*
*Last Updated: December 2024*
*For: Pierre Gallet Portfolio Website Project*
