import type { SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn, focusRing } from './utils';

export interface DropdownOption {
  readonly value: string;
  readonly label: string;
}

export interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly options: readonly DropdownOption[];
}

export function Dropdown({ className, label, options, id, ...props }: DropdownProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={selectId}>
      {label && <span className="mb-1.5 block">{label}</span>}
      <select
        className={cn(
          'block min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
          focusRing,
          'focus:border-indigo-500',
          className,
        )}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
