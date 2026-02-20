#!/bin/bash
# verify-stack.sh - Reusable post-deploy VPS verification script
# Validates container security configs, service health, and miner indicators.
# Usage: ./verify-stack.sh
# Exit code: 0 if all checks pass, 1 if any FAIL
set -euo pipefail

# -------------------------------------------------------------------
# Colors and counters
# -------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

COMPOSE_FILE="/home/pierre_sudo_user/docker-apps/docker-compose.yml"

# -------------------------------------------------------------------
# Helper: print colored result and increment counter
# -------------------------------------------------------------------
check() {
    local description="$1"
    local result="$2"
    if [ "$result" = "PASS" ]; then
        echo -e "  ${GREEN}[PASS]${NC} $description"
        ((PASS++))
    elif [ "$result" = "WARN" ]; then
        echo -e "  ${YELLOW}[WARN]${NC} $description"
        ((WARN++))
    else
        echo -e "  ${RED}[FAIL]${NC} $description"
        ((FAIL++))
    fi
}

info() {
    echo -e "  ${BLUE}[INFO]${NC} $1"
}

# -------------------------------------------------------------------
# Containers that legitimately cannot use read_only rootfs
# (entrypoint chown, app writes to own directories, cgroup access)
# -------------------------------------------------------------------
READONLY_EXCEPTIONS=("neo4j" "lightrag" "graphiti" "reading-fluency" "cadvisor")

# -------------------------------------------------------------------
# Check if a container name matches any readonly exception
# Container names include a project prefix (e.g. "docker-apps-neo4j-1")
# -------------------------------------------------------------------
is_readonly_exception() {
    local container="$1"
    for exception in "${READONLY_EXCEPTIONS[@]}"; do
        if [[ "$container" == *"$exception"* ]]; then
            return 0
        fi
    done
    return 1
}

# ===================================================================
# Section 1: Container Security Checks
# ===================================================================
echo ""
echo "==========================================="
echo " Container Security Checks"
echo "==========================================="

# Get list of running containers from docker compose
CONTAINERS=$(docker compose -f "$COMPOSE_FILE" ps --format '{{.Name}}' 2>/dev/null || true)

if [ -z "$CONTAINERS" ]; then
    echo -e "  ${RED}[FAIL]${NC} No containers found. Is docker compose running?"
    FAIL=$((FAIL + 1))
else
    # Check if certbot is in the list; if not, print informational note
    if ! echo "$CONTAINERS" | grep -q "certbot"; then
        info "certbot not running (uses 'certbot-renew' profile, runs on-demand only)"
    fi

    for container in $CONTAINERS; do
        echo ""
        echo "--- ${container} ---"

        # 1. Running check
        running=$(docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null || echo "false")
        check "Container running" "$([ "$running" = "true" ] && echo PASS || echo FAIL)"

        # 2. Healthcheck (informational if not configured)
        health=$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
        if [ "$health" = "none" ] || [ "$health" = "<nil>" ] || [ -z "$health" ]; then
            info "No healthcheck configured"
        elif [ "$health" = "healthy" ]; then
            check "Healthcheck: $health" "PASS"
        else
            check "Healthcheck: $health" "FAIL"
        fi

        # 3. no-new-privileges
        sec_opts=$(docker inspect --format '{{.HostConfig.SecurityOpt}}' "$container" 2>/dev/null || echo "[]")
        if echo "$sec_opts" | grep -q 'no-new-privileges'; then
            check "no-new-privileges" "PASS"
        else
            check "no-new-privileges" "FAIL"
        fi

        # 4. cap_drop ALL
        cap_drop=$(docker inspect --format '{{.HostConfig.CapDrop}}' "$container" 2>/dev/null || echo "[]")
        if echo "$cap_drop" | grep -qi 'all'; then
            check "cap_drop ALL" "PASS"
        else
            check "cap_drop ALL" "FAIL"
        fi

        # 5. ReadonlyRootfs (with known exceptions)
        readonly_fs=$(docker inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$container" 2>/dev/null || echo "unknown")
        if is_readonly_exception "$container"; then
            if [ "$readonly_fs" = "false" ]; then
                check "ReadonlyRootfs (exception: expected false)" "PASS"
            else
                check "ReadonlyRootfs (exception: unexpectedly true)" "WARN"
            fi
        else
            if [ "$readonly_fs" = "true" ]; then
                check "ReadonlyRootfs" "PASS"
            else
                check "ReadonlyRootfs" "FAIL"
            fi
        fi
    done
fi

# ===================================================================
# Section 2: Miner Indicator Checks
# ===================================================================
echo ""
echo ""
echo "==========================================="
echo " Miner Indicator Checks"
echo "==========================================="
echo ""

# Known miner process names from the Phase 1 incident
MINER_PROCESSES=("1HsT7J0l" "7cCYn" "dhclient" ".monitor" "lrt")

for proc in "${MINER_PROCESSES[@]}"; do
    if pgrep -f "$proc" > /dev/null 2>&1; then
        check "No miner process: $proc" "FAIL"
    else
        check "No miner process: $proc" "PASS"
    fi
done

# Check iptables OUTPUT chain for mining pool IP DROP rules
# Phase 1 blocked 3 mining pool proxy IPs via iptables OUTPUT DROP
echo ""
if command -v iptables > /dev/null 2>&1; then
    DROP_COUNT=$(sudo iptables -L OUTPUT -n 2>/dev/null | grep -c "DROP" || echo "0")
    if [ "$DROP_COUNT" -ge 3 ]; then
        check "iptables OUTPUT DROP rules (mining pool IPs): $DROP_COUNT rules" "PASS"
    elif [ "$DROP_COUNT" -gt 0 ]; then
        check "iptables OUTPUT DROP rules (mining pool IPs): only $DROP_COUNT of 3 expected" "WARN"
    else
        check "iptables OUTPUT DROP rules (mining pool IPs): none found" "WARN"
    fi
else
    info "iptables not available (cannot verify mining pool IP blocks)"
fi

# ===================================================================
# Section 3: Service Accessibility (informational)
# ===================================================================
echo ""
echo ""
echo "==========================================="
echo " Service Accessibility (informational)"
echo "==========================================="
echo ""

if command -v curl > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://pierre.brandiron.co.za 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        check "https://pierre.brandiron.co.za responds 200" "PASS"
    else
        info "https://pierre.brandiron.co.za returned $HTTP_CODE (may not be reachable from this host)"
    fi
else
    info "curl not available (skipping service accessibility checks)"
fi

# ===================================================================
# Summary
# ===================================================================
echo ""
echo ""
echo "==========================================="
echo " Summary"
echo "==========================================="
echo ""
echo -e "  ${GREEN}PASS:${NC} $PASS    ${RED}FAIL:${NC} $FAIL    ${YELLOW}WARN:${NC} $WARN"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}All checks passed.${NC}"
    exit 0
else
    echo -e "  ${RED}$FAIL check(s) failed.${NC}"
    exit 1
fi
