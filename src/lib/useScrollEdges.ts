import { type RefObject, useEffect, useState } from 'react';

export interface ScrollEdges {
  /** Content is hidden to the left. */
  left: boolean;
  /** Content is hidden to the right. */
  right: boolean;
}

/**
 * Whether a sideways-scrolling element has content past either edge.
 *
 * Read on scroll and on resize, so a table that fits on a desktop and
 * overflows on a phone shows its fade only where something is cut off.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      const next = {
        left: scrollLeft > 1,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      };
      setEdges((current) =>
        current.left === next.left && current.right === next.right ? current : next,
      );
    };

    measure();
    element.addEventListener('scroll', measure, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            measure();
          });
    observer?.observe(element);
    return () => {
      element.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [ref]);

  return edges;
}
