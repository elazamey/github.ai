#!/usr/bin/env python3
"""Evaluate a configured Gate from JSON check results."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PASS = "PASS"
BLOCK = "BLOCK"
VALID_STATUSES = {PASS, "FAIL", "NOT_RUN", "WAIVED"}


def load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as handle:
            value = json.load(handle)
    except FileNotFoundError as exc:
        raise ValueError(f"missing JSON file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON in {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"JSON root must be an object: {path}")
    return value


def git_value(root: Path, *args: str, fallback: str) -> str:
    try:
        completed = subprocess.run(
            ["git", "-C", str(root), *args],
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return fallback
    return completed.stdout.strip() or fallback


def evaluate(root: Path, config_path: Path, results_path: Path, gate: str) -> dict[str, Any]:
    config = load_json(config_path)
    results = load_json(results_path)
    gates = config.get("gates")
    if not isinstance(gates, dict) or gate not in gates:
        raise ValueError(f"unknown gate: {gate}")

    gate_config = gates[gate]
    required = gate_config.get("requires", [])
    if not isinstance(required, list) or not all(isinstance(item, str) for item in required):
        raise ValueError(f"gate requires must be a list of strings: {gate}")

    checks = results.get("checks", {})
    if not isinstance(checks, dict):
        raise ValueError("results.checks must be an object")

    evaluated: dict[str, dict[str, Any]] = {}
    reasons: list[str] = []
    for check_name in required:
        raw = checks.get(check_name)
        if isinstance(raw, str):
            status = raw
            details = ""
        elif isinstance(raw, dict):
            status = raw.get("status", "NOT_RUN")
            details = raw.get("details", "")
        else:
            status = "NOT_RUN"
            details = "No result was provided."
        if status not in VALID_STATUSES:
            status = "NOT_RUN"
            details = f"Invalid status supplied for {check_name}."
        evaluated[check_name] = {"status": status, "details": details}
        if status != PASS:
            reasons.append(f"{check_name}: {status} — {details or 'required check did not pass'}")

    previous = gate_config.get("previous")
    previous_decision = results.get("previous_gate_decision")
    if previous and previous_decision != PASS:
        reasons.append(f"previous gate {previous}: {previous_decision or 'NOT_RUN'}")

    decision = PASS if not reasons else BLOCK
    return {
        "engine_version": 1,
        "gate": gate,
        "gate_name": gate_config.get("name", gate),
        "decision": decision,
        "baseline": git_value(root, "rev-parse", "HEAD", fallback="UNCOMMITTED"),
        "branch": git_value(root, "branch", "--show-current", fallback="UNKNOWN"),
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "required_checks": evaluated,
        "reasons": reasons,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate a configured engineering Gate.")
    parser.add_argument("--gate", default="gate-0")
    parser.add_argument("--config", default="GATES/gates.json")
    parser.add_argument("--results", required=True)
    parser.add_argument("--output")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    try:
        report = evaluate(root, root / args.config, root / args.results, args.gate)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        output = root / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if report["decision"] == PASS else 1


if __name__ == "__main__":
    raise SystemExit(main())
