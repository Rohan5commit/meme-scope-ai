import type { AnalysisReport, NormalizedInput } from '@/lib/schema';
import { analysisReportSchema } from '@/lib/schema';
import type { EnrichmentContext } from '@/lib/enrichment';
import { buildProjectLabel } from '@/lib/normalize-input';
import { clamp, dedupeStrings, formatCurrency, hostFromUrl, limitText } from '@/lib/utils';

interface FallbackArgs {
  input: NormalizedInput;
  enrichment: EnrichmentContext;
  reason: string;
}

interface EmergencyFallbackArgs extends FallbackArgs {
  fallbackReason?: string;
}

function inferNarrativeTag(input: NormalizedInput) {
  const haystack = [input.projectName, input.ticker, input.notes].filter(Boolean).join(' ').toLowerCase();

  if (/ai|agent|copilot|model/.test(haystack)) {
    return 'AI-inflected meme narrative';
  }

  if (/dog|shib|inu|bonk/.test(haystack)) {
    return 'dog-coin community identity';
  }

  if (/cat|mog/.test(haystack)) {
    return 'cat-coin internet irony';
  }

  if (/pepe|frog/.test(haystack)) {
    return 'frog-meme internet-native identity';
  }

  if (/fart|lol|meme/.test(haystack)) {
    return 'absurdist humor and screenshot culture';
  }

  return 'culture-first internet-native positioning';
}

function buildBullCase(input: NormalizedInput, enrichment: EnrichmentContext) {
  const projectLabel = buildProjectLabel(input);
  const points: string[] = [];

  if (enrichment.dexPair) {
    points.push(
      `${projectLabel} already has a live market footprint on ${enrichment.dexPair.chainId}, with ${formatCurrency(enrichment.dexPair.liquidityUsd)} liquidity and ${formatCurrency(enrichment.dexPair.volume24h)} in 24h volume.`,
    );
  }

  if (enrichment.websitePreview?.description || input.notes) {
    points.push(
      `There is at least some message surface area to explain the project, which makes it easier to turn into a coherent narrative rather than pure ticker speculation.`,
    );
  }

  if (input.ticker) {
    points.push(`The ticker ${input.ticker} is concise and easy to repeat, which helps with recall and screenshot sharing.`);
  }

  if (enrichment.dexPair?.socials.length || input.xHandle) {
    points.push(`Social discovery paths exist, which lowers the friction for community due diligence and public discussion.`);
  }

  while (points.length < 3) {
    points.push('The project can still work if it turns its story into a repeatable meme, keeps the message simple, and avoids obvious trust-breaking signals.');
  }

  return points.slice(0, 4);
}

function buildBearCase(input: NormalizedInput, enrichment: EnrichmentContext) {
  const points: string[] = [];

  if (!input.contractAddress) {
    points.push('Without an explicit contract address, a user cannot quickly verify the exact asset being discussed or compare contract-level red flags.');
  }

  if (!input.websiteUrl) {
    points.push('No canonical website means the narrative has to be inferred from fragmented signals, which is a common failure mode for meme launches.');
  }

  if (!input.xHandle) {
    points.push('No X/Twitter handle limits the ability to inspect cadence, tone, community quality, and whether the narrative is organically spreading.');
  }

  if (enrichment.dexPair && (enrichment.dexPair.liquidityUsd ?? 0) < 100_000) {
    points.push('Liquidity appears thin enough that attention can be highly reflexive and fragile, which increases execution risk around any narrative breakout.');
  }

  if (!enrichment.dexPair) {
    points.push('If no market match is found, there may be ambiguity around ticker collisions, chain selection, or whether the project has real trading activity yet.');
  }

  while (points.length < 3) {
    points.push('The project still needs proof that its meme can outlast a short-lived attention spike and convert into real community retention.');
  }

  return points.slice(0, 4);
}

