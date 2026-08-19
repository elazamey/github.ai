function evaluateGate(requirements, checks) {
  const checkByName = new Map(checks.map(check => [check.name, check]));
  const reasons = [];
  for (const requirement of requirements) {
    const check = checkByName.get(requirement);
    if (!check) reasons.push(`${requirement}: TODO`);
    else if (check.status !== "PASS") reasons.push(`${requirement}: ${check.status}`);
  }
  return { status: reasons.length === 0 ? "PASS" : "BLOCK", reasons, checks };
}

const requirementsByGate = {
  0: ["structure", "evidence"], 1: ["architecture", "scope"], 2: ["tests", "build"],
  3: ["tests", "typecheck", "security"], 4: ["contracts", "tests", "security"],
  5: ["ai-evaluation", "security", "scope"], 6: ["e2e", "build", "security"],
  7: ["build", "deployment", "workflow"], 8: ["tests", "security", "deployment", "approval"]
};
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const parseJson = async request => { try { return await request.json(); } catch { return null; } };
const isAuthorized = (request, env) => Boolean(env.INGEST_TOKEN) && request.headers.get("authorization") === `Bearer ${env.INGEST_TOKEN}`;
const projectById = (db, id) => db.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status FROM projects WHERE id = ?1").bind(id).first();
const projectByRepository = (db, repository) => db.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status FROM projects WHERE repository = ?1").bind(repository).first();

async function ingest(request, env) {
  if (!isAuthorized(request, env)) return json({ status: "unauthorized" }, 401);
  const body = await parseJson(request);
  if (!body || (!body.projectId && !body.repository) || !Number.isInteger(body.gateIndex) || body.gateIndex < 0 || body.gateIndex > 8 || !body.sha || !body.branch || !Array.isArray(body.checks)) return json({ status: "invalid" }, 400);
  const project = body.projectId ? await projectById(env.DB, body.projectId) : await projectByRepository(env.DB, body.repository);
  if (!project) return json({ status: "missing", reason: "Project is not registered" }, 404);
  const gate = await env.DB.prepare("SELECT requirements_json, baseline FROM gates WHERE project_id = ?1 AND gate_index = ?2").bind(project.id, body.gateIndex).first();
  const requirements = gate ? JSON.parse(gate.requirements_json) : requirementsByGate[body.gateIndex];
  const decision = evaluateGate(requirements, body.checks);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO evidence (project_id, gate_index, sha, branch, workflow_run_url, workflow_run_id, decision, checks_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)").bind(project.id, body.gateIndex, body.sha, body.branch, body.workflowRunUrl || null, body.workflowRunId || null, decision.status, JSON.stringify(body.checks), now),
    env.DB.prepare("INSERT INTO gates (project_id, gate_index, baseline, sha, status, requirements_json, checks_json, reasons_json, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) ON CONFLICT(project_id, gate_index) DO UPDATE SET sha=excluded.sha, status=excluded.status, checks_json=excluded.checks_json, reasons_json=excluded.reasons_json, updated_at=excluded.updated_at").bind(project.id, body.gateIndex, gate?.baseline || project.baseline || null, body.sha, decision.status, JSON.stringify(requirements), JSON.stringify(body.checks), JSON.stringify(decision.reasons), now),
    env.DB.prepare("UPDATE projects SET current_gate = ?1, status = ?2, updated_at = ?3 WHERE id = ?4").bind(body.gateIndex, decision.status, now, project.id)
  ]);
  return json({ status: "accepted", projectId: project.id, gateDecision: decision }, 202);
}

