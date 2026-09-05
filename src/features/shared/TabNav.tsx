import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface TabItem {
  to: string;
  label: string;
  active: boolean;
}

/** The section strip under a page heading. Scrolls sideways on a phone. */
export function TabNav({ label, items }: { label: string; items: TabItem[] }) {
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1 rounded-xl border border-hairline bg-surface/60 p-1">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'block rounded-lg px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-wide transition',
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
    </nav>
  );
}
