# Folder Cleanup & Submodule Setup Guide

## Current State

You have some duplicate/legacy folders that should be cleaned up:

### Folders to DELETE (duplicates/legacy):
- `website-security/` → Duplicate of `website-templates/`
- `website/` → Legacy, replaced by `personal-website/`

### Folders to KEEP:
- `personal-website/` → Will become Lovable submodule
- `website-templates/` → Security templates for website setup
- `ai-context/` → AI assistant context files

## Cleanup Commands

```bash
cd ~/Documents/pierre-vps-dev

# Remove duplicate website-security folder
rm -rf website-security/

# Remove legacy website folder (backup the image first if needed)
mv website/hero_background.png personal-website/ 2>/dev/null || true
rm -rf website/

# Verify structure
ls -la
```

## After Cleanup - Expected Structure

```
pierre-vps-dev/
├── ai-context/               ← AI assistant rules (KEEP)
│   ├── AI_ASSISTANT_RULES.md
│   ├── PROJECT_CONTEXT.md
│   ├── README.md
│   └── SECURITY_PROTOCOL.md
├── website-templates/        ← Security templates (KEEP)
│   ├── README.md
│   ├── env.example
│   ├── gitignore-additions
│   └── pre-commit-hook.sh
├── personal-website/         ← Lovable submodule (KEEP - will be populated)
├── docker-apps/
├── caddy/
├── graphiti/
├── lightrag/
├── supabase/
├── scripts/
├── monitoring/
├── nginx/
├── chonkie/
├── portfolio-content/
├── reading-fluency/
└── [various .md and config files]
```

## Next Step: Set Up Lovable Submodule

Once you've connected Lovable to GitHub and have a repo URL:

```bash
cd ~/Documents/pierre-vps-dev

# Remove the empty personal-website folder first
rm -rf personal-website/

# Add Lovable repo as submodule
git submodule add https://github.com/YOUR-USERNAME/YOUR-LOVABLE-REPO.git personal-website

# Install pre-commit hook
cp website-templates/pre-commit-hook.sh personal-website/.git/hooks/pre-commit
chmod +x personal-website/.git/hooks/pre-commit

# Copy environment template
cp website-templates/env.example personal-website/.env.example

# Create your local .env (never committed)
cp personal-website/.env.example personal-website/.env
# Then edit .env with real values

# Commit the submodule addition
git add .gitmodules personal-website
git commit -m "Add personal-website as Lovable submodule"
git push
```

## Verification Checklist

After setup, verify:

- [ ] `personal-website/` contains Lovable code
- [ ] `personal-website/.git/hooks/pre-commit` exists and is executable
- [ ] `personal-website/.env` exists (with real values)
- [ ] `personal-website/.env.example` exists (with placeholders)
- [ ] `personal-website/.gitignore` includes `.env`
- [ ] Test pre-commit hook catches secrets
