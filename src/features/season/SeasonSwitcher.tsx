import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';
import type { SleeperLeague } from '@/lib/sleeper/types';

interface SeasonSwitcherProps {
  chain: SleeperLeague[];
  currentLeagueId: string;
  tab: string;
}

/**
 * One button per season of the league, newest first.
 *
 * Each season is a separate Sleeper league id linked by `previous_league_id`,
 * so switching seasons is a route change, not a filter.
 */
export function SeasonSwitcher({ chain, currentLeagueId, tab }: SeasonSwitcherProps) {
  if (chain.length <= 1) return null;

  // Scrolls rather than wraps: a long-running league has a lot of seasons, and a
  // wrapping block pushes the tabs off a phone screen.
  return (
    <nav
      aria-label="Season"
      className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1"
    >
      {chain.map((league) => {
        const isCurrent = league.league_id === currentLeagueId;
        return (
          <Link
            key={league.league_id}
            to={`/l/${league.league_id}/${tab}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
              isCurrent
                ? 'bg-brand text-canvas'
                : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
            )}
          >
            {league.season}
          </Link>
        );
      })}
    </nav>
  );
}
