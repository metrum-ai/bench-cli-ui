import type { CommandDef } from "./types";
import { asrCommand } from "./commands/asr";
import { imagegenCommand } from "./commands/imagegen";
import { llmCommand } from "./commands/llm";
import { promptsCommand } from "./commands/prompts";
import { strategicCommand } from "./commands/strategic";
import {
  compareCommand,
  mockServerCommand,
  preflightCommand,
  selftestCommand,
  sutInitCommand,
} from "./commands/utilities";
import { vlmCommand } from "./commands/vlm";

export const COMMANDS: CommandDef[] = [
  llmCommand,
  vlmCommand,
  asrCommand,
  imagegenCommand,
  promptsCommand,
  strategicCommand,
  preflightCommand,
  sutInitCommand,
  compareCommand,
  selftestCommand,
  mockServerCommand,
];

export const NAV_GROUPS: { title: string; ids: string[] }[] = [
  {
    title: "Modalities",
    ids: ["llm", "vlm", "asr", "imagegen"],
  },
  {
    title: "Workloads",
    ids: ["prompts", "strategic"],
  },
  {
    title: "Utilities",
    ids: ["preflight", "sut-init", "compare", "selftest", "mock-server"],
  },
];

export function getCommand(id: string): CommandDef | undefined {
  return COMMANDS.find((c) => c.id === id);
}

export {
  asrCommand,
  compareCommand,
  imagegenCommand,
  llmCommand,
  mockServerCommand,
  preflightCommand,
  promptsCommand,
  selftestCommand,
  strategicCommand,
  sutInitCommand,
  vlmCommand,
};
