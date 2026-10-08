import { cn } from './utils';

export interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly className?: string;
}

export function ProgressBar({ value, max = 100, label = 'Progress', className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0;
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div
      aria-label={label}
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200', className)}
      role="progressbar"
    >
      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percentage}%` }} />
    </div>
  );
}
