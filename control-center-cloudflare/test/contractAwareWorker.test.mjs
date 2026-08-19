import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.mjs";

function makeEnv() {
  const project = {
    id: 1,
    name: "Calia Fashion Design",
    repository: "elazamey/calia-fashion-design",
    default_branch: "main",
    baseline: "baseline-sha",
    current_gate: 0,
    status: "PASS"
  };
  const gate = {
    requirements_json: JSON.stringify(["structure", "evidence"]),
    baseline: "baseline-sha"
  };
  const DB = {
    prepare(sql) {
      return {
        bind() {
          return {
            first: async () => sql.startsWith("SELECT id, name") ? project : gate,
            run: async () => ({ meta: { last_row_id: 1 } })
          };
        }
      };
    },
    batch: async () => []
  };
  return { DB, INGEST_TOKEN: "test-token" };
}

function requestFor(body) {
  return new Request("https://example.workers.dev/api/evidence", {
    method: "POST",
    headers: {
      authorization: "Bearer test-token",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("contract-aware Worker includes contracts only when requested", async () => {
  const env = makeEnv();
  const response = await worker.fetch(requestFor({
    projectId: 1,
    gateIndex: 0,
    sha: "changed-contract-sha",
    branch: "main",
    requirements: ["structure", "evidence", "contracts"],
    checks: [
      { name: "structure", status: "PASS" },
      { name: "evidence", status: "PASS" },
      { name: "contracts", status: "PASS", detail: "workflow contract changed and passed" }
    ]
  }), env);
  const body = await response.json();
  assert.equal(response.status, 202);
  assert.deepEqual(body.requirements, ["structure", "evidence", "contracts"]);
  assert.equal(body.gateDecision.status, "PASS");
});

test("contract-aware Worker keeps the base requirements when no contract changed", async () => {
  const env = makeEnv();
  const response = await worker.fetch(requestFor({
    projectId: 1,
    gateIndex: 0,
    sha: "unchanged-contract-sha",
    branch: "main",
    checks: [
      { name: "structure", status: "PASS" },
      { name: "evidence", status: "PASS" }
    ]
  }), env);
  const body = await response.json();
  assert.equal(response.status, 202);
  assert.deepEqual(body.requirements, ["structure", "evidence"]);
  assert.equal(body.gateDecision.status, "PASS");
});

test("contract-aware Worker rejects a selection that drops a base requirement", async () => {
  const env = makeEnv();
  const response = await worker.fetch(requestFor({
    projectId: 1,
    gateIndex: 0,
    sha: "invalid-contract-selection-sha",
    branch: "main",
    requirements: ["structure", "contracts"],
    checks: [
      { name: "structure", status: "PASS" },
      { name: "contracts", status: "PASS" }
    ]
  }), env);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.match(body.reason, /base Gate requirements/);
});
