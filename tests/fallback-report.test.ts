import { describe, expect, it } from 'vitest';
import { buildFallbackReport } from '../src/lib/fallback-report';
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
});
