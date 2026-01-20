#!/bin/bash
# ===========================================
# Git History Cleanup Script for pierre-vps-stack
# ===========================================
#
# This script removes sensitive data from git history using BFG Repo-Cleaner
# Run this BEFORE making the repository public
#
# Prerequisites:
# 1. Install BFG: brew install bfg
# 2. Ensure all changes are committed
# 3. Have a backup of your repo
#
# WARNING: This rewrites git history! All collaborators will need to re-clone.
# ===========================================

set -e

echo "=========================================="
echo "Git History Cleanup for pierre-vps-stack"
echo "=========================================="

# Check if BFG is installed
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG is not installed. Install it with: brew install bfg"
    exit 1
fi

# Check we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the pierre-vps-dev root directory"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ You have uncommitted changes. Please commit or stash them first."
    echo "Run: git status"
    exit 1
fi

echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "   - All collaborators will need to re-clone the repo"
echo "   - Make sure you have pushed all branches you want to keep"
echo ""
read -p "Do you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Create secrets file for BFG to find and replace
echo ""
echo "📝 Creating secrets replacement file..."
cat > /tmp/secrets-to-remove.txt << 'EOF'
# OpenAI API Keys (the real one from the backup file)
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==>REDACTED_OPENAI_KEY

# LightRAG API Key
APhZrhP6nqfAUvqACJiUOlc9N+xy9QA4hhAE+gCb8o0===>REDACTED_LIGHTRAG_KEY

# Auth account hash
J0yvGSl/P14jjRsIMHqp8m9f+1ObkDQA9NycESOlqg===>REDACTED_AUTH_HASH

# Supabase demo JWTs (these are public demo tokens but let's clean them anyway)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0==>REDACTED_SUPABASE_ANON_JWT

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU==>REDACTED_SUPABASE_SERVICE_JWT

# Realtime secret key
UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq==>REDACTED_REALTIME_KEY

# Next.js preview mode keys (auto-generated, not sensitive but flagged by gitleaks)
63ea9008c5d6f080ae469d09a3a5633e35faf2d56f4e75a2b6c8d8ca25e07328==>REDACTED_PREVIEW_SIGNING_KEY
67abc144b4ba5916204c8b073656f20bd9783507729802d0b10700ed07eda771==>REDACTED_PREVIEW_ENCRYPTION_KEY
GcMsbSc3SzTH2qrwbUvHcJYBpRXayTSWZ2VbfLcx4gg===>REDACTED_ENCRYPTION_KEY
EOF

echo "✅ Secrets file created"

# Run BFG to replace secrets
echo ""
echo "🔧 Running BFG to clean git history..."
echo "   This may take a few minutes..."

# First, delete the problematic files from history entirely
bfg --delete-files '.env.backup-*' --no-blob-protection .
bfg --delete-folders '.next' --no-blob-protection .

# Then replace any remaining secrets with placeholders
bfg --replace-text /tmp/secrets-to-remove.txt --no-blob-protection .

# Clean up
echo ""
echo "🧹 Running git garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Clean up temp file
rm /tmp/secrets-to-remove.txt

echo ""
echo "=========================================="
echo "✅ Git history cleanup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the changes: git log --oneline -20"
echo "2. Force push to GitHub: git push origin main --force"
echo "3. If you have other branches, force push them too"
echo "4. Any collaborators must re-clone the repository"
echo ""
echo "⚠️  IMPORTANT: After force pushing, the old commits with secrets"
echo "   may still be accessible via their SHA for a short time."
echo "   GitHub will garbage collect them eventually."
echo ""
echo "To verify cleanup worked, run: gitleaks detect"
