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

/**
 * A card heading. An `h3`, because the page title is the `h2` and the site
 * name is the `h1`; role queries in the tests do not care about the level.
 */
export function CardTitle({ children, className }: CardProps) {
  return (
    <h3
      className={cn(
        'font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted',
        className,
      )}
    >
      {children}
    </h3>
  );
}

/** A footnote under a table or a list, inside the card's hairline. */
export function CardFooter({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'border-t border-hairline px-5 py-3 text-xs leading-relaxed text-ink-dim',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}
