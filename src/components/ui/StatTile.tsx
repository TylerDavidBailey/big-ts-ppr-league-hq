import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type StatTone = 'brand' | 'gold' | 'loss' | 'ink';

const TONES: Record<StatTone, string> = {
  brand: 'text-brand',
  gold: 'text-gold',
  loss: 'text-loss',
  ink: 'text-ink',
};

interface StatTileProps {
  /** Small uppercase label. */
  label: ReactNode;
  /** The headline figure. Omitted when nothing is decided yet. */
  value?: ReactNode;
  tone?: StatTone;
  /** A badge or a figure shown opposite the label. */
  badge?: ReactNode;
  /** Who holds it, and any detail. */
  children?: ReactNode;
  /** Pinned to the bottom, for a link or a note. */
  footer?: ReactNode;
  className?: string;
}

/** One stat: a label, a big number, and whoever earned it. */
export function StatTile({
  label,
  value,
  tone = 'brand',
  badge,
  children,
  footer,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-hairline bg-surface/60 p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          {label}
        </p>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {value ? (
        <p className={cn('font-display text-2xl font-bold tabular', TONES[tone])}>{value}</p>
      ) : null}
      {children}
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </div>
  );
}
