import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

export interface TabItem {
  to: string;
  label: string;
  active: boolean;
}

/** The underlined tab strip under a season or the all-time heading. */
export function TabNav({ label, items }: { label: string; items: TabItem[] }) {
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1 border-b border-hairline">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'block border-b-2 px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide transition',
                item.active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-dim hover:text-ink',
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
