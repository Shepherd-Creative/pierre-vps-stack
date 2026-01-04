# CI/CD Setup Checklist - AGGP Deadline: Jan 19, 2026

## ✅ Immediate Actions (Before First Push)

### 1. Generate SSH Key for GitHub Actions
```bash
# Generate new key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_vps

# You'll have two files:
# ~/.ssh/github_actions_vps (private key - goes to GitHub)
# ~/.ssh/github_actions_vps.pub (public key - goes to VPS)
```

### 2. Add Public Key to VPS
```bash
# Copy public key to VPS
cat ~/.ssh/github_actions_vps.pub | ssh pierre_sudo_user@46.202.128.120 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# Test it works
ssh -i ~/.ssh/github_actions_vps pierre_sudo_user@46.202.128.120 'echo "SSH key works!"'
```

### 3. Add Private Key to GitHub Secrets
1. Copy private key content:
   ```bash
   cat ~/.ssh/github_actions_vps
   ```

2. Go to: https://github.com/[YOUR-USERNAME]/pierre-vps-stack/settings/secrets/actions

3. Click "New repository secret"
   - Name: `VPS_SSH_PRIVATE_KEY`
   - Value: Paste entire private key (including BEGIN/END lines)
   - Click "Add secret"

### 4. Commit and Push Workflows
```bash
cd /Users/pierregallet/Documents/pierre-vps-dev

# Check what's new
git status

# Stage the workflows
git add .github/

# Commit
git commit -m "feat: add CI/CD workflows for automated testing and deployment"

# Push to trigger workflows
git push origin main
```

---

## ✅ Verification Steps

### 5. Check CI Workflow Run
1. Go to: https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions
2. You should see "CI - Testing & Linting" running or completed
3. Click on it to see:
   - ✅ Validate Docker Configuration
   - ✅ Lint Shell Scripts  
   - ✅ Build & Lint Website

**Expected result:** All green checkmarks ✅

### 6. Check CD Deployment (if main branch)
1. Same Actions page
2. Look for "CD - Deploy to VPS"
3. Should show successful deployment to your VPS

**If it fails:** Check troubleshooting in `.github/workflows/README.md`

---

## ✅ Make it Visible to Recruiters

### 7. Add Workflow Badges to Main README
Add this to the top of your `README.md`:

```markdown
# Pierre's VPS Stack

[![CI](https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions/workflows/ci.yml)
[![Deploy](https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions/workflows/deploy.yml/badge.svg)](https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions/workflows/deploy.yml)

*Replace [YOUR-USERNAME] with your actual GitHub username*
```

### 8. Take Screenshots for AGGP Application
Capture:
- [ ] GitHub Actions tab showing successful workflow runs
- [ ] Green checkmarks on both CI and CD workflows
- [ ] Deployment logs showing VPS connection and service restart
- [ ] Workflow badges in README (shows automation)

---

## 🎯 Timeline to Jan 19 Deadline

**Today (Saturday):**
- [ ] Generate SSH keys
- [ ] Add public key to VPS
- [ ] Add private key to GitHub secrets
- [ ] Push workflows to GitHub
- [ ] Verify CI workflow passes

**Sunday:**
- [ ] Verify CD deployment works
- [ ] Add badges to README
- [ ] Screenshot successful runs
- [ ] Test manual workflow trigger

**Monday onwards:**
- [ ] Normal git workflow will now trigger CI/CD automatically
- [ ] Every push to main = automatic deployment
- [ ] Every push/PR = automatic testing

---

## 🔥 Quick Test Commands

```bash
# Quick test to trigger both workflows
cd /Users/pierregallet/Documents/pierre-vps-dev
echo "# Test CI/CD" >> README.md
git add README.md
git commit -m "test: trigger CI/CD workflows"
git push origin main

# Then check: https://github.com/[YOUR-USERNAME]/pierre-vps-stack/actions
```

---

## ❗ Common Issues & Fixes

### CI fails on "Lint Shell Scripts"
```bash
# Make scripts executable
chmod +x scripts/*.sh
git add scripts/
git commit -m "fix: make scripts executable"
git push
```

### CD fails on SSH connection
```bash
# Test SSH manually first
ssh -i ~/.ssh/github_actions_vps pierre_sudo_user@46.202.128.120

# If it doesn't work, check:
# 1. Public key is in ~/.ssh/authorized_keys on VPS
# 2. Private key is correct in GitHub secrets
# 3. VPS firewall allows SSH (port 22)
```

### Website build fails
```bash
# Test locally first
cd personal-website
npm ci
npm run lint
npm run build

# If local works but CI fails, check package-lock.json is committed
git add personal-website/package-lock.json
git commit -m "fix: add package-lock.json for CI"
git push
```

---

## 🎖️ Success Criteria

You'll know it's working when:
- ✅ Actions tab shows green checkmarks
- ✅ Every push triggers CI automatically  
- ✅ Pushes to main deploy automatically to VPS
- ✅ Badges show "passing" in README
- ✅ Recruiters can see CI/CD evidence on your GitHub profile

**Impact for AGGP:** Demonstrates DevOps capabilities, automation mindset, and production-ready practices.
