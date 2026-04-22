export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function safeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function formatCurrency(value?: number) {
  if (value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

export function formatCompact(value?: number) {
  if (value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function truncateMiddle(value?: string, head = 6, tail = 4) {
  if (!value) {
    return '';
  }

  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function hostFromUrl(value?: string) {
  if (!value) {
    return '';
  }

  try {
    return new URL(value).host.replace(/^www\./, '');
  } catch {
    return value.replace(/^https?:\/\//, '').split('/')[0] ?? value;
  }
}

export function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function limitText(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label = 'request'): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function extractJsonObject(rawText: string) {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? rawText;
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object.');
  }

  return fenced.slice(start, end + 1);
}

export function prettyTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
