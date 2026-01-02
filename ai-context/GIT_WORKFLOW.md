# Git Workflow Commands for Pierre VPS Stack

> **For AI Assistants**: Use these commands when the user asks to sync, commit, push, or deploy.

---

## Quick Reference

### After Editing in Lovable (pull changes locally)

```bash
cd ~/Documents/pierre-vps-dev/personal-website
git restore package-lock.json 2>/dev/null  # Handle conflicts
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
git fetch origin && [ "$(git rev-list HEAD..origin/main --count)" -gt 0 ] && git pull --rebase
git add personal-website
git commit -m "Update website submodule: [brief description]"
git push
```

---

## Full Workflows

### Workflow A: User edited in Lovable, wants to sync locally

```bash
# 0. Pre-Flight: Handle common conflicts
cd ~/Documents/pierre-vps-dev/personal-website

# Check for package-lock.json changes (common conflict source)
git status | grep -q package-lock.json && git restore package-lock.json || echo "No package-lock conflicts"

# 1. Pull Lovable's changes
git pull

# If pull fails with conflicts:
# - Review: git status
# - Resolve conflicts manually, then: git add . && git commit && git pull

# 2. Install any new dependencies
npm install

# 3. Test locally (optional but recommended)
npm run dev

# 4. Update parent repo to track new submodule commit
cd ~/Documents/pierre-vps-dev

# Pre-check: See if remote has changes we don't have
git fetch origin
BEHIND=$(git rev-list HEAD..origin/main --count)

# If behind remote, pull first to avoid push rejection
if [ "$BEHIND" -gt 0 ]; then
    echo "Remote has $BEHIND commits we don't have, pulling first..."
    git pull --rebase || {
        echo "❌ Rebase failed. Resolve conflicts, then continue with: git rebase --continue"
        exit 1
    }
fi

# Now update submodule pointer and push
git add personal-website
git commit -m "Update website submodule: sync from Lovable"
git push

# If push still fails with "rejected", run:
# git pull --rebase && git push
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

### Workflow C: Deploy to VPS

```bash
# 1. SSH to VPS
ssh pierre_sudo_user@46.202.128.120

# 2. Pre-Flight: Check git health
cd ~/docker-apps
git status > /dev/null 2>&1 || {
    echo "❌ Git repository unhealthy! Use Workflow D for recovery."
    exit 1
}

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️ Warning: Uncommitted changes detected"
    git status
    echo "Commit or stash changes before continuing"
    exit 1
fi

# 3. Pull updates
git pull origin main || {
    echo "❌ Pull failed. Check for merge conflicts or use Workflow D"
    exit 1
}

# 4. Update submodule
git submodule update --init --recursive

# 5. Verify .env files exist
[ -f .env ] || { echo "❌ Main .env missing!"; exit 1; }
[ -f personal-website/.env ] || { echo "❌ Website .env missing!"; exit 1; }

# 6. Rebuild and restart website container
docker compose up -d --build personal-website
docker compose restart nginx

# 7. Wait for startup
sleep 10

# 8. Post-Deployment Verification
echo ""
echo "=== Verifying Deployment ==="

# Check nginx status
if docker ps | grep nginx | grep -q "Up"; then
    echo "✅ Nginx running"
else
    echo "❌ Nginx not running"
    docker logs nginx --tail 20
    exit 1
fi

# Check personal-website status
if docker ps | grep personal-website | grep -q "Up"; then
    echo "✅ Personal website container running"
else
    echo "❌ Personal website container not running"
    docker logs personal-website --tail 20
    exit 1
fi

# Test HTTPS
if curl -s -o /dev/null -w "%{http_code}" https://pierre.brandiron.co.za | grep -q "200"; then
    echo "✅ Website accessible via HTTPS"
else
    echo "❌ Website not accessible"
    curl -I https://pierre.brandiron.co.za
    exit 1
fi

