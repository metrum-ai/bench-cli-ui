# Metrum AI Bench CLI Web UI

Operator console for [`metrum-ai/bench-cli`](https://github.com/metrum-ai/bench-cli) **1.5.1**.

Configure every CLI command with typed defaults, live argv preview, and optional local Run when `metrum-ai-bench-cli` is on `PATH`.

## Requirements

- Node.js **24+** (via [nvm](https://github.com/nvm-sh/nvm): `nvm use 24`)
- Optional: a built/installed `metrum-ai-bench-cli` on `PATH` for Run

## Quick start

```bash
source ~/.nvm/nvm.sh && nvm use 24
npm install
npm run dev
```

The app listens on **`http://0.0.0.0:23456`**.

```bash
curl -sf http://127.0.0.1:23456 >/dev/null && echo ok
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server on `0.0.0.0:23456` |
| `npm run build` | Production build |
| `npm run start` | Production server on `0.0.0.0:23456` |
| `npm test` | Vitest (argv serializer contracts) |
| `npm run lint` | ESLint |

## Commands covered

See [docs/UI.md](docs/UI.md) for the full field catalog. Nav groups:

- **Modalities:** LLM, VLM, ASR, Imagegen
- **Workloads:** Prompts, Strategic
- **Utilities:** Preflight, SUT init, Compare, Selftest, Mock server

## Security

- API keys use password inputs and are sent only to the local `/api/run` process.
- `/api/run` allowlists binaries: `metrum-ai-bench-cli`, `metrum-ai-bench-cli-strategic`, `metrum-ai-bench-cli-mock-server`.
- Do not commit secrets, endpoint credential files, or run logs with keys.

## Theme

Metrum dark theme from [www.metrum.ai](https://www.metrum.ai): black background, Geist / Poppins / Geist Mono, brand gradient `#FF3132 → #FE005F → #EE0089 → #CC28AF → #9948CB → #465CDA`.

## License

Apache-2.0 aligned with bench-cli. Metrum AI trademarks belong to Metrum AI, Inc.
