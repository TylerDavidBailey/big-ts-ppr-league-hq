import { Link, useLocation } from 'react-router-dom';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import type { SleeperLeague } from '@/lib/sleeper/types';

/**
 * One pill per season, newest first, then the all-time view.
 *
 * Each season is a separate Sleeper league linked by `previous_league_id`, so
 * switching seasons is a route change, not a filter. The newest season is also
 * served at `/`, so its pill lights up there too.
 */
export function YearNav({ chain, loading }: { chain: SleeperLeague[]; loading: boolean }) {
  const { pathname } = useLocation();
  const head = chain[0];

  const isYearActive = (league: SleeperLeague) =>
    pathname.startsWith(`/${league.season}`) || (pathname === '/' && league === head);
  const allTimeActive = pathname.startsWith('/all-time');

  const pill = (active: boolean) =>
    cn(
      'shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
      active
        ? 'bg-brand text-canvas'
        : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
    );

  return (
    <nav aria-label="Season" className="flex max-w-full items-center gap-1.5 overflow-x-auto">
      {chain.map((league) => (
        <Link
          key={league.league_id}
          to={`/${league.season}`}
          aria-current={isYearActive(league) ? 'page' : undefined}
          className={pill(isYearActive(league))}
        >
          {league.season}
        </Link>
      ))}
      {loading ? <Skeleton className="h-8 w-14 shrink-0" /> : null}
      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hairline-strong" />
      <Link
        to="/all-time"
        aria-current={allTimeActive ? 'page' : undefined}
        className={pill(allTimeActive)}
      >
        All-time
      </Link>
    </nav>
  );
}
