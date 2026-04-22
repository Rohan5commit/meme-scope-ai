import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const sharedInputClassName =
  'w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-fuchsia-300/50 focus:bg-white/8 focus:ring-2 focus:ring-fuchsia-400/15';

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
      <span>{children}</span>
      {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(sharedInputClassName, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(sharedInputClassName, 'min-h-[132px] resize-y', props.className)} />;
}

const buttonVariants = {
  primary:
    'border border-fuchsia-300/30 bg-linear-to-r from-fuchsia-500 to-cyan-400 text-slate-950 shadow-lg shadow-fuchsia-500/20 hover:from-fuchsia-400 hover:to-cyan-300',
  secondary:
    'border border-white/12 bg-white/6 text-slate-100 hover:border-fuchsia-300/35 hover:bg-white/10',
  ghost: 'border border-transparent bg-transparent text-slate-300 hover:bg-white/8 hover:text-white',
};

const buttonSizes = {
  md: 'px-4 py-3 text-sm',
  sm: 'px-3 py-2 text-xs',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    />
  );
}

const pillTones = {
  brand: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
  danger: 'border-rose-400/25 bg-rose-400/10 text-rose-100',
  neutral: 'border-white/12 bg-white/5 text-slate-200',
};

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof pillTones }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', pillTones[tone])}>
      {children}
    </span>
  );
}
