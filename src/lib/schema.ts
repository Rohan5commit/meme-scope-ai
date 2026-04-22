import { z } from 'zod';

const requestString = (max: number) => z.string().trim().max(max).optional().default('');
const boundedString = (max: number) => z.string().trim().min(1).max(max);

export const analysisRequestSchema = z
  .object({
    rawQuery: requestString(160),
    projectName: requestString(120),
    ticker: requestString(32),
    contractAddress: requestString(160),
    websiteUrl: requestString(300),
    xHandle: requestString(80),
    chainHint: requestString(40),
    notes: requestString(1600),
  })
  .refine((value) => Object.values(value).some(Boolean), {
    message: 'Provide at least one identifier or note.',
  });

export type AnalysisRequestPayload = z.infer<typeof analysisRequestSchema>;

export const normalizedInputSchema = z.object({
  rawQuery: z.string().optional(),
  projectName: z.string().optional(),
  ticker: z.string().optional(),
  contractAddress: z.string().optional(),
  websiteUrl: z.string().optional(),
  xHandle: z.string().optional(),
  chainHint: z.string().optional(),
  notes: z.string().optional(),
});

export type NormalizedInput = z.infer<typeof normalizedInputSchema>;

const scoreDetailSchema = z.object({
  score: z.number().min(0).max(10),
  rationale: boundedString(280),
});

const riskFlagSchema = z.object({
  title: boundedString(120),
  severity: z.enum(['low', 'medium', 'high']),
  rationale: boundedString(280),
  evidence: z.string().trim().max(220).optional().default(''),
});

const checklistItemSchema = z.object({
  item: boundedString(120),
  whyItMatters: boundedString(220),
  status: z.enum(['required', 'recommended', 'manual']),
});

export const modelAnalysisSchema = z.object({
  executiveSummary: boundedString(900),
  bullCase: z.array(boundedString(280)).min(3).max(6),
  bearCase: z.array(boundedString(280)).min(3).max(6),
  riskFlags: z.array(riskFlagSchema).min(3).max(8),
  narrative: z.object({
    memeAngle: boundedString(240),
    audience: boundedString(200),
    positioning: boundedString(240),
    whyItSpreads: boundedString(280),
  }),
  diligenceChecklist: z.array(checklistItemSchema).min(4).max(8),
  socialPosts: z.object({
    launchThread: z.array(boundedString(280)).min(4).max(6),
    shortPost: boundedString(320),
    disclaimer: boundedString(220),
  }),
  scorecard: z.object({
    clarity: scoreDetailSchema,
    narrativeStrength: scoreDetailSchema,
    risk: scoreDetailSchema,
    communityPotential: scoreDetailSchema,
  }),
  confidence: z.object({
    score: z.number().int().min(0).max(100),
    rationale: boundedString(280),
  }),
  missingData: z.array(boundedString(160)).max(10).default([]),
  sourceNotes: z.array(boundedString(220)).max(12).default([]),
});

export type ModelAnalysisDraft = z.infer<typeof modelAnalysisSchema>;

export const analysisReportSchema = modelAnalysisSchema.extend({
  input: normalizedInputSchema,
  projectLabel: boundedString(120),
  generatedAt: boundedString(80),
  dataWarnings: z.array(boundedString(220)).max(12).default([]),
  analysisMode: z.enum(['llm', 'fallback']),
});

export type AnalysisReport = z.infer<typeof analysisReportSchema>;