# Check for errors in logs
echo ""
echo "=== Recent Container Logs ==="
echo "--- Nginx ---"
docker logs nginx --tail 5
echo "--- Personal Website ---"
docker logs personal-website --tail 5

echo ""
echo "✅ Deployment successful!"
echo "Visit: https://pierre.brandiron.co.za"
```

---

## 🆘 Workflow D: VPS Git Repository Corruption Recovery

**Use this if `git pull` fails with merge conflicts or "not a git repository" errors on VPS.**

This happened on Jan 2, 2025 when the VPS `~/docker-apps` directory was never properly initialized from GitHub, causing merge conflicts and missing SSL certificates after attempting fresh clone.

### Quick Diagnosis

```bash
# On VPS - check if git repo is healthy
cd ~/docker-apps
git status

# Common signs of corruption:
# - "Not a git repository"
# - "No commits yet" on branch master
# - Merge conflicts on every pull
# - Changes staged but never committed
```

### Recovery Steps

#### Step 1: Backup Critical VPS-Specific Files

```bash
# On VPS - create timestamped backup
cd ~
mkdir -p vps-recovery-backup-$(date +%Y%m%d-%H%M)

# Back up environment variables (NOT in git)
cp docker-apps/.env vps-recovery-backup-*/main.env 2>/dev/null
cp docker-apps/personal-website/.env vps-recovery-backup-*/website.env 2>/dev/null
cp -r docker-apps/lightrag/.env vps-recovery-backup-*/lightrag.env 2>/dev/null

# Back up SSL certificates (NOT in git) - CRITICAL!
sudo cp -r docker-apps/certbot/conf vps-recovery-backup-*/certbot-conf

# Back up any working nginx configs that differ from GitHub
cp -r docker-apps/nginx/conf.d vps-recovery-backup-*/nginx-conf.d

# Verify backup
ls -lah vps-recovery-backup-*/
```

**⚠️ CRITICAL:** SSL certificates are NOT in git. If you skip backing them up, you'll need to regenerate ALL certificates (20+ minutes, risk of rate limits).

#### Step 2: Rename Broken Directory

```bash
# On VPS
cd ~
mv docker-apps docker-apps-broken-$(date +%Y%m%d-%H%M)
```

#### Step 3: Fresh Clone from GitHub

```bash
# On VPS
cd ~
git clone https://github.com/Shepherd-Creative/pierre-vps-stack.git docker-apps
cd docker-apps

# Verify clone
git remote -v
git status  # Should be clean
git log --oneline -3
```

#### Step 4: Initialize Submodule

```bash
# On VPS
cd ~/docker-apps
git submodule update --init --recursive

# Verify submodule
ls -la personal-website/
cd personal-website && git status && cd ..
```

#### Step 5: Restore Environment Variables

```bash
# On VPS
cd ~/docker-apps

# Restore main .env
cp ~/vps-recovery-backup-*/main.env .env

# Restore website .env
cp ~/vps-recovery-backup-*/website.env personal-website/.env

# Restore other service .env files
cp ~/vps-recovery-backup-*/lightrag.env lightrag/.env 2>/dev/null

# Verify restoration
echo "=== Main .env ==="
head -5 .env

echo "=== Website .env ==="
cat personal-website/.env
```

#### Step 6: Restore SSL Certificates (CRITICAL!)

```bash
# On VPS
cd ~/docker-apps

# Restore entire certbot configuration
sudo cp -r ~/vps-recovery-backup-*/certbot-conf/* certbot/conf/

# Verify certificates restored
sudo ls -la certbot/conf/live/ 2>/dev/null || echo "⚠️ Certificates not restored!"

# Should see directories like:
# - pierre.brandiron.co.za/
# - n8n.brandiron.co.za/
# - qdrant.brandiron.co.za/
# etc.
```

**Why this matters:** Without SSL certificates, nginx will crash on startup with certificate file not found errors.

#### Step 7: Check for Nginx Config Differences

```bash
# On VPS
cd ~/docker-apps

# Compare backup configs with GitHub version
diff -r ~/vps-recovery-backup-*/nginx-conf.d/ nginx/conf.d/ | grep "^Only in"

