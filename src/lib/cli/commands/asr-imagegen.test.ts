import { describe, expect, it } from "vitest";
import {
  defaultFormValues,
  serializeCommand,
  validateRequired,
} from "@/lib/cli/argv";
import { asrCommand } from "@/lib/cli/commands/asr";
import { imagegenCommand } from "@/lib/cli/commands/imagegen";

function asrValues() {
  const values = defaultFormValues(asrCommand);
  values.url = "http://127.0.0.1:18321/v1";
  values.apiKey = "dummy";
  return values;
}

function imagegenValues() {
  const values = defaultFormValues(imagegenCommand);
  values.prompt = "a square";
  return values;
}

describe("asrCommand argv", () => {
  it("uses --input (not --prompts) for the audio sample file", () => {
    const { args } = serializeCommand(asrCommand, asrValues());
    expect(args).toContain("--input");
    expect(args[args.indexOf("--input") + 1]).toBe("test-data/asr.jsonl");
    expect(args).not.toContain("--prompts");
    expect(args).not.toContain("--prompt");
  });

  it("omits default concurrency 10 unless includeDefaults", () => {
    const without = serializeCommand(asrCommand, asrValues());
    expect(without.args).not.toContain("--concurrency");

    const withDefaults = serializeCommand(asrCommand, asrValues(), {
      includeDefaults: true,
    });
    const idx = withDefaults.args.indexOf("--concurrency");
    expect(idx).toBeGreaterThan(-1);
    expect(withDefaults.args[idx + 1]).toBe("10");
  });

  it("emits non-default concurrency", () => {
    const values = asrValues();
    values.concurrency = 25;
    const { args } = serializeCommand(asrCommand, values);
    const idx = args.indexOf("--concurrency");
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe("25");
  });

  it("omits normalizer default unless includeDefaults", () => {
    const without = serializeCommand(asrCommand, asrValues());
    expect(without.args).not.toContain("--normalizer");

    const withDefaults = serializeCommand(asrCommand, asrValues(), {
      includeDefaults: true,
    });
    const idx = withDefaults.args.indexOf("--normalizer");
    expect(idx).toBeGreaterThan(-1);
    expect(withDefaults.args[idx + 1]).toBe("whisper-english");
  });

  it("emits non-default normalizer", () => {
    const values = asrValues();
    values.normalizer = "none";
    const { args } = serializeCommand(asrCommand, values);
    expect(args).toContain("--normalizer");
    expect(args[args.indexOf("--normalizer") + 1]).toBe("none");
  });
});

describe("imagegenCommand argv", () => {
  it("requires prompt or prompts", () => {
    const values = defaultFormValues(imagegenCommand);
    const errors = validateRequired(imagegenCommand, values);
    expect(errors.some((e) => /prompt/i.test(e))).toBe(true);

    values.prompt = "a square";
    expect(
      validateRequired(imagegenCommand, values).some((e) => /prompt/i.test(e)),
    ).toBe(false);
  });

  it("accepts prompts file instead of prompt", () => {
    const values = defaultFormValues(imagegenCommand);
    values.prompts = "prompts.jsonl";
    const errors = validateRequired(imagegenCommand, values);
    expect(errors.some((e) => /prompt/i.test(e))).toBe(false);
  });

  it("emits --prompt when set", () => {
    const values = defaultFormValues(imagegenCommand);
    values.prompt = "a square";
    const { args } = serializeCommand(imagegenCommand, values);
    expect(args).toContain("--prompt");
    expect(args[args.indexOf("--prompt") + 1]).toBe("a square");
    expect(args).not.toContain("--prompts");
  });

  it("emits --prompts when only prompts file set", () => {
    const values = defaultFormValues(imagegenCommand);
    values.prompts = "prompts.jsonl";
    const { args } = serializeCommand(imagegenCommand, values);
    expect(args).toContain("--prompts");
    expect(args[args.indexOf("--prompts") + 1]).toBe("prompts.jsonl");
    expect(args).not.toContain("--prompt");
  });

  it("is mutually exclusive: --prompt wins over --prompts when both set", () => {
    const values = defaultFormValues(imagegenCommand);
    values.prompt = "a square";
    values.prompts = "prompts.jsonl";
    const { args } = serializeCommand(imagegenCommand, values);
    expect(args).toContain("--prompt");
    expect(args).not.toContain("--prompts");
  });

  it("omits default size 1024x1024 unless includeDefaults", () => {
    const without = serializeCommand(imagegenCommand, imagegenValues());
    expect(without.args).not.toContain("--size");

    const withDefaults = serializeCommand(imagegenCommand, imagegenValues(), {
      includeDefaults: true,
    });
    const idx = withDefaults.args.indexOf("--size");
    expect(idx).toBeGreaterThan(-1);
    expect(withDefaults.args[idx + 1]).toBe("1024x1024");
  });

  it("emits non-default size", () => {
    const values = imagegenValues();
    values.size = "512x512";
    const { args } = serializeCommand(imagegenCommand, values);
    expect(args).toContain("--size");
    expect(args[args.indexOf("--size") + 1]).toBe("512x512");
  });
});