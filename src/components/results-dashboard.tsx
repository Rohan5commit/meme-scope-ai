'use client';

import { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  Megaphone,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { SectionCard } from '@/components/section-card';
import { Button, Pill } from '@/components/ui';
import { SCORE_HELPERS } from '@/lib/constants';
import { encodeReportPayload } from '@/lib/share';
import type { AnalysisReport } from '@/lib/schema';
import { cn, formatCompact, formatCurrency, hostFromUrl, prettyTimestamp, truncateMiddle } from '@/lib/utils';

interface ResultsDashboardProps {
  report: AnalysisReport;
  isSharePage?: boolean;
}

function scoreTone(score: number) {
  if (score >= 7.5) return 'success' as const;
  if (score >= 5.5) return 'warning' as const;
  return 'danger' as const;
}

function severityTone(severity: 'low' | 'medium' | 'high') {
  if (severity === 'low') return 'success' as const;
  if (severity === 'medium') return 'warning' as const;
  return 'danger' as const;
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function ResultsDashboard({ report, isSharePage = false }: ResultsDashboardProps) {
  const payload = useMemo(() => encodeReportPayload(report), [report]);
  const [feedback, setFeedback] = useState<string>('');

  const quickStats = [
    {
      key: 'clarity',
      label: 'Clarity',
      value: report.scorecard.clarity.score,
      rationale: report.scorecard.clarity.rationale,
      helper: SCORE_HELPERS.clarity,
    },
    {
      key: 'narrative',
      label: 'Narrative strength',
      value: report.scorecard.narrativeStrength.score,
      rationale: report.scorecard.narrativeStrength.rationale,
      helper: SCORE_HELPERS.narrativeStrength,
    },
    {
      key: 'risk',
      label: 'Risk score',
      value: report.scorecard.risk.score,
      rationale: report.scorecard.risk.rationale,
      helper: SCORE_HELPERS.risk,
    },
    {
      key: 'community',
      label: 'Community potential',
      value: report.scorecard.communityPotential.score,
      rationale: report.scorecard.communityPotential.rationale,
      helper: SCORE_HELPERS.communityPotential,
    },
  ];

  async function handleCopyShare() {
    const url = `${window.location.origin}/report?payload=${payload}`;
    await copyToClipboard(url);
    setFeedback('Share link copied.');
  }

  async function handleCopyShortPost() {
    await copyToClipboard(report.socialPosts.shortPost);
    setFeedback('Short post copied.');
  }

  async function handleCopyThread() {
    await copyToClipboard(report.socialPosts.launchThread.join('\n\n'));
    setFeedback('Launch thread copied.');
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.projectLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'memescope-report'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('JSON report downloaded.');
  }

  return (
    <section className="space-y-6">
      <SectionCard
        title={report.projectLabel}
        eyebrow="Research report"
        description="One-screen diligence snapshot built for fast operator judgment: what this is, why it could work, why it could fail, and what still needs verification."
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Confidence {report.confidence.score}%</Pill>
              <Pill tone={report.analysisMode === 'llm' ? 'success' : 'warning'}>
                {report.analysisMode === 'llm' ? 'LLM analysis' : 'Fallback analysis'}
              </Pill>
              {report.input.ticker ? <Pill tone="neutral">${report.input.ticker}</Pill> : null}
              {report.input.contractAddress ? <Pill tone="neutral">{truncateMiddle(report.input.contractAddress, 8, 6)}</Pill> : null}
              {report.input.websiteUrl ? <Pill tone="neutral">{hostFromUrl(report.input.websiteUrl)}</Pill> : null}
            </div>
            <p className="text-base leading-7 text-slate-200 md:text-lg">{report.executiveSummary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Generated</p>
                <p className="mt-2 text-sm font-medium text-white">{prettyTimestamp(report.generatedAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Confidence rationale</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{report.confidence.rationale}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-slate-950/35 p-5">
            <p className="text-sm font-semibold text-white">Action tray</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Export or share the result without setting up a database. Useful for judges, teammates, or quick community posts.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {!isSharePage ? (
                <Button type="button" variant="secondary" onClick={handleCopyShare}>
                  <Copy className="h-4 w-4" />
                  Copy share link
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
              <Button type="button" variant="secondary" onClick={handleCopyShortPost}>
                <Megaphone className="h-4 w-4" />
                Copy short post
              </Button>
              <Button type="button" variant="secondary" onClick={handleCopyThread}>
                <Copy className="h-4 w-4" />
                Copy thread
              </Button>
            </div>
            {feedback ? <p className="mt-3 text-xs font-medium text-emerald-200">{feedback}</p> : null}
            {report.dataWarnings.length ? (
              <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                  <TriangleAlert className="h-4 w-4" />
                  Confidence / missing-data notices
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-50/90">
                  {report.dataWarnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <div key={item.key} className="glass-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
              <Pill tone={scoreTone(item.value)}>{item.value.toFixed(1)} / 10</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.rationale}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Bull case" eyebrow="Upside frame" description="Why the story could travel if the strongest signals hold up.">
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            {report.bullCase.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-3xl border border-emerald-400/12 bg-emerald-400/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Bear case" eyebrow="Failure frame" description="Why the project could break down even if the meme is strong.">
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            {report.bearCase.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-3xl border border-rose-400/12 bg-rose-400/5 p-4">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Risk flags" eyebrow="Fast diligence" description="High-signal issues that should change how seriously someone treats the narrative.">
        <div className="grid gap-4 lg:grid-cols-3">
          {report.riskFlags.map((flag) => (
            <article key={`${flag.title}-${flag.rationale}`} className="rounded-[26px] border border-white/8 bg-slate-950/35 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{flag.title}</h3>
                <Pill tone={severityTone(flag.severity)}>{flag.severity}</Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">{flag.rationale}</p>
              {flag.evidence ? <p className="mt-3 text-xs leading-5 text-slate-500">Evidence: {flag.evidence}</p> : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard title="Narrative / meme angle" eyebrow="Positioning" description="The memorable frame that explains why people might talk about it.">
          <div className="space-y-4 text-sm leading-6 text-slate-200">
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Meme angle</p>
              <p className="mt-2">{report.narrative.memeAngle}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Audience</p>
              <p className="mt-2">{report.narrative.audience}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Positioning</p>
              <p className="mt-2">{report.narrative.positioning}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Why it spreads</p>
              <p className="mt-2">{report.narrative.whyItSpreads}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Quick diligence checklist" eyebrow="Operator checklist" description="What someone should verify before repeating the story or taking action.">
          <div className="space-y-3">
            {report.diligenceChecklist.map((item) => (
              <div key={`${item.item}-${item.status}`} className="rounded-[24px] border border-white/8 bg-slate-950/35 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-sm font-semibold text-white">{item.item}</h3>
                  <Pill tone={item.status === 'required' ? 'danger' : item.status === 'recommended' ? 'warning' : 'neutral'}>
                    {item.status}
                  </Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Launch-ready social copy" eyebrow="Presentation layer" description="Copy that is immediately usable for a demo, landing page, or community preview thread.">
        <div className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[26px] border border-white/8 bg-slate-950/35 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Megaphone className="h-4 w-4 text-fuchsia-200" />
              Short post
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{report.socialPosts.shortPost}</p>
            <p className="mt-4 text-xs leading-5 text-slate-500">{report.socialPosts.disclaimer}</p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-slate-950/35 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              Launch thread
            </div>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-200">
              {report.socialPosts.launchThread.map((line, index) => (
                <div key={`${index}-${line}`} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Source notes & missing data" eyebrow="Evidence boundaries" description="MemeScope shows what it used and what still needs to be checked, so the output stays trustworthy.">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[26px] border border-white/8 bg-slate-950/35 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Radar className="h-4 w-4 text-cyan-200" />
              Source notes
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              {report.sourceNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-slate-950/35 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <TriangleAlert className="h-4 w-4 text-amber-200" />
              Missing data
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              {report.missingData.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      {report.input.websiteUrl || report.input.contractAddress ? (
        <SectionCard title="Quick reference" eyebrow="Resolved identifiers" description="Useful context for live demos and screenshots.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Website</p>
              <p className="mt-2 text-sm font-medium text-white">{report.input.websiteUrl ? hostFromUrl(report.input.websiteUrl) : 'N/A'}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">X handle</p>
              <p className="mt-2 text-sm font-medium text-white">{report.input.xHandle ? `@${report.input.xHandle}` : 'N/A'}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Contract</p>
              <p className="mt-2 text-sm font-medium text-white">{report.input.contractAddress ? truncateMiddle(report.input.contractAddress, 10, 8) : 'N/A'}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mode</p>
              <p className="mt-2 text-sm font-medium text-white">{report.analysisMode === 'llm' ? 'Live AI analysis' : 'Deterministic backup'}</p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </section>
  );
}
