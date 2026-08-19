#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
status=0

for gate in {0..8}; do
  file="${ROOT_DIR}/GATES/gate-${gate}.md"
  if [[ ! -f "$file" ]]; then
    echo "FAIL: missing ${file}"
    status=1
    continue
  fi
  for required in STATUS BASELINE OWNER; do
    if ! grep -q "^${required} =" "$file"; then
      echo "FAIL: ${file} lacks ${required}"
      status=1
    fi
  done
done

if [[ "$status" -eq 0 ]]; then
  echo "PASS: Gates 0-8 are present and contain required metadata."
else
  echo "BLOCK: Gate structure validation failed."
fi
exit "$status"
