#!/bin/bash
# Quick setup script for CI/CD workflows
# Run this to configure SSH access for GitHub Actions deployment

set -e

echo "🚀 Setting up CI/CD for pierre-vps-stack"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VPS_USER="pierre_sudo_user"
VPS_HOST="46.202.128.120"
SSH_KEY_PATH="$HOME/.ssh/github_actions_vps"

echo "📋 Checklist:"
echo "  1. Generate SSH key for GitHub Actions"
echo "  2. Add public key to VPS"
echo "  3. Display private key for GitHub secrets"
echo "  4. Push workflows to GitHub"
echo ""

# Step 1: Generate SSH key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Generate SSH Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists at $SSH_KEY_PATH${NC}"
    read -p "Do you want to use the existing key? (y/n): " use_existing
    
    if [ "$use_existing" != "y" ]; then
        echo "Generating new SSH key..."
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
        echo -e "${GREEN}✅ New SSH key generated${NC}"
    else
        echo -e "${GREEN}✅ Using existing SSH key${NC}"
    fi
else
    echo "Generating SSH key..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✅ SSH key generated at $SSH_KEY_PATH${NC}"
fi

echo ""

# Step 2: Add public key to VPS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Add Public Key to VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Adding public key to VPS..."
cat "$SSH_KEY_PATH.pub" | ssh "$VPS_USER@$VPS_HOST" \
    'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Public key added to VPS${NC}"
else
    echo -e "${RED}❌ Failed to add public key to VPS${NC}"
    echo "Please check your VPS connection and try again"
    exit 1
fi

# Test SSH connection
echo "Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" 'echo "SSH works!"' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    exit 1
fi

echo ""

# Step 3: Display private key for GitHub secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Add Private Key to GitHub Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 Copy this ENTIRE private key (including BEGIN/END lines):"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SSH_KEY_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Now do this:"
echo "  1. Copy the key above (scroll up if needed)"
echo "  2. Go to: https://github.com/YOUR-USERNAME/pierre-vps-stack/settings/secrets/actions"
echo "  3. Click 'New repository secret'"
echo "  4. Name: VPS_SSH_PRIVATE_KEY"
echo "  5. Value: Paste the key you copied"
echo "  6. Click 'Add secret'"
echo ""

read -p "Press Enter when you've added the secret to GitHub..."

# Step 4: Push workflows to GitHub
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Push Workflows to GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to commit and push the workflows now? (y/n): " push_now

if [ "$push_now" = "y" ]; then
    echo "Adding workflow files..."
    git add .github/
    
    echo "Committing..."
    git commit -m "feat: add CI/CD workflows for automated testing and deployment

- Add CI workflow for Docker validation, script linting, and website builds
- Add CD workflow for automated VPS deployment
- Configure SSH-based deployment to production server
- Set up automated testing on all pushes and pull requests"
    
    echo "Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Workflows pushed to GitHub${NC}"
        echo ""
        echo "🎉 Setup complete!"
        echo ""
        echo "Next steps:"
        echo "  1. Check workflow runs: https://github.com/YOUR-USERNAME/pierre-vps-stack/actions"
        echo "  2. CI workflow should pass immediately"
        echo "  3. CD workflow should deploy to VPS"
        echo "  4. Add badges to your README (see IMPLEMENTATION_SUMMARY.md)"
        echo ""
    else
        echo -e "${RED}❌ Failed to push to GitHub${NC}"
        echo "Please push manually when ready:"
        echo "  git push origin main"
    fi
else
    echo ""
    echo "No problem! When you're ready, run:"
    echo "  git add .github/"
    echo "  git commit -m \"feat: add CI/CD workflows\""
    echo "  git push origin main"
fi

echo ""
echo "📚 Documentation:"
echo "  - Implementation summary: .github/IMPLEMENTATION_SUMMARY.md"
echo "  - Setup checklist: .github/CICD_SETUP_CHECKLIST.md"
echo "  - Workflow details: .github/workflows/README.md"