# Common differences:
# - HTTPS enabled/disabled (VPS should have HTTPS enabled)
# - Deleted services (flowise, supabase, etc.)
```

If you see differences:

```bash
# Copy production HTTPS configs if GitHub has HTTP-only versions
cp ~/vps-recovery-backup-*/nginx-conf.d/pierre.brandiron.co.za.conf nginx/conf.d/

# Remove configs for deleted services
rm nginx/conf.d/flowise.brandiron.co.za.conf 2>/dev/null
rm nginx/conf.d/supabase.brandiron.co.za.conf 2>/dev/null
rm nginx/conf.d/brandiron.co.za.conf 2>/dev/null
```

#### Step 8: Commit Corrected Configs to GitHub

```bash
# On VPS
cd ~/docker-apps

# If you copied HTTPS-enabled configs from backup
git add nginx/conf.d/
git commit -m "Enable HTTPS for production configs (restored from VPS)"
git push

# If you removed obsolete configs
git add nginx/conf.d/
git commit -m "Remove obsolete nginx configs for deleted services"
git push
```

#### Step 9: Restart All Services

```bash
# On VPS
cd ~/docker-apps

# Stop everything cleanly
docker compose down

# Start all services fresh
docker compose up -d

# Wait for startup
sleep 15

# Check status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

#### Step 10: Verify Everything Works

```bash
# On VPS

# 1. Check nginx is running (not restarting)
docker ps | grep nginx
# Should show: Up X seconds (not "Restarting")

# 2. Test website HTTPS
curl -I https://pierre.brandiron.co.za
# Should return: HTTP/1.1 200 OK

# 3. Verify environment variables loaded
docker exec personal-website env | grep VITE
# Should show VITE_CHAT_WEBHOOK_URL, etc.

# 4. Check git status
git status
# Should show: working tree clean

# 5. Test other critical services
curl -I https://n8n.brandiron.co.za
curl -I https://qdrant.brandiron.co.za
```

#### Step 11: Cleanup (Only After Verification)

```bash
# On VPS - only after ALL checks pass

# Remove broken directory
sudo rm -rf ~/docker-apps-broken-*

# Keep backup for 24-48 hours, then remove
# sudo rm -rf ~/vps-recovery-backup-*
```

### Common Issues During Recovery

#### Issue: Nginx keeps restarting

```bash
# Check logs
docker logs nginx --tail 50

# Common causes:
# 1. Missing SSL certificates - restore from backup (Step 6)
# 2. Configs reference deleted services - remove those configs
# 3. Configs reference missing upstreams - remove or fix configs
```

#### Issue: "host not found in upstream"

```bash
# Nginx can't find a container referenced in a config
# Solution: Remove the config for that deleted service
rm nginx/conf.d/[deleted-service].brandiron.co.za.conf
docker compose restart nginx
```

#### Issue: "cannot load certificate"

```bash
# SSL certificate missing
# Solution: Restore from backup or regenerate
sudo cp -r ~/vps-recovery-backup-*/certbot-conf/* certbot/conf/
docker compose restart nginx
```

#### Issue: VITE variables undefined in website

```bash
# .env wasn't present during build
# Solution: Restore .env and rebuild
cp ~/vps-recovery-backup-*/website.env personal-website/.env
docker compose up -d --build personal-website --force-recreate
```

### Prevention Tips

1. **Never manually initialize git on VPS** - always clone from GitHub
2. **Back up SSL certs before major changes** - they're not in git
3. **Keep nginx configs synced to GitHub** - especially HTTPS-enabled versions
4. **Remove configs when deleting services** - prevents nginx startup failures
5. **Test after every git pull** - catch issues before they cascade

### When to Use This Workflow

- `git pull` consistently fails with merge conflicts
- VPS shows "not a git repository" or "no commits yet"
- Fresh VPS setup needed
- Major infrastructure migration
- After accidentally corrupted git directory

