import { buildEnrichmentContext } from '@/lib/enrichment';
import { buildFallbackReport } from '@/lib/fallback-report';
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

async function generateModelDraft(input: ReturnType<typeof normalizeInput>, enrichment: Awaited<ReturnType<typeof buildEnrichmentContext>>) {
  const provider = getLlmProvider();
  const { systemPrompt, userPrompt } = buildAnalysisPrompts(input, enrichment);
  const completion = await provider.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens: 1800,
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
  const mergedMissingData = dedupeStrings([...draft.missingData, ...enrichment.missingData]).slice(0, 10);
  const mergedSourceNotes = dedupeStrings([
    ...draft.sourceNotes,
    ...enrichment.sourceNotes,
    buildInputDescriptor(input) ? `Input packet: ${buildInputDescriptor(input)}` : '',
  ]).slice(0, 12);

  return analysisReportSchema.parse({
    ...draft,
    input,
    projectLabel,
    generatedAt: new Date().toISOString(),
    analysisMode: 'llm',
    missingData: mergedMissingData,
    sourceNotes: mergedSourceNotes,
    dataWarnings: enrichment.warnings,
  });
}

export async function analyzeProject(payload: AnalysisRequestPayload) {
  const input = normalizeInput(payload);
  const enrichment = await buildEnrichmentContext(input);

  try {
    const draft = await generateModelDraft(input, enrichment);
    return finalizeReport(draft, input, enrichment);
  } catch (error) {
    return buildFallbackReport({
      input,
      enrichment,
      reason: error instanceof Error ? limitText(error.message, 180) : 'Unknown generation error',
    });
  }
}