async function registerProject(request, env) {
  if (!isAuthorized(request, env)) return json({ status: "unauthorized" }, 401);
  const body = await parseJson(request);
  if (!body || typeof body.name !== "string" || !body.name.trim() || typeof body.repository !== "string" || !body.repository.trim()) return json({ status: "invalid", reason: "name and repository are required" }, 400);
  const existing = await projectByRepository(env.DB, body.repository.trim());
  if (existing) return json({ status: "conflict", reason: "Project is already registered", projectId: existing.id }, 409);
  const now = new Date().toISOString();
  const name = body.name.trim();
  const repository = body.repository.trim();
  const branch = typeof body.defaultBranch === "string" && body.defaultBranch.trim() ? body.defaultBranch.trim() : "main";
  const baseline = typeof body.baseline === "string" && body.baseline.trim() ? body.baseline.trim() : null;
  const inserted = await env.DB.prepare("INSERT INTO projects (name, repository, default_branch, baseline, current_gate, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 0, 'TODO', ?5, ?5)").bind(name, repository, branch, baseline, now).run();
  const projectId = inserted.meta.last_row_id;
  const gateStatements = Array.from({ length: 9 }, (_, gateIndex) => env.DB.prepare("INSERT INTO gates (project_id, gate_index, baseline, status, requirements_json, checks_json, reasons_json, updated_at) VALUES (?1, ?2, ?3, 'TODO', ?4, '[]', '[]', ?5)").bind(projectId, gateIndex, baseline, JSON.stringify(requirementsByGate[gateIndex]), now));
  await env.DB.batch(gateStatements);
  return json({ status: "registered", projectId, gateCount: 9 }, 201);
}

async function listProjects(env) {
  const result = await env.DB.prepare("SELECT id, name, repository, default_branch, baseline, current_gate, status, updated_at FROM projects ORDER BY updated_at DESC").all();
  return json({ projects: result.results });
}

const parseStoredJson = value => { try { return JSON.parse(value || "[]"); } catch { return []; } };
async function projectDetail(env, id) {
  const project = await projectById(env.DB, id);
  if (!project) return json({ status: "missing", reason: "Project is not registered" }, 404);
  const [gateResult, evidenceResult] = await Promise.all([
    env.DB.prepare("SELECT gate_index, baseline, sha, status, requirements_json, checks_json, reasons_json, updated_at FROM gates WHERE project_id = ?1 ORDER BY gate_index ASC").bind(id).all(),
    env.DB.prepare("SELECT id, gate_index, sha, branch, workflow_run_url, workflow_run_id, decision, checks_json, created_at FROM evidence WHERE project_id = ?1 ORDER BY created_at DESC, id DESC LIMIT 50").bind(id).all()
  ]);
  return json({
    project,
    gates: gateResult.results.map(gate => ({ ...gate, requirements: parseStoredJson(gate.requirements_json), checks: parseStoredJson(gate.checks_json), reasons: parseStoredJson(gate.reasons_json) })),
    evidence: evidenceResult.results.map(item => ({ ...item, checks: parseStoredJson(item.checks_json) }))
  });
}

const landing = `<!doctype html><meta charset="utf-8"><title>Engineering Control Center</title><style>body{font-family:Arial,sans-serif;margin:0;background:#fff;color:#050505}main{padding:36px;max-width:900px;border-top:4px solid #050505}h1{font-size:clamp(64px,16vw,150px);line-height:.78;letter-spacing:-.1em;margin:25px 0}p{font-weight:800}.tag{font-size:11px;letter-spacing:.18em}.red{color:#e10000}</style><main><p class="tag">ENGINEERING / CONTROL / CENTER</p><h1>GATE OPS<span class="red">.</span></h1><p>Cloudflare Worker and D1 migration endpoint.</p><p>Use <code>/api/health</code> and <code>/api/projects</code> to verify the runtime.</p></main>`;

export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/health") return json({ status: "ok", runtime: "cloudflare-worker", engine: "deterministic" });
  if (url.pathname === "/api/projects" && request.method === "GET") return listProjects(env);
  if (url.pathname === "/api/projects" && request.method === "POST") return registerProject(request, env);
  const projectMatch = url.pathname.match(/^\/api\/projects\/(\d+)$/);
  if (projectMatch && request.method === "GET") return projectDetail(env, Number(projectMatch[1]));
  if (url.pathname === "/api/evidence" && request.method === "POST") return ingest(request, env);
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response(landing, { headers: { "content-type": "text/html; charset=utf-8" } });
}};
