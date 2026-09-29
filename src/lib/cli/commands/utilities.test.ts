import { describe, expect, it } from "vitest";
import {
  defaultFormValues,
  serializeCommand,
  validateRequired,
} from "@/lib/cli/argv";
import {
  compareCommand,
  mockServerCommand,
  preflightCommand,
  selftestCommand,
  sutInitCommand,
} from "@/lib/cli/commands/utilities";

describe("preflightCommand", () => {
  it("serializes with default endpoint, api-key, and model", () => {
    const values = defaultFormValues(preflightCommand);
    const { args, preview, binary } = serializeCommand(preflightCommand, values);

    expect(binary).toBe("metrum-ai-bench-cli");
    expect(args[0]).toBe("preflight");
    expect(args).toContain("--url");
    expect(args).toContain("http://127.0.0.1:18321/v1/chat/completions");
    expect(args).toContain("--api-key");
    expect(args).toContain("dummy");
    // default model "dummy" is omitWhenDefault so it should be hidden
    expect(args).not.toContain("--model");
    // omitWhenDefault:true fields with their defaults are not emitted
    expect(args).not.toContain("--connect-timeout");
    expect(args).not.toContain("--request-timeout");
    expect(args).not.toContain("--latency-samples");
    expect(args).not.toContain("--json");
    expect(preview.startsWith("metrum-ai-bench-cli preflight")).toBe(true);
  });

  it("includes overridden timeouts and latency samples", () => {
    const values = defaultFormValues(preflightCommand);
    values.connectTimeout = 5;
    values.requestTimeout = 30;
    values.latencySamples = 10;
    const { args } = serializeCommand(preflightCommand, values);
    expect(args).toContain("--connect-timeout");
    expect(args).toContain("5");
    expect(args).toContain("--request-timeout");
    expect(args).toContain("30");
    expect(args).toContain("--latency-samples");
    expect(args).toContain("10");
  });

  it("emits --json when enabled", () => {
    const values = defaultFormValues(preflightCommand);
    values.json = true;
    const { args } = serializeCommand(preflightCommand, values);
    expect(args).toContain("--json");
  });

  it("uses the canonical binary", () => {
    expect(preflightCommand.binary).toBe("metrum-ai-bench-cli");
    expect(preflightCommand.subcommand).toEqual(["preflight"]);
    expect(preflightCommand.supportsRuns).toBe(false);
    expect(preflightCommand.useDoubleDash).toBe(false);
  });
});

describe("sutInitCommand", () => {
  it("serializes default form without --probe/--force flags", () => {
    const values = defaultFormValues(sutInitCommand);
    const { args, preview, binary } = serializeCommand(sutInitCommand, values);

    expect(binary).toBe("metrum-ai-bench-cli");
    expect(args).toEqual(["sut", "init"]);
    expect(args).not.toContain("--probe");
    expect(args).not.toContain("--force");
    expect(args).not.toContain("--output");
    expect(preview).toBe("metrum-ai-bench-cli sut init");
  });

  it("emits --probe when the user opts in", () => {
    const values = defaultFormValues(sutInitCommand);
    values.probe = true;
    const { args } = serializeCommand(sutInitCommand, values);
    expect(args).toContain("--probe");
  });

  it("emits --force when requested", () => {
    const values = defaultFormValues(sutInitCommand);
    values.force = true;
    const { args } = serializeCommand(sutInitCommand, values);
    expect(args).toContain("--force");
  });

  it("emits --output when override is provided", () => {
    const values = defaultFormValues(sutInitCommand);
    values.output = "/tmp/custom-sut.json";
    const { args } = serializeCommand(sutInitCommand, values);
    expect(args).toContain("--output");
    expect(args).toContain("/tmp/custom-sut.json");
  });

  it("uses the canonical binary", () => {
    expect(sutInitCommand.binary).toBe("metrum-ai-bench-cli");
    expect(sutInitCommand.subcommand).toEqual(["sut", "init"]);
    expect(sutInitCommand.supportsRuns).toBe(false);
  });
});

