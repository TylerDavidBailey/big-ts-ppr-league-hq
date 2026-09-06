import { type CSSProperties, type ReactNode, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/useScrollEdges';

interface ScrollXProps {
  children: ReactNode;
  /** Classes for the scrolling element itself. */
  className?: string;
  /** Hide the scrollbar. For a strip of tabs, not for data. */
  hideScrollbar?: boolean;
}

/**
 * A sideways scroller that fades whichever edge has more behind it, so a
 * table cut off on a phone reads as scrollable rather than finished.
 *
 * The scrolling element is positioned, so anything absolutely positioned
 * inside it (a screen-reader-only label, say) stays within the scroller
 * instead of widening the page. It also sets `--sticky-bg` once content has
 * scrolled under a sticky cell, which is when that cell needs to be opaque.
 */
export function ScrollX({ children, className, hideScrollbar = false }: ScrollXProps) {
  const ref = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(ref);
  const style = {
    '--sticky-bg': edges.left ? 'var(--color-card-solid)' : 'transparent',
  } as CSSProperties;

  return (
    <div className="relative" style={style}>
      <div
        ref={ref}
        className={cn('relative overflow-x-auto', hideScrollbar && 'no-scrollbar', className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-card-solid to-transparent transition-opacity',
          edges.left ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-card-solid to-transparent transition-opacity',
          edges.right ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}
