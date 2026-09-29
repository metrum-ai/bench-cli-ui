import { describe, expect, it } from "vitest";
import { defaultFormValues, serializeCommand } from "@/lib/cli/argv";
import { llmCommand } from "@/lib/cli/commands/llm";
import { vlmCommand } from "@/lib/cli/commands/vlm";

function flagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
}

describe("VLM serializer", () => {
  it("never emits --mode (VLM has no mode field)", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";

    const { args } = serializeCommand(vlmCommand, values, {
      includeDefaults: true,
    });

    expect(args).not.toContain("--mode");
    // LLM does emit --mode under the same conditions for contrast.
    const llmValues = defaultFormValues(llmCommand);
    llmValues.url = "http://127.0.0.1:18321/v1/chat/completions";
    llmValues.apiKey = "dummy";
    const llmArgs = serializeCommand(llmCommand, llmValues, {
      includeDefaults: true,
    }).args;
    expect(llmArgs).toContain("--mode");
  });

  it("includes image flags when set to non-default values", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.numImagesBatch = 4;
    values.imageDetail = "high";

    const { args } = serializeCommand(vlmCommand, values);

    expect(flagValue(args, "--num-images-batch")).toBe("4");
    expect(flagValue(args, "--image-detail")).toBe("high");
  });

  it("omits image flags at defaults unless includeDefaults", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";

    const without = serializeCommand(vlmCommand, values);
    expect(without.args).not.toContain("--num-images-batch");
    expect(without.args).not.toContain("--image-detail");

    const withDefaults = serializeCommand(vlmCommand, values, {
      includeDefaults: true,
    });
    expect(flagValue(withDefaults.args, "--num-images-batch")).toBe("1");
    expect(flagValue(withDefaults.args, "--image-detail")).toBe("low");
  });

  it("omits request-timeout default 120 unless includeDefaults", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";

    const without = serializeCommand(vlmCommand, values);
    expect(without.args).not.toContain("--request-timeout");

    const withDefaults = serializeCommand(vlmCommand, values, {
      includeDefaults: true,
    });
    expect(flagValue(withDefaults.args, "--request-timeout")).toBe("120");
  });

  it("emits non-default request-timeout without includeDefaults", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.requestTimeout = 300;

    const { args } = serializeCommand(vlmCommand, values);
    expect(flagValue(args, "--request-timeout")).toBe("300");
  });
});

describe("LLM serializer", () => {
  it("emits --streaming when true (default)", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.streaming = true;

    const { args } = serializeCommand(llmCommand, values);
    expect(args).toContain("--streaming");
  });

  it("omits --streaming when false", () => {
    const values = defaultFormValues(llmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.streaming = false;

    const { args } = serializeCommand(llmCommand, values);
    expect(args).not.toContain("--streaming");
  });

  it("VLM also emits --streaming when true", () => {
    const values = defaultFormValues(vlmCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.apiKey = "dummy";
    values.streaming = true;

    const { args } = serializeCommand(vlmCommand, values);
    expect(args).toContain("--streaming");
  });
});
