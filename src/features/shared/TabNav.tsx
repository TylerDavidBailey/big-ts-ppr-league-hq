import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { ScrollX } from '@/components/ui/ScrollX';
import { cn } from '@/lib/cn';

export interface TabItem {
  to: string;
  label: string;
  active: boolean;
}

/**
 * The section strip under a page heading.
 *
 * One row at every width. On a phone it scrolls sideways and the active tab
 * is brought into view, so the section you are on is never on a hidden row.
 */
export function TabNav({ label, items }: { label: string; items: TabItem[] }) {
  const activeRef = useRef<HTMLAnchorElement>(null);
  const activeTo = items.find((item) => item.active)?.to;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTo]);

  return (
    <nav aria-label={label} className="rounded-xl border border-hairline bg-surface/60">
      <ScrollX hideScrollbar fade="surface" wrapperClassName="rounded-xl" className="snap-x">
        <ul className="flex gap-1 p-1">
          {items.map((item) => (
            <li key={item.to} className="shrink-0 snap-start">
              <Link
                ref={item.active ? activeRef : undefined}
                to={item.to}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'block rounded-lg px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition',
                  item.active
                    ? 'bg-card text-brand shadow-sm shadow-black/30'
                    : 'text-ink-dim hover:bg-white/[0.04] hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </ScrollX>
    </nav>
  );
}
