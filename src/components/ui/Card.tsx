import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-hairline bg-card/70 backdrop-blur-sm shadow-lg shadow-black/20',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 py-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h2
      className={cn(
        'font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted',
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}
