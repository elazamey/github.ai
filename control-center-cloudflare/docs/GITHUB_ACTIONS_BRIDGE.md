# Cloudflare GitHub Actions Bridge

Copy `.github/workflows/report-evidence.yml` to each source repository. Set these GitHub Actions secrets:

| Secret | Value |
|---|---|
| `CONTROL_CENTER_URL` | `https://engineering-control-center.canyoudfg.workers.dev` |
| `CONTROL_CENTER_INGEST_TOKEN` | The same private Worker secret configured as `INGEST_TOKEN` |

The template reports Gate 0 only. It reports `structure` and `evidence` because those are Gate 0 requirements. `evidence` is recorded as `PASS` only when the workflow actually posts the payload. `structure` remains `TODO` in the provided template because a generic Bridge cannot truthfully claim that a repository's structure has passed. Replace it only with a repository-specific deterministic command and its observed result.

The Worker requires `INGEST_TOKEN` for Evidence ingestion and returns `401` for a missing or incorrect token. Configure the secret in Cloudflare before placing the URL and token in a source repository.

## Calia Fashion activation state

The Calia Fashion workflow now targets `/api/evidence` on the Cloudflare Worker and contains no unsupported `structure: PASS` assertion. GitHub Actions run [`32230786766`](https://github.com/elazamey/calia-fashion-design/actions/runs/32230786766) completed successfully but skipped the submission step because `CONTROL_CENTER_URL` and `CONTROL_CENTER_INGEST_TOKEN` were both empty. The GitHub token available to this session cannot list or set repository secrets (`403: Resource not accessible by integration`).

To activate the real Bridge, a repository administrator must enter the two values in **Settings → Secrets and variables → Actions**, then push a non-empty commit to `main`. After the run, inspect `GET /api/projects/1` and require a matching `workflow_run_id`, SHA, and Gate Engine decision before declaring the transport active.
