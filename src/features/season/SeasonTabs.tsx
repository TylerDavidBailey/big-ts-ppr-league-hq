import { NavLink } from 'react-router-dom';

import { SEASON_TABS } from './tabConfig';
import { cn } from '@/lib/cn';

export function SeasonTabs({ leagueId }: { leagueId: string }) {
  return (
    <nav aria-label="League sections" className="-mx-5 overflow-x-auto px-5">
      <ul className="flex min-w-max gap-1 border-b border-hairline">
        {SEASON_TABS.map((tab) => (
          <li key={tab.slug}>
            <NavLink
              to={`/l/${leagueId}/${tab.slug}`}
              className={({ isActive }) =>
                cn(
                  'block border-b-2 px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide transition',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-dim hover:text-ink',
                )
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
