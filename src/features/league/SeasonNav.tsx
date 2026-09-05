import { Link, useLocation } from 'react-router-dom';

import { SeasonSwitcher } from './SeasonSwitcher';
import { cn } from '@/lib/cn';
import type { SleeperLeague } from '@/lib/sleeper/types';

/**
 * The two ways into the site: one season, or every season at once.
 *
 * Each season is a separate Sleeper league linked by `previous_league_id`, so
 * switching seasons is a route change, not a filter. All-time stays a button of
 * its own rather than a row in the switcher, because it is a different view of
 * the league rather than another year.
 */
export function SeasonNav({ chain, loading }: { chain: SleeperLeague[]; loading: boolean }) {
  const { pathname } = useLocation();
  const allTimeActive = pathname.startsWith('/all-time');

  return (
    <nav aria-label="Season" className="flex items-center gap-1.5">
      <SeasonSwitcher chain={chain} loading={loading} />
      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hairline-strong" />
      <Link
        to="/all-time"
        aria-current={allTimeActive ? 'page' : undefined}
        className={cn(
          'shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-semibold transition',
          allTimeActive
            ? 'bg-brand text-canvas'
            : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
        )}
      >
        All-time
      </Link>
    </nav>
  );
}
