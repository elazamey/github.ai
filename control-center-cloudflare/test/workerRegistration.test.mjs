import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/worker.mjs';

class FakeD1 {
  constructor() {
    this.projects = [];
    this.gates = [];
  }

  prepare(sql) {
    return {
      bind: (...values) => ({
        first: async () => {
          if (sql.includes('FROM projects WHERE repository')) return this.projects.find(project => project.repository === values[0]) || null;
          return null;
        },
        run: async () => {
          if (sql.startsWith('INSERT INTO projects')) {
            const [name, repository, defaultBranch, baseline, now] = values;
            const id = this.projects.length + 1;
            this.projects.push({ id, name, repository, default_branch: defaultBranch, baseline, current_gate: 0, status: 'TODO', created_at: now, updated_at: now });
            return { meta: { last_row_id: id } };
          }
          if (sql.startsWith('INSERT INTO gates')) {
            const [projectId, gateIndex, baseline, requirementsJson, now] = values;
            this.gates.push({ project_id: projectId, gate_index: gateIndex, baseline, requirements_json: requirementsJson, status: 'TODO', updated_at: now });
            return { meta: { changes: 1 } };
          }
          throw new Error(`Unexpected query: ${sql}`);
        }
      })
    };
  }

  async batch(statements) {
    return Promise.all(statements.map(statement => statement.run()));
  }
}

test('project registration requires the ingestion token and creates all deterministic Gates', async () => {
  const db = new FakeD1();
  const body = { name: 'Registered Project', repository: 'owner/registered-project', defaultBranch: 'main', baseline: 'abc1234' };
  const unauthorized = await worker.fetch(new Request('https://example.test/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), { DB: db, INGEST_TOKEN: 'token' });
  assert.equal(unauthorized.status, 401);
  assert.equal(db.projects.length, 0);

  const authorized = await worker.fetch(new Request('https://example.test/api/projects', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer token' }, body: JSON.stringify(body) }), { DB: db, INGEST_TOKEN: 'token' });
  assert.equal(authorized.status, 201);
  assert.deepEqual(await authorized.json(), { status: 'registered', projectId: 1, gateCount: 9 });
  assert.equal(db.projects[0].status, 'TODO');
  assert.equal(db.gates.length, 9);
  assert.deepEqual(JSON.parse(db.gates[0].requirements_json), ['structure', 'evidence']);
  assert.deepEqual(JSON.parse(db.gates[8].requirements_json), ['tests', 'security', 'deployment', 'approval']);

  const duplicate = await worker.fetch(new Request('https://example.test/api/projects', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer token' }, body: JSON.stringify(body) }), { DB: db, INGEST_TOKEN: 'token' });
  assert.equal(duplicate.status, 409);
  assert.deepEqual(await duplicate.json(), { status: 'conflict', reason: 'Project is already registered', projectId: 1 });
  assert.equal(db.gates.length, 9);
});
