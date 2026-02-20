#!/bin/bash
# scripts/security/clamav-scan.sh
# ClamAV scan wrapper with detailed logging and Prometheus .prom metric output
# Usage: clamav-scan.sh [daily|weekly]
#   daily  - Narrow scan of /home/pierre_sudo_user/docker-apps (default)
#   weekly - Broad scan of /home + /var/lib/docker/volumes (excludes evidence overlay)
set -euo pipefail

SCAN_TYPE="${1:-daily}"
LOG_DIR="${HOME}/security-logs"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/clamav-${SCAN_TYPE}-${DATE}.log"
PROM_FILE="${TEXTFILE_DIR}/clamav.prom"

# UPDATE: Set this to the evidence image overlay ID found via:
#   docker inspect evidence-chonkie-visualizer:20260220 | grep UpperDir
# The evidence Docker image contains known malware remnants from Phase 1 forensics.
# Excluding it prevents false positives in weekly scans.
EVIDENCE_OVERLAY_ID="PLACEHOLDER_SET_DURING_VPS_SETUP"

mkdir -p "${LOG_DIR}"
# Note: Do NOT mkdir TEXTFILE_DIR here -- it's created during VPS setup with proper permissions

# Update virus signatures as safety net (freshclam daemon may already handle this)
freshclam || true

START=$(date +%s)

# ClamAV exit codes: 0=clean, 1=virus found (scan succeeded), 2=scan error
# We need set +e to capture the exit code without triggering pipefail
set +e
if [ "${SCAN_TYPE}" = "daily" ]; then
    # Narrow daily scan: just docker-apps directory (fast, ~5 min)
    nice -n 19 ionice -c3 clamscan \
        --recursive \
        --infected \
        --log="${LOG_FILE}" \
        /home/pierre_sudo_user/docker-apps
    EXIT_CODE=$?
elif [ "${SCAN_TYPE}" = "weekly" ]; then
    # Broad weekly scan: /home + Docker volumes
    # Exclude evidence Docker overlay (forensic image from Phase 1 -- already scanned in Phase 4)
    nice -n 19 ionice -c3 clamscan \
        --recursive \
        --infected \
        --log="${LOG_FILE}" \
        --exclude-dir="^/var/lib/docker/overlay2/${EVIDENCE_OVERLAY_ID}" \
        /home \
        /var/lib/docker/volumes
    EXIT_CODE=$?
else
    echo "ERROR: Unknown scan type '${SCAN_TYPE}'. Use 'daily' or 'weekly'." >&2
    exit 1
fi
set -e

END=$(date +%s)
DURATION=$((END - START))

# Parse scan results from ClamAV log file
FILES_SCANNED=$(grep "Scanned files:" "${LOG_FILE}" 2>/dev/null | awk '{print $NF}' || echo "0")
THREATS_FOUND=$(grep "Infected files:" "${LOG_FILE}" 2>/dev/null | awk '{print $NF}' || echo "0")

# Default to 0 if parsing returned empty
FILES_SCANNED="${FILES_SCANNED:-0}"
THREATS_FOUND="${THREATS_FOUND:-0}"

# SUCCESS=1 if exit code <= 1 (0=clean, 1=virus found but scan completed)
# SUCCESS=0 if exit code 2 (scan error)
if [ "${EXIT_CODE}" -le 1 ]; then
    SUCCESS=1
else
    SUCCESS=0
fi

# Write .prom metrics atomically (temp file + mv on same filesystem = atomic rename)
cat << EOF > "${PROM_FILE}.$$"
# HELP security_scan_success Whether the last scan completed successfully (1=pass, 0=fail)
# TYPE security_scan_success gauge
security_scan_success{tool="clamav",scan_type="${SCAN_TYPE}"} ${SUCCESS}
# HELP security_scan_timestamp_seconds Unix timestamp of last scan completion
# TYPE security_scan_timestamp_seconds gauge
security_scan_timestamp_seconds{tool="clamav",scan_type="${SCAN_TYPE}"} ${END}
# HELP security_scan_files_scanned_total Number of files scanned
# TYPE security_scan_files_scanned_total gauge
security_scan_files_scanned_total{tool="clamav",scan_type="${SCAN_TYPE}"} ${FILES_SCANNED}
# HELP security_scan_threats_found_total Number of threats/infections found
# TYPE security_scan_threats_found_total gauge
security_scan_threats_found_total{tool="clamav",scan_type="${SCAN_TYPE}"} ${THREATS_FOUND}
# HELP security_scan_duration_seconds Duration of last scan in seconds
# TYPE security_scan_duration_seconds gauge
security_scan_duration_seconds{tool="clamav",scan_type="${SCAN_TYPE}"} ${DURATION}
EOF

mv "${PROM_FILE}.$$" "${PROM_FILE}"

echo "ClamAV ${SCAN_TYPE} scan complete: exit_code=${EXIT_CODE} files=${FILES_SCANNED} threats=${THREATS_FOUND} duration=${DURATION}s"
