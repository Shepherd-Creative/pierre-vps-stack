# Codebase Concerns

**Analysis Date:** 2026-02-20

## CRITICAL: Active Security Issues

### VPS Cryptominer Infection (CRITICAL)
- **Issue:** `chonkie-visualizer` Docker container is infected with XMRig cryptocurrency miner exploiting Monero mining pool. 242 malicious processes, consuming significant CPU resources. Attacker: `imeatingpoop` via 3 proxy servers (185.155.235.180, 83.147.19.245, 45.196.97.119).
- **Files:** `chonkie/chonkie-visualizer/` (infected container)
- **Impact:** Resource depletion, potential VPS shutdown, reputational damage, legal liability. Infection contained to single container but indicates application-layer vulnerability.
- **Fix approach:**
  1. Immediate: Stop and remove infected container `docker stop chonkie-visualizer && docker rm chonkie-visualizer`
  2. Investigate infection vector: audit `chonkie/chonkie-visualizer/package.json` for malicious dependencies, check `chonkie/chonkie-visualizer/Dockerfile` base image, run `npm audit` for known vulnerabilities
  3. Rebuild with security hardening: add `read_only: true`, `security_opt: [no-new-privileges:true]`, `cap_drop: [ALL]` to docker-compose.yml
  4. Block mining pool IPs outbound in UFW: `sudo ufw deny out to 185.155.235.180 83.147.19.245 45.196.97.119`
  5. Full details in `/Users/pierregallet/Documents/pierre-vps-dev/security_hardening.md`

## Authentication & Security

### Hardcoded Default Credentials in DeepEval
- **Issue:** `deepeval/app/config.py` line 23 sets default admin password to hardcoded `"changeme123"` if `ADMIN_PASSWORD` env var is not set. Same pattern for `SECRET_KEY` line 17 (`"change-this-secret-key-in-production"`).
- **Files:** `deepeval/app/config.py`
- **Impact:** If environment variables are not explicitly set in production deployment, the API defaults to weak, publicly-known credentials. Anyone accessing the API endpoint can authenticate as admin.
- **Current mitigation:** Env vars should override defaults when properly configured.
- **Recommendations:**
  1. Remove hardcoded defaults entirely — raise exception if required env vars are missing at startup
  2. Add validation in `__init__` to ensure `SECRET_KEY` contains minimum entropy
  3. Generate random `SECRET_KEY` at first startup if using local development (document this)

### CORS Configuration Overly Permissive
- **Issue:** `deepeval/app/config.py` lines 60-63 set CORS to accept `["*"]` origins, all methods `["*"]`, all headers `["*"]`, and allow credentials.
- **Files:** `deepeval/app/config.py`
- **Impact:** Allows any website to make authenticated requests to the API. Combined with weak default SECRET_KEY, this is a significant vulnerability.
- **Current mitigation:** None. This is default-open.
- **Recommendations:**
  1. Restrict `cors_origins` to specific domains (e.g., `["https://pierre.brandiron.co.za"]`)
  2. Restrict `cors_allow_methods` to only what's needed (e.g., `["GET", "POST"]`)
  3. Use environment variable to configure CORS origins per deployment environment

### API Key Stored in Memory Without Rotation
- **Issue:** `deepeval/app/services/auth_service.py` line 82 validates API keys against `settings.api_keys_list` — a simple list from env var. No key rotation, no expiration tracking, no rate limiting per key.
- **Files:** `deepeval/app/services/auth_service.py`, `deepeval/app/config.py`
- **Impact:** Compromised API keys cannot be rotated without redeploying. No audit trail of which key was used for which request.
- **Recommendations:**
  1. Add API key rotation mechanism — generate new keys, expire old ones, allow grace period
  2. Add API key expiration timestamps in config
  3. Add rate limiting per API key to detect abuse
  4. Log which API key was used for each request (for audit trail)

## Dependency & Supply Chain

