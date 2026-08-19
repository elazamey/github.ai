#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

check_file() {
  local path="$1"
  if [[ -f "${ROOT_DIR}/${path}" ]]; then
    echo "PASS: ${path}"
  else
    echo "FAIL: missing ${path}"
    FAILED=1
  fi
}

for required in \
  README.md \
  ARCHITECTURE.md \
  GOVERNANCE.md \
  PROJECT_STATUS.md \
  ROADMAP.md \
  GATES/gates.json \
  PROJECTS/README.md \
  PROJECTS/calia-fashion-design.md \
  PROJECTS/projects.json \
  .github/workflows/control-center.yml \
  .github/branch-protection/main-policy.json; do
  check_file "$required"
done

for json_file in "${ROOT_DIR}/GATES/gates.json" "${ROOT_DIR}/PROJECTS/projects.json" "${ROOT_DIR}/.github/branch-protection/main-policy.json"; do
  if ! python3 -m json.tool "$json_file" >/dev/null; then
    echo "FAIL: invalid JSON ${json_file}"
    FAILED=1
  else
    echo "PASS: valid JSON ${json_file}"
  fi
done

for script in "${ROOT_DIR}"/SCRIPTS/*.sh; do
  if ! bash -n "$script"; then
    echo "FAIL: shell syntax ${script}"
    FAILED=1
  fi
done

echo "PASS: shell syntax checks completed."

if ! python3 -m py_compile "${ROOT_DIR}/SCRIPTS/gate-engine.py"; then
  echo "FAIL: Python syntax SCRIPTS/gate-engine.py"
  FAILED=1
else
  echo "PASS: Python syntax SCRIPTS/gate-engine.py"
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo "PASS: Control center validation completed."
else
  echo "BLOCK: Control center validation failed."
fi
exit "$FAILED"
