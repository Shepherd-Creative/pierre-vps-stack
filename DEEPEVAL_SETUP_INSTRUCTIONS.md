# DeepEval Service Setup Instructions

## What Was Done

1. Downloaded the theaiautomators/deepeval-wrapper repo
2. Removed their git history to make it yours
3. Initialized as your own git repo (initial commit done)
4. Created `.env.example` with placeholders (following your security protocol)
5. Created nginx config for `deepeval.brandiron.co.za`
6. Ready to add to docker-compose.yml

## Next Steps

### 1. Add DeepEval Service to docker-compose.yml

**You need to manually edit** `docker-compose.yml` and add this service definition BEFORE the `volumes:` section (after the reading-fluency service):

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

### 2. Create GitHub Repo for DeepEval

```bash
cd ~/Documents/pierre-vps-dev/deepeval

# Create a NEW private repo on GitHub:
# - Go to github.com/Shepherd-Creative (or your account)
# - Click "New repository"
# - Name: "deepeval-api" or "llm-evaluation-service"
# - Make it PRIVATE
# - Don't initialize with README (you already have code)

# Then push YOUR code:
git remote add origin git@github.com:Shepherd-Creative/deepeval-api.git
git branch -M main
git push -u origin main
```

### 3. Create Local .env File

```bash
cd ~/Documents/pierre-vps-dev/deepeval
cp .env.example .env

# Edit with your actual values
# Use Cursor, nano, or any editor
```

**Required values:**
- `OPENAI_API_KEY` - Your OpenAI key
- `API_KEYS` - A secure API key for authentication (generate a random string)
- `ADMIN_PASSWORD` - A secure admin password
- `SECRET_KEY` - Generate a random secret key

### 4. Commit Everything to Your Main Infrastructure Repo

```bash
cd ~/Documents/pierre-vps-dev

# Add all the new files
git add deepeval/
git add nginx/conf.d/deepeval.brandiron.co.za.conf
git add docker-compose.yml

# Commit
git commit -m "Add DeepEval LLM evaluation API service"

# Push
git push
```

### 5. Add DNS Record

In your domain provider (wherever brandiron.co.za is hosted):
- **Type**: A
- **Name**: deepeval
- **Value**: 46.202.128.120
- **TTL**: Auto or 3600

### 6. Deploy to VPS

```bash
# SSH to VPS
ssh pierre_sudo_user@46.202.128.120

cd ~/docker-apps

# Pull infrastructure updates
git pull origin main

# Create .env for deepeval on VPS
cd deepeval
cp .env.example .env
nano .env
# Add your OPENAI_API_KEY, API_KEYS, ADMIN_PASSWORD, SECRET_KEY

cd ~/docker-apps

# Build and start (HTTP first - no SSL yet)
docker compose up -d --build deepeval

# Check it's running
docker ps | grep deepeval
docker logs deepeval --tail 20

# Restart nginx to pick up new config
docker compose restart nginx

# Test locally
curl http://localhost:8000/docs
```

### 7. Get SSL Certificate

```bash
# On VPS - obtain SSL certificate
docker run --rm \
  -v /home/pierre_sudo_user/docker-apps/certbot/conf:/etc/letsencrypt \
  -v /home/pierre_sudo_user/docker-apps/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d deepeval.brandiron.co.za \
  --email user@example.com \
  --agree-tos \
  --no-eff-email

# Restart nginx to use HTTPS
docker compose restart nginx

# Verify HTTPS works
curl -I https://deepeval.brandiron.co.za/docs
```

### 8. Test the API

**Visit in browser:**
- API Docs: `https://deepeval.brandiron.co.za/docs`
- ReDoc: `https://deepeval.brandiron.co.za/redoc`
- Health Check: `https://deepeval.brandiron.co.za/health`

**Test evaluation endpoint:**
```bash
# Replace YOUR_API_KEY with the value from your .env API_KEYS
curl -X POST "https://deepeval.brandiron.co.za/evaluate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "test_case": {
      "input": "What is 2+2?",
      "actual_output": "The answer is 4"
    },
    "metrics": [
      {
        "metric_type": "answer_relevancy",
        "threshold": 0.7
      }
    ]
  }'
```

## What Makes This "Yours"

1. **Your git history** - Starts with your initial commit, no trace of original repo
2. **Your private repo** - Under Shepherd-Creative, completely private
3. **Your infrastructure** - Integrated into your VPS stack following your patterns
4. **Your configuration** - Following your security protocol with .env.example
5. **Your branding** - Can modify, customize, add features as needed

This is now YOUR deepeval API service that happens to use their excellent foundation code!

## For Your AGGP Application

You can reference this as:
- "DeepEval LLM Evaluation API - deployed infrastructure for systematic testing and validation of LLM outputs"
- "Integrated evaluation framework supporting 25+ research-backed metrics including RAG faithfulness, answer relevancy, bias detection, and toxicity screening"
- Part of your broader AI infrastructure stack demonstrating production deployment capabilities

## Troubleshooting

**Container won't start:**
```bash
docker logs deepeval --tail 50
```

**Nginx errors:**
```bash
docker logs nginx --tail 50
```

**Can't connect to container:**
```bash
# Check if it's running
docker ps | grep deepeval

# Check if it's exposing port 8000
docker inspect deepeval | grep -A 5 ExposedPorts
```

**SSL certificate issues:**
Make sure DNS is propagated first (can take 5-60 minutes after adding the A record).
