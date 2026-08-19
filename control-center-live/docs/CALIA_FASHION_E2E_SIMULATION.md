# Calia Fashion Evidence Simulation

## GitHub Secrets required for a real Bridge run

Configure these repository secrets at `elazamey/calia-fashion-design` after publishing the Control Center.

| Secret | Required value |
|---|---|
| `CONTROL_CENTER_URL` | Published HTTPS URL of Engineering Control Center Live, without a trailing slash |
| `CONTROL_CENTER_INGEST_TOKEN` | Exact value of the Control Center Live ingestion token |

The current GitHub integration token can push code but cannot manage repository secrets; GitHub returned `403 Resource not accessible by integration` when secret configuration was attempted. Configure the two secrets from the repository settings or with a GitHub token that has Actions secrets administration permission.

An attempt to open the repository Actions secrets settings through the connected browser also timed out. The remaining action is therefore manual: open `https://github.com/elazamey/calia-fashion-design/settings/secrets/actions`, add the two secrets above, and rerun the `Report Gate 0 Evidence to Control Center` workflow.

## Positive simulation

Use a temporary SHA label and send Gate 0 requirements `structure` and `evidence` as `PASS`. Confirm a `202` response, one stored Evidence record, and `Gate 0 = PASS`. Then remove the temporary Evidence and restore the project and Gate state to `TODO`.

## Negative simulation

Repeat the same request using a deliberately invalid Bearer token. The expected result is `401 {"status":"unauthorized"}`. The number of Evidence rows and all project/Gate state must remain unchanged.

## Boundary

These simulations prove only API behavior. They do not constitute production Evidence and must not be used to mark Gate 0 as PASS. The real Bridge becomes eligible to submit Evidence only after the GitHub Secrets are configured and a genuine GitHub Actions run occurs.

## 2026-08-19 execution record

| Scenario | Result | State after test |
|---|---|---|
| Valid configured token with repository-based Gate 0 Evidence | `202` accepted; the API stored temporary Evidence and returned a `PASS` Gate Engine decision | Temporary Evidence was deleted and project/Gate 0 were restored to `TODO` with baseline `b72cd00` |
| Deliberately wrong Bearer token | `401` unauthorized | No Evidence or Gate state was created by the rejected request |

The positive request was a non-persistent API simulation and used a temporary `SIMULATION-calia-positive` SHA label. The post-cleanup status endpoint confirmed `projectStatus = TODO`, `currentGate = 0`, `gate0Status = TODO`, and no Gate 0 SHA. A dedicated API test also confirms that an invalid token returns `401` before repository lookup or Evidence persistence is invoked.
