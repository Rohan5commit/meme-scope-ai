import { LoaderCircle, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/section-card';

export function LoadingState({ step }: { step: string }) {
  return (
    <SectionCard
      title="Generating analysis"
      eyebrow="In progress"
      description="MemeScope combines whatever public metadata it can find with structured AI analysis. Missing data is surfaced instead of hidden."
    >
      <div className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-slate-950/35 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-3 text-fuchsia-100">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-white">{step}</p>
            <p className="text-sm text-slate-400">This usually completes in a few seconds depending on enrichment and model latency.</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
          <Sparkles className="h-3.5 w-3.5" />
          Graceful fallback enabled if live AI or data is unavailable
        </div>
      </div>
    </SectionCard>
  );
}
