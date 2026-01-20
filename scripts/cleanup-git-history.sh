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
***REMOVED***
REDACTED_OPENAI_KEY==>REDACTED_OPENAI_KEY

***REMOVED***
REDACTED_LIGHTRAG_KEY==>REDACTED_LIGHTRAG_KEY

***REMOVED***
REDACTED_AUTH_HASH==>REDACTED_AUTH_HASH

***REMOVED***
REDACTED_SUPABASE_ANON_JWT==>REDACTED_SUPABASE_ANON_JWT

REDACTED_SUPABASE_SERVICE_JWT==>REDACTED_SUPABASE_SERVICE_JWT

***REMOVED***
REDACTED_REALTIME_KEY==>REDACTED_REALTIME_KEY

***REMOVED***
REDACTED_PREVIEW_SIGNING_KEY==>REDACTED_PREVIEW_SIGNING_KEY
REDACTED_PREVIEW_ENCRYPTION_KEY==>REDACTED_PREVIEW_ENCRYPTION_KEY
REDACTED_ENCRYPTION_KEY==>REDACTED_ENCRYPTION_KEY
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
