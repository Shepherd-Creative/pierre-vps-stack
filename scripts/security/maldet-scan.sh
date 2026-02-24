#!/bin/bash
# scripts/security/maldet-scan.sh
# Maldet (Linux Malware Detect) scan wrapper with Prometheus .prom metric output
# Usage: maldet-scan.sh
#   Scans /home/pierre_sudo_user/docker-apps for malware
#
# Operational copy: /opt/security-scripts/maldet-scan.sh (root-owned)
# Scheduled via: /etc/cron.d/security-scans (as root)
set -euo pipefail

LOG_DIR="/var/log/security-scans"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/maldet-${DATE}.log"
PROM_FILE="${TEXTFILE_DIR}/maldet.prom"
SCAN_TYPE="weekly"

mkdir -p "${LOG_DIR}"

# Update maldet signatures and engine before scanning
maldet -d || true
maldet -u || true

START=$(date +%s)

# Run maldet scan, capture output for result extraction
# maldet exit code 0 = scan completed (regardless of findings)
set +e
SCAN_OUTPUT=$(nice -n 19 ionice -c3 maldet --scan-all /home/pierre_sudo_user/docker-apps 2>&1)
EXIT_CODE=$?
set -e

END=$(date +%s)
DURATION=$((END - START))

# Parse results directly from scan output
# Format: "{scan} scan completed on ...: files 356, malware hits 0, cleaned hits 0, time 14s"
FILES_SCANNED=$(echo "${SCAN_OUTPUT}" | sed -n 's/.*scan completed.*files \([0-9]*\),.*/\1/p' | tail -1)
THREATS_FOUND=$(echo "${SCAN_OUTPUT}" | sed -n 's/.*malware hits \([0-9]*\),.*/\1/p' | tail -1)

# Default to 0 if parsing returned empty
FILES_SCANNED="${FILES_SCANNED:-0}"
THREATS_FOUND="${THREATS_FOUND:-0}"

# Log the scan output
{
    echo "=== Maldet Scan - ${DATE} ==="
    echo "${SCAN_OUTPUT}"
} >> "${LOG_FILE}"

# SUCCESS=1 if scan completed (exit 0), SUCCESS=0 otherwise
if [ "${EXIT_CODE}" -eq 0 ]; then
    SUCCESS=1
else
    SUCCESS=0
fi

# Write .prom metrics atomically (temp file + mv on same filesystem = atomic rename)
cat << EOF > "${PROM_FILE}.$$"
# HELP security_scan_success Whether the last scan completed successfully (1=pass, 0=fail)
# TYPE security_scan_success gauge
security_scan_success{tool="maldet",scan_type="${SCAN_TYPE}"} ${SUCCESS}
# HELP security_scan_timestamp_seconds Unix timestamp of last scan completion
# TYPE security_scan_timestamp_seconds gauge
security_scan_timestamp_seconds{tool="maldet",scan_type="${SCAN_TYPE}"} ${END}
# HELP security_scan_files_scanned_total Number of files scanned
# TYPE security_scan_files_scanned_total gauge
security_scan_files_scanned_total{tool="maldet",scan_type="${SCAN_TYPE}"} ${FILES_SCANNED}
# HELP security_scan_threats_found_total Number of threats/infections found
# TYPE security_scan_threats_found_total gauge
security_scan_threats_found_total{tool="maldet",scan_type="${SCAN_TYPE}"} ${THREATS_FOUND}
# HELP security_scan_duration_seconds Duration of last scan in seconds
# TYPE security_scan_duration_seconds gauge
security_scan_duration_seconds{tool="maldet",scan_type="${SCAN_TYPE}"} ${DURATION}
EOF

mv "${PROM_FILE}.$$" "${PROM_FILE}"

echo "Maldet scan complete: exit_code=${EXIT_CODE} files=${FILES_SCANNED} threats=${THREATS_FOUND} duration=${DURATION}s"
