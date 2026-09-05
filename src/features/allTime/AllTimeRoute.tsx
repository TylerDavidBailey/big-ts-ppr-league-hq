import { useMemo } from 'react';

import { RecordsTab } from './RecordsTab';
import { StandingsTab } from './StandingsTab';
import { useLeagueContext } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { TabNav } from '../shared/TabNav';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { computeSeasonAwards } from '@/domain/awards';
import type { SeasonSummary } from '@/domain/history';
import { LEAGUE } from '@/league.config';
import { playerNameResolver } from '@/lib/players';
import { useAllSeasonModels, usePlayerIndex } from '@/lib/sleeper/queries';

export type AllTimeTab = 'standings' | 'records';

/**
 * Every season at once.
 *
 * The queries share keys with the season pages, so a season already opened
 * costs nothing here. Rows fill in as seasons resolve.
 */
export function AllTimeRoute({ tab }: { tab: AllTimeTab }) {
  const { chain, chainLoading } = useLeagueContext();
  const results = useAllSeasonModels(chain);
  const playerIndex = usePlayerIndex().data;

  // A fresh array every render, so the memo keys on when each season last
  // changed rather than on the array itself.
  const version = results.map((result) => result.dataUpdatedAt).join(',');
  const summaries = useMemo<SeasonSummary[]>(() => {
    const playerName = playerNameResolver(playerIndex ?? {});
    return results.flatMap((result) =>
      result.data
        ? [
            {
              season: result.data,
              awards: computeSeasonAwards(result.data, { playerName }, LEAGUE.places),
            },
          ]
        : [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, playerIndex]);

  const pending = chainLoading || results.some((result) => result.isPending);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError && summaries.length === 0) return <FetchError error={firstError} />;

  return (
    <div className="space-y-5">
      <TabNav
        label="All-time sections"
        items={[
          { to: '/all-time', label: 'All-time standings', active: tab === 'standings' },
          { to: '/all-time/records', label: 'Records', active: tab === 'records' },
        ]}
      />

      {pending ? (
        <p className="flex items-center gap-2 text-xs text-ink-dim">
          <Spinner className="size-3.5" />
          Loading seasons, {summaries.length} of {chainLoading ? '?' : chain.length} in
        </p>
      ) : null}

      {summaries.length === 0 ? (
        <SkeletonRows rows={8} />
      ) : tab === 'standings' ? (
        <StandingsTab summaries={summaries} />
      ) : (
        <RecordsTab summaries={summaries} />
      )}
    </div>
  );
}
