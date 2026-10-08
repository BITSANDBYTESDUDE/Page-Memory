import { useEffect, useId, type ReactNode } from 'react';
import { IconButton } from './IconButton';
import { cn } from './utils';

export interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly className?: string;
}

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-950" id={titleId}>
            {title}
          </h2>
          <IconButton aria-label="Close dialog" autoFocus onClick={onClose} size="sm">
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
        <div className="mt-4 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}
