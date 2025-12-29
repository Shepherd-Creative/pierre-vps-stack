#!/bin/bash
# Copy config files from VPS to local
# Run this to sync VPS configs to your local clone

VPS_USER="pierre_sudo_user"
VPS_HOST="46.202.128.120"
VPS_PATH="/home/pierre_sudo_user/docker-apps"
LOCAL_PATH="$(dirname "$0")/.."

echo "Syncing from VPS..."

# Sync nginx configs
rsync -avz --exclude='*.pem' "$VPS_USER@$VPS_HOST:$VPS_PATH/nginx/" "$LOCAL_PATH/nginx/"

# Sync supabase configs (not data)
rsync -avz "$VPS_USER@$VPS_HOST:$VPS_PATH/supabase/volumes/" "$LOCAL_PATH/supabase/volumes/"

# Sync monitoring configs
rsync -avz "$VPS_USER@$VPS_HOST:$VPS_PATH/monitoring/" "$LOCAL_PATH/monitoring/"

# Sync lightrag config (not data)
rsync -avz --exclude='rag_storage' --exclude='inputs' --exclude='tiktoken' "$VPS_USER@$VPS_HOST:$VPS_PATH/lightrag/" "$LOCAL_PATH/lightrag/"

# Sync chonkie source
rsync -avz --exclude='node_modules' --exclude='data' "$VPS_USER@$VPS_HOST:$VPS_PATH/chonkie/" "$LOCAL_PATH/chonkie/"

# Sync reading-fluency source
rsync -avz --exclude='logs' --exclude='__pycache__' "$VPS_USER@$VPS_HOST:$VPS_PATH/reading-fluency/" "$LOCAL_PATH/reading-fluency/"

echo "Sync complete!"
echo ""
echo "Next steps:"
echo "1. Review changes with: git status"
echo "2. Commit: git add . && git commit -m 'sync from VPS'"
echo "3. Push: git push origin main"
