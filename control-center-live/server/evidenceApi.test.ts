import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "http";
import { registerEvidenceApi } from "./evidenceApi";
import { getProjectByRepository, ingestEvidence } from "./controlCenterDb";

vi.mock("./controlCenterDb", () => ({
  getProject: vi.fn(),
  getProjectByRepository: vi.fn(),
  getProjectGates: vi.fn(),
  ingestEvidence: vi.fn(),
}));

describe("Evidence API token", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    registerEvidenceApi(app);
    server = await new Promise<Server>(resolve => {
      const started = app.listen(0, () => resolve(started));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  beforeEach(() => {
    vi.mocked(ingestEvidence).mockReset();
    vi.mocked(getProjectByRepository).mockReset();
  });

  it("accepts the configured token before project validation", async () => {
    const token = process.env.CONTROL_CENTER_INGEST_TOKEN;
    expect(token).toBeTruthy();
    vi.mocked(ingestEvidence).mockRejectedValue(new Error("Project does not exist"));
    const response = await fetch(`${baseUrl}/api/v1/evidence`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        projectId: 999999,
        gateIndex: 0,
        sha: "verification-sha",
        branch: "main",
        checks: [],
      }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ status: "rejected", reason: "Project does not exist" });
  });

  it("accepts valid Evidence and returns the Gate Engine decision", async () => {
    vi.mocked(ingestEvidence).mockResolvedValue({
      status: "PASS",
      reasons: [],
      checks: [{ name: "structure", status: "PASS" }, { name: "evidence", status: "PASS" }],
    });
    const token = process.env.CONTROL_CENTER_INGEST_TOKEN;
    const payload = {
      projectId: 7,
      gateIndex: 0,
      sha: "accepted-sha",
      branch: "main",
      workflowRunId: "12345",
      checks: [{ name: "structure", status: "PASS" as const }, { name: "evidence", status: "PASS" as const }],
    };
    const response = await fetch(`${baseUrl}/api/v1/evidence`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "accepted", gateDecision: { status: "PASS" } });
    expect(ingestEvidence).toHaveBeenCalledWith(payload);
  });

  it("resolves a registered repository before ingesting Evidence", async () => {
    vi.mocked(getProjectByRepository).mockResolvedValue({ id: 1 } as never);
    vi.mocked(ingestEvidence).mockResolvedValue({ status: "PASS", reasons: [], checks: [] });
    const token = process.env.CONTROL_CENTER_INGEST_TOKEN;
    const response = await fetch(`${baseUrl}/api/v1/evidence`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        repository: "elazamey/calia-fashion-design",
        gateIndex: 0,
        sha: "b72cd00",
        branch: "main",
        checks: [{ name: "structure", status: "PASS" }, { name: "evidence", status: "PASS" }],
      }),
    });
    expect(response.status).toBe(202);
    expect(getProjectByRepository).toHaveBeenCalledWith("elazamey/calia-fashion-design");
    expect(ingestEvidence).toHaveBeenCalledWith(expect.objectContaining({ projectId: 1, sha: "b72cd00" }));
  });

  it("rejects an invalid token before any Evidence lookup or persistence can occur", async () => {
    const response = await fetch(`${baseUrl}/api/v1/evidence`, {
      method: "POST",
      headers: { authorization: "Bearer deliberately-wrong-token", "content-type": "application/json" },
      body: JSON.stringify({
        repository: "elazamey/calia-fashion-design",
        gateIndex: 0,
        sha: "SIMULATION-calia-negative",
        branch: "main",
        checks: [],
      }),
    });
    expect(response.status).toBe(401);
    expect(getProjectByRepository).not.toHaveBeenCalled();
    expect(ingestEvidence).not.toHaveBeenCalled();
  });
});
