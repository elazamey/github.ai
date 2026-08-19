import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createProject,
  createRoadmapPhase,
  createTechnicalDecision,
  getEvidence,
  getProject,
  getProjectGates,
  ingestEvidence,
  listProjects,
  listRoadmap,
  listTechnicalDecisions,
} from "./controlCenterDb";
import { gateDefinitions } from "./controlCenter";

const statusSchema = z.enum(["PASS", "BLOCK", "TODO"]);
const checkSchema = z.object({
  name: z.string().min(1),
  status: statusSchema,
  details: z.string().optional(),
});

const evidenceInput = z.object({
  projectId: z.number().int().positive(),
  gateIndex: z.number().int().min(0).max(8),
  sha: z.string().min(1),
  branch: z.string().min(1),
  workflowRunUrl: z.string().url().optional(),
  workflowRunId: z.string().optional(),
  checks: z.array(checkSchema),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  controlCenter: router({
    projects: publicProcedure.query(() => listProjects()),
    project: publicProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ input }) => getProject(input.projectId)),
    projectGates: publicProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ input }) => getProjectGates(input.projectId)),
    evidence: publicProcedure.input(z.object({ projectId: z.number().int().positive(), gateIndex: z.number().int().min(0).max(8).optional() })).query(({ input }) => getEvidence(input.projectId, input.gateIndex)),
    gateDefinitions: publicProcedure.query(() => gateDefinitions),
    decisions: publicProcedure.query(() => listTechnicalDecisions()),
    roadmap: publicProcedure.query(() => listRoadmap()),
    createProject: protectedProcedure.input(z.object({
      name: z.string().min(2),
      repository: z.string().min(3),
      defaultBranch: z.string().min(1),
      baseline: z.string().optional(),
      verificationCommands: z.record(z.string(), z.string()),
    })).mutation(({ input }) => createProject(input)),
    ingestEvidence: publicProcedure.input(evidenceInput).mutation(({ input }) => ingestEvidence(input)),
    createDecision: protectedProcedure.input(z.object({
      projectId: z.number().int().positive().optional(),
      gateIndex: z.number().int().min(0).max(8).optional(),
      sha: z.string().optional(),
      title: z.string().min(2),
      context: z.string().min(2),
      decision: z.string().min(2),
    })).mutation(({ input }) => createTechnicalDecision(input)),
    createRoadmapPhase: protectedProcedure.input(z.object({
      title: z.string().min(2),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      description: z.string().min(2),
      position: z.number().int().min(0),
    })).mutation(({ input }) => createRoadmapPhase(input)),
  }),
});

export type AppRouter = typeof appRouter;
