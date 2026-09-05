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

  return (
    <nav aria-label="Season" className="flex flex-wrap items-center gap-1.5">
      {chain.map((league) => {
        const isCurrent = league.league_id === currentLeagueId;
        return (
          <Link
            key={league.league_id}
            to={`/l/${league.league_id}/${tab}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
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
