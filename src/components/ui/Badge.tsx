import type { HTMLAttributes } from 'react';
import { cn } from './utils';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-indigo-50 text-indigo-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
