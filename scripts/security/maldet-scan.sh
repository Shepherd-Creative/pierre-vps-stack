#!/bin/bash
# scripts/security/maldet-scan.sh
# Maldet (Linux Malware Detect) scan wrapper with detailed logging and Prometheus .prom metric output
# Usage: maldet-scan.sh
#   Scans /home/pierre_sudo_user/docker-apps for malware
set -euo pipefail

LOG_DIR="${HOME}/security-logs"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/maldet-${DATE}.log"
PROM_FILE="${TEXTFILE_DIR}/maldet.prom"
SCAN_TYPE="weekly"

mkdir -p "${LOG_DIR}"
# Note: Do NOT mkdir TEXTFILE_DIR here -- it's created during VPS setup with proper permissions

# Update maldet signatures and engine before scanning
maldet -d || true
maldet -u || true

START=$(date +%s)

# Run maldet scan, capture output for report ID extraction
# maldet exit code 0 = scan completed (regardless of findings)
set +e
SCAN_OUTPUT=$(nice -n 19 ionice -c3 maldet --scan-all /home/pierre_sudo_user/docker-apps 2>&1)
EXIT_CODE=$?
set -e

END=$(date +%s)
DURATION=$((END - START))

# Extract report ID from scan output (format: "SCAN ID: XXXXXX-XXXX.XXXXX")
REPORT_ID=$(echo "${SCAN_OUTPUT}" | grep -oP 'SCAN ID:\s+\K\S+' || echo "")

# Parse results: try to get report if we have an ID
FILES_SCANNED=0
THREATS_FOUND=0

if [ -n "${REPORT_ID}" ]; then
    # Get the full report
    REPORT_OUTPUT=$(maldet --report "${REPORT_ID}" 2>&1 || echo "")

    # Parse from report output
    FILES_SCANNED=$(echo "${REPORT_OUTPUT}" | grep "Total files scanned:" | awk '{print $NF}' || echo "0")
    THREATS_FOUND=$(echo "${REPORT_OUTPUT}" | grep "Total hits:" | awk '{print $NF}' || echo "0")

    # Append full report to log file for persistent logging
    {
        echo "=== Maldet Scan Report - ${DATE} ==="
        echo "Report ID: ${REPORT_ID}"
        echo ""
        echo "${REPORT_OUTPUT}"
    } >> "${LOG_FILE}"
else
    # No report ID found -- log raw output
    {
        echo "=== Maldet Scan - ${DATE} ==="
        echo "WARNING: Could not extract report ID from scan output"
        echo ""
        echo "${SCAN_OUTPUT}"
    } >> "${LOG_FILE}"
fi

# Default to 0 if parsing returned empty
FILES_SCANNED="${FILES_SCANNED:-0}"
THREATS_FOUND="${THREATS_FOUND:-0}"

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
