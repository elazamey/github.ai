# Gate Engine Reference

## Configuration schema

Use `GATES/gates.json` with this shape:

```json
{
  "version": 1,
  "gates": {
    "gate-0": {
      "name": "Control Center Foundation",
      "requires": ["structure", "evidence"]
    },
    "gate-1": {
      "name": "Architecture",
      "previous": "gate-0",
      "requires": ["architecture", "structure"]
    }
  }
}
```

Each required check may be a string in the configuration and an object in the results file:

```json
{
  "checks": {
    "structure": {"status": "PASS", "details": "..."},
    "tests": {"status": "NOT_RUN", "details": "..."}
  }
}
```

## Decision semantics

| Result | Meaning |
|---|---|
| `PASS` | Every required check is `PASS`, and the previous Gate is satisfied when configured |
| `BLOCK` | At least one required check is `FAIL`, `NOT_RUN`, `WAIVED`, or missing; or the previous Gate is not `PASS` |
| Operational error | Gate name, configuration, or JSON input is invalid |

Treat `WAIVED` as non-passing unless a deliberate project policy converts it to `PASS` with an accepted decision record. Never infer a successful build, test, security scan, or deployment from repository registration alone.

## Evidence contract

The decision report should contain the Gate identifier, Gate name, decision, full baseline SHA, branch, UTC timestamp, evaluated checks, and reasons. A Markdown summary may be generated for human review, but the JSON decision is the machine-readable source of truth.
