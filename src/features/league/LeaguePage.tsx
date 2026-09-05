import { Link, Outlet, useLocation } from 'react-router-dom';

import type { LeagueContext } from './useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { Avatar } from '../shared/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEAGUE } from '@/league.config';
import { cn } from '@/lib/cn';
import { useCurrentLeague, useLeagueChain } from '@/lib/sleeper/queries';
import type { SleeperLeague } from '@/lib/sleeper/types';

/**
 * One button per season, newest first, then the all-time view.
 *
 * Each season is a separate Sleeper league linked by `previous_league_id`, so
 * switching seasons is a route change, not a filter. The newest season is also
 * served at `/`, so its button lights up there too.
 */
function YearNav({ chain, loading }: { chain: SleeperLeague[]; loading: boolean }) {
  const { pathname } = useLocation();
  const head = chain[0];

  const isYearActive = (league: SleeperLeague) =>
    pathname.startsWith(`/${league.season}`) || (pathname === '/' && league === head);
  const allTimeActive = pathname.startsWith('/all-time');

  const button = (active: boolean) =>
    cn(
      'shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
      active
        ? 'bg-brand text-canvas'
        : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
    );

  return (
    <nav
      aria-label="Season"
      className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1"
    >
      {chain.map((league) => (
        <Link
          key={league.league_id}
          to={`/${league.season}`}
          aria-current={isYearActive(league) ? 'page' : undefined}
          className={button(isYearActive(league))}
        >
          {league.season}
        </Link>
      ))}
      {loading ? <Skeleton className="h-8 w-14 shrink-0" /> : null}
      <Link
        to="/all-time"
        aria-current={allTimeActive ? 'page' : undefined}
        className={button(allTimeActive)}
      >
        All-time
      </Link>
    </nav>
  );
}

export function LeaguePage() {
  const headQuery = useCurrentLeague();
  const head = headQuery.data;
  const chainQuery = useLeagueChain(head);

  const chain = chainQuery.data ?? (head ? [head] : []);
  const context: LeagueContext = { head, chain, chainLoading: !chainQuery.data };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar avatarId={head?.avatar} name={LEAGUE.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {LEAGUE.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-dim">
              {head ? <span>{head.total_rosters} teams</span> : <Skeleton className="h-4 w-16" />}
              <span aria-hidden>·</span>
              <a
                href={LEAGUE.sleeperUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-brand underline-offset-4 hover:underline"
              >
                Open in Sleeper
              </a>
            </p>
          </div>
        </div>

        <YearNav chain={chain} loading={Boolean(head) && !chainQuery.data && !chainQuery.error} />
      </header>

      <div className="mt-6">
        {headQuery.error ? <FetchError error={headQuery.error} /> : <Outlet context={context} />}
      </div>
    </main>
  );
}
