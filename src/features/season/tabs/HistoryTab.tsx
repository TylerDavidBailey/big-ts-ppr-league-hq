import { Link } from 'react-router-dom';

import { Avatar } from '../../shared/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { statusLabel } from '@/lib/format';
import type { SleeperLeague } from '@/lib/sleeper/types';

/**
 * Every season of the league, found by walking `previous_league_id`.
 *
 * Each season is its own Sleeper league, so each row links to that season's own
 * page rather than filtering the current one.
 */
export function HistoryTab({ chain, isLoading }: { chain: SleeperLeague[]; isLoading: boolean }) {
  if (isLoading) return <SkeletonRows rows={4} />;

  if (chain.length === 0) {
    return <EmptyState icon="🕰️" title="No season history" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season history</CardTitle>
        <span className="text-xs text-ink-dim">
          {chain.length} {chain.length === 1 ? 'season' : 'seasons'}
        </span>
      </CardHeader>

      <CardBody>
        <ol className="space-y-2">
          {chain.map((league) => (
            <li key={league.league_id}>
              <Link
                to={`/l/${league.league_id}/awards`}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-surface/60 px-4 py-3 transition hover:border-brand/40 hover:bg-raised"
              >
                <span className="w-12 shrink-0 font-display text-xl font-bold tabular text-brand">
                  {league.season}
                </span>
                <Avatar avatarId={league.avatar} name={league.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {league.name}
                  </span>
                  <span className="block text-xs text-ink-dim">{league.total_rosters} teams</span>
                </span>
                <Badge tone={league.status === 'complete' ? 'gold' : 'brand'}>
                  {statusLabel(league.status)}
                </Badge>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-4 border-t border-hairline pt-3 text-xs text-ink-dim">
          Seasons are linked through Sleeper&apos;s <code>previous_league_id</code>. A season that
          was never rolled over from the prior one will not appear.
        </p>
      </CardBody>
    </Card>
  );
}
