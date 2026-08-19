CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  repository TEXT NOT NULL UNIQUE,
  default_branch TEXT NOT NULL,
  baseline TEXT,
  current_gate INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'TODO',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gates (
  project_id INTEGER NOT NULL,
  gate_index INTEGER NOT NULL,
  baseline TEXT,
  sha TEXT,
  status TEXT NOT NULL DEFAULT 'TODO',
  requirements_json TEXT NOT NULL,
  checks_json TEXT NOT NULL DEFAULT '[]',
  reasons_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (project_id, gate_index),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  gate_index INTEGER NOT NULL,
  sha TEXT NOT NULL,
  branch TEXT NOT NULL,
  workflow_run_url TEXT,
  workflow_run_id TEXT,
  decision TEXT NOT NULL,
  checks_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS evidence_project_gate_created ON evidence(project_id, gate_index, created_at DESC);
CREATE TABLE IF NOT EXISTS technical_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  gate_index INTEGER,
  sha TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
