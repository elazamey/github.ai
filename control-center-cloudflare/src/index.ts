import { evaluateGate } from "./gateEngine.js";

type CheckStatus = "PASS" | "BLOCK" | "TODO";
type GateCheck = { name: string; status: CheckStatus; details?: string };

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  INGEST_TOKEN: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const defaultRequirements: Record<number, string[]> = {
  0: ["structure", "evidence"],
  1: ["architecture", "scope"],
  2: ["tests", "build"],
  3: ["tests", "typecheck", "security"],
  4: ["contracts", "tests", "security"],
  5: ["ai-evaluation", "security", "scope"],
  6: ["e2e", "build", "security"],
  7: ["build", "deployment", "workflow"],
  8: ["tests", "security", "deployment", "approval"]
};

function authorizationIsValid(request: Request, env: Env) {
  const value = request.headers.get("authorization");
  return Boolean(env.INGEST_TOKEN) && value === `Bearer ${env.INGEST_TOKEN}`;
}

async function parseJson<T>(request: Request): Promise<T | null> {
  try { return await request.json<T>(); } catch { return null; }
}

async function projectByRepository(db: D1Database, repository: string) {
  return db.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status FROM projects WHERE repository = ?1")
    .bind(repository).first();
}

async function projectById(db: D1Database, id: number) {
  return db.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status FROM projects WHERE id = ?1")
    .bind(id).first();
}

async function statusForProject(db: D1Database, id: number) {
  const [project, gates, evidence] = await Promise.all([
    projectById(db, id),
    db.prepare("SELECT gate_index, baseline, sha, status, requirements_json, checks_json, reasons_json, updated_at FROM gates WHERE project_id = ?1 ORDER BY gate_index").bind(id).all(),
    db.prepare("SELECT gate_index, sha, branch, workflow_run_url, workflow_run_id, decision, checks_json, created_at FROM evidence WHERE project_id = ?1 ORDER BY id DESC LIMIT 50").bind(id).all()
  ]);
  return { project, gates: gates.results, evidence: evidence.results };
}

async function ingestEvidence(request: Request, env: Env) {
  if (!authorizationIsValid(request, env)) return json({ status: "unauthorized" }, 401);
  const body = await parseJson<{ projectId?: number; repository?: string; gateIndex?: number; sha?: string; branch?: string; workflowRunUrl?: string; workflowRunId?: string; checks?: GateCheck[] }>(request);
  if (!body || (!body.projectId && !body.repository) || !Number.isInteger(body.gateIndex) || body.gateIndex! < 0 || body.gateIndex! > 8 || !body.sha || !body.branch || !Array.isArray(body.checks)) {
    return json({ status: "invalid", reason: "projectId or repository, gateIndex 0-8, sha, branch, and checks are required" }, 400);
  }
  const project = body.projectId ? await projectById(env.DB, body.projectId) : await projectByRepository(env.DB, body.repository!);
  if (!project) return json({ status: "missing", reason: "Project is not registered" }, 404);
  const gateIndex = body.gateIndex!;
  const existingGate = await env.DB.prepare("SELECT requirements_json, baseline FROM gates WHERE project_id = ?1 AND gate_index = ?2").bind(project.id, gateIndex).first<{ requirements_json: string; baseline: string | null }>();
  const requirements = existingGate ? JSON.parse(existingGate.requirements_json) : defaultRequirements[gateIndex];
  const decision = evaluateGate(requirements, body.checks);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO evidence (project_id, gate_index, sha, branch, workflow_run_url, workflow_run_id, decision, checks_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
      .bind(project.id, gateIndex, body.sha, body.branch, body.workflowRunUrl || null, body.workflowRunId || null, decision.status, JSON.stringify(body.checks), now),
    env.DB.prepare("INSERT INTO gates (project_id, gate_index, baseline, sha, status, requirements_json, checks_json, reasons_json, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ON CONFLICT(project_id, gate_index) DO UPDATE SET sha=excluded.sha, status=excluded.status, checks_json=excluded.checks_json, reasons_json=excluded.reasons_json, updated_at=excluded.updated_at")
      .bind(project.id, gateIndex, existingGate?.baseline || project.baseline || null, body.sha, decision.status, JSON.stringify(requirements), JSON.stringify(body.checks), JSON.stringify(decision.reasons), now),
    env.DB.prepare("UPDATE projects SET current_gate = ?1, status = ?2, updated_at = ?3 WHERE id = ?4")
      .bind(gateIndex, decision.status, now, project.id)
  ]);
  return json({ status: "accepted", projectId: project.id, gateDecision: decision }, 202);
}

async function registerProject(request: Request, env: Env) {
  const body = await parseJson<{ name?: string; repository?: string; defaultBranch?: string; baseline?: string }>(request);
  if (!body?.name || !body.repository || !body.defaultBranch) return json({ status: "invalid", reason: "name, repository, and defaultBranch are required" }, 400);
  const now = new Date().toISOString();
  const inserted = await env.DB.prepare("INSERT INTO projects (name, repository, default_branch, baseline, current_gate, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 0, 'TODO', ?5, ?5)")
    .bind(body.name, body.repository, body.defaultBranch, body.baseline || null, now).run();
  const projectId = Number(inserted.meta.last_row_id);
  await env.DB.batch(Object.entries(defaultRequirements).map(([index, requirements]) => env.DB.prepare("INSERT INTO gates (project_id, gate_index, baseline, sha, status, requirements_json, checks_json, reasons_json, updated_at) VALUES (?1, ?2, ?3, NULL, 'TODO', ?4, '[]', '[]', ?5)")
    .bind(projectId, Number(index), body.baseline || null, JSON.stringify(requirements), now)));
  return json({ status: "created", projectId }, 201);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ status: "ok", service: "engineering-control-center" });
    if (url.pathname === "/api/evidence" && request.method === "POST") return ingestEvidence(request, env);
    if (url.pathname === "/api/projects" && request.method === "GET") {
      const result = await env.DB.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status, updated_at FROM projects ORDER BY updated_at DESC").all();
      return json({ projects: result.results });
    }
    if (url.pathname === "/api/projects" && request.method === "POST") return registerProject(request, env);
    const projectMatch = url.pathname.match(/^\/api\/projects\/(\d+)$/);
    if (projectMatch && request.method === "GET") {
      const status = await statusForProject(env.DB, Number(projectMatch[1]));
      return status.project ? json(status) : json({ status: "missing" }, 404);
    }
    return env.ASSETS.fetch(request);
  }
};
