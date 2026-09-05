import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Avatar } from '../shared/Avatar';
import { formatRelativeTime } from '@/lib/format';
import { forgetLeague, getRecentLeagues, type RecentLeague } from '@/lib/storage';

/**
 * Leagues visited before, read from localStorage.
 *
 * Populated by the season page on a successful load, so paste an ID once and it
 * is waiting on the next visit.
 */
export function RecentLeagues() {
  const [leagues, setLeagues] = useState<RecentLeague[]>([]);

  useEffect(() => {
    setLeagues(getRecentLeagues());
  }, []);

  const handleForget = useCallback((leagueId: string) => {
    setLeagues(forgetLeague(leagueId));
  }, []);

  if (leagues.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="space-y-3">
      <h2
        id="recent-heading"
        className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim"
      >
        Recent leagues
      </h2>

      <ul className="grid gap-2 sm:grid-cols-2">
        {leagues.map((league) => (
          <li key={league.leagueId} className="group relative">
            <Link
              to={`/l/${league.leagueId}`}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-3.5 py-3 pr-10 transition hover:border-brand/40 hover:bg-raised"
            >
              <Avatar avatarId={league.avatarId} name={league.name} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{league.name}</span>
                <span className="block text-xs text-ink-dim">
                  {league.season} · {league.totalRosters} teams ·{' '}
                  {formatRelativeTime(league.lastOpenedAt)}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                handleForget(league.leagueId);
              }}
              aria-label={`Remove ${league.name} from recent leagues`}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-dim opacity-0 transition hover:bg-white/5 hover:text-loss focus-visible:opacity-100 group-hover:opacity-100"
            >
              <span aria-hidden>✕</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
