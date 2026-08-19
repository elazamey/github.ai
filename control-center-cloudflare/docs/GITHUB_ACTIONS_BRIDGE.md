# Cloudflare GitHub Actions Bridge

Copy `.github/workflows/report-evidence.yml` to each source repository. Set these GitHub Actions secrets:

| Secret | Value |
|---|---|
| `CONTROL_CENTER_URL` | `https://engineering-control-center.canyoudfg.workers.dev` |
| `CONTROL_CENTER_INGEST_TOKEN` | The same private Worker secret configured as `INGEST_TOKEN` |

The template reports Gate 0 only. It reports `structure` and `evidence` because those are Gate 0 requirements. `evidence` is recorded as `PASS` only when the workflow actually posts the payload. `structure` remains `TODO` in the generic template because a reusable Bridge cannot truthfully claim that an arbitrary repository's structure has passed. Replace it only with a repository-specific deterministic command and its observed result.

The Worker requires `INGEST_TOKEN` for Evidence ingestion and returns `401` for a missing or incorrect token. Configure the secret in Cloudflare before placing the URL and token in a source repository.

## Workflow dispatch and SHA audit

The generic template supports both pushes to `main` and manual runs. A manual run accepts a `ref` input containing either a branch name or a literal commit SHA. Checkout uses that input, then `git rev-parse HEAD` resolves the exact revision that was inspected. The Evidence payload must use that resolved SHA rather than assuming `github.sha` is the checked-out revision.

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      ref:
        description: "Branch or commit SHA to inspect"
        required: false
        default: "main"
        type: string
```

Run it from **Actions → Report Evidence → Run workflow**, enter a branch or full commit SHA, and verify that D1 contains the same SHA and `workflow_run_id`.

## Calia Fashion verified state

The Calia Fashion workflow targets `/api/evidence` on the Cloudflare Worker and runs `scripts/check-structure.sh`, which deterministically checks the repository's documented files and Evidence contract. Commit `8f36ebc` produced `PASS` in Workflow Run [`32253246349`](https://github.com/elazamey/calia-fashion-design/actions/runs/32253246349). A manual run with a literal SHA `53e172ce13642ecea0890741237b73ee8ad9f851` was verified in Workflow Run [`32257547163`](https://github.com/elazamey/calia-fashion-design/actions/runs/32257547163); Cloudflare returned `accepted`, and D1 stored the matching SHA and `PASS` decision.

The repository secrets are `CONTROL_CENTER_URL` and `CONTROL_CENTER_INGEST_TOKEN`. Do not declare transport active from a successful Workflow alone; require a matching `workflow_run_id`, SHA, Evidence record, and Gate Engine decision in D1.
