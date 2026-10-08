import type { ButtonHTMLAttributes } from 'react';
import { cn, focusRing } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-2.5 text-xs',
  md: 'min-h-9 px-3 text-sm',
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed',
        focusRing,
        variants[variant],
        sizes[size],
        className,
      )}
      type="button"
      {...props}
    />
  );
}
