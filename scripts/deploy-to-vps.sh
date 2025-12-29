#!/bin/bash
# Deploy changes to VPS
# Run after committing and pushing to GitHub

VPS_USER="pierre_sudo_user"
VPS_HOST="46.202.128.120"
VPS_PATH="/home/pierre_sudo_user/docker-apps"

echo "Deploying to VPS..."

ssh "$VPS_USER@$VPS_HOST" << 'EOF'
cd ~/docker-apps

# Pull latest changes
git pull origin main

# Rebuild only changed services
docker compose up -d --build

# Show status
docker compose ps

echo ""
echo "Deployment complete!"
EOF
