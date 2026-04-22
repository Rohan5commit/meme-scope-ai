import type { NormalizedInput } from '@/lib/schema';
import { dedupeStrings, formatCompact, formatCurrency, hostFromUrl, limitText, safeNumber, withTimeout } from '@/lib/utils';

export interface DexPairSnapshot {
  query: string;
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseTokenName: string;
  baseTokenSymbol: string;
  quoteTokenSymbol?: string;
  priceUsd?: number;
  liquidityUsd?: number;
  volume24h?: number;
  marketCap?: number;
  fdv?: number;
  buys24h?: number;
  sells24h?: number;
  websites: string[];
  socials: string[];
}

export interface WebsitePreview {
  finalUrl: string;
  host: string;
  title?: string;
  description?: string;
}

export interface EnrichmentContext {
  dexPair?: DexPairSnapshot;
  websitePreview?: WebsitePreview;
  missingData: string[];
  warnings: string[];
  sourceNotes: string[];
}

function candidateQueries(input: NormalizedInput) {
  const candidates = [
    input.contractAddress,
    input.ticker,
    [input.projectName, input.ticker].filter(Boolean).join(' '),
    input.projectName,
    input.rawQuery,
  ];

  return dedupeStrings(candidates.filter(Boolean) as string[]).slice(0, 4);
}

function scorePair(pair: Record<string, unknown>) {
  const liquidity = safeNumber((pair.liquidity as { usd?: number } | undefined)?.usd) ?? 0;
  const volume = safeNumber((pair.volume as { h24?: number } | undefined)?.h24) ?? 0;
  const marketCap = safeNumber(pair.marketCap) ?? safeNumber(pair.fdv) ?? 0;
  const boosts = safeNumber((pair.boosts as { active?: number } | undefined)?.active) ?? 0;
  const socials = Array.isArray((pair.info as { socials?: unknown[] } | undefined)?.socials)
    ? ((pair.info as { socials?: unknown[] }).socials?.length ?? 0)
    : 0;

  return Math.log10(liquidity + 1) * 4 + Math.log10(volume + 1) * 3 + Math.log10(marketCap + 1) * 2 + boosts + socials * 0.4;
}

function flattenSocialUrl(item: Record<string, unknown>) {
  const directUrl = typeof item.url === 'string' ? item.url : undefined;
  if (directUrl) {
    return directUrl;
  }

  const platform = typeof item.platform === 'string' ? item.platform : 'social';
  const handle = typeof item.handle === 'string' ? item.handle : '';
  return handle ? `${platform}:${handle}` : platform;
}

