# Cloudflare Migration Package

This package moves the Engineering Control Center runtime to one Worker deployment with D1 and Static Assets. Gate Engine decisions remain deterministic: only required Evidence checks marked `PASS` produce a `PASS` decision. AI analysis is deliberately outside this package and cannot set Gate status.

## Provisioned migration resources

| Resource | Value |
|---|---|
| Worker URL | `https://engineering-control-center.canyoudfg.workers.dev` |
| D1 database | `engineering-control-center` |
| D1 database ID | `3a8313bd-bf2a-4d6b-882e-0c1ba2115f47` |
| Current migrated project | `elazamey/calia-fashion-design`, baseline `b72cd00`, latest verified Gate 0 = `PASS` on SHA `8f36ebc6e9a5ac5e73a1acd4f983bf8a432c6647` |

The deployed Worker serves the Static Assets dashboard and D1-backed runtime. The dashboard reads the project registry, Gate history, Evidence history, SHA, baseline, and workflow links directly from the Worker API. Gate Engine decisions remain deterministic and never use AI to decide a Gate.

## Prepare

1. Create or select a D1 database named `engineering-control-center` and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with its UUID.
2. Install dependencies with `npm install` or `pnpm install`.
3. Apply migrations with `npx wrangler d1 migrations apply engineering-control-center --remote`.
4. Set the Worker secret with `npx wrangler secret put INGEST_TOKEN`.
5. Deploy the Worker and Static Assets with `npx wrangler deploy`.

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Runtime health result |
| `/api/projects` | GET | Project registry for dashboard |
| `/api/projects` | POST | Authenticated project registration; creates deterministic Gates 0–8 as `TODO` |
| `/api/projects/:id` | GET | Project, Gate, and Evidence history |
| `/api/evidence` | POST | Ingest authenticated GitHub Actions Evidence |

`POST /api/projects` and `POST /api/evidence` require `Authorization: Bearer <INGEST_TOKEN>`. Registering a repository that already exists returns `409` without overwriting project state or Evidence. The registration endpoint initializes all Gates with the requirements declared in `src/worker.mjs`; it never fabricates a SHA, check, or PASS result.

## Verified deployment evidence

| Check | Result |
|---|---|
| Worker health | `200`, runtime reports `cloudflare-worker` and `deterministic` |
| Static dashboard | Served from the Worker with project list, Gate matrix, Evidence log, SHA, baseline, and workflow link surface |
| Project detail | `GET /api/projects/1` returns Calia Fashion project, Gates 0–8, and stored Evidence |
| Evidence authorization | Valid token accepted with `202`; a wrong token rejected with `401` |
| Registration protection | Missing token rejected with `401`; duplicate Calia repository rejected with `409` |
| Real registration | `POST /api/projects` registered `elazamey/github.ai` as project `2` at baseline `1bf41647b4789ff7a0bc79ee818fb03bd8e2357a`; `GET /api/projects/2` returned Gates 0–8 initialized as `TODO` |
| Deterministic tests | Three Node tests pass: Gate PASS rule, Gate BLOCK rule, and authenticated project/Gate creation |
| Calia Structure Gate | Workflow Run `32253246349` submitted real Evidence for SHA `8f36ebc6e9a5ac5e73a1acd4f983bf8a432c6647`; required files and documented contracts passed deterministically; D1 decision = `PASS` |

> The earlier Calia Fashion workflow run `32230786766` was the last pre-Structure baseline and submitted Evidence with `structure: TODO`, producing deterministic `BLOCK`. The subsequent Workflow Run `32253246349` submitted fresh Structure Evidence from SHA `8f36ebc6e9a5ac5e73a1acd4f983bf8a432c6647` and produced deterministic `PASS`.

## GitHub Actions

Set `CONTROL_CENTER_URL` to the deployed Worker URL and `CONTROL_CENTER_INGEST_TOKEN` to the same value as `INGEST_TOKEN`. The Calia Bridge now runs `scripts/check-structure.sh`, which deterministically checks `README.md`, `CONTROL_CENTER_INTEGRATION.md`, and `.github/workflows/control-center.yml`, including the documented registration contract and Evidence endpoint. It reports auditable `PASS` or `FAIL` details; it does not use a placeholder `TODO` result.
