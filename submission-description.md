# Submission Description

## Project name

MemeScope AI

## One-line description

MemeScope AI is an AI copilot that turns noisy meme-token or internet-native project signals into a structured research memo with bull/bear framing, risk flags, narrative analysis, and share-ready communication assets.

## Problem

Meme tokens and culture-first internet projects move fast, but the research process is fragmented. Traders, creators, and community operators often have incomplete inputs — maybe only a ticker, a website, or a social handle — and still need to answer the same questions quickly:

- What is this project really?
- Why might it work?
- Why might it fail?
- What still needs to be checked?
- How do we explain it clearly to other people?

Most AI tools stop at generic chat output. Most research tools stop at raw market data. Neither gives a fast, presentation-ready decision surface.

## Solution

MemeScope AI combines input normalization, optional public-data enrichment, and structured AI analysis to produce a one-screen research report with:

- executive summary
- bull vs bear case
- risk flags
- narrative / meme angle analysis
- quick diligence checklist
- launch-ready social posts
- scorecard
- confidence and missing-data notices
- exportable JSON and shareable result page

## Why it is innovative

The novelty is not just "use an LLM on token data." MemeScope is designed as a **research-to-communication pipeline** for internet-native projects. It does three things together in one workflow:

1. **Clarifies the story** — what the project is and why people care.
2. **Surfaces the downside** — what is missing, ambiguous, or risky.
3. **Packages the output** — how to talk about it publicly without losing nuance.

That combination makes the app feel more like an operator tool than a chatbot.

## Technical implementation

- Next.js + TypeScript full-stack app
- typed API route with Zod validation
- visible prompt templates in source control
- NVIDIA NIM integration through the OpenAI-compatible chat endpoint
- optional enrichment from DexScreener and website metadata
- structured JSON model outputs
- deterministic fallback report when live AI or enrichment is unavailable
- compressed shareable result URLs + downloadable JSON export

## Practical value

MemeScope AI is useful for:

- traders screening narrative-heavy projects quickly
- creators trying to package a launch story clearly
- community operators who need to explain a token or project fast
- hackathon judges or reviewers who want one clean surface instead of scattered context

## Presentation strength

The product is intentionally optimized for demo clarity:

- one primary workflow
- polished responsive UI
- clear output hierarchy
- built-in seed examples
- visible confidence / missing-data notices
- shareable report page for judges or community voting

## Reliability decisions

Because hackathon time is limited, the implementation prioritizes a stable demo over fragile complexity:

- manual input works even if live data is sparse
- enrichment is optional, not required
- AI output is structured and validated
- fallback mode prevents hard failures

## Open-source / licensing

- MIT-licensed codebase
- no proprietary UI kits required
- secrets are not committed and must be provided via environment variables