describe("compareCommand", () => {
  it("emits positional inputs without flags", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    const { args, preview, binary } = serializeCommand(compareCommand, values);

    expect(binary).toBe("metrum-ai-bench-cli");
    expect(args[0]).toBe("compare");
    expect(args).toContain("a.json");
    expect(args).toContain("b.json");
    // format default markdown is omitWhenDefault, so omitted
    expect(args).not.toContain("--format");
    expect(preview.startsWith("metrum-ai-bench-cli compare")).toBe(true);
  });

  it("emits --labels joined by commas", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    values.labels = "baseline,candidate";
    const { args } = serializeCommand(compareCommand, values);
    expect(args).toContain("--labels");
    expect(args).toContain("baseline,candidate");
  });

  it("emits --format when changed", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    values.format = "json";
    const { args } = serializeCommand(compareCommand, values);
    expect(args).toContain("--format");
    expect(args).toContain("json");
  });

  it("emits --output when provided", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    values.output = "/tmp/diff.md";
    const { args } = serializeCommand(compareCommand, values);
    expect(args).toContain("--output");
    expect(args).toContain("/tmp/diff.md");
  });

  it("requires at least one input", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = [];
    const errors = validateRequired(compareCommand, values);
    expect(errors.some((e) => /inputs/i.test(e))).toBe(true);
  });

  it("passes validation with two inputs", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    const errors = validateRequired(compareCommand, values);
    expect(errors).toEqual([]);
  });
});

describe("selftestCommand", () => {
  it("serializes with only the subcommand and no flags", () => {
    const values = defaultFormValues(selftestCommand);
    const { args, preview, binary } = serializeCommand(selftestCommand, values);

    expect(binary).toBe("metrum-ai-bench-cli");
    expect(args).toEqual(["selftest"]);
    expect(preview).toBe("metrum-ai-bench-cli selftest");
  });

  it("has no fields", () => {
    expect(selftestCommand.fields).toEqual([]);
  });

  it("does not support runs and does not use a double-dash", () => {
    expect(selftestCommand.supportsRuns).toBe(false);
    expect(selftestCommand.useDoubleDash).toBe(false);
  });
});

describe("mockServerCommand", () => {
  it("uses the dedicated mock-server binary and no subcommand", () => {
    const { args, preview, binary } = serializeCommand(
      mockServerCommand,
      defaultFormValues(mockServerCommand),
    );

    expect(binary).toBe("metrum-ai-bench-cli-mock-server");
    expect(args).toEqual([]);
    expect(preview).toBe("metrum-ai-bench-cli-mock-server");
  });

  it("omits defaults for listen, latency, fail-every, telemetry-fixture", () => {
    const { args } = serializeCommand(
      mockServerCommand,
      defaultFormValues(mockServerCommand),
    );
    expect(args).not.toContain("--listen");
    expect(args).not.toContain("--latency-ms");
    expect(args).not.toContain("--fail-every");
    expect(args).not.toContain("--telemetry-fixture");
  });

  it("emits overrides when provided", () => {
    const values = defaultFormValues(mockServerCommand);
    values.listen = "0.0.0.0:9090";
    values.latencyMs = 50;
    values.failEvery = 5;
    values.telemetryFixture = true;
    const { args } = serializeCommand(mockServerCommand, values);
    expect(args).toContain("--listen");
    expect(args).toContain("0.0.0.0:9090");
    expect(args).toContain("--latency-ms");
    expect(args).toContain("50");
    expect(args).toContain("--fail-every");
    expect(args).toContain("5");
    expect(args).toContain("--telemetry-fixture");
  });

  it("declares supportsRuns=false and no subcommand", () => {
    expect(mockServerCommand.binary).toBe("metrum-ai-bench-cli-mock-server");
    expect(mockServerCommand.subcommand).toEqual([]);
    expect(mockServerCommand.supportsRuns).toBe(false);
    expect(mockServerCommand.useDoubleDash).toBe(false);
  });
});

describe("utilities commands share the allowlist", () => {
  it("every utilities binary is one of the run-route binaries", () => {
    const allowed = new Set([
      "metrum-ai-bench-cli",
      "metrum-ai-bench-cli-strategic",
      "metrum-ai-bench-cli-mock-server",
    ]);
    for (const cmd of [
      preflightCommand,
      sutInitCommand,
      compareCommand,
      selftestCommand,
      mockServerCommand,
    ]) {
      expect(allowed.has(cmd.binary)).toBe(true);
    }
  });
});