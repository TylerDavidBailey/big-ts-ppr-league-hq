import { type CSSProperties, type ReactNode, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useScrollEdges } from '@/lib/useScrollEdges';

/** What the fades blend into: the card a table sits in, or a surface strip over the canvas. */
type Fade = 'card' | 'surface';

const FADE: Record<Fade, { left: string; right: string }> = {
  card: { left: 'from-card-solid', right: 'from-card-solid' },
  surface: { left: 'from-canvas', right: 'from-canvas' },
};

interface ScrollXProps {
  children: ReactNode;
  /** Classes for the scrolling element itself. */
  className?: string;
  /** Classes for the outer box, which clips the fades: a radius, usually. */
  wrapperClassName?: string;
  /** Which background the edge fades blend into. */
  fade?: Fade;
  /** Hide the scrollbar. For a strip of tabs, not for data. */
  hideScrollbar?: boolean;
}

/**
 * A sideways scroller that fades whichever edge has more behind it, so a
 * table cut off on a phone reads as scrollable rather than finished.
 *
 * The scrolling element is positioned, so anything absolutely positioned
 * inside it (a screen-reader-only label, say) stays within the scroller
 * instead of widening the page. The outer box clips, so the fades follow its
 * corners. It also sets `--sticky-bg` once content has scrolled under a
 * sticky cell, which is when that cell needs to be opaque.
 */
export function ScrollX({
  children,
  className,
  wrapperClassName,
  fade = 'card',
  hideScrollbar = false,
}: ScrollXProps) {
  const ref = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(ref);
  const style = {
    '--sticky-bg': edges.left ? 'var(--color-card-solid)' : 'transparent',
  } as CSSProperties;

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)} style={style}>
      <div
        ref={ref}
        className={cn('relative overflow-x-auto', hideScrollbar && 'no-scrollbar', className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r to-transparent transition-opacity',
          FADE[fade].left,
          edges.left ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l to-transparent transition-opacity',
          FADE[fade].right,
          edges.right ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}
