# Evidence API

`POST /api/v1/evidence` receives Evidence from GitHub Actions. Every request must include `Authorization: Bearer <CONTROL_CENTER_INGEST_TOKEN>`.

| Field | Required | Meaning |
|---|---:|---|
| `projectId` | One of two identifiers | Registered numeric project identifier |
| `repository` | One of two identifiers | Registered GitHub repository in `owner/repository` form |
| `gateIndex` | Yes | Gate number from 0 to 8 |
| `sha` | Yes | Commit SHA evaluated by the workflow |
| `branch` | Yes | Branch evaluated by the workflow |
| `workflowRunUrl` | No | Workflow Run URL |
| `workflowRunId` | No | Workflow Run identifier |
| `checks` | Yes | Array of named check results with `PASS`, `BLOCK`, or `TODO` |

Provide either `projectId` or `repository`. The API records Evidence, evaluates the configured conditions for the Gate, and returns a Gate Engine decision. A missing required condition yields `BLOCK`; no successful state is inferred from an absent result.
