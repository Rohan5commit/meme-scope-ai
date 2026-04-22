import type { AnalysisRequestPayload, NormalizedInput } from '@/lib/schema';
import { hostFromUrl, truncateMiddle } from '@/lib/utils';

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TICKER_PATTERN = /^\$?[A-Za-z][A-Za-z0-9_-]{1,10}$/;
const DOMAIN_PATTERN = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/.*)?$/;

function cleanValue(value?: string) {
  return value?.trim() || '';
}

export function looksLikeContractAddress(value: string) {
  return EVM_ADDRESS.test(value) || SOLANA_ADDRESS.test(value);
}

export function looksLikeTicker(value: string) {
  return TICKER_PATTERN.test(value.trim());
}

export function looksLikeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  return DOMAIN_PATTERN.test(trimmed);
}

export function cleanHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const withoutProtocol = trimmed
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/^x\.com\//i, '')
    .replace(/^twitter\.com\//i, '')
    .replace(/^@/, '');

  return withoutProtocol.split(/[/?#]/)[0]?.trim() || '';
}

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeInput(input: AnalysisRequestPayload): NormalizedInput {
  const normalized: NormalizedInput = {
    rawQuery: cleanValue(input.rawQuery) || undefined,
    projectName: cleanValue(input.projectName) || undefined,
    ticker: cleanValue(input.ticker).replace(/^\$/, '').toUpperCase() || undefined,
    contractAddress: cleanValue(input.contractAddress) || undefined,
    websiteUrl: cleanValue(input.websiteUrl) ? normalizeWebsiteUrl(input.websiteUrl) : undefined,
    xHandle: cleanValue(input.xHandle) ? cleanHandle(input.xHandle) : undefined,
    chainHint: cleanValue(input.chainHint) || undefined,
    notes: cleanValue(input.notes) || undefined,
  };

  const rawQuery = cleanValue(input.rawQuery);
  if (!rawQuery) {
    return normalized;
  }

  if (!normalized.websiteUrl && looksLikeUrl(rawQuery)) {
    normalized.websiteUrl = normalizeWebsiteUrl(rawQuery);
    return normalized;
  }

  const maybeHandle = cleanHandle(rawQuery);
  if (!normalized.xHandle && maybeHandle && (rawQuery.startsWith('@') || rawQuery.includes('x.com/') || rawQuery.includes('twitter.com/'))) {
    normalized.xHandle = maybeHandle;
    return normalized;
  }

  if (!normalized.contractAddress && looksLikeContractAddress(rawQuery)) {
    normalized.contractAddress = rawQuery;
    return normalized;
  }

  if (!normalized.ticker && looksLikeTicker(rawQuery)) {
    normalized.ticker = rawQuery.replace(/^\$/, '').toUpperCase();
    return normalized;
  }

  if (!normalized.projectName) {
    normalized.projectName = rawQuery;
  }

  return normalized;
}

export function buildProjectLabel(input: NormalizedInput) {
  if (input.projectName) {
    return input.projectName;
  }

  if (input.ticker) {
    return `$${input.ticker}`;
  }

  if (input.xHandle) {
    return `@${input.xHandle}`;
  }

  if (input.websiteUrl) {
    return hostFromUrl(input.websiteUrl);
  }

  if (input.contractAddress) {
    return truncateMiddle(input.contractAddress, 8, 6);
  }

  return 'Unknown project';
}

export function buildInputDescriptor(input: NormalizedInput) {
  const parts = [
    input.projectName ? `name: ${input.projectName}` : '',
    input.ticker ? `ticker: ${input.ticker}` : '',
    input.chainHint ? `chain: ${input.chainHint}` : '',
    input.websiteUrl ? `website: ${hostFromUrl(input.websiteUrl)}` : '',
    input.xHandle ? `x: @${input.xHandle}` : '',
    input.contractAddress ? `contract: ${truncateMiddle(input.contractAddress, 8, 6)}` : '',
  ].filter(Boolean);

  return parts.join(' • ');
}
