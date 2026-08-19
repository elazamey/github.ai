CREATE TABLE IF NOT EXISTS decision_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id TEXT NOT NULL UNIQUE,
  trace_id TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  gate_index INTEGER NOT NULL,
  sha TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  decision TEXT NOT NULL,
  requirements_json TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  check_count INTEGER NOT NULL,
  pass_count INTEGER NOT NULL,
  fail_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  policy_version TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS decision_logs_project_created
  ON decision_logs(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS block_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  gate_index INTEGER NOT NULL,
  sha TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  reason_json TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS block_alerts_project_created
  ON block_alerts(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_chain (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  sha TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  previous_hash TEXT,
  chain_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  UNIQUE (project_id, sequence)
);

CREATE INDEX IF NOT EXISTS audit_chain_project_sequence
  ON audit_chain(project_id, sequence ASC);

CREATE TRIGGER IF NOT EXISTS audit_chain_no_update
BEFORE UPDATE ON audit_chain
BEGIN
  SELECT RAISE(ABORT, 'audit_chain is append-only');
END;

CREATE TRIGGER IF NOT EXISTS audit_chain_no_delete
BEFORE DELETE ON audit_chain
BEGIN
  SELECT RAISE(ABORT, 'audit_chain is append-only');
END;

CREATE TRIGGER IF NOT EXISTS decision_logs_no_update
BEFORE UPDATE ON decision_logs
BEGIN
  SELECT RAISE(ABORT, 'decision_logs is immutable');
END;

CREATE TRIGGER IF NOT EXISTS decision_logs_no_delete
BEFORE DELETE ON decision_logs
BEGIN
  SELECT RAISE(ABORT, 'decision_logs is immutable');
END;
