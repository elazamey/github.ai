export const gateDefinitions = [
  { index: 0, label: "Gate 0", requirements: ["structure", "evidence"] },
  { index: 1, label: "Gate 1", requirements: ["architecture", "scope"] },
  { index: 2, label: "Gate 2", requirements: ["tests", "build"] },
  { index: 3, label: "Gate 3", requirements: ["tests", "typecheck", "security"] },
  { index: 4, label: "Gate 4", requirements: ["contracts", "tests", "security"] },
  { index: 5, label: "Gate 5", requirements: ["ai-evaluation", "security", "scope"] },
  { index: 6, label: "Gate 6", requirements: ["e2e", "build", "security"] },
  { index: 7, label: "Gate 7", requirements: ["build", "deployment", "workflow"] },
  { index: 8, label: "Gate 8", requirements: ["tests", "security", "deployment", "approval"] },
];

export type CheckStatus = "PASS" | "BLOCK" | "TODO";

export type GateCheck = {
  name: string;
  status: CheckStatus;
  details?: string;
};

export function evaluateGate(checks: GateCheck[], requirements: string[]) {
  const requiredChecks = requirements.map(name => {
    const check = checks.find(item => item.name === name);
    return check ?? { name, status: "TODO" as const, details: "Evidence not received." };
  });
  const reasons = requiredChecks
    .filter(check => check.status !== "PASS")
    .map(check => `${check.name}: ${check.status}${check.details ? ` — ${check.details}` : ""}`);

  return {
    status: reasons.length === 0 ? ("PASS" as const) : ("BLOCK" as const),
    reasons,
    checks: requiredChecks,
  };
}
