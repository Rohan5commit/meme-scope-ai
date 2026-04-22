'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, Link2, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ResultsDashboard } from '@/components/results-dashboard';
import { decodeReportPayload } from '@/lib/share';
import { APP_NAME } from '@/lib/constants';

export default function ReportPage() {
  const searchParams = useSearchParams();
  const payload = searchParams.get('payload');
  const report = useMemo(() => (payload ? decodeReportPayload(payload) : null), [payload]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="glass-panel rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
              <Link2 className="h-3.5 w-3.5" />
              Shareable research report
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {APP_NAME} report snapshot
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              This page is a portable research snapshot. It preserves the generated analysis, scorecard, diligence checklist,
              and social-ready copy without requiring a database.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-fuchsia-300/40 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Run a new analysis
          </Link>
        </div>
      </header>

      {report ? (
        <ResultsDashboard report={report} isSharePage />
      ) : (
        <section className="glass-panel rounded-[28px] p-8">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-300" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Invalid or missing share payload</h2>
              <p className="text-sm leading-6 text-slate-300">
                This report link is incomplete or corrupted. Generate a fresh analysis from the homepage and copy the new
                share link.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