### Unaudited npm Dependencies in chonkie-visualizer
- **Issue:** `chonkie/chonkie-visualizer/package.json` has 28 direct dependencies. No `.npmrc` audit configuration, no `npm audit` in CI/CD, postinstall scripts are not explicitly blocked.
- **Files:** `chonkie/chonkie-visualizer/package.json`, `chonkie/chonkie-visualizer/package-lock.json`
- **Impact:** Cryptominer infection likely came through compromised npm package or postinstall script. Current detection: none until runtime.
- **Fix approach:**
  1. Run `npm audit` locally immediately in `chonkie/chonkie-visualizer/` directory
  2. Add `npm audit --audit-level=moderate` to CI/CD pipeline (fail on moderate+ vulnerabilities)
  3. Add `audit-level = moderate` to `.npmrc` if it exists, otherwise create one
  4. Check for postinstall/preinstall scripts: `grep -r "postinstall\|preinstall" chonkie/chonkie-visualizer/package.json`
  5. Consider using `npm ci` instead of `npm install` in Docker for reproducible builds

### Next.js Version Not Specified (Flexible Range)
- **Issue:** `chonkie/chonkie-visualizer/package.json` line 24 specifies `next: 15.5.3` (pinned, good). But personal-website does not include Next.js at all — uses React + Vite (different stack). Mixing frameworks increases surface area.
- **Files:** `chonkie/chonkie-visualizer/package.json`, `personal-website/package.json`
- **Impact:** If Next.js has critical CVE, chonkie-visualizer affected. Known recent CVEs: CVE-2024-34351 (SSRF), CVE-2025-29927 (middleware auth bypass).
- **Current mitigation:** Using recent version (15.5.3).
- **Recommendations:**
  1. Add `npm audit` to CI/CD that catches Next.js CVEs
  2. Subscribe to security advisories for Next.js releases

## Code Quality & Type Safety

### Console.error in Production Code
- **Issue:** `personal-website/src/pages/NotFound.tsx` line 8 logs `console.error()` which will appear in browser console and server logs. `personal-website/src/hooks/useChatbot.ts` line 134 logs `console.error("Chat error:", error)` which exposes error details to client.
- **Files:** `personal-website/src/pages/NotFound.tsx`, `personal-website/src/hooks/useChatbot.ts`
- **Impact:** Error details (stack traces, URLs, object structures) leak to client-side console, visible in browser DevTools and potentially client-side monitoring. Not a security issue per se, but bad practice.
- **Recommendations:**
  1. Use proper error boundary and error reporting service (e.g., Sentry) for errors
  2. Remove `console.error()` in favor of structured logging to a service
  3. Log only sanitized error messages to console (omit sensitive details)

### Loose Error Handling in Chat Endpoint
- **Issue:** `personal-website/src/hooks/useChatbot.ts` lines 104-145 fetch chat API but catch all errors generically. If API returns error status, error message shown is generic fallback text that doesn't reflect actual issue. No retry logic, no timeout.
- **Files:** `personal-website/src/hooks/useChatbot.ts`
- **Impact:** User doesn't know if API is down, auth failed, rate limited, or timeout occurred. Difficult to debug in production.
- **Recommendations:**
  1. Add specific error handling for different HTTP status codes (401, 429, 500, etc.)
  2. Add fetch timeout (use `AbortSignal`)
  3. Add retry logic with exponential backoff for transient failures
  4. Log error details server-side, not client-side

### Session ID Generation Uses Weak Randomness
- **Issue:** `personal-website/src/hooks/useChatbot.ts` line 34 generates session ID using `Math.random().toString(36).substring(2, 9)`. `Math.random()` is not cryptographically secure.
- **Files:** `personal-website/src/hooks/useChatbot.ts`
- **Impact:** Session IDs are predictable. If sessions are used for authorization (not the case here, but could be), this is a security issue. For analytics-only, low risk but bad practice.
- **Recommendations:**
  1. Use `crypto.getRandomValues()` for session token generation
  2. Use at least 32 bytes of entropy (e.g., `crypto.randomUUID()`)
  3. Or use server-side session token generation instead of client-side

## Architecture & Design Patterns

