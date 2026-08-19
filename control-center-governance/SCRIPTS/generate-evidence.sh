#!/usr/bin/env bash
set -euo pipefail

GATE="gate-0"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gate)
      GATE="${2:?قيمة --gate مطلوبة}"
      shift 2
      ;;
    *)
      echo "الاستخدام: $0 [--gate gate-0]" >&2
      exit 2
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/EVIDENCE/${GATE}"
mkdir -p "$OUTPUT_DIR"

SHA="$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || echo 'UNCOMMITTED')"
BRANCH="$(git -C "$ROOT_DIR" branch --show-current 2>/dev/null || echo 'UNKNOWN')"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CHECKS_FILE="${OUTPUT_DIR}/checks.json"
REPORT_FILE="${OUTPUT_DIR}/gate-decision.json"
MARKDOWN_FILE="${OUTPUT_DIR}/verification-$(date -u +%Y-%m-%d).md"

set +e
VALIDATION_OUTPUT="$(${ROOT_DIR}/SCRIPTS/validate-gates.sh 2>&1)"
VALIDATION_EXIT=$?
set -e

if [[ "$VALIDATION_EXIT" -eq 0 ]]; then
  STRUCTURE_STATUS="PASS"
  STRUCTURE_DETAILS="Gate files 0-8 and required metadata are present."
else
  STRUCTURE_STATUS="FAIL"
  STRUCTURE_DETAILS="Gate structure validation failed; inspect validator output."
fi

cat > "$CHECKS_FILE" <<EOF
{
  "checks": {
    "structure": {
      "status": "${STRUCTURE_STATUS}",
      "details": "${STRUCTURE_DETAILS}"
    },
    "evidence": {
      "status": "PASS",
      "details": "Evidence context was collected by this script."
    },
    "tests": {"status": "NOT_RUN", "details": "No project test command configured."},
    "build": {"status": "NOT_RUN", "details": "No project build command configured."},
    "security": {"status": "NOT_RUN", "details": "No project security command configured."},
    "architecture": {"status": "NOT_RUN", "details": "No project architecture command configured."},
    "scope": {"status": "NOT_RUN", "details": "No project scope check configured."},
    "deployment": {"status": "NOT_RUN", "details": "No deployment configured."}
  }
}
EOF

set +e
python3 "${ROOT_DIR}/SCRIPTS/gate-engine.py" \
  --gate "$GATE" \
  --results "EVIDENCE/${GATE}/checks.json" \
  --output "EVIDENCE/${GATE}/gate-decision.json" \
  > /tmp/gate-engine-output.json
ENGINE_EXIT=$?
set -e
cat /tmp/gate-engine-output.json

DECISION="BLOCK"
if grep -q '"decision": "PASS"' "$REPORT_FILE"; then
  DECISION="PASS"
fi

cat > "$MARKDOWN_FILE" <<EOF
# Verification Evidence

| الحقل | القيمة |
|---|---|
| Gate | ${GATE} |
| Decision | ${DECISION} |
| SHA | ${SHA} |
| Branch | ${BRANCH} |
| Timestamp UTC | ${TIMESTAMP} |
| Structure | ${STRUCTURE_STATUS} |
| Tests | NOT_RUN |
| Build | NOT_RUN |
| Security | NOT_RUN |
| Deployment URL | NOT_SET |
| Workflow Run | ${GITHUB_RUN_ID:-NOT_SET} |

## ملاحظات

تم تقييم القرار بواسطة Gate Engine. لا تُعتبر الفحوصات غير المهيأة ناجحة تلقائيًا، ولذلك ستؤدي إلى BLOCK في Gates التي تتطلبها.

التقرير الآلي الكامل موجود في \`gate-decision.json\`، ونتائج الفحوصات الخام في \`checks.json\`.
EOF

if [[ "$ENGINE_EXIT" -ne 0 ]]; then
  echo "Gate decision: ${DECISION}" >&2
  exit "$ENGINE_EXIT"
fi

echo "Evidence and Gate decision written to ${OUTPUT_DIR}"
