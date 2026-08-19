import { and, desc, eq } from "drizzle-orm";
import {
  evidence,
  gates,
  projects,
  roadmapPhases,
  technicalDecisions,
} from "../drizzle/schema";
import { evaluateGate, gateDefinitions, type GateCheck } from "./controlCenter";
import { getDb } from "./db";

export async function listProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getProject(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0];
}

export async function getProjectByRepository(repository: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.repository, repository)).limit(1);
  return result[0];
}

export async function createProject(input: {
  name: string;
  repository: string;
  defaultBranch: string;
  baseline?: string;
  verificationCommands: Record<string, string>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(projects).values({
    ...input,
    baseline: input.baseline || null,
    currentGate: 0,
    status: "TODO",
  });
  const projectId = Number(result[0].insertId);
  await db.insert(gates).values(
    gateDefinitions.map(gate => ({
      projectId,
      gateIndex: gate.index,
      requirements: gate.requirements,
      checks: [],
      reasons: [],
      status: "TODO" as const,
    }))
  );
  return getProject(projectId);
}

export async function getProjectGates(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gates).where(eq(gates.projectId, projectId)).orderBy(gates.gateIndex);
}

export async function getEvidence(projectId: number, gateIndex?: number) {
  const db = await getDb();
  if (!db) return [];
  const condition = gateIndex === undefined
    ? eq(evidence.projectId, projectId)
    : and(eq(evidence.projectId, projectId), eq(evidence.gateIndex, gateIndex));
  return db.select().from(evidence).where(condition).orderBy(desc(evidence.receivedAt));
}

export async function ingestEvidence(input: {
  projectId: number;
  gateIndex: number;
  sha: string;
  branch: string;
  workflowRunUrl?: string;
  workflowRunId?: string;
  checks: GateCheck[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const definition = gateDefinitions[input.gateIndex];
  if (!definition) throw new Error("Gate does not exist");
  const project = await getProject(input.projectId);
  if (!project) throw new Error("Project does not exist");

  const evaluation = evaluateGate(input.checks, definition.requirements);
  await db.insert(evidence).values({
    projectId: input.projectId,
    gateIndex: input.gateIndex,
    sha: input.sha,
    branch: input.branch,
    workflowRunUrl: input.workflowRunUrl || null,
    workflowRunId: input.workflowRunId || null,
    checks: input.checks,
    decision: evaluation.status,
  });

  const existing = await db
    .select()
    .from(gates)
    .where(and(eq(gates.projectId, input.projectId), eq(gates.gateIndex, input.gateIndex)))
    .limit(1);
  const gateValues = {
    baseline: project.baseline,
    sha: input.sha,
    requirements: definition.requirements,
    checks: evaluation.checks,
    reasons: evaluation.reasons,
    status: evaluation.status,
  };
  if (existing[0]) {
    await db.update(gates).set(gateValues).where(eq(gates.id, existing[0].id));
  } else {
    await db.insert(gates).values({ projectId: input.projectId, gateIndex: input.gateIndex, ...gateValues });
  }
  await db.update(projects).set({ currentGate: input.gateIndex, status: evaluation.status }).where(eq(projects.id, input.projectId));
  return evaluation;
}

export async function listTechnicalDecisions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(technicalDecisions).orderBy(desc(technicalDecisions.createdAt));
}

export async function createTechnicalDecision(input: {
  projectId?: number;
  gateIndex?: number;
  sha?: string;
  title: string;
  context: string;
  decision: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(technicalDecisions).values({
    ...input,
    projectId: input.projectId ?? null,
    gateIndex: input.gateIndex ?? null,
    sha: input.sha || null,
  });
}

export async function listRoadmap() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roadmapPhases).orderBy(roadmapPhases.position);
}

export async function createRoadmapPhase(input: {
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(roadmapPhases).values({ ...input, status: "TODO" });
}
