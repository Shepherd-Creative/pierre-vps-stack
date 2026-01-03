# GitHub Actions CI/CD Workflows

This directory contains automated workflows that run on GitHub Actions to test, lint, and deploy your VPS stack.

## 🔄 Workflows

### 1. CI - Testing & Linting (`ci.yml`)
**Triggers:** Every push to `main`/`develop` and all pull requests

**What it does:**
- ✅ Validates `docker-compose.yml` syntax
- ✅ Lints all shell scripts in `scripts/` with shellcheck
- ✅ Builds and lints your personal website (React/TypeScript)

**Visible to recruiters:** Shows green checkmarks on your GitHub repo Actions tab

---

### 2. CD - Deploy to VPS (`deploy.yml`)
**Triggers:** Push to `main` branch (or manual trigger)

**What it does:**
- 🔐 Connects to your VPS via SSH
- 📥 Pulls latest code from GitHub
- 🏗️ Rebuilds and restarts Docker services
- ✅ Verifies deployment success

**Status:** ⚠️ Requires setup (see below)

---

## ⚙️ Required Setup for Deployment Workflow

The deployment workflow needs SSH access to your VPS. Here's how to set it up:

### Step 1: Generate SSH Key (if you don't have one)
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_vps
```

### Step 2: Add Public Key to VPS
```bash
# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions_vps.pub pierre_sudo_user@46.202.128.120

# Or manually:
cat ~/.ssh/github_actions_vps.pub | ssh pierre_sudo_user@46.202.128.120 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

### Step 3: Add Private Key to GitHub Secrets
1. Go to your GitHub repo: `pierre-vps-stack`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VPS_SSH_PRIVATE_KEY`
5. Value: Copy your private key:
   ```bash
   cat ~/.ssh/github_actions_vps
   ```
6. Paste the entire key (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
7. Click **Add secret**

### Step 4: Test the Workflow
```bash
# Make a small change and push
git add .
git commit -m "test: trigger CI/CD workflows"
git push origin main
```

Then check: `https://github.com/YOUR-USERNAME/pierre-vps-stack/actions`

---

## 📊 What Recruiters See

When they visit your GitHub repo, they'll see:

1. **Actions tab** with workflow runs showing:
   - ✅ CI passing (testing & linting)
   - ✅ CD successful deployments
   - 📊 Build history and logs

2. **Badges** (optional - add to README.md):
   ```markdown
   ![CI](https://github.com/YOUR-USERNAME/pierre-vps-stack/actions/workflows/ci.yml/badge.svg)
   ![Deploy](https://github.com/YOUR-USERNAME/pierre-vps-stack/actions/workflows/deploy.yml/badge.svg)
   ```

3. **Evidence of:**
   - Automated testing
   - Code quality checks
   - Continuous deployment
   - Infrastructure as Code practices

---

## 🔧 Troubleshooting

### CI workflow fails on shellcheck
- Make sure shell scripts have execute permissions:
  ```bash
  chmod +x scripts/*.sh
  ```

### Deploy workflow fails on SSH
- Verify SSH key is added correctly to GitHub secrets
- Test manual SSH: `ssh pierre_sudo_user@46.202.128.120`
- Check VPS is reachable: `ping 46.202.128.120`

### Website build fails
- Check `personal-website/package-lock.json` is committed
- Ensure all dependencies are in `package.json`
- Test locally: `cd personal-website && npm ci && npm run build`

---

## 🎯 Next Steps for AGGP Application

1. ✅ Push these workflows to GitHub
2. ✅ Set up VPS_SSH_PRIVATE_KEY secret
3. ✅ Trigger a test deployment
4. ✅ Add workflow badges to main README
5. ✅ Screenshot successful workflow runs for portfolio

**Timeline:** Get this visible before Jan 19 deadline!