async function fetchDexScreenerPair(input: NormalizedInput) {
  const queries = candidateQueries(input);

  for (const query of queries) {
    const endpoint = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
    const response = await withTimeout(
      fetch(endpoint, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      }),
      7000,
      'DexScreener',
    );

    if (!response.ok) {
      throw new Error(`DexScreener search failed with ${response.status}`);
    }

    const payload = (await response.json()) as { pairs?: Array<Record<string, unknown>> };
    const pairs = payload.pairs ?? [];
    if (!pairs.length) {
      continue;
    }

    const sorted = [...pairs].sort((left, right) => scorePair(right) - scorePair(left));
    const best = sorted[0];
    const info = (best.info as Record<string, unknown> | undefined) ?? {};

    const websites = Array.isArray(info.websites)
      ? (info.websites as Array<Record<string, unknown>>)
          .map((item) => (typeof item.url === 'string' ? item.url : ''))
          .filter(Boolean)
      : [];
    const socials = Array.isArray(info.socials)
      ? (info.socials as Array<Record<string, unknown>>).map(flattenSocialUrl).filter(Boolean)
      : [];

    return {
      pair: {
        query,
        chainId: String(best.chainId ?? 'unknown'),
        dexId: String(best.dexId ?? 'unknown'),
        url: String(best.url ?? ''),
        pairAddress: String(best.pairAddress ?? ''),
        baseTokenName: String(((best.baseToken as Record<string, unknown> | undefined)?.name as string | undefined) ?? input.projectName ?? 'Unknown token'),
        baseTokenSymbol: String(((best.baseToken as Record<string, unknown> | undefined)?.symbol as string | undefined) ?? input.ticker ?? 'UNKNOWN'),
        quoteTokenSymbol: ((best.quoteToken as Record<string, unknown> | undefined)?.symbol as string | undefined) ?? undefined,
        priceUsd: safeNumber(best.priceUsd),
        liquidityUsd: safeNumber((best.liquidity as { usd?: number } | undefined)?.usd),
        volume24h: safeNumber((best.volume as { h24?: number } | undefined)?.h24),
        marketCap: safeNumber(best.marketCap),
        fdv: safeNumber(best.fdv),
        buys24h: safeNumber(((best.txns as { h24?: { buys?: number } } | undefined)?.h24?.buys) ?? undefined),
        sells24h: safeNumber(((best.txns as { h24?: { sells?: number } } | undefined)?.h24?.sells) ?? undefined),
        websites,
        socials,
      } satisfies DexPairSnapshot,
      candidateCount: pairs.length,
    };
  }

  return null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html: string, key: string, attr: 'name' | 'property' = 'name') {
  const regex = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']{1,320})["'][^>]*>`, 'i');
  return decodeHtml(html.match(regex)?.[1] ?? '');
}

async function fetchWebsitePreview(url: string) {
  const response = await withTimeout(
    fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'MemeScopeAI/0.1 (+https://github.com/Rohan5commit/meme-scope-ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
    }),
    7000,
    'Website fetch',
  );

  if (!response.ok) {
    throw new Error(`Website returned ${response.status}`);
  }

  const html = (await response.text()).slice(0, 120_000);
  const title = decodeHtml(html.match(/<title[^>]*>([^<]{1,220})<\/title>/i)?.[1] ?? '');
  const description =
    extractMeta(html, 'description') ||
    extractMeta(html, 'og:description', 'property') ||
    extractMeta(html, 'twitter:description', 'name');

  return {
    finalUrl: response.url || url,
    host: hostFromUrl(response.url || url),
    title: title || undefined,
    description: description || undefined,
  } satisfies WebsitePreview;
}

export async function buildEnrichmentContext(input: NormalizedInput): Promise<EnrichmentContext> {
  const missingData: string[] = [];
  const warnings: string[] = [];
  const sourceNotes: string[] = [];

  let dexPair: DexPairSnapshot | undefined;
  let websitePreview: WebsitePreview | undefined;

  if (process.env.DEXSCREENER_ENABLED !== 'false' && (input.contractAddress || input.ticker || input.projectName || input.rawQuery)) {
    try {
      const result = await fetchDexScreenerPair(input);
      if (result) {
        dexPair = result.pair;
        sourceNotes.push(
          limitText(
            `DexScreener: ${dexPair.baseTokenSymbol}/${dexPair.quoteTokenSymbol ?? '?'} on ${dexPair.chainId} via ${dexPair.dexId} • liquidity ${formatCurrency(dexPair.liquidityUsd)} • volume 24h ${formatCurrency(dexPair.volume24h)}`,
            220,
          ),
        );
        if (result.candidateCount > 1) {
          warnings.push(`DexScreener returned ${result.candidateCount} possible matches. MemeScope selected the highest-signal candidate.`);
        }
      } else {
        missingData.push('No DexScreener market match was found from the provided identifiers.');
      }
    } catch (error) {
      warnings.push(`DexScreener enrichment failed: ${error instanceof Error ? limitText(error.message, 120) : 'unknown error'}.`);
    }
  } else {
    missingData.push('No market-searchable identifier was available for token enrichment.');
  }

  if (process.env.WEBSITE_ENRICHMENT_ENABLED !== 'false' && input.websiteUrl) {
    try {
      websitePreview = await fetchWebsitePreview(input.websiteUrl);
      sourceNotes.push(
        limitText(
          `Website metadata from ${websitePreview.host}: ${websitePreview.title ?? 'no title'}${websitePreview.description ? ` • ${websitePreview.description}` : ''}`,
          220,
        ),
      );
    } catch (error) {
      warnings.push(`Website enrichment failed: ${error instanceof Error ? limitText(error.message, 120) : 'unknown error'}.`);
    }
  } else {
    missingData.push('No website URL was supplied, so product messaging had to be inferred from other signals.');
  }

  if (!input.xHandle) {
    missingData.push('No X/Twitter handle was supplied, so social narrative context is limited.');
  }

  if (!input.contractAddress) {
    missingData.push('No explicit contract address was supplied for direct contract-level diligence.');
  }

  if (!input.notes) {
    missingData.push('No manual notes were supplied; intent and roadmap may be underspecified.');
  }

  return {
    dexPair,
    websitePreview,
    missingData: dedupeStrings(missingData).slice(0, 10),
    warnings: dedupeStrings(warnings).slice(0, 12),
    sourceNotes: dedupeStrings(sourceNotes).slice(0, 12),
  };
}
