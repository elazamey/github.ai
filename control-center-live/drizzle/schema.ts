import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  repository: varchar("repository", { length: 256 }).notNull().unique(),
  defaultBranch: varchar("defaultBranch", { length: 120 }).notNull(),
  baseline: varchar("baseline", { length: 128 }),
  verificationCommands: json("verificationCommands").$type<Record<string, string>>().notNull(),
  currentGate: int("currentGate").notNull().default(0),
  status: mysqlEnum("status", ["PASS", "BLOCK", "TODO"]).notNull().default("TODO"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gates = mysqlTable("gates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  gateIndex: int("gateIndex").notNull(),
  baseline: varchar("baseline", { length: 128 }),
  sha: varchar("sha", { length: 128 }),
  status: mysqlEnum("status", ["PASS", "BLOCK", "TODO"]).notNull().default("TODO"),
  requirements: json("requirements").$type<string[]>().notNull(),
  checks: json("checks").$type<Array<{ name: string; status: "PASS" | "BLOCK" | "TODO"; details?: string }>>().notNull(),
  reasons: json("reasons").$type<string[]>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  gateIndex: int("gateIndex").notNull(),
  sha: varchar("sha", { length: 128 }).notNull(),
  branch: varchar("branch", { length: 120 }).notNull(),
  workflowRunUrl: varchar("workflowRunUrl", { length: 512 }),
  workflowRunId: varchar("workflowRunId", { length: 128 }),
  checks: json("checks").$type<Array<{ name: string; status: "PASS" | "BLOCK" | "TODO"; details?: string }>>().notNull(),
  decision: mysqlEnum("decision", ["PASS", "BLOCK", "TODO"]).notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export const technicalDecisions = mysqlTable("technicalDecisions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  gateIndex: int("gateIndex"),
  sha: varchar("sha", { length: 128 }),
  title: varchar("title", { length: 220 }).notNull(),
  context: text("context").notNull(),
  decision: text("decision").notNull(),
  status: mysqlEnum("status", ["PROPOSED", "ACCEPTED", "SUPERSEDED"]).notNull().default("PROPOSED"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roadmapPhases = mysqlTable("roadmapPhases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  priority: mysqlEnum("priority", ["HIGH", "MEDIUM", "LOW"]).notNull().default("MEDIUM"),
  status: mysqlEnum("status", ["PASS", "BLOCK", "TODO"]).notNull().default("TODO"),
  description: text("description").notNull(),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type Gate = typeof gates.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type TechnicalDecision = typeof technicalDecisions.$inferSelect;
export type RoadmapPhase = typeof roadmapPhases.$inferSelect;
