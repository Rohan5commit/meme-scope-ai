# MemeScope AI

MemeScope AI is an AI copilot for meme-token and internet-native project research.

It accepts a token name, ticker, contract address, website, or X/Twitter handle and returns a structured research report with:

- AI-generated summary
- bull vs bear case
- risk flags
- narrative / meme angle analysis
- quick diligence checklist
- launch-ready social posts
- confidence + missing-data notices
- exportable JSON + shareable report page

This repo is optimized for **hackathon reliability**:

- one polished vertical slice
- clear AI depth
- live enrichment when available
- deterministic fallback when live data or model access is unavailable
- simple setup with one repo and one `.env`

## Why this project fits Four.Meme AI Sprint

MemeScope AI is intentionally aligned to the current public competition summary for the Four.Meme AI Sprint: AI is required, AI x Web3 / AI x Meme is encouraged, a working repo and demo video are required, token issuance is optional, and judging emphasizes innovation, technical implementation, practical value, and presentation. Public summary source: [CompeteHub – Four.Meme AI Sprint](https://www.competehub.dev/en/competitions/dorahacksfourmemeaisprint).

## Core workflow

1. User pastes a token/project signal: name, ticker, contract, website, handle, or manual notes.
2. Backend normalizes the input.
3. Optional enrichment pulls:
   - token market context from DexScreener search
   - website metadata from the supplied URL
4. NVIDIA NIM generates a structured JSON report.
5. If live AI generation fails, MemeScope emits a deterministic fallback report instead of crashing.
6. User can copy a share link or download the report as JSON.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js route handler (`/api/analyze`)
- **AI provider:** NVIDIA NIM chat completions (`https://integrate.api.nvidia.com/v1/chat/completions`)
- **Optional data enrichment:** DexScreener API + website metadata fetch
- **Validation:** Zod
- **Testing:** Vitest

## Architecture

```text
src/
  app/
    api/analyze/route.ts      # request validation + report generation
    report/page.tsx           # shareable report page
    layout.tsx                # metadata + shell
    page.tsx                  # home page
  components/
    analysis-form.tsx         # user input workflow
    app-shell.tsx             # landing + orchestration
    loading-state.tsx         # progress UI
    results-dashboard.tsx     # report renderer + export/share actions
    section-card.tsx          # reusable card shell
    ui.tsx                    # lightweight UI primitives
  lib/
    analysis-service.ts       # end-to-end orchestration
    enrichment.ts             # DexScreener + website enrichment
    fallback-report.ts        # deterministic backup report
    llm/                      # provider abstraction + NVIDIA implementation
    normalize-input.ts        # input normalization
    prompts.ts                # visible AI prompts
    schema.ts                 # Zod schemas + shared types
    seeds.ts                  # demo examples
    share.ts                  # compressed share payloads
    utils.ts                  # formatting + timeouts + JSON extraction
tests/
  normalize-input.test.ts
  fallback-report.test.ts
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your NVIDIA key:

```bash
cp .env.example .env.local
```

Required:

- `NIM_API_KEY` — NVIDIA NIM API key

Optional:

- `LLM_PROVIDER` — defaults to `nvidia`
- `NIM_BASE_URL` — defaults to `https://integrate.api.nvidia.com/v1`
- `NIM_MODEL` — defaults to `openai/gpt-oss-20b`
- `DEXSCREENER_ENABLED` — `true` / `false`
- `WEBSITE_ENRICHMENT_ENABLED` — `true` / `false`

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## CI / validation

```bash
npm run ci
```

This runs:

- TypeScript typecheck
- Vitest tests
- Next.js production build

## Demo-safe behavior

MemeScope is intentionally resilient:

- If DexScreener returns nothing, the app still works from manual input.
- If website enrichment fails, the app shows a warning instead of failing.
- If NVIDIA NIM is unavailable or the response is malformed, the app emits a deterministic fallback report with an explicit notice.

## Suggested demo flow

1. Open the home page.
2. Click **BONK benchmark**.
3. Generate a report.
4. Call out:
   - confidence score
   - bull vs bear split
   - risk flags
   - narrative / meme angle
   - diligence checklist
   - share link + download JSON
5. Optionally switch to **Manual-only concept** to show the graceful fallback path when live market data is sparse.

A tighter talk track is in [`demo-script.md`](./demo-script.md).

## Prompt design

The main prompt lives in [`src/lib/prompts.ts`](./src/lib/prompts.ts). It explicitly forces:

- JSON-only output
- no fabricated facts
- missing-data disclosures
- compact operator-facing reasoning
- a consistent report schema for UI rendering

## Sources used in the implementation

- NVIDIA NIM docs, including the current OpenAI-compatible chat endpoint and `openai/gpt-oss-20b` model reference:
  - https://docs.api.nvidia.com/nim/reference/llm-apis
  - https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b
  - https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b-infer
- DexScreener API reference:
  - https://docs.dexscreener.com/api/reference

## Security and licensing notes

- Do **not** commit API keys.
- Store `NIM_API_KEY` in local env files or deployment secrets.
- This repo uses MIT for the code.
- Runtime dependencies were chosen to avoid obvious licensing risk.

## Submission assets in this repo

- [`demo-script.md`](./demo-script.md)
- [`submission-description.md`](./submission-description.md)
- [`elevator-pitch.md`](./elevator-pitch.md)

## Final manual steps before submission

1. Add `NIM_API_KEY` locally or in your deployment platform.
2. Record a short demo video using the script in `demo-script.md`.
3. Deploy the app (Vercel/Netlify are the fastest paths).
4. Paste the repo URL, deployment URL, and demo video into the hackathon submission.
5. Double-check that no secrets are committed before publishing.
