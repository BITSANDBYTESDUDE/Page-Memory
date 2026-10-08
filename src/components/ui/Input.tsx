import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn, focusRing } from './utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly description?: string;
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, description, error, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
      {label && <span className="mb-1.5 block">{label}</span>}
      <input
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
          focusRing,
          'focus:border-indigo-500',
          error && 'border-rose-400 focus:border-rose-500 focus-visible:ring-rose-500',
          className,
        )}
        id={inputId}
        ref={ref}
        {...props}
      />
      {description && !error && (
        <span className="mt-1 block text-xs text-slate-500" id={descriptionId}>
          {description}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-rose-700" id={errorId} role="alert">
          {error}
        </span>
      )}
    </label>
  );
});