### Evaluation Service Missing Error Recovery
- **Issue:** `deepeval/app/api/evaluation.py` lines 181-207 (`_run_async_single_evaluation`) and lines 210-246 (`_run_async_bulk_evaluation`) use background tasks without persistent job queue. If the task crashes mid-execution, there's no recovery — job stays in "running" state forever.
- **Files:** `deepeval/app/api/evaluation.py`, `deepeval/app/services/job_service.py`
- **Impact:** Long-running evaluations that fail midway have no retry mechanism. Users can't resume interrupted jobs. Memory leaks if tasks are abandoned.
- **Fix approach:**
  1. Add timeout to background tasks (e.g., `settings.default_timeout = 300` seconds)
  2. Add heartbeat mechanism — job updates progress every 30 seconds, or it's considered stale
  3. Add job cancellation endpoint: `DELETE /evaluate/jobs/{job_id}`
  4. Consider using Celery + Redis (already configured in `deepeval/app/config.py` lines 46-48) instead of FastAPI's `BackgroundTasks`

### Evaluation Response Structure Is Loose
- **Issue:** `deepeval/app/api/evaluation.py` line 124 shows fallback response parsing: `data.output || data.response || data.text || generic message`. No schema validation of upstream n8n response format. If n8n changes output format, chat breaks silently.
- **Files:** `deepeval/app/api/evaluation.py`, `personal-website/src/hooks/useChatbot.ts`
- **Impact:** Breaking change in upstream API silently falls back to error message. User experience degrades without alerting developer.
- **Recommendations:**
  1. Define strict Pydantic response model for n8n output: `class N8nResponse(BaseModel): output: str`
  2. Validate response in `personal-website/src/hooks/useChatbot.ts` — throw error if response missing `output` field
  3. Add integration test that mocks n8n response and validates parsing

### No Test Coverage Across Codebase
- **Issue:** Found 186 test files (`.test.ts`, `.spec.ts`, `_test.py`, `_spec.py`) in total codebase, but 77 TypeScript source files in `personal-website/src/` have zero corresponding test files. 347-line `deepeval/app/api/evaluation.py` has no corresponding `test_evaluation.py`.
- **Files:** All application code
- **Impact:** Refactoring is risky. Bugs slip through CI/CD because behavior is not verified. No regression test suite.
- **Fix approach:**
  1. Add unit tests for critical paths: chat message handling, evaluation result parsing, auth token validation
  2. Add integration tests: full chat flow from request to response, API key validation
  3. Add e2e tests (if possible): real n8n integration test
  4. Target 80%+ coverage for critical modules (`useChatbot.ts`, `auth_service.py`, `evaluation.py`)

## Infrastructure & Deployment

### SSH PermitRootLogin Still Enabled
- **Issue:** `/etc/ssh/sshd_config` (on VPS, not in repo) has `PermitRootLogin yes`. Combined with root having 1 authorized key, this creates a single point of failure.
- **Files:** N/A (VPS configuration)
- **Impact:** If root key is compromised, attacker has direct root access. No sudo logging.
- **Fix approach:** Set `PermitRootLogin no` in SSH config (detailed in `security_hardening.md` Phase 5)

### Docker Containers Not Security-Hardened
- **Issue:** All Docker containers in `docker-compose.yml` run with default capabilities, writable filesystems, and privilege not restricted. This is what allowed the miner to write binaries to `/home/nextjs/`.
- **Files:** `docker-compose.yml` (at repository root)
- **Impact:** Container escape exploits have full ability to modify filesystem, execute arbitrary binaries, spawn processes.
- **Fix approach:** Add to every service in `docker-compose.yml`:
  ```yaml
  read_only: true
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  tmpfs:
    - /tmp:size=50M
  ```
  Adjust `tmpfs` mounts per service (e.g., Next.js needs writable cache).

### No Outbound Firewall Rules
- **Issue:** UFW allows all outbound traffic by default. Containers inherit host network access. Miner was able to connect to mining pools because there were no outbound restrictions.
- **Files:** N/A (UFW configuration on VPS)
- **Impact:** Any compromised service can exfiltrate data or connect to attacker infrastructure.
- **Fix approach:** Add UFW rules:
  ```bash
  sudo ufw default deny outgoing  # Set default to deny
  sudo ufw allow out to any port 53   # DNS
  sudo ufw allow out to any port 80   # HTTP
  sudo ufw allow out to any port 443  # HTTPS
  sudo ufw allow out to any port 123  # NTP
  # Then add service-specific rules as needed
  ```

## Performance & Scalability

