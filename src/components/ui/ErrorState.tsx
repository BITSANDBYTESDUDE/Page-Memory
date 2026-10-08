import type { ReactNode } from 'react';
import { cn } from './utils';

export interface ErrorStateProps {
  readonly title?: string;
  readonly message: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <section
      aria-live="assertive"
      className={cn('rounded-xl border border-rose-200 bg-rose-50 p-4', className)}
      role="alert"
    >
      <h2 className="text-sm font-semibold text-rose-900">{title}</h2>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}
