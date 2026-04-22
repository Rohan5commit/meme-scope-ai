'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, Megaphone, Shield, Sparkles } from 'lucide-react';
import { analysisReportSchema, type AnalysisReport, type AnalysisRequestPayload } from '@/lib/schema';
import { APP_NAME, APP_TAGLINE, LOADING_STEPS } from '@/lib/constants';
import { AnalysisForm } from '@/components/analysis-form';
import { LoadingState } from '@/components/loading-state';
import { ResultsDashboard } from '@/components/results-dashboard';
import { SectionCard } from '@/components/section-card';

export function AppShell() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const interval = setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % LOADING_STEPS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (report && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  async function handleAnalyze(input: AnalysisRequestPayload) {
    setError(null);
    setIsLoading(true);
    setLoadingStepIndex(0);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const payload = (await response.json()) as { error?: string } | unknown;
      if (!response.ok) {
        const message = typeof payload === 'object' && payload && 'error' in payload ? String(payload.error) : 'Analysis failed.';
        throw new Error(message);
      }

      const parsed = analysisReportSchema.parse(payload);
      setReport(parsed);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Failed to analyze the request.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/55 px-6 py-8 md:px-10 md:py-12">
        <div className="hero-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="relative grid gap-8 xl:grid-cols-[1.05fr,0.95fr] xl:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI x Meme x Web3 research copilot
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.04]">
                {APP_NAME}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                {APP_TAGLINE}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Useful in under 30 seconds</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Paste a ticker, site, handle, or contract and get an opinionated diligence snapshot fast.</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Evidence-aware output</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">MemeScope calls out missing data and confidence instead of faking certainty.</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Built for demos</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Shareable report pages, downloadable JSON, and launch-ready post copy are built in.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <div className="glass-panel rounded-[28px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-100">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Bull vs bear</p>
                  <p className="text-xs leading-5 text-slate-400">Two-sided reasoning, not one-sided hype.</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-[28px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-3 text-fuchsia-100">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Scorecard + checklist</p>
                  <p className="text-xs leading-5 text-slate-400">Fast operator framing for diligence and narrative quality.</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-[28px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-100">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Presentation-ready copy</p>
                  <p className="text-xs leading-5 text-slate-400">Turn research into a launch thread or teaser post instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.08fr,0.92fr] xl:items-start">
        <AnalysisForm isLoading={isLoading} error={error} onAnalyze={handleAnalyze} />
        <SectionCard
          title="Why this product scores well in a hackathon"
          eyebrow="Built for judges"
          description="One polished vertical slice beats a pile of fragile features. MemeScope focuses on the exact things judges can understand quickly: visible AI depth, practical usefulness, and demo clarity."
        >
          <div className="space-y-4 text-sm leading-6 text-slate-200">
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="font-semibold text-white">Innovation</p>
              <p className="mt-2 text-slate-300">
                The product is not a generic chat wrapper. It uses a structured research workflow that outputs a decision-ready memo,
                risk surface, narrative analysis, and social packaging in one pass.
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="font-semibold text-white">Technical implementation</p>
              <p className="mt-2 text-slate-300">
                Typed request validation, provider abstraction, structured JSON generation, optional live enrichment, graceful fallback,
                and a shareable result page make the prototype feel complete instead of stitched together.
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="font-semibold text-white">Practical value</p>
              <p className="mt-2 text-slate-300">
                Traders, creators, and community operators all need the same thing under time pressure: a fast read on what the project is,
                what could go right, what could go wrong, and how to explain it clearly.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {isLoading ? <LoadingState step={LOADING_STEPS[loadingStepIndex]} /> : null}

      <div ref={resultsRef}>{report ? <ResultsDashboard report={report} /> : null}</div>
    </main>
  );
}