### Evaluation Batch Processing Not Optimized
- **Issue:** `deepeval/app/api/evaluation.py` lines 217-238 processes evaluations in batches, but batch size is hardcoded to `min(request.max_concurrent or 10, 10)`. If 1000 test cases requested with `max_concurrent=100`, will be capped at 10, causing 100 sequential API calls.
- **Files:** `deepeval/app/api/evaluation.py`
- **Impact:** Slow evaluation for bulk requests. No parallelization beyond hardcoded limit.
- **Current mitigation:** Default limit is reasonable (10) but prevents power users from optimizing.
- **Recommendations:**
  1. Allow `max_concurrent` to go higher if system resources permit (e.g., up to 50)
  2. Add memory limit check before accepting `max_concurrent` — fail if request would exceed available memory
  3. Consider Celery workers for true parallelization

### File Upload Size Limit Too High
- **Issue:** `deepeval/app/config.py` line 53 sets `max_file_size: int = 10 * 1024 * 1024  # 10MB`. Combined with `max_concurrent=10`, uploading 10MB file × 10 concurrent requests could exhaust memory.
- **Files:** `deepeval/app/config.py`, `deepeval/app/api/evaluation.py`
- **Impact:** Memory exhaustion, service crash, DoS vulnerability.
- **Recommendations:**
  1. Lower to 5MB per file
  2. Add request-level memory limit check
  3. Stream file processing instead of loading entire file into memory

## Missing Monitoring & Observability

### No Application Logging Service
- **Issue:** `deepeval/app/config.py` line 56 sets `log_level: str = os.getenv("LOG_LEVEL", "INFO")` but no actual logging configuration (no handlers, formatters, or log aggregation). Logs go to stdout only. No central log collection.
- **Files:** `deepeval/app/config.py`, `deepeval/app/main.py`
- **Impact:** Errors and security events only visible in container logs, not accessible after container restarts. No alerting on errors.
- **Recommendations:**
  1. Configure Python logging with handlers and formatters
  2. Send logs to a centralized service (e.g., Grafana Loki, ELK stack, or CloudWatch)
  3. Add structured logging for security events (auth attempts, API key usage)

### No API Monitoring or Rate Limiting
- **Issue:** No rate limiting on `/api/chat` or `/evaluate` endpoints. No request logging per endpoint. No alerting on unusual traffic patterns.
- **Files:** `personal-website/src/hooks/useChatbot.ts` (no client-side rate limiting), `deepeval/app/api/evaluation.py` (no server-side rate limiting)
- **Impact:** DDoS vulnerability. Single user can overwhelm the API. No visibility into which endpoints are slow.
- **Recommendations:**
  1. Add rate limiting middleware to FastAPI (e.g., `SlowAPI`)
  2. Configure per-endpoint limits (e.g., 10 requests/minute per IP for `/evaluate`)
  3. Add Prometheus metrics: request count, latency, error rate per endpoint
  4. Add alerting: trigger alert if error rate > 5%

## Environment Configuration

### Environment Variables Not Documented
- **Issue:** `deepeval/app/config.py` defines 20+ environment variables but no `.env.example` documents which are required vs optional, which are sensitive, and example values.
- **Files:** `deepeval/app/config.py`, `deepeval/.env.example`
- **Impact:** Deployment setup is error-prone. New developers don't know what to configure. Production might be missing critical env vars.
- **Fix approach:**
  1. Update `deepeval/.env.example` to include all vars from `config.py` with descriptions
  2. Mark required vars (no default) differently from optional
  3. Add comments explaining sensitive vars (secret key, API keys)
  4. Add setup script or terraform that validates all required vars are set before deploying

### No Validation of Critical Environment Variables at Startup
- **Issue:** If `DEEPEVAL_API_KEY` or `OPENAI_API_KEY` are missing, the service starts successfully but fails only when a request tries to use them.
- **Files:** `deepeval/app/config.py`, `deepeval/app/main.py`
- **Impact:** Deployment doesn't immediately fail. Users see 500 errors instead of getting fast feedback that config is wrong.
- **Recommendations:**
  1. Add validation in `config.py` __init__ to check required vars and raise exception if missing
  2. Add healthcheck endpoint that validates all integrations are reachable (returns 500 if not)

---

*Concerns audit: 2026-02-20*
