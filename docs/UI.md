# Bench CLI UI reference

This Next.js app mirrors [metrum-ai/bench-cli](https://github.com/metrum-ai/bench-cli) **1.5.1** flags from `docs/CLI.md` and the unified dispatcher in `src/bin/metrum-ai-bench-cli.rs`.

## Runtime

- Bind: `0.0.0.0:23456` (`npm run dev` / `npm run start`)
- Node: 24+ via `nvm use 24`
- Stack: Next.js App Router, React, Tailwind CSS, shadcn/ui, Vitest

## Architecture

| Path | Role |
|------|------|
| `src/lib/cli/types.ts` | Field and command types |
| `src/lib/cli/argv.ts` | Pure argv serializer + validation |
| `src/lib/cli/shared-fields.ts` | Shared endpoint/load/publish/advanced fields |
| `src/lib/cli/commands/*` | Per-command schemas |
| `src/lib/cli/registry.ts` | Nav registry |
| `src/components/cli/*` | Form workbench + field renderer |
| `src/app/api/run` | SSE process runner (allowlisted binaries) |
| `src/app/api/binary` | PATH probe for Run button |
| `src/lib/cli/binaries.ts` | Centralized `ALLOWED_BINARIES` + `isAllowedBinary()` guard shared by the run/binary routes |

## Argv rules

1. Empty optional fields are omitted.
2. Values equal to schema `defaultValue` are omitted unless **Include defaults** is on (`omitWhenDefault` defaults to true).
3. Required fields with non-default sample values use `omitWhenDefault: false` so quickstarts appear in the preview.
4. Mutual exclusion: first non-empty field in schema order wins (`url`/`apiKey` vs `endpointsFile`; `prompt` vs `prompts`; profile vs ISL/OSL targets).
5. Modality commands use `metrum-ai-bench-cli <sub> [--runs N] -- <flags>`.
6. Strategic and mock-server use their own binary names with no `--` separator.
7. Repeatable `--slo` becomes multiple `--slo metric=value` pairs.
8. Compare `inputs` are positional path args.

## Command map

| UI route | Binary / subcommand |
|----------|---------------------|
| `/llm` | `metrum-ai-bench-cli llm -- …` |
| `/vlm` | `metrum-ai-bench-cli vlm -- …` |
| `/asr` | `metrum-ai-bench-cli asr -- …` |
| `/imagegen` | `metrum-ai-bench-cli imagegen -- …` |
| `/prompts` | `metrum-ai-bench-cli prompts …` |
| `/strategic` | `metrum-ai-bench-cli-strategic …` |
| `/preflight` | `metrum-ai-bench-cli preflight …` |
| `/sut` | `metrum-ai-bench-cli sut init …` |
| `/compare` | `metrum-ai-bench-cli compare …` |
| `/selftest` | `metrum-ai-bench-cli selftest` |
| `/mock-server` | `metrum-ai-bench-cli-mock-server …` |

## Docs sync rule

Any user-visible control or default change must update this file and `README.md` in the same PR.

## Testing

```bash
nvm use 24
npm test
```

Serializer contracts live in `src/lib/cli/argv.test.ts` (quickstart shape, mutual exclusion, SLOs, `--runs` placement, omit-defaults), `src/lib/cli/commands/llm-vlm.test.ts`, `src/lib/cli/commands/asr-imagegen.test.ts` (ASR `--input`/concurrency/normalizer defaults, imagegen prompt exclusivity and size default), `src/lib/cli/commands/prompts-strategic.test.ts`, and `src/lib/cli/commands/utilities.test.ts`. The run/binary allowlist is covered by `src/lib/cli/binaries.test.ts` and `src/app/api/run/route.test.ts`.