---

## 🚀 Workflow E: Complete Deployment (Lovable → Local → GitHub → VPS)

**Use this when you want to deploy Lovable changes all the way to production in one go.**

This combines Workflow A and Workflow C with proper conflict handling and verification.

### Quick Command Sequence

```bash
# ============================================
# PART 1: LOCAL MACHINE (Mac)
# ============================================

# Navigate and handle conflicts
cd ~/Documents/pierre-vps-dev/personal-website
git restore package-lock.json 2>/dev/null
git pull
npm install

# Update parent repo
cd ~/Documents/pierre-vps-dev
git fetch origin
[ "$(git rev-list HEAD..origin/main --count)" -gt 0 ] && git pull --rebase
git add personal-website
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M')"
git push

# ============================================
# PART 2: VPS (via SSH)
# ============================================

ssh pierre_sudo_user@46.202.128.120 << 'ENDSSH'
cd ~/docker-apps

# Health check and deploy
git status > /dev/null 2>&1 || { echo "❌ Git unhealthy, use Workflow D"; exit 1; }
git pull origin main
git submodule update --init --recursive
[ -f .env ] && [ -f personal-website/.env ] || { echo "❌ .env missing"; exit 1; }

# Rebuild and verify
docker compose up -d --build personal-website
docker compose restart nginx
sleep 10

# Quick verification
docker ps | grep -E "nginx|personal-website" | grep -q "Up" && \
curl -s -o /dev/null -w "%{http_code}" https://pierre.brandiron.co.za | grep -q "200" && \
echo "✅ Deployment successful! Visit: https://pierre.brandiron.co.za" || \
echo "❌ Deployment failed, check logs"
ENDSSH
```

### When to Use Workflow E

- ✅ You made changes in Lovable and want them live on production
- ✅ You want a single command to deploy everything  
- ✅ You want automated verification after deployment
- ⚠️ First time deploying? Test Workflow A and C separately first

### Troubleshooting

If any step fails, refer to the appropriate workflow:

| Issue | Use Workflow |
|-------|--------------|
| Package-lock.json conflicts | Automatic in Workflow E |
| Git pull fails with conflicts | Workflow A troubleshooting |
| Push rejected | Automatic in Workflow E |
| VPS git unhealthy | Workflow D |
| Nginx crashes | Service Decommissioning section |
| Website not accessible | Check logs and verify .env files |

---

## ⚠️ IMPORTANT: New Subdomain Deployment Checklist

When deploying a **new subdomain** (first time only), additional steps are required:

### Step 1: DNS Setup
Add A record at your domain provider:
| Type | Name | Value |
|------|------|-------|
| A | [subdomain] | 46.202.128.120 |

### Step 2: Deploy Container First (HTTP only)
```bash
# On VPS
cd ~/docker-apps
git pull origin main
git submodule update --init --recursive
docker compose up -d --build [service-name]
docker compose restart nginx
```

### Step 3: Obtain SSL Certificate
```bash
# On VPS - run certbot for the new domain
docker run --rm \
  -v /home/pierre_sudo_user/docker-apps/certbot/conf:/etc/letsencrypt \
  -v /home/pierre_sudo_user/docker-apps/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d [subdomain].brandiron.co.za \
  --email user@example.com \
  --agree-tos \
  --no-eff-email
```

### Step 4: Update Nginx Config for HTTPS
After SSL cert is obtained, the nginx config needs HTTPS enabled:
1. Update local nginx config with HTTPS block
2. Commit and push to GitHub
3. Pull on VPS and restart nginx

### Step 5: Sync Updated Config Back to Git
```bash
# After VPS config is working, sync back to local
# On local machine:
scp pierre_sudo_user@46.202.128.120:~/docker-apps/nginx/conf.d/[subdomain].brandiron.co.za.conf \
    ~/Documents/pierre-vps-dev/nginx/conf.d/

# Commit the working config
cd ~/Documents/pierre-vps-dev
git add nginx/conf.d/[subdomain].brandiron.co.za.conf
git commit -m "Update nginx config: enable HTTPS for [subdomain]"
git push
```

