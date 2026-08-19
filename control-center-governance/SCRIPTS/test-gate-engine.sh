#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat > "$TMP_DIR/pass.json" <<'EOF'
{
  "checks": {
    "structure": {"status": "PASS", "details": "ok"},
    "evidence": {"status": "PASS", "details": "ok"}
  }
}
EOF

python3 "$ROOT_DIR/SCRIPTS/gate-engine.py" \
  --gate gate-0 \
  --results "$TMP_DIR/pass.json" \
  --output "$TMP_DIR/pass-report.json" >/dev/null

grep -q '"decision": "PASS"' "$TMP_DIR/pass-report.json"

cat > "$TMP_DIR/block.json" <<'EOF'
{
  "checks": {
    "structure": {"status": "PASS", "details": "ok"},
    "evidence": {"status": "NOT_RUN", "details": "missing"}
  }
}
EOF

if python3 "$ROOT_DIR/SCRIPTS/gate-engine.py" \
  --gate gate-0 \
  --results "$TMP_DIR/block.json" \
  --output "$TMP_DIR/block-report.json" >/dev/null; then
  echo "FAIL: NOT_RUN result incorrectly passed."
  exit 1
fi

grep -q '"decision": "BLOCK"' "$TMP_DIR/block-report.json"
echo "PASS: Gate Engine PASS/BLOCK self-tests succeeded."
