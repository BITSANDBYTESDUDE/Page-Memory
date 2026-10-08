import type { HTMLAttributes } from 'react';
import { cn } from './utils';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'article' | 'section' | 'div';
}

export function Card({ as: Element = 'section', className, ...props }: CardProps) {
  return (
    <Element
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}
