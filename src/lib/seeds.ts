import type { AnalysisRequestPayload } from '@/lib/schema';

export const EMPTY_ANALYSIS_FORM: AnalysisRequestPayload = {
  rawQuery: '',
  projectName: '',
  ticker: '',
  contractAddress: '',
  websiteUrl: '',
  xHandle: '',
  chainHint: '',
  notes: '',
};

export const DEMO_EXAMPLES: Array<{
  label: string;
  blurb: string;
  values: AnalysisRequestPayload;
}> = [
  {
    label: 'BONK benchmark',
    blurb: 'Real meme-token benchmark with likely live market context.',
    values: {
      ...EMPTY_ANALYSIS_FORM,
      projectName: 'BONK',
      ticker: 'BONK',
      chainHint: 'Solana',
      notes: 'Known Solana meme coin used as a benchmark for narrative clarity versus diligence depth.',
    },
  },
  {
    label: 'PEPE benchmark',
    blurb: 'Ethereum meme benchmark to compare narrative and risk framing.',
    values: {
      ...EMPTY_ANALYSIS_FORM,
      projectName: 'PEPE',
      ticker: 'PEPE',
      chainHint: 'Ethereum',
      notes: 'Use this to demonstrate how MemeScope separates viral narrative from actual diligence gaps.',
    },
  },
  {
    label: 'Manual-only concept',
    blurb: 'Demo the graceful fallback path even when live data is sparse.',
    values: {
      ...EMPTY_ANALYSIS_FORM,
      projectName: 'AI Meme Factory',
      ticker: 'AIMEME',
      notes: 'Internet-native AI meme project concept focused on creators, remix culture, and rapid content generation. No live token lookup required.',
      xHandle: '@aimemefactory',
    },
  },
];