export function buildFallbackReport({ input, enrichment, reason }: FallbackArgs): AnalysisReport {
  const projectLabel = buildProjectLabel(input);
  const narrativeTag = inferNarrativeTag(input);
  const marketPresent = Boolean(enrichment.dexPair);
  const websitePresent = Boolean(enrichment.websitePreview);

  const missingData = dedupeStrings(enrichment.missingData.map((item) => limitText(item, 160)))
    .map((item) => limitText(item, 160))
    .slice(0, 10);
  const dataWarnings = dedupeStrings([
    ...enrichment.warnings.map((item) => limitText(item, 220)),
    `Live LLM generation was unavailable, so MemeScope emitted a deterministic backup report: ${limitText(reason, 140)}.`,
  ])
    .map((item) => limitText(item, 220))
    .slice(0, 12);

  const clarity = clamp((input.projectName ? 3 : 1) + (input.websiteUrl ? 2 : 0) + (input.notes ? 2 : 0) + (marketPresent ? 2 : 0), 2, 9);
  const narrativeStrength = clamp((input.ticker ? 3 : 1) + (input.notes ? 2 : 0) + (websitePresent ? 1 : 0) + (/meme|ai|dog|cat|frog|pepe|bonk|mog|fart/i.test([input.projectName, input.ticker, input.notes].join(' ')) ? 2 : 0), 3, 9);
  const risk = clamp(8 - missingData.length * 0.6 - (!marketPresent ? 1.5 : 0) - (!input.contractAddress ? 1 : 0), 2, 8.5);
  const communityPotential = clamp((input.xHandle ? 2 : 0) + (input.ticker ? 2 : 1) + (marketPresent ? 2 : 0) + (websitePresent ? 1 : 0) + 2, 3, 9);
  const confidence = clamp(38 + (marketPresent ? 18 : 0) + (websitePresent ? 10 : 0) + (input.notes ? 8 : 0) - missingData.length * 4, 28, 74);

  const riskFlags = [
    {
      title: !input.contractAddress ? 'Contract ambiguity' : 'Contract still needs direct review',
      severity: !input.contractAddress ? 'high' : 'medium',
      rationale: !input.contractAddress
        ? 'The exact onchain asset is not pinned down, so ticker collisions and spoofing risk remain material.'
        : 'Even with a contract address, holder distribution, permissions, and deployment history still need direct checks.',
      evidence: input.contractAddress ? input.contractAddress : 'No contract address provided',
    },
    {
      title: marketPresent ? 'Narrative must survive market reality' : 'No clear market footprint',
      severity: marketPresent ? 'medium' : 'high',
      rationale: marketPresent
        ? 'Market activity exists, but meme projects still fail when liquidity, holder concentration, or narrative consistency break down.'
        : 'Without a confirmed live market match, it is hard to separate a real project from an idea or a low-signal ticker collision.',
      evidence: marketPresent
        ? `DexScreener candidate on ${enrichment.dexPair?.chainId} with ${formatCurrency(enrichment.dexPair?.liquidityUsd)} liquidity.`
        : 'DexScreener did not resolve a strong candidate from the supplied identifiers.',
    },
    {
      title: websitePresent ? 'Messaging still needs proof' : 'Messaging surface is thin',
      severity: websitePresent ? 'medium' : 'high',
      rationale: websitePresent
        ? 'A website helps, but operators still need to verify that the product story and social story actually match what traders are repeating.'
        : 'No canonical website was supplied, so the narrative can easily drift or be hijacked by rumor.',
      evidence: websitePresent ? enrichment.websitePreview?.host ?? 'Website supplied' : 'No website URL provided',
    },
  ];

  const checklist = [
    {
      item: 'Confirm the exact contract and chain',
      whyItMatters: 'Removes ticker confusion and anchors all later diligence to a single asset.',
      status: 'required' as const,
    },
    {
      item: 'Check top holders and deployer behavior',
      whyItMatters: 'Holder concentration and deployer patterns often dominate downside in meme launches.',
      status: 'required' as const,
    },
    {
      item: 'Validate liquidity depth and where it trades',
      whyItMatters: 'Thin liquidity can make a strong meme look healthy until exits actually matter.',
      status: 'required' as const,
    },
    {
      item: 'Review website and socials for consistency',
      whyItMatters: 'Narrative mismatch is one of the fastest ways a community loses trust.',
      status: 'recommended' as const,
    },
    {
      item: 'Look for proof of community retention beyond screenshots',
      whyItMatters: 'A meme can trend briefly without converting into a real holder base.',
      status: 'recommended' as const,
    },
    {
      item: 'Add manual notes after reading the primary sources',
      whyItMatters: 'MemeScope improves sharply when it has direct operator context, not just public metadata.',
      status: 'manual' as const,
    },
  ];

  const launchThread = [
    `1/ ${projectLabel} looks like a ${narrativeTag} play — easy to understand, but still needs evidence before anyone should trust the story blindly.`,
    `2/ Bull case: ${buildBullCase(input, enrichment)[0]}`,
    `3/ Bear case: ${buildBearCase(input, enrichment)[0]}`,
    `4/ Fast diligence checklist: confirm contract, inspect holders/liquidity, and verify that the public narrative matches the actual project surface area.`,
  ];

  return analysisReportSchema.parse({
    input,
    projectLabel,
    generatedAt: new Date().toISOString(),
    analysisMode: 'fallback',
    executiveSummary: `${projectLabel} currently reads like a ${narrativeTag}. The opportunity is mostly narrative-driven: if the meme is sticky and the public story is coherent, attention can compound quickly. The main limitation is verification depth — key diligence gaps remain around contract specificity, social context, and whether the visible narrative is backed by enough real project surface area to sustain attention.`,
    bullCase: buildBullCase(input, enrichment),
    bearCase: buildBearCase(input, enrichment),
    riskFlags,
    narrative: {
      memeAngle: `${projectLabel} plays best as a ${narrativeTag} with a simple, repeatable one-line story.`,
      audience: 'Meme-token traders, CT lurkers, culture-first communities, and launch watchers looking for fast narrative legibility.',
      positioning: `${projectLabel} should be framed as a fast-to-understand internet-native identity play, not as a complicated product story.`,
      whyItSpreads: 'These projects spread when the ticker is memorable, the joke is immediately legible, and the community can remix the narrative faster than critics can compress it.',
    },
    diligenceChecklist: checklist,
    socialPosts: {
      launchThread,
      shortPost: `${projectLabel}: clear meme, incomplete diligence. Strongest next step is to verify contract, holders, liquidity, and whether the public narrative is actually coherent across website + socials.`,
      disclaimer: 'For research and communication support only — not financial advice.',
    },
    scorecard: {
      clarity: {
        score: Number(clarity.toFixed(1)),
        rationale: 'Story clarity improves when the project has a name, website, notes, and a resolved market candidate instead of just a raw ticker.',
      },
      narrativeStrength: {
        score: Number(narrativeStrength.toFixed(1)),
        rationale: 'Narrative strength tracks how easy the meme is to repeat, remix, and explain in one screenshot or one sentence.',
      },
      risk: {
        score: Number(risk.toFixed(1)),
        rationale: 'Higher is cleaner. Missing contract, weak market evidence, and thin messaging surface all drag the score down.',
      },
      communityPotential: {
        score: Number(communityPotential.toFixed(1)),
        rationale: 'Community potential rises when a project has a memorable ticker, visible social handles, and enough signal for others to discuss it publicly.',
      },
    },
    confidence: {
      score: Math.round(confidence),
      rationale: 'Confidence is moderate because this backup mode only uses available metadata and explicit inputs; it avoids pretending to know what was not supplied.',
    },
    missingData,
    dataWarnings,
    sourceNotes: dedupeStrings([
      ...enrichment.sourceNotes.map((item) => limitText(item, 220)),
      `Backup mode summary generated from explicit inputs and any successfully retrieved public metadata.`,
      input.websiteUrl ? `Website host: ${hostFromUrl(input.websiteUrl)}` : '',
    ])
      .map((item) => limitText(item, 220))
      .slice(0, 12),
  });
}

