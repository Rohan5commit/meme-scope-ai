import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function SectionCard({ title, eyebrow, description, className, children }: SectionCardProps) {
  return (
    <section className={cn('glass-panel rounded-[28px] p-6 md:p-7', className)}>
      <div className="mb-5 space-y-2">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.24em] text-fuchsia-200/80">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
