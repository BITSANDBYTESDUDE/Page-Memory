import type { ReactNode } from 'react';
import { cn } from './utils';

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
