import { describe, expect, it } from "vitest";
import { defaultFormValues, serializeCommand } from "@/lib/cli/argv";
import { promptsCommand } from "@/lib/cli/commands/prompts";
import { strategicCommand } from "@/lib/cli/commands/strategic";

describe("prompts command", () => {
  it("invokes the metrum-ai-bench-cli binary with the prompts subcommand", () => {
    const values = defaultFormValues(promptsCommand);
    const { binary, args, preview } = serializeCommand(
      promptsCommand,
      values,
    );

    expect(binary).toBe("metrum-ai-bench-cli");
    expect(args[0]).toBe("prompts");
    expect(preview.startsWith("metrum-ai-bench-cli prompts")).toBe(true);
  });

  it("does not insert a -- separator between subcommand and flags", () => {
    const values = defaultFormValues(promptsCommand);
    values.seed = 42;
    const { args, preview } = serializeCommand(promptsCommand, values);

    expect(args).not.toContain("--");
    expect(preview).not.toContain(" -- ");
    // Flags follow the subcommand directly.
    expect(args.indexOf("--seed")).toBeGreaterThan(args.indexOf("prompts"));
  });

  it("suppresses isl/osl targets when a profile is set", () => {
    const values = defaultFormValues(promptsCommand);
    values.profile = "chat-medium";
    values.islTarget = 512;
    values.oslTarget = 128;
    const { args } = serializeCommand(promptsCommand, values);

    expect(args).toContain("--profile");
    expect(args[args.indexOf("--profile") + 1]).toBe("chat-medium");
    expect(args).not.toContain("--isl-target");
    expect(args).not.toContain("--osl-target");
    // Tolerances are not part of the exclusive group and still serialize.
    expect(args).toContain("--isl-tolerance");
    expect(args).toContain("--osl-tolerance");
  });

  it("suppresses profile when explicit isl/osl targets win schema order", () => {
    // profile is empty (default) so it does not suppress; explicit targets emit.
    const values = defaultFormValues(promptsCommand);
    values.profile = "";
    values.islTarget = 1024;
    values.oslTarget = 256;
    const { args } = serializeCommand(promptsCommand, values);

    expect(args).not.toContain("--profile");
    expect(args).toContain("--isl-target");
    expect(args[args.indexOf("--isl-target") + 1]).toBe("1024");
    expect(args).toContain("--osl-target");
    expect(args[args.indexOf("--osl-target") + 1]).toBe("256");
  });
});

describe("strategic command", () => {
  it("invokes the standalone metrum-ai-bench-cli-strategic binary with no subcommand", () => {
    const values = defaultFormValues(strategicCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    const { binary, args, preview } = serializeCommand(
      strategicCommand,
      values,
    );

    expect(binary).toBe("metrum-ai-bench-cli-strategic");
    expect(strategicCommand.subcommand).toEqual([]);
    // First arg is a flag, not a subcommand token.
    expect(args[0]).toBe("--url");
    expect(preview.startsWith("metrum-ai-bench-cli-strategic --")).toBe(true);
    expect(args).not.toContain("--");
  });

  it("omits sweep and kind defaults unless includeDefaults is set", () => {
    const values = defaultFormValues(strategicCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";

    const without = serializeCommand(strategicCommand, values, {
      includeDefaults: false,
    });
    expect(without.args).not.toContain("--sweep");
    expect(without.args).not.toContain("--kind");

    const withDefaults = serializeCommand(strategicCommand, values, {
      includeDefaults: true,
    });
    expect(withDefaults.args).toContain("--sweep");
    expect(withDefaults.args[withDefaults.args.indexOf("--sweep") + 1]).toBe(
      "1,2,4,8",
    );
    expect(withDefaults.args).toContain("--kind");
    expect(withDefaults.args[withDefaults.args.indexOf("--kind") + 1]).toBe(
      "chat",
    );
  });

  it("emits non-default sweep and kind values", () => {
    const values = defaultFormValues(strategicCommand);
    values.url = "http://127.0.0.1:18321/v1/chat/completions";
    values.sweep = "4,16";
    values.kind = "embeddings";
    const { args } = serializeCommand(strategicCommand, values);

    expect(args).toContain("--sweep");
    expect(args[args.indexOf("--sweep") + 1]).toBe("4,16");
    expect(args).toContain("--kind");
    expect(args[args.indexOf("--kind") + 1]).toBe("embeddings");
  });
});
