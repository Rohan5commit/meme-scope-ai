import { buildEnrichmentContext } from '@/lib/enrichment';
import { buildEmergencyFallbackReport, buildFallbackReport } from '@/lib/fallback-report';
import { getLlmProvider } from '@/lib/llm';
import { buildProjectLabel, buildInputDescriptor, normalizeInput } from '@/lib/normalize-input';
import { buildAnalysisPrompts } from '@/lib/prompts';
import {
  analysisReportSchema,
  modelAnalysisSchema,
  type AnalysisReport,
  type AnalysisRequestPayload,
  type ModelAnalysisDraft,
} from '@/lib/schema';
import { dedupeStrings, extractJsonObject, limitText } from '@/lib/utils';

const ANALYSIS_BUDGET_MS = 22_000;
const MIN_LLM_BUDGET_MS = 5_000;
const MAX_LLM_TIMEOUT_MS = 12_000;

function remainingBudget(deadlineAt: number) {
  return deadlineAt - Date.now();
}

function buildSafeFallback(
  input: ReturnType<typeof normalizeInput>,
  enrichment: Awaited<ReturnType<typeof buildEnrichmentContext>>,
  reason: string,
) {
  try {
    return buildFallbackReport({ input, enrichment, reason });
  } catch (fallbackError) {
    return buildEmergencyFallbackReport({
      input,
      enrichment,
      reason,
      fallbackReason: fallbackError instanceof Error ? limitText(fallbackError.message, 180) : 'Unknown fallback rendering error',
    });
  }
}

async function generateModelDraft(
  input: ReturnType<typeof normalizeInput>,
  enrichment: Awaited<ReturnType<typeof buildEnrichmentContext>>,
  timeoutMs: number,
) {
  const provider = getLlmProvider();
  const { systemPrompt, userPrompt } = buildAnalysisPrompts(input, enrichment);
  const completion = await provider.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens: 1800,
    timeoutMs,
  });

  const jsonText = extractJsonObject(completion.text);
  const payload = JSON.parse(jsonText) as ModelAnalysisDraft;
  return modelAnalysisSchema.parse(payload);
}

function finalizeReport(
  draft: ModelAnalysisDraft,
  input: ReturnType<typeof normalizeInput>,
  enrichment: Awaited<ReturnType<typeof buildEnrichmentContext>>,
): AnalysisReport {
  const projectLabel = buildProjectLabel(input);
  const mergedMissingData = dedupeStrings(
    [...draft.missingData, ...enrichment.missingData].map((item) => limitText(item, 160)),
  ).slice(0, 10);
  const mergedSourceNotes = dedupeStrings([
    ...draft.sourceNotes.map((item) => limitText(item, 220)),
    ...enrichment.sourceNotes.map((item) => limitText(item, 220)),
    buildInputDescriptor(input) ? limitText(`Input packet: ${buildInputDescriptor(input)}`, 220) : '',
  ]).slice(0, 12);
  const boundedWarnings = dedupeStrings(enrichment.warnings.map((item) => limitText(item, 220))).slice(0, 12);

  return analysisReportSchema.parse({
    ...draft,
    input,
    projectLabel,
    generatedAt: new Date().toISOString(),
    analysisMode: 'llm',
    missingData: mergedMissingData,
    sourceNotes: mergedSourceNotes,
    dataWarnings: boundedWarnings,
  });
}

export async function analyzeProject(payload: AnalysisRequestPayload) {
  const input = normalizeInput(payload);
  const deadlineAt = Date.now() + ANALYSIS_BUDGET_MS;
  const enrichment = await buildEnrichmentContext(input, { deadlineAt });
  const remainingForModel = remainingBudget(deadlineAt);

  if (remainingForModel < MIN_LLM_BUDGET_MS) {
    return buildSafeFallback(input, enrichment, `Runtime budget exhausted before live model call (${Math.max(0, remainingForModel)}ms remaining).`);
  }

  try {
    const draft = await generateModelDraft(
      input,
      enrichment,
      Math.min(MAX_LLM_TIMEOUT_MS, Math.max(MIN_LLM_BUDGET_MS, remainingForModel - 500)),
    );
    return finalizeReport(draft, input, enrichment);
  } catch (error) {
    return buildSafeFallback(input, enrichment, error instanceof Error ? limitText(error.message, 180) : 'Unknown generation error');
  }
}