export function buildEmergencyFallbackReport({
  input,
  enrichment,
  reason,
  fallbackReason,
}: EmergencyFallbackArgs): AnalysisReport {
  const projectLabel = limitText(buildProjectLabel(input) || 'Unknown project', 120);
  const missingData = dedupeStrings(
    [
      ...enrichment.missingData.map((item) => limitText(item, 160)),
      'Live model output was unavailable, so this report uses the emergency backup renderer.',
    ],
  )
    .map((item) => limitText(item, 160))
    .slice(0, 10);

  const dataWarnings = dedupeStrings(
    [
      ...enrichment.warnings.map((item) => limitText(item, 220)),
      `Emergency backup report used after generation failure: ${limitText(reason, 120)}.`,
      fallbackReason ? `Fallback renderer recovery note: ${limitText(fallbackReason, 120)}.` : '',
    ],
  )
    .map((item) => limitText(item, 220))
    .slice(0, 12);

  const sourceNotes = dedupeStrings(
    [
      ...enrichment.sourceNotes.map((item) => limitText(item, 220)),
      'Emergency backup mode used to guarantee a stable, shareable report.',
      input.websiteUrl ? limitText(`Website host: ${hostFromUrl(input.websiteUrl)}`, 220) : '',
    ],
  )
    .map((item) => limitText(item, 220))
    .slice(0, 12);

  return analysisReportSchema.parse({
    input,
    projectLabel,
    generatedAt: new Date().toISOString(),
    analysisMode: 'fallback',
    executiveSummary: `${projectLabel} could not complete the full live analysis path, so MemeScope returned a compact emergency memo instead. Use it as a fast operator brief, then verify contract, holder structure, liquidity, and primary-source messaging before acting.`,
    bullCase: [
      `${projectLabel} is still easy to summarize quickly, which is valuable for a demo and for first-pass research.`,
      'MemeScope preserved the core diligence workflow instead of failing hard when live generation became unreliable.',
      'Users can still leave with a risk-aware memo, checklist, and social-ready framing even under degraded conditions.',
    ],
    bearCase: [
      'This path intentionally sacrifices nuance to guarantee stability.',
      'Missing source data still limits conviction until the operator checks the primary links directly.',
      'Emergency output should support diligence, not replace contract-level and market-structure verification.',
    ],
    riskFlags: [
      {
        title: 'Primary-source verification still required',
        severity: 'high',
        rationale: 'Emergency mode is designed for continuity, not for high-conviction judgment under uncertainty.',
        evidence: input.contractAddress ? limitText(input.contractAddress, 220) : 'No contract address provided',
      },
      {
        title: 'Model path degraded',
        severity: 'medium',
        rationale: 'The live generation path did not complete cleanly, so the memo is intentionally conservative.',
        evidence: limitText(reason, 220),
      },
      {
        title: 'Narrative context may be incomplete',
        severity: 'medium',
        rationale: 'Without complete social and contract context, meme-token narratives can be misleading.',
        evidence: input.xHandle ? limitText(`Handle supplied: ${input.xHandle}`, 220) : 'No X/Twitter handle provided',
      },
    ],
    narrative: {
      memeAngle: `${projectLabel} should be framed as a fast, evidence-aware meme research candidate rather than a certainty-heavy call.`,
      audience: 'Traders, creators, and communities who need a rapid first-pass memo before deeper diligence.',
      positioning: `${projectLabel} is best presented as a quick operator brief with explicit uncertainty handling.`,
      whyItSpreads: 'This format spreads because it compresses noisy inputs into a simple, readable memo with visible caveats.',
    },
    diligenceChecklist: [
      {
        item: 'Confirm contract and chain',
        whyItMatters: 'It anchors every later check to the exact asset.',
        status: 'required',
      },
      {
        item: 'Inspect holders and liquidity',
        whyItMatters: 'Concentration and exit depth drive downside in meme launches.',
        status: 'required',
      },
      {
        item: 'Review website and socials directly',
        whyItMatters: 'Primary sources often expose narrative drift or weak execution.',
        status: 'recommended',
      },
      {
        item: 'Add manual operator notes',
        whyItMatters: 'The analysis sharpens once explicit context is added.',
        status: 'manual',
      },
    ],
    socialPosts: {
      launchThread: [
        `1/ ${projectLabel} is in emergency memo mode: quick read, clear caveats, and no fake certainty.`,
        '2/ Use this output to frame the opportunity and the risks before spending time on deeper due diligence.',
        '3/ Priority checks: confirm contract, inspect holders/liquidity, and compare website + socials for consistency.',
        '4/ The goal is reliability under noisy conditions, not hype masquerading as conviction.',
      ],
      shortPost: `${projectLabel}: emergency memo mode is live. Fast summary, visible caveats, and a diligence checklist before deeper research.`,
      disclaimer: 'For research support only — not financial advice.',
    },
    scorecard: {
      clarity: {
        score: 6.2,
        rationale: 'The memo stays readable even when the richer model path is unavailable.',
      },
      narrativeStrength: {
        score: 6.4,
        rationale: 'Narrative assessment is intentionally conservative in emergency mode.',
      },
      risk: {
        score: 4.8,
        rationale: 'Risk remains elevated until contract, holders, and primary messaging are verified directly.',
      },
      communityPotential: {
        score: 6.0,
        rationale: 'Community potential depends on social proof and repeatable meme identity, both of which still need checks.',
      },
    },
    confidence: {
      score: 42,
      rationale: 'Confidence is capped because emergency mode prioritizes availability over deeper model reasoning.',
    },
    missingData,
    dataWarnings,
    sourceNotes,
  });
}
