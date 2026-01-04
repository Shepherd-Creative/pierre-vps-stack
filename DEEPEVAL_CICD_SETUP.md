# DeepEval Service Setup - CI/CD Compatible

## ⚠️ IMPORTANT: Your CI/CD Workflow Requires Different Steps

Your GitHub Actions CI workflow validates `docker-compose.yml` and expects all `.env` files referenced in it to exist (or it creates dummy ones). We need to follow a specific order.

---

## Step-by-Step: CI/CD Compatible Setup

### Step 1: Create GitHub Repo FIRST (Before Pushing to Main Repo)

```bash
cd ~/Documents/pierre-vps-dev/deepeval

# Create a NEW private repo on GitHub:
# - Go to github.com/Shepherd-Creative (or your account)
# - Click "New repository"  
# - Name: "deepeval-api"
# - Make it PRIVATE
# - Don't initialize with README

# Push YOUR deepeval code to its OWN repo:
git remote add origin git@github.com:Shepherd-Creative/deepeval-api.git
git branch -M main
git push -u origin main
```

This creates a standalone repo for deepeval, separate from your main infrastructure.

---

### Step 2: Create Local .env File

```bash
cd ~/Documents/pierre-vps-dev/deepeval
cp .env.example .env

# Edit with your actual values (for local testing)
nano .env
```

**Required minimum:**
- `OPENAI_API_KEY=your-key-here`
- `API_KEYS=your-secure-random-key-here`
- `ADMIN_PASSWORD=your-secure-password`
- `SECRET_KEY=another-random-secret-key`

**Generate secure keys:**
```bash
# For API_KEYS and SECRET_KEY, generate random strings:
openssl rand -hex 32
```

---

### Step 3: Update CI Workflow to Include DeepEval

Your CI workflow needs to know about the new `.env` file. Edit `.github/workflows/ci.yml`:

```bash
cd ~/Documents/pierre-vps-dev
nano .github/workflows/ci.yml
```

Find this section (around line 18):
```yaml
      - name: Create dummy env files for validation
        run: |
          # Create ALL missing .env and .env.local files that docker-compose references
          touch .env || true
          touch chonkie/.env.local || true
          touch lightrag/.env.local || true
          touch graphiti/.env.local || true
          touch personal-website/.env || true
          touch personal-website/.env.local || true
          touch reading-fluency/.env || true
```

**Add this line:**
```yaml
          touch deepeval/.env || true
```

So it becomes:
```yaml
      - name: Create dummy env files for validation
        run: |
          # Create ALL missing .env and .env.local files that docker-compose references
          touch .env || true
          touch chonkie/.env.local || true
          touch lightrag/.env.local || true
          touch graphiti/.env.local || true
          touch personal-website/.env || true
          touch personal-website/.env.local || true
          touch reading-fluency/.env || true
          touch deepeval/.env || true
```

---

### Step 4: Edit docker-compose.yml

Add the deepeval service AFTER the `reading-fluency` service:

```yaml
  # DeepEval LLM Evaluation API
  deepeval:
    build:
      context: ./deepeval
      dockerfile: Dockerfile
    container_name: deepeval
    restart: unless-stopped
    env_file:
      - ./deepeval/.env
    expose:
      - 8000
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.2'
    networks:
      - docker-apps-network
```

---

### Step 5: Test Locally BEFORE Pushing

```bash
cd ~/Documents/pierre-vps-dev

# Validate docker-compose
docker compose config -q

# If that passes, you're good to go
echo "✅ Docker compose is valid"
```

---

### Step 6: Commit to Your Infrastructure Repo

```bash
cd ~/Documents/pierre-vps-dev

# Check what you're committing
git status

# Add files
git add deepeval/
git add nginx/conf.d/deepeval.brandiron.co.za.conf
git add docker-compose.yml
git add .github/workflows/ci.yml

# Commit
git commit -m "Add DeepEval LLM evaluation API service"

# Push to main - this will trigger CI/CD
git push
```

---

### Step 7: Monitor CI/CD Pipeline

Go to: `https://github.com/Shepherd-Creative/pierre-vps-stack/actions`

You should see:
1. **CI workflow** running first (validates, builds, tests)
2. **CD workflow** running after CI passes (deploys to VPS)

**Expected behavior:**
- ✅ CI creates dummy `deepeval/.env` for validation
- ✅ CI validates docker-compose.yml
- ✅ CD pulls code to VPS
- ✅ CD runs `docker compose up -d --build`

---

### Step 8: Create .env on VPS

**After CD completes,** SSH to VPS and create the production `.env`:

```bash
ssh pierre_sudo_user@46.202.128.120

cd ~/docker-apps/deepeval
cp .env.example .env
nano .env

# Add your production keys:
# - OPENAI_API_KEY
# - API_KEYS (different from local, more secure)
# - ADMIN_PASSWORD
# - SECRET_KEY

# Save and exit
```

---

### Step 9: Rebuild DeepEval Container on VPS

```bash
# Still on VPS
cd ~/docker-apps

# Rebuild deepeval with the new .env
docker compose up -d --build deepeval

# Check it's running
docker ps | grep deepeval
docker logs deepeval --tail 20
```

---

### Step 10: Add DNS Record

In your domain provider:
- **Type**: A
- **Name**: deepeval  
- **Value**: 46.202.128.120
- **TTL**: 3600

---

### Step 11: Get SSL Certificate

```bash
# On VPS
docker run --rm \
  -v /home/pierre_sudo_user/docker-apps/certbot/conf:/etc/letsencrypt \
  -v /home/pierre_sudo_user/docker-apps/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d deepeval.brandiron.co.za \
  --email user@example.com \
  --agree-tos \
  --no-eff-email

# Restart nginx
docker compose restart nginx

# Test HTTPS
curl -I https://deepeval.brandiron.co.za/docs
```

---

### Step 12: Verify Everything Works

**Check the API:**
```bash
# Health check
curl https://deepeval.brandiron.co.za/health

# Visit in browser:
# https://deepeval.brandiron.co.za/docs
```

---

## 🎯 Key Differences From Standard Deployment

| Standard | Your CI/CD Setup |
|----------|------------------|
| Push whenever | Must update CI workflow first |
| .env created on VPS only | Need .env locally for docker compose validation |
| Manual deployment | Automatic via GitHub Actions |
| No validation | CI validates before deploy |

---

## ✅ Success Checklist

- [ ] DeepEval repo created on GitHub
- [ ] Local .env created
- [ ] CI workflow updated (`touch deepeval/.env`)
- [ ] docker-compose.yml updated
- [ ] `docker compose config -q` passes locally
- [ ] Committed and pushed to main
- [ ] CI workflow passed (green checkmark)
- [ ] CD workflow deployed to VPS
- [ ] Created .env on VPS
- [ ] Rebuilt container on VPS
- [ ] DNS record added
- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] API accessible
