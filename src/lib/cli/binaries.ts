import type { BinaryName } from "./types";

/**
 * Allowlist of binaries that the `/api/run` and `/api/binary` routes are
 * permitted to spawn or probe. Centralized here so the allowlist is the single
 * source of truth across all run-related endpoints and their tests.
 */
export const ALLOWED_BINARIES: readonly BinaryName[] = [
  "metrum-ai-bench-cli",
  "metrum-ai-bench-cli-strategic",
  "metrum-ai-bench-cli-mock-server",
] as const;

const ALLOWED_BINARIES_SET: ReadonlySet<string> = new Set(ALLOWED_BINARIES);

/**
 * Type-safe guard for the run/binary allowlist. Returns true only when `name`
 * is one of the explicitly allowlisted binaries; any other input (including
 * the empty string, lookalike names with extra characters, or attacker-
 * supplied shell-like values) is rejected.
 */
export function isAllowedBinary(name: unknown): name is BinaryName {
  return typeof name === "string" && ALLOWED_BINARIES_SET.has(name);
}