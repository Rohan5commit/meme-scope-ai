import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { analysisReportSchema, type AnalysisReport } from '@/lib/schema';

export function encodeReportPayload(report: AnalysisReport) {
  return compressToEncodedURIComponent(JSON.stringify(report));
}

export function decodeReportPayload(payload: string) {
  const decoded = decompressFromEncodedURIComponent(payload);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded);
    const result = analysisReportSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
