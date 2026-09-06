import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

import { ScrollX } from './ScrollX';
import { cn } from '@/lib/cn';

/**
 * Table primitives with the site's look: uppercase display headings, tabular
 * numerals, and a sideways scroll container with faded edges so a wide table
 * never scrolls the whole page on a phone.
 *
 * With `stickyFirstColumns`, that many leading cells stay put while the
 * numbers scroll under them, so a row keeps its name. Pass the same count to
 * `Th`, `Td` and `RankCell` as `sticky`, in order, since a cell's offset is
 * its own to know. The rank cell is 3.25rem wide; a team cell after it starts
 * at that offset.
 */
export function Table({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollX>
      <table className={cn('w-full border-collapse text-sm', className)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </ScrollX>
  );
}

export function HeadRow({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-hairline text-left font-display text-[11px] uppercase tracking-[0.12em] text-ink-dim">
        {children}
      </tr>
    </thead>
  );
}

/** Where a sticky cell sits: the first column, or the one after a rank cell. */
export type StickyColumn = 'first' | 'after-rank';

const STICKY: Record<StickyColumn, string> = {
  first: 'sticky left-0 z-10 bg-(--sticky-bg)',
  'after-rank': 'sticky left-[3.25rem] z-10 bg-(--sticky-bg)',
};

/** A column heading. `abbr` spells out a short header for a tooltip and screen readers. */
export function Th({
  children,
  align = 'left',
  abbr,
  sticky,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right';
  abbr?: string;
  sticky?: StickyColumn;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-3 font-semibold whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        sticky && STICKY[sticky],
        className,
      )}
      {...rest}
    >
      {abbr ? (
        <abbr title={abbr} className="no-underline">
          {children}
        </abbr>
      ) : (
        children
      )}
    </th>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        'group border-b border-hairline/60 transition last:border-0 hover:bg-white/[0.03]',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = 'left',
  sticky,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right'; sticky?: StickyColumn }) {
  return (
    <td
      className={cn(
        'px-3 py-3',
        align === 'right' ? 'text-right tabular' : 'text-left',
        sticky && STICKY[sticky],
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** The rank cell: gold for first, brand for a highlighted band, dim otherwise. */
export function RankCell({
  rank,
  tone = 'dim',
  sticky,
}: {
  rank: number;
  tone?: 'gold' | 'brand' | 'dim';
  sticky?: StickyColumn;
}) {
  return (
    <td className={cn('w-[3.25rem] px-3 py-3', sticky && STICKY[sticky])}>
      <span
        className={cn(
          'grid size-6 place-items-center rounded-md font-display text-xs font-bold tabular',
          tone === 'gold' && 'bg-gold text-canvas',
          tone === 'brand' && 'bg-brand/15 text-brand',
          tone === 'dim' && 'text-ink-dim',
        )}
      >
        {rank}
      </span>
    </td>
  );
}
