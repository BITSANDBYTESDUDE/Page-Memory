import { cn } from './utils';

export interface LoadingStateProps {
  readonly label?: string;
  readonly className?: string;
}

export function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={cn('flex items-center gap-2 text-sm text-slate-500', className)}
      role="status"
    >
      <span aria-hidden="true" className="h-3.5 w-3.5 animate-pulse rounded-full bg-indigo-500" />
      <span>{label}</span>
    </div>
  );
}
