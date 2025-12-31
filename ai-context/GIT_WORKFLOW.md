# Git Workflow Commands for Personal Website

> **For AI Assistants**: Use these commands when the user asks to sync, commit, push, or update the website after editing.

---

## Quick Reference

### After Editing in Lovable (pull changes locally)

```bash
cd ~/Documents/pierre-vps-dev/personal-website
git pull
npm install  # only if dependencies changed
npm run dev  # to test locally
```

### After Editing Locally (push to GitHub → Lovable)

```bash
cd ~/Documents/pierre-vps-dev/personal-website
git add .
git commit -m "Update: [describe what changed]"
git push
```

### Update Parent Repo (always do after website changes)

```bash
cd ~/Documents/pierre-vps-dev
git add personal-website
git commit -m "Update website submodule: [brief description]"
git push
```

---

## Full Workflows

### Workflow A: User edited in Lovable, wants to sync locally

```bash
# 1. Pull Lovable's changes
cd ~/Documents/pierre-vps-dev/personal-website
git pull

# 2. Install any new dependencies
npm install

# 3. Test locally
npm run dev

# 4. Update parent repo to track new submodule commit
cd ~/Documents/pierre-vps-dev
git add personal-website
git commit -m "Update website submodule: sync from Lovable"
git push
```

### Workflow B: User edited locally, wants to push to Lovable

```bash
# 1. Commit and push website changes
cd ~/Documents/pierre-vps-dev/personal-website
git add .
git commit -m "Update: [what changed]"
git push  # Goes to GitHub → Lovable sees it automatically

# 2. Update parent repo to track new submodule commit
cd ~/Documents/pierre-vps-dev
git add personal-website
git commit -m "Update website submodule: [what changed]"
git push
```

### Workflow C: User wants to deploy to VPS

```bash
# 1. SSH to VPS
ssh pierre_sudo_user@46.202.128.120

# 2. Pull updates
cd ~/pierre-vps-dev
git pull
git submodule update --init --recursive

# 3. Build website
cd personal-website
npm install
npm run build

# 4. Restart web server (adjust based on your setup)
# If using Docker:
# docker-compose restart portfolio
# If using static hosting, copy dist/ to web root
```

---

## Important Notes

1. **Pre-commit hook**: Runs automatically on every commit in `personal-website/`. If it blocks a commit, check for accidentally staged secrets.

2. **Two repos to update**: 
   - `personal-website/` (the website code)
   - `pierre-vps-dev/` (parent repo that tracks submodule pointer)

3. **Order matters**: Always commit website changes first, then update parent repo.

4. **`.env` is local only**: Never committed. If user switches machines, they need to recreate it from `.env.example`.

---

## Trigger Phrases

When user says any of these, use the appropriate workflow:

| User Says | Action |
|-----------|--------|
| "sync from Lovable" / "pull Lovable changes" | Workflow A |
| "push my changes" / "sync to Lovable" | Workflow B |
| "deploy to VPS" / "push to production" | Workflow C |
| "commit website changes" | Workflow B (steps 1 only) |
| "update the submodule" / "update parent repo" | Parent repo update only |

---

## Directory Reference

```
~/Documents/pierre-vps-dev/           ← Parent repo (infrastructure)
├── personal-website/                 ← Submodule (website code)
│   ├── .env                          ← Local secrets (never committed)
│   ├── .env.example                  ← Template (committed)
│   └── src/                          ← Website source code
├── ai-context/                       ← AI assistant rules (this folder)
└── website-templates/                ← Security templates
```

---

*Last Updated: December 2024*
