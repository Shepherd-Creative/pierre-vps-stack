#!/bin/bash
# scripts/security/rkhunter-check.sh
# Rkhunter rootkit check wrapper with Prometheus .prom metric output
# Usage: rkhunter-check.sh
#   Runs rkhunter check in cron mode, reporting warnings only
#
# Operational copy: /opt/security-scripts/rkhunter-check.sh (root-owned)
# Scheduled via: /etc/cron.d/security-scans (as root)
set -euo pipefail

LOG_DIR="/var/log/security-scans"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/rkhunter-${DATE}.log"
PROM_FILE="${TEXTFILE_DIR}/rkhunter.prom"
SCAN_TYPE="weekly"

mkdir -p "${LOG_DIR}"

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

# Parse results from rkhunter log summary
# Format: "[HH:MM:SS] Files checked: 144" and "[HH:MM:SS] Possible rootkits: 0"
FILES_CHECKED=$(grep -i "Files checked:" "${LOG_FILE}" 2>/dev/null | awk '{print $NF}' || echo "0")
ROOTKITS_FOUND=$(grep -i "Possible rootkits:" "${LOG_FILE}" 2>/dev/null | awk '{print $NF}' || echo "0")

# Default to 0 if parsing returned empty
FILES_CHECKED="${FILES_CHECKED:-0}"
ROOTKITS_FOUND="${ROOTKITS_FOUND:-0}"

# SUCCESS based on actual rootkit findings, not exit code
# (rkhunter returns non-zero for benign warnings like replaced system scripts)
if [ "${ROOTKITS_FOUND}" -eq 0 ] 2>/dev/null; then
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
security_scan_threats_found_total{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${ROOTKITS_FOUND}
# HELP security_scan_duration_seconds Duration of last scan in seconds
# TYPE security_scan_duration_seconds gauge
security_scan_duration_seconds{tool="rkhunter",scan_type="${SCAN_TYPE}"} ${DURATION}
EOF

mv "${PROM_FILE}.$$" "${PROM_FILE}"

echo "Rkhunter check complete: exit_code=${EXIT_CODE} files=${FILES_CHECKED} rootkits=${ROOTKITS_FOUND} duration=${DURATION}s"