---

## 🗑️ Service Decommissioning Checklist

**Use this when permanently removing a service from VPS to prevent nginx startup failures.**

### Step 1: Stop and Remove Container

```bash
# On VPS
cd ~/docker-apps
docker compose stop [service-name]
docker compose rm [service-name]

# Verify removal
docker ps -a | grep [service-name]
```

### Step 2: Remove Nginx Config

```bash
# On VPS
cd ~/docker-apps

# Remove the nginx config for this service
rm nginx/conf.d/[service-name].brandiron.co.za.conf

# Commit the removal to git
git add nginx/conf.d/
git commit -m "Remove nginx config for decommissioned [service-name] service"
git push
```

**⚠️ CRITICAL:** If you skip this step, nginx will crash on next restart trying to find the deleted service!

### Step 3: Restart Nginx

```bash
# On VPS
docker compose restart nginx

# Verify nginx started successfully
docker ps | grep nginx
# Should show: Up X seconds (not "Restarting")
```

### Step 4: Clean Up SSL Certificate (Optional)

```bash
# On VPS - optional, certs don't hurt to keep

# List certificate to confirm it exists
sudo ls -la certbot/conf/live/[service-name].brandiron.co.za/

# Remove certificate (optional)
# sudo rm -rf certbot/conf/live/[service-name].brandiron.co.za/
# sudo rm -rf certbot/conf/archive/[service-name].brandiron.co.za/
# sudo rm certbot/conf/renewal/[service-name].brandiron.co.za.conf
```

**Note:** Keeping old certificates doesn't hurt. They'll auto-renew until manually removed.

### Step 5: Update Local Repository

```bash
# On local machine
cd ~/Documents/pierre-vps-dev
git pull origin main

# Verify config removed locally
ls nginx/conf.d/ | grep [service-name]
# Should return nothing
```

### Example: Decommissioning Flowise

```bash
# 1. Stop container
docker compose stop flowise
docker compose rm flowise

# 2. Remove nginx config
rm nginx/conf.d/flowise.brandiron.co.za.conf
git add nginx/conf.d/
git commit -m "Remove nginx config for decommissioned flowise service"
git push

# 3. Restart nginx
docker compose restart nginx
docker ps | grep nginx  # Verify running
```

### Services Recently Decommissioned

- ✅ flowise.brandiron.co.za (Jan 2, 2025)
- ✅ supabase.brandiron.co.za (Jan 2, 2025)
- ✅ brandiron.co.za main landing (Jan 2, 2025)

---

## Nginx Config Template for New Subdomains

Save to `nginx/conf.d/[subdomain].brandiron.co.za.conf`:

