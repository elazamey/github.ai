# Control Center Integration

This repository is registered in Engineering Control Center Live as `elazamey/calia-fashion-design` at baseline `b72cd00`.

The GitHub Actions bridge reports **Gate 0** only. The repository currently contains no package manifest or project source, so it does not report tests, build, typecheck, coverage, or security outcomes. Those checks must be added only after real project commands exist.

## Required GitHub Secrets

| Secret | Value |
|---|---|
| `CONTROL_CENTER_URL` | Published Engineering Control Center Live URL |
| `CONTROL_CENTER_INGEST_TOKEN` | The matching Control Center Live Evidence ingestion token |

After both secrets are set, push to `main` to send Gate 0 Evidence. The Evidence submission step is skipped safely while either secret is absent.
