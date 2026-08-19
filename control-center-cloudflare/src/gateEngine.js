export const GateStatus = Object.freeze({ PASS: "PASS", BLOCK: "BLOCK", TODO: "TODO" });

export function evaluateGate(requirements, checks) {
  const checkByName = new Map(checks.map(check => [check.name, check]));
  const reasons = [];
  for (const requirement of requirements) {
    const check = checkByName.get(requirement);
    if (!check) {
      reasons.push(`${requirement}: TODO`);
      continue;
    }
    if (check.status !== GateStatus.PASS) reasons.push(`${requirement}: ${check.status}`);
  }
  return {
    status: reasons.length === 0 ? GateStatus.PASS : GateStatus.BLOCK,
    reasons,
    checks
  };
}
