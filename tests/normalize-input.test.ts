import { describe, expect, it } from 'vitest';
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

describe('normalizeInput', () => {
  it('extracts contract addresses from the raw query field', () => {
    const result = normalizeInput({
      ...emptyPayload,
      rawQuery: '0x1234567890abcdef1234567890abcdef12345678',
    });

    expect(result.contractAddress).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('normalizes website URLs and x handles', () => {
    const result = normalizeInput({
      ...emptyPayload,
      websiteUrl: 'example.com',
      xHandle: 'https://x.com/memescopeai',
    });

    expect(result.websiteUrl).toBe('https://example.com');
    expect(result.xHandle).toBe('memescopeai');
  });

  it('promotes raw tickers into structured ticker fields', () => {
    const result = normalizeInput({
      ...emptyPayload,
      rawQuery: '$bonk',
    });

    expect(result.ticker).toBe('BONK');
  });
});