```nginx
# [Service Name]
# Domain: [subdomain].brandiron.co.za

server {
    listen 80;
    server_name [subdomain].brandiron.co.za;

    # ACME challenge for SSL certificate renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name [subdomain].brandiron.co.za;

    ssl_certificate /etc/letsencrypt/live/[subdomain].brandiron.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/[subdomain].brandiron.co.za/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://[container-name]:[port]/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## Important Notes

1. **Pre-commit hook**: Runs automatically on every commit in `personal-website/`. If it blocks a commit, check for accidentally staged secrets.

2. **Two repos to update**: 
   - `personal-website/` (the website code)
   - `pierre-vps-dev/` (parent repo that tracks submodule pointer)

3. **Order matters**: Always commit website changes first, then update parent repo.

4. **`.env` files are local/VPS only**: Never committed. Created manually on each environment from `.env.example`.

5. **SSL certs live on VPS only**: Certificates are not in git. They're stored at `/home/pierre_sudo_user/docker-apps/certbot/conf/`. **ALWAYS back these up before major git operations!**

6. **Nginx configs in git should be production-ready**: Once HTTPS is working, sync the config back to git so future pulls don't break SSL.

7. **⚠️ CRITICAL: Vite environment variables must exist at BUILD TIME**: 
   - Vite bakes `VITE_*` variables into the JavaScript bundle during `npm run build`
   - If `.env` is missing or added after the build, variables will be `undefined`
   - **On VPS**: Ensure `personal-website/.env` exists BEFORE running `docker compose up --build`
   - **To verify**: `docker exec personal-website grep -o "n8n.brandiron" /usr/share/nginx/html/assets/*.js`
   - If variable is missing, recreate `.env` and rebuild: `docker compose up -d --build personal-website --force-recreate`

8. **⚠️ CRITICAL: Always remove nginx configs when decommissioning services**: If a service is deleted but its nginx config remains, nginx will crash on startup trying to find the missing upstream container or SSL certificate.

---

## Trigger Phrases

When user says any of these, use the appropriate workflow:

| User Says | Action |
|-----------|--------|
| "sync from Lovable" / "pull Lovable changes" | Workflow A |
| "push my changes" / "sync to Lovable" | Workflow B |
| "deploy to VPS" / "push to production" | Workflow C |
| "deploy Lovable to production" / "complete deployment" / "deploy everything" | Workflow E (Complete) |
| "VPS git is broken" / "merge conflicts on VPS" / "fresh clone VPS" | Workflow D (Recovery) |
| "commit website changes" | Workflow B (steps 1 only) |
| "update the submodule" / "update parent repo" | Parent repo update only |
| "add new subdomain" / "deploy new service" | New Subdomain Checklist |
| "remove service" / "delete [service]" / "decommission [service]" | Service Decommissioning Checklist |

---

## Directory Reference

```
~/Documents/pierre-vps-dev/           ← Parent repo (infrastructure) - LOCAL
├── personal-website/                 ← Submodule (website code)
│   ├── .env                          ← Local secrets (never committed)
│   ├── .env.example                  ← Template (committed)
│   └── src/                          ← Website source code
├── ai-context/                       ← AI assistant rules (this folder)
├── nginx/conf.d/                     ← Nginx configs (committed)
└── docker-compose.yml                ← Service definitions (committed)

~/docker-apps/                        ← Same repo on VPS - PRODUCTION
├── personal-website/                 ← Submodule
│   └── .env                          ← VPS secrets (created manually)
├── nginx/conf.d/                     ← Nginx configs
├── certbot/conf/                     ← SSL certificates (VPS only, NOT in git!)
└── .env                              ← Main VPS secrets
```

---

## Best Practices Summary

### SSL Certificates (NOT in git)
- ✅ Always back up before major git operations
- ✅ Stored in `certbot/conf/` directory
- ✅ Auto-renew via certbot cron job
- ❌ Never commit to git (too large, security risk)

### Nginx Configs (IN git)
- ✅ Commit production HTTPS-enabled versions to git
- ✅ Remove config when decommissioning service
- ✅ Test locally before deploying to VPS
- ❌ Don't leave configs referencing deleted services

### Environment Variables (NOT in git)
- ✅ Use `.env.example` as template in git
- ✅ Create actual `.env` manually on each machine
- ✅ Back up before major operations
- ❌ Never commit actual `.env` files

### Git Operations on VPS
- ✅ Always pull from GitHub, never manually init
- ✅ Verify `git status` is clean before major changes
- ✅ Test after every `git pull` before restarting services
- ❌ Don't manually create git repos on VPS

---

*Last Updated: January 2, 2026*  
*Latest Updates:*
- *Added Workflow E: Complete end-to-end deployment (Lovable → VPS)*
- *Enhanced Workflow A: Conflict handling and push rejection prevention*
- *Enhanced Workflow C: Pre-flight checks and post-deployment verification*
- *Workflow D: VPS git corruption recovery with SSL certificate restoration*
- *Service Decommissioning Checklist to prevent nginx crashes*
