import type { ButtonHTMLAttributes } from 'react';
import { cn, focusRing } from './utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly 'aria-label': string;
  readonly size?: 'sm' | 'md';
}

export function IconButton({ className, size = 'md', ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300',
        focusRing,
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        className,
      )}
      type="button"
      {...props}
    />
  );
}
