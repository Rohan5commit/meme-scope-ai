'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { DEMO_EXAMPLES, EMPTY_ANALYSIS_FORM } from '@/lib/seeds';
import type { AnalysisRequestPayload } from '@/lib/schema';

interface AnalysisFormProps {
  isLoading: boolean;
  error?: string | null;
  onAnalyze: (input: AnalysisRequestPayload) => Promise<void>;
}

export function AnalysisForm({ isLoading, error, onAnalyze }: AnalysisFormProps) {
  const [form, setForm] = useState<AnalysisRequestPayload>(EMPTY_ANALYSIS_FORM);
  const hasAnyValue = useMemo(() => Object.values(form).some(Boolean), [form]);

  function updateField<K extends keyof AnalysisRequestPayload>(key: K, value: AnalysisRequestPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onAnalyze(form);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-[30px] p-6 md:p-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          AI-first research workflow
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Analyze a token, project, website, or handle</h2>
        <p className="text-sm leading-6 text-slate-300 md:text-base">
          Use one strong identifier or combine multiple signals. Best results usually come from 2–4 inputs.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {DEMO_EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => setForm({ ...EMPTY_ANALYSIS_FORM, ...example.values })}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-fuchsia-300/30 hover:bg-white/8"
          >
            <p className="text-sm font-semibold text-white">{example.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{example.blurb}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label hint="smart parser">Quick paste</Label>
          <Input
            value={form.rawQuery}
            onChange={(event) => updateField('rawQuery', event.target.value)}
            placeholder="Paste a name, ticker, contract, website URL, or @handle"
            maxLength={160}
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Project / token name</Label>
            <Input
              value={form.projectName}
              onChange={(event) => updateField('projectName', event.target.value)}
              placeholder="BONK"
              maxLength={120}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Ticker</Label>
            <Input
              value={form.ticker}
              onChange={(event) => updateField('ticker', event.target.value)}
              placeholder="BONK"
              maxLength={32}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label hint="optional but high-signal">Contract address</Label>
            <Input
              value={form.contractAddress}
              onChange={(event) => updateField('contractAddress', event.target.value)}
              placeholder="0x... or Solana address"
              maxLength={160}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input
              value={form.websiteUrl}
              onChange={(event) => updateField('websiteUrl', event.target.value)}
              placeholder="https://example.com"
              maxLength={300}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>X / Twitter handle</Label>
            <Input
              value={form.xHandle}
              onChange={(event) => updateField('xHandle', event.target.value)}
              placeholder="@project"
              maxLength={80}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label hint="optional">Chain hint</Label>
            <Input
              value={form.chainHint}
              onChange={(event) => updateField('chainHint', event.target.value)}
              placeholder="Solana, Ethereum, BNB Chain, Base..."
              maxLength={40}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label hint="high leverage">Manual context / notes</Label>
          <Textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="What does the project claim to be? Why does anyone care? Anything unusual, funny, suspicious, or strategically important?"
            maxLength={1600}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-slate-400">
          <p>Outputs: summary, bull vs bear, risk flags, meme angle, diligence checklist, scorecard, and launch-ready post copy.</p>
          <p>MemeScope always shows confidence and missing-data notices so the report does not overclaim certainty.</p>
        </div>
        <Button type="submit" className="min-w-[220px]" disabled={isLoading || !hasAnyValue}>
          {isLoading ? 'Analyzing…' : 'Generate research report'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </form>
  );
}
