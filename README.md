# GitHub AI Archive

This public repository is the portable source archive for the Engineering Control Center ecosystem. It intentionally stores **source code, templates, documentation, and reusable skills only**. It does not contain environment files, database contents, personal tokens, generated build output, or runtime logs.

| Directory | Contents |
|---|---|
| `control-center-governance/` | The standalone GitHub governance repository: Gates, Evidence tooling, validation scripts, workflows, templates, and architecture documents. |
| `control-center-live/` | The full-stack Engineering Control Center Live application: client, server, database schema and migrations, API documentation, tests, and operational notes. |
| `control-center-cloudflare/` | Cloudflare migration package: Worker, D1 migration, deterministic Gate Engine, Static Assets source, Bridge template, and operating guide. |
| `skills/github-engineering-control-center/` | Reusable skill package for bootstrapping the Gate, Evidence, and governance workflow. |
| `integrations/calia-fashion-design/` | Safe GitHub Actions Bridge and setup guidance for Calia Fashion Design. |

## Secret policy

Configure deployment and integration values only through the target platform's secret manager. Never commit ingestion tokens, environment files, SSH keys, API keys, database URLs, or generated Evidence containing sensitive data.

## Restore notes

The Live application needs its managed database, OAuth configuration, and secrets supplied by its deployment environment. The Calia Fashion Bridge needs a published Control Center URL and a matching ingestion token configured as GitHub Actions secrets.
