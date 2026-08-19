import type { Express, Request, Response } from "express";
import { z } from "zod";
import { gateDefinitions } from "./controlCenter";
import { getProject, getProjectByRepository, getProjectGates, ingestEvidence } from "./controlCenterDb";

const evidencePayload = z.object({
  projectId: z.number().int().positive().optional(),
  repository: z.string().min(3).optional(),
  gateIndex: z.number().int().min(0).max(8),
  sha: z.string().min(1),
  branch: z.string().min(1),
  workflowRunUrl: z.string().url().optional(),
  workflowRunId: z.string().optional(),
  checks: z.array(z.object({
    name: z.string().min(1),
    status: z.enum(["PASS", "BLOCK", "TODO"]),
    details: z.string().optional(),
  })),
}).refine(value => value.projectId !== undefined || value.repository !== undefined, {
  message: "projectId or repository is required",
});

function hasValidToken(req: Request) {
  const configuredToken = process.env.CONTROL_CENTER_INGEST_TOKEN;
  if (!configuredToken) return false;
  return req.header("authorization") === `Bearer ${configuredToken}`;
}

export function registerEvidenceApi(app: Express) {
  app.post("/api/v1/evidence", async (req: Request, res: Response) => {
    if (!process.env.CONTROL_CENTER_INGEST_TOKEN) {
      return res.status(503).json({ status: "unavailable", reason: "CONTROL_CENTER_INGEST_TOKEN is not configured" });
    }
    if (!hasValidToken(req)) {
      return res.status(401).json({ status: "unauthorized" });
    }
    const parsed = evidencePayload.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ status: "invalid", issues: parsed.error.flatten() });
    }
    try {
      const repositoryProject = parsed.data.projectId === undefined && parsed.data.repository
        ? await getProjectByRepository(parsed.data.repository)
        : undefined;
      const projectId = parsed.data.projectId ?? repositoryProject?.id;
      if (!projectId) {
        return res.status(404).json({ status: "missing", reason: "Project is not registered" });
      }
      const { repository: _repository, projectId: _projectId, ...evidenceInput } = parsed.data;
      const gateDecision = await ingestEvidence({ ...evidenceInput, projectId });
      return res.status(202).json({ status: "accepted", gateDecision });
    } catch (error) {
      return res.status(400).json({ status: "rejected", reason: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/v1/projects/:projectId/status", async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ status: "invalid", reason: "projectId must be a positive integer" });
    }
    const project = await getProject(projectId);
    if (!project) return res.status(404).json({ status: "missing" });
    const projectGates = await getProjectGates(projectId);
    return res.json({ project, gates: projectGates });
  });

  app.get("/api/v1/gates", (_req: Request, res: Response) => {
    return res.json({ gates: gateDefinitions });
  });
}
