import { forwardRef, type InputHTMLAttributes } from 'react';
import { IconButton } from './IconButton';
import { Input } from './Input';
import { cn } from './utils';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label?: string;
  readonly onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, label = 'Search', onClear, value, defaultValue, ...props },
  ref,
) {
  const hasValue =
    value !== undefined ? String(value).length > 0 : String(defaultValue ?? '').length > 0;

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn('pr-9', className)}
        defaultValue={defaultValue}
        label={label}
        ref={ref}
        type="search"
        value={value}
      />
      {onClear && hasValue && (
        <IconButton
          aria-label="Clear search"
          className="absolute right-1 top-7"
          onClick={onClear}
          size="sm"
        >
          <span aria-hidden="true">×</span>
        </IconButton>
      )}
    </div>
  );
});
