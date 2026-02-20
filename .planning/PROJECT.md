# VPS Security Hardening & Malware Remediation

## What This Is

A security remediation and hardening project for Pierre's VPS (46.202.128.120) running a Docker Compose stack. An active XMRig cryptominer was discovered inside the `chonkie-visualizer` container. This project kills the miner, investigates the infection vector, rebuilds securely, and hardens the entire VPS against future attacks.

## Core Value

Eliminate the active cryptominer and harden the VPS so no container can be weaponized again, even if a dependency is compromised.

## Requirements

### Validated

- Docker Compose microservices architecture with nginx reverse proxy — existing
- fail2ban active with SSH jail — existing
- UFW firewall with default deny incoming, ports 22/80/443 allowed — existing
- SSH key-only authentication (PasswordAuthentication no) — existing
- Internal Docker network isolation (only nginx exposes ports) — existing
- Certbot SSL certificate auto-renewal — existing
- CI/CD pipeline via GitHub Actions deploy.yml — existing
- Monitoring stack (Grafana, Prometheus, cAdvisor, node-exporter) — existing

### Active

- [ ] Kill active XMRig cryptominer in chonkie-visualizer container
- [ ] Investigate infection vector (compromised dependency, Next.js CVE, or malicious postinstall)
- [ ] Rebuild chonkie-visualizer from clean source with updated dependencies
- [ ] Harden all Docker containers (read-only filesystem, no-new-privileges, cap_drop ALL)
- [ ] Block known mining pool proxy IPs via UFW outbound rules
- [ ] Disable SSH root login (PermitRootLogin no)
- [ ] Install and run ClamAV on VPS
- [ ] Install and run Linux Malware Detect (Maldet) on VPS
- [ ] Install and run Rkhunter on VPS
- [ ] Set up automated daily/weekly security scans with cron
- [ ] Scan local Mac development machine with ClamAV
- [ ] Verify all services operational post-remediation

### Out of Scope

- Outbound traffic whitelisting for Docker containers — complex to maintain, read-only filesystem is the primary defense
- Container runtime security (gVisor, Kata) — overkill for this VPS scale
- Network segmentation beyond Docker bridge — single VPS, not a cluster
- SIEM/log aggregation — existing Grafana stack is sufficient for this scale

## Context

- VPS hosted at Hostinger (46.202.128.120), Ubuntu 24.04, 2 cores, 8GB RAM
- 15 Docker containers running: personal website, n8n, Graphiti, LightRAG, Neo4j, DeepEval, Chonkie, Grafana, Prometheus, etc.
- The miner has 242 processes, mines Monero for user "imeatingpoop" via 3 proxy servers
- Miner was spawned by the Next.js server process — infection came through the application layer
- Monarx agent (Hostinger's scanner) already detected the malware
- All SSH logins verified as Pierre's IP range (102.165.68.x)
- Infection is contained to the single chonkie-visualizer container

## Constraints

- **Access**: VPS commands must run via SSH as pierre_sudo_user (key at ~/.ssh/github_actions_vps)
- **Deployment**: Infrastructure changes (docker-compose.yml, nginx) go through git push + CI/CD
- **Availability**: Other services (personal website, n8n, monitoring) must remain operational during remediation
- **Priority**: Miner must be killed immediately before any investigation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild chonkie-visualizer rather than remove | User wants it running | -- Pending |
| Apply Docker hardening to ALL containers | Defense in depth — prevents any container from being weaponized | -- Pending |
| Block mining IPs as stopgap, not as primary defense | Attacker can change IPs; read-only filesystem is the real fix | -- Pending |

---
*Last updated: 2026-02-20 after initialization*
