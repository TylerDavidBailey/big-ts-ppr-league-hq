import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Table primitives with the site's look: uppercase display headings, tabular
 * numerals, and a horizontal scroll container so a wide table never scrolls
 * the whole page sideways on a phone.
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
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
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

export function Th({
  children,
  align = 'left',
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-3 font-semibold',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        'border-b border-hairline/60 transition last:border-0 hover:bg-white/[0.03]',
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
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <td
      className={cn('px-3 py-3', align === 'right' ? 'text-right tabular' : 'text-left', className)}
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
}: {
  rank: number;
  tone?: 'gold' | 'brand' | 'dim';
}) {
  return (
    <td className="px-3 py-3">
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
