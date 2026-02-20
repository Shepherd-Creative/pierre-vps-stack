#!/bin/bash
# scripts/security/rkhunter-check.sh
# Rkhunter rootkit check wrapper with detailed logging and Prometheus .prom metric output
# Usage: rkhunter-check.sh
#   Runs rkhunter check in cron mode, reporting warnings only
set -euo pipefail

LOG_DIR="${HOME}/security-logs"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/rkhunter-${DATE}.log"
PROM_FILE="${TEXTFILE_DIR}/rkhunter.prom"
SCAN_TYPE="weekly"

mkdir -p "${LOG_DIR}"
# Note: Do NOT mkdir TEXTFILE_DIR here -- it's created during VPS setup with proper permissions

# Update rkhunter signatures before check
rkhunter --update || true

START=$(date +%s)

# Run rkhunter check in cron mode (non-interactive, warnings only)
# Exit code 0 = clean, non-zero = warnings or errors
set +e
nice -n 19 ionice -c3 rkhunter \
    --check \
    --cronjob \
    --report-warnings-only \
    --logfile "${LOG_FILE}"
EXIT_CODE=$?
set -e

END=$(date +%s)
DURATION=$((END - START))

# Parse results from rkhunter log file
# Look for "warnings found" line for threat count
WARNINGS_FOUND=$(grep -i "warnings found" "${LOG_FILE}" 2>/dev/null | awk '{print $1}' || echo "0")
# Look for "files checked" line for file count
FILES_CHECKED=$(grep -i "files checked" "${LOG_FILE}" 2>/dev/null | awk '{print $1}' || echo "0")

# Default to 0 if parsing returned empty
WARNINGS_FOUND="${WARNINGS_FOUND:-0}"
FILES_CHECKED="${FILES_CHECKED:-0}"

# SUCCESS=1 if exit code 0 (clean), SUCCESS=0 if non-zero (warnings or error)
if [ "${EXIT_CODE}" -eq 0 ]; then
    SUCCESS=1
else
    SUCCESS=0
fi

# Write .prom metrics atomically (temp file + mv on same filesystem = atomic rename)
cat << EOF > "${PROM_FILE}.$$"
# HELP security_scan_success Whether the last scan completed successfully (1=pass, 0=fail)
# TYPE security_scan_success gauge
security_scan_success{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${SUCCESS}
# HELP security_scan_timestamp_seconds Unix timestamp of last scan completion
# TYPE security_scan_timestamp_seconds gauge
security_scan_timestamp_seconds{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${END}
# HELP security_scan_files_scanned_total Number of files scanned
# TYPE security_scan_files_scanned_total gauge
security_scan_files_scanned_total{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${FILES_CHECKED}
# HELP security_scan_threats_found_total Number of threats/infections found
# TYPE security_scan_threats_found_total gauge
security_scan_threats_found_total{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${WARNINGS_FOUND}
# HELP security_scan_duration_seconds Duration of last scan in seconds
# TYPE security_scan_duration_seconds gauge
security_scan_duration_seconds{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${DURATION}
EOF

mv "${PROM_FILE}.$$" "${PROM_FILE}"

echo "Rkhunter check complete: exit_code=${EXIT_CODE} files=${FILES_CHECKED} warnings=${WARNINGS_FOUND} duration=${DURATION}s"
