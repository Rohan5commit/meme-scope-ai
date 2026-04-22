import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { analyzeProject } from '@/lib/analysis-service';
import { analysisRequestSchema } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join('; ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = analysisRequestSchema.parse(payload);
    const report = await analyzeProject(input);
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: formatError(error),
      },
      { status: 400 },
    );
  }
}
