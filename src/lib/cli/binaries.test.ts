import { describe, expect, it } from "vitest";
import { ALLOWED_BINARIES, isAllowedBinary } from "@/lib/cli/binaries";

describe("ALLOWED_BINARIES", () => {
  it("contains exactly the three supported bench-cli binaries", () => {
    expect(ALLOWED_BINARIES).toEqual([
      "metrum-ai-bench-cli",
      "metrum-ai-bench-cli-strategic",
      "metrum-ai-bench-cli-mock-server",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(ALLOWED_BINARIES).size).toBe(ALLOWED_BINARIES.length);
  });
});

describe("isAllowedBinary", () => {
  it("accepts every allowlisted binary", () => {
    for (const name of ALLOWED_BINARIES) {
      expect(isAllowedBinary(name)).toBe(true);
    }
  });

  it("rejects unknown binaries", () => {
    expect(isAllowedBinary("metrum-ai-bench-cli-evil")).toBe(false);
    expect(isAllowedBinary("metrum-ai-bench")).toBe(false);
    expect(isAllowedBinary("sh")).toBe(false);
    expect(isAllowedBinary("bash")).toBe(false);
    expect(isAllowedBinary("curl")).toBe(false);
  });

  it("rejects empty and whitespace strings", () => {
    expect(isAllowedBinary("")).toBe(false);
    expect(isAllowedBinary(" ")).toBe(false);
    expect(isAllowedBinary("metrum-ai-bench-cli ")).toBe(false);
    expect(isAllowedBinary(" metrum-ai-bench-cli")).toBe(false);
  });

  it("rejects shell-injection style values", () => {
    expect(isAllowedBinary("metrum-ai-bench-cli; rm -rf /")).toBe(false);
    expect(isAllowedBinary("metrum-ai-bench-cli && id")).toBe(false);
    expect(isAllowedBinary("$(id)")).toBe(false);
    expect(isAllowedBinary("`id`")).toBe(false);
    expect(isAllowedBinary("/usr/bin/metrum-ai-bench-cli")).toBe(false);
    expect(isAllowedBinary("./metrum-ai-bench-cli")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isAllowedBinary(undefined)).toBe(false);
    expect(isAllowedBinary(null)).toBe(false);
    expect(isAllowedBinary(0)).toBe(false);
    expect(isAllowedBinary(1)).toBe(false);
    expect(isAllowedBinary(true)).toBe(false);
    expect(isAllowedBinary(false)).toBe(false);
    expect(isAllowedBinary([])).toBe(false);
    expect(isAllowedBinary(["metrum-ai-bench-cli"])).toBe(false);
    expect(isAllowedBinary({})).toBe(false);
    expect(isAllowedBinary({ toString: () => "metrum-ai-bench-cli" })).toBe(
      false,
    );
  });

  it("is case-sensitive", () => {
    expect(isAllowedBinary("METRUM-AI-BENCH-CLI")).toBe(false);
    expect(isAllowedBinary("Metrum-Ai-Bench-Cli")).toBe(false);
  });
});