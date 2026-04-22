import { describe, expect, it } from 'vitest';
import { buildEmergencyFallbackReport, buildFallbackReport } from '../src/lib/fallback-report';
import { normalizeInput } from '../src/lib/normalize-input';
import type { AnalysisRequestPayload } from '../src/lib/schema';

const emptyPayload: AnalysisRequestPayload = {
  rawQuery: '',
  projectName: '',
  ticker: '',
  contractAddress: '',
  websiteUrl: '',
  xHandle: '',
  chainHint: '',
  notes: '',
};

describe('buildFallbackReport', () => {
  it('returns a valid fallback analysis with explicit warnings', () => {
    const input = normalizeInput({
      ...emptyPayload,
      projectName: 'BONK',
      ticker: 'BONK',
      notes: 'Solana meme benchmark for testing.',
    });

    const report = buildFallbackReport({
      input,
      enrichment: {
        missingData: ['No website URL was supplied, so product messaging had to be inferred from other signals.'],
        warnings: [],
        sourceNotes: ['Manual input only.'],
      },
      reason: 'Missing NIM_API_KEY',
    });

    expect(report.analysisMode).toBe('fallback');
    expect(report.bullCase.length).toBeGreaterThanOrEqual(3);
    expect(report.riskFlags.length).toBeGreaterThanOrEqual(3);
    expect(report.dataWarnings[0]).toContain('deterministic backup report');
  });

  it('clamps long enrichment strings so fallback mode stays schema-safe', () => {
    const input = normalizeInput({
      ...emptyPayload,
      projectName: 'BONK',
      ticker: 'BONK',
      websiteUrl: 'https://bonkcoin.com',
      notes: 'Solana meme benchmark for testing.',
    });

    const tooLong = 'x'.repeat(500);
    const report = buildFallbackReport({
      input,
      enrichment: {
        missingData: [tooLong],
        warnings: [tooLong],
        sourceNotes: [tooLong],
      },
      reason: tooLong,
    });

    expect(report.missingData.every((item) => item.length <= 160)).toBe(true);
    expect(report.dataWarnings.every((item) => item.length <= 220)).toBe(true);
    expect(report.sourceNotes.every((item) => item.length <= 220)).toBe(true);
  });

  it('can emit an emergency fallback report if the normal fallback renderer breaks', () => {
    const input = normalizeInput({
      ...emptyPayload,
      projectName: 'BONK',
      ticker: 'BONK',
    });

    const report = buildEmergencyFallbackReport({
      input,
      enrichment: {
        missingData: [],
        warnings: [],
        sourceNotes: [],
      },
      reason: 'Model output exceeded bounds.',
      fallbackReason: 'Fallback renderer also exceeded a schema bound.',
    });

    expect(report.analysisMode).toBe('fallback');
    expect(report.executiveSummary.length).toBeGreaterThan(20);
    expect(report.socialPosts.launchThread).toHaveLength(4);
  });
});
