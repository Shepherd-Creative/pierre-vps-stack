#!/bin/bash

# ============================================================
# PRE-COMMIT HOOK: Security Check for Personal Website
# ============================================================
# This hook prevents committing files containing potential secrets.
# 
# Installation:
#   cp pre-commit-hook.sh personal-website/.git/hooks/pre-commit
#   chmod +x personal-website/.git/hooks/pre-commit
#
# To bypass (use with caution):
#   git commit --no-verify
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Running security check..."

# ============================================================
# CHECK 1: Prevent .env files from being committed
# ============================================================
ENV_FILES=$(git diff --cached --name-only | grep -E "^\.env$|^\.env\.[^e]|^\.env\.local$|^\.env\.production$|^\.env\.development$")

if [ -n "$ENV_FILES" ]; then
    echo ""
    echo -e "${RED}❌ ERROR: Attempting to commit .env file(s)${NC}"
    echo ""
    echo "The following .env files are staged for commit:"
    echo "$ENV_FILES"
    echo ""
    echo "These files contain secrets and should NEVER be committed."
    echo ""
    echo "To fix:"
    echo "  git reset HEAD <file>    # Unstage the file"
    echo "  Add to .gitignore if not already there"
    echo ""
    exit 1
fi

# ============================================================
# CHECK 2: Scan for API key patterns
# ============================================================
# Patterns to detect:
#   sk-...        OpenAI API keys
#   pk_...        Stripe public keys
#   sbp_...       Supabase keys
#   eyJ...        JWT tokens (base64 encoded JSON)

SECRETS_PATTERN="(sk-[a-zA-Z0-9]{20,}|pk_[a-zA-Z0-9]{20,}|sk_[a-zA-Z0-9]{20,}|sbp_[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9_-]{50,})"

FOUND_SECRETS=$(git diff --cached | grep -E "$SECRETS_PATTERN" | head -5)

if [ -n "$FOUND_SECRETS" ]; then
    echo ""
    echo -e "${RED}❌ ERROR: Potential API key detected in staged changes${NC}"
    echo ""
    echo "Found patterns that look like API keys:"
    echo "$FOUND_SECRETS"
    echo ""
    echo "If this is a false positive, you can:"
    echo "  1. Review the change carefully"
    echo "  2. Use: git commit --no-verify"
    echo ""
    exit 1
fi

# ============================================================
# CHECK 3: Scan for webhook URLs with UUIDs
# ============================================================
WEBHOOK_PATTERN="webhook/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"

FOUND_WEBHOOKS=$(git diff --cached | grep -E "$WEBHOOK_PATTERN" | head -5)

if [ -n "$FOUND_WEBHOOKS" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: Webhook URL detected in staged changes${NC}"
    echo ""
    echo "Found what looks like a webhook URL with UUID:"
    echo "$FOUND_WEBHOOKS"
    echo ""
    echo "Webhook URLs should be in environment variables, not hardcoded."
    echo ""
    echo "Expected pattern:"
    echo "  const url = import.meta.env.VITE_CHAT_WEBHOOK_URL;"
    echo ""
    echo "If this is intentional (e.g., in .env.example with placeholder),"
    echo "you can proceed with: git commit --no-verify"
    echo ""
    exit 1
fi

# ============================================================
# CHECK 4: Scan for hardcoded localhost with ports (dev URLs)
# ============================================================
LOCALHOST_PATTERN="(localhost:[0-9]{4,5}|127\.0\.0\.1:[0-9]{4,5})"

FOUND_LOCALHOST=$(git diff --cached --name-only | xargs grep -l -E "$LOCALHOST_PATTERN" 2>/dev/null | grep -v "node_modules" | grep -v ".lock")

if [ -n "$FOUND_LOCALHOST" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: Hardcoded localhost URL found${NC}"
    echo ""
    echo "Files containing localhost URLs:"
    echo "$FOUND_LOCALHOST"
    echo ""
    echo "Consider using environment variables for all URLs."
    echo "Proceeding anyway... (this is just a warning)"
    echo ""
fi

# ============================================================
# CHECK 5: Look for common secret variable names with values
# ============================================================
SECRET_ASSIGNMENT_PATTERN='(API_KEY|SECRET|PASSWORD|TOKEN|WEBHOOK)\s*[=:]\s*["\x27][^"\x27]{10,}'

FOUND_ASSIGNMENTS=$(git diff --cached | grep -iE "$SECRET_ASSIGNMENT_PATTERN" | grep -v "env.example" | grep -v "VITE_" | head -5)

if [ -n "$FOUND_ASSIGNMENTS" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: Possible hardcoded secret assignment${NC}"
    echo ""
    echo "Found assignments that might contain secrets:"
    echo "$FOUND_ASSIGNMENTS"
    echo ""
    echo "Review these carefully. If intentional, use: git commit --no-verify"
    echo ""
fi

# ============================================================
# ALL CHECKS PASSED
# ============================================================
echo -e "${GREEN}✅ Security check passed${NC}"
echo ""
exit 0
