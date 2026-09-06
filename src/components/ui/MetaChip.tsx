import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface MetaChipProps {
  children: ReactNode;
  /** Adds a pulsing dot, for a season being played right now. */
  live?: boolean;
  className?: string;
}

/** One small fact under a page title: a count, a date, a caveat. */
export function MetaChip({ children, live = false, className }: MetaChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-2 py-0.5 text-xs font-medium text-ink-muted',
        live && 'border-brand/40 text-brand',
        className,
      )}
    >
      {live ? (
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-brand" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
