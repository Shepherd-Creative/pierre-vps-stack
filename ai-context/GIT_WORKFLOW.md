# Git Workflow Commands for Pierre VPS Stack

> **For AI Assistants**: Use these commands when the user asks to sync, commit, push, or deploy.

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

### Workflow C: Deploy to VPS

```bash
# 1. SSH to VPS
ssh pierre_sudo_user@46.202.128.120

# 2. Pull updates (from ~/docker-apps directory)
cd ~/docker-apps
git pull origin main

# 3. Update submodule
git submodule update --init --recursive

# 4. Rebuild and restart website container
docker compose up -d --build personal-website
docker compose restart nginx
```

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

5. **SSL certs live on VPS only**: Certificates are not in git. They're stored at `/home/pierre_sudo_user/docker-apps/certbot/conf/`.

6. **Nginx configs in git should be production-ready**: Once HTTPS is working, sync the config back to git so future pulls don't break SSL.

7. **⚠️ CRITICAL: Vite environment variables must exist at BUILD TIME**: 
   - Vite bakes `VITE_*` variables into the JavaScript bundle during `npm run build`
   - If `.env` is missing or added after the build, variables will be `undefined`
   - **On VPS**: Ensure `personal-website/.env` exists BEFORE running `docker compose up --build`
   - **To verify**: `docker exec personal-website grep -o "n8n.brandiron" /usr/share/nginx/html/assets/*.js`
   - If variable is missing, recreate `.env` and rebuild: `docker compose up -d --build personal-website --force-recreate`

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
| "add new subdomain" / "deploy new service" | New Subdomain Checklist |

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
├── certbot/conf/                     ← SSL certificates (VPS only)
└── .env                              ← Main VPS secrets
```

---

*Last Updated: December 2025*
