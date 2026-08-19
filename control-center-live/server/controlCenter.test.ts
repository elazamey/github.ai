import { describe, expect, it } from "vitest";
import { evaluateGate } from "./controlCenter";

describe("Gate Engine", () => {
  it("returns PASS when every required check is PASS", () => {
    const result = evaluateGate([
      { name: "tests", status: "PASS" },
      { name: "build", status: "PASS" },
    ], ["tests", "build"]);
    expect(result.status).toBe("PASS");
    expect(result.reasons).toEqual([]);
  });

  it("returns BLOCK with a reason when a required check is missing", () => {
    const result = evaluateGate([{ name: "tests", status: "PASS" }], ["tests", "security"]);
    expect(result.status).toBe("BLOCK");
    expect(result.reasons[0]).toContain("security: TODO");
  });
});
