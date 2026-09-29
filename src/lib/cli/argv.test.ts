import { describe, expect, it } from "vitest";
import {
  defaultFormValues,
  serializeCommand,
  validateRequired,
} from "@/lib/cli/argv";
import { llmCommand } from "@/lib/cli/commands/llm";
import { promptsCommand } from "@/lib/cli/commands/prompts";
import { compareCommand } from "@/lib/cli/commands/utilities";
import { selftestCommand } from "@/lib/cli/commands/utilities";

describe("serializeCommand", () => {
  it("matches LLM quickstart shape with --runs before --", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.numRequests = 16;
    values.concurrency = 4;
    values.maxTokens = 64;
    values.seed = 7;
    values.sut = "sut.json";
    values.requireSut = true;
    values.runs = 2;

    const { args, preview } = serializeCommand(llmCommand, values);

    expect(args.slice(0, 4)).toEqual(["llm", "--runs", "2", "--"]);
    expect(args).toContain("--scenario");
    expect(args).toContain("quickstart");
    expect(args).toContain("--streaming");
    expect(args).toContain("--mode");
    expect(args).toContain("chat");
    expect(args).toContain("--url");
    expect(args).toContain("http://127.0.0.1:18321/v1/chat/completions");
    expect(args).toContain("--api-key");
    expect(args).toContain("dummy");
    expect(args).toContain("--require-sut");
    expect(args).toContain("--seed");
    expect(args).toContain("7");
    expect(preview.startsWith("metrum-ai-bench-cli llm --runs 2 --")).toBe(
      true,
    );
    // default seed 0 omitted; seed 7 included. temperature 0.1 omitted.
    expect(args).not.toContain("--temperature");
  });

  it("omits --runs when runs is 1", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.runs = 1;
    const { args } = serializeCommand(llmCommand, values);
    expect(args).not.toContain("--runs");
    expect(args[0]).toBe("llm");
    expect(args[1]).toBe("--");
  });

  it("enforces mutual exclusion of url vs endpoints-file", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://example.com/v1/chat/completions";
    values.apiKey = "secret";
    values.endpointsFile = "endpoints.yaml";

    const { args } = serializeCommand(llmCommand, values);
    expect(args).toContain("--url");
    expect(args).toContain("--api-key");
    expect(args).not.toContain("--endpoints-file");
  });

  it("emits repeatable --slo flags", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://example.com";
    values.apiKey = "k";
    values.slo = [
      { metric: "ttft", value: "250ms" },
      { metric: "e2e", value: "2s" },
    ];
    const { args } = serializeCommand(llmCommand, values);
    const sloIndexes = args
      .map((a, i) => (a === "--slo" ? i : -1))
      .filter((i) => i >= 0);
    expect(sloIndexes.length).toBe(2);
    expect(args[sloIndexes[0] + 1]).toBe("ttft=250ms");
    expect(args[sloIndexes[1] + 1]).toBe("e2e=2s");
  });

  it("includes defaults when requested", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://example.com";
    values.apiKey = "k";
    const without = serializeCommand(llmCommand, values, {
      includeDefaults: false,
    });
    const withDefaults = serializeCommand(llmCommand, values, {
      includeDefaults: true,
    });
    expect(withDefaults.args).toContain("--temperature");
    expect(withDefaults.args).toContain("0.1");
    expect(without.args).not.toContain("--temperature");
  });

  it("serializes selftest with no flags", () => {
    const { args, preview } = serializeCommand(
      selftestCommand,
      defaultFormValues(selftestCommand),
    );
    expect(args).toEqual(["selftest"]);
    expect(preview).toBe("metrum-ai-bench-cli selftest");
  });

  it("serializes compare positional inputs", () => {
    const values = defaultFormValues(compareCommand);
    values.inputs = ["a.json", "b.json"];
    values.format = "json";
    const { args } = serializeCommand(compareCommand, values);
    expect(args[0]).toBe("compare");
    expect(args).toContain("a.json");
    expect(args).toContain("b.json");
    expect(args).toContain("--format");
    expect(args).toContain("json");
  });

  it("validates required LLM fields", () => {
    const values = defaultFormValues(llmCommand);
    values.scenario = "";
    values.url = "";
    values.apiKey = "";
    values.endpointsFile = "";
    const errors = validateRequired(llmCommand, values);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("accepts endpoints-file instead of url", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "";
    values.apiKey = "";
    values.endpointsFile = "endpoints.yaml";
    const errors = validateRequired(llmCommand, values);
    expect(errors.some((e) => e.toLowerCase().includes("url"))).toBe(false);
  });

  it("builds prompts mix argv", () => {
    const values = defaultFormValues(promptsCommand);
    values.count = 64;
    values.seed = 42;
    values.islTarget = 512;
    values.islTolerance = 64;
    values.oslTarget = 128;
    values.oslTolerance = 32;
    values.output = "/tmp/mix.jsonl";
    values.report = "/tmp/mix-report.json";
    const { args, preview } = serializeCommand(promptsCommand, values);
    expect(preview.startsWith("metrum-ai-bench-cli prompts")).toBe(true);
    expect(args).toContain("--count");
    expect(args).toContain("64");
    expect(args).toContain("--isl-target");
    expect(args).toContain("512");
    expect(args).not.toContain("--");
  });
});
