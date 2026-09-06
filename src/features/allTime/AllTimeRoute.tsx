import { useMemo } from 'react';

import { AllTimeStandings } from './AllTimeStandings';
import { ChampionsView } from './ChampionsView';
import { RecordsView } from './RecordsView';
import { useLeagueContext } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { TabNav } from '../shared/TabNav';
import { MetaChip } from '@/components/ui/MetaChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { computeSeasonAwards } from '@/domain/awards';
import type { SeasonSummary } from '@/domain/history';
import { LEAGUE } from '@/league.config';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { playerNameResolver } from '@/lib/players';
import { useAllSeasonModels, usePlayerIndex } from '@/lib/sleeper/queries';

export type AllTimeView = 'standings' | 'champions' | 'records';

const VIEWS: { view: AllTimeView; label: string; path: string }[] = [
  { view: 'standings', label: 'Managers', path: '/all-time' },
  { view: 'champions', label: 'Champions', path: '/all-time/champions' },
  { view: 'records', label: 'Records', path: '/all-time/records' },
];

/**
 * Every season at once.
 *
 * The queries share keys with the season pages, so a season already opened
 * costs nothing here. Rows fill in as seasons resolve.
 */
export function AllTimeRoute({ view }: { view: AllTimeView }) {
  const { chain, chainLoading } = useLeagueContext();
  const results = useAllSeasonModels(chain);
  const label = VIEWS.find((item) => item.view === view)?.label ?? 'Managers';
  useDocumentTitle(label, 'All-time');
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
  const played = summaries.filter(({ season }) => season.hasScores).length;
  const first = summaries.at(-1)?.season.season;
  const last = summaries.find(({ season }) => season.hasScores)?.season.season;

  if (firstError && summaries.length === 0) return <FetchError error={firstError} />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="All-time"
        title={label}
        meta={
          pending ? (
            <MetaChip>
              <Spinner className="size-3" />
              Loading seasons, {summaries.length} of {chainLoading ? '?' : chain.length} in
            </MetaChip>
          ) : (
            <>
              <MetaChip>
                {played} {played === 1 ? 'season' : 'seasons'} played
              </MetaChip>
              {first && last && first !== last ? (
                <MetaChip>
                  {first} to {last}
                </MetaChip>
              ) : null}
            </>
          )
        }
      />

      <TabNav
        label="All-time sections"
        items={VIEWS.map((item) => ({
          to: item.path,
          label: item.label,
          active: item.view === view,
        }))}
      />

      {summaries.length === 0 ? (
        <SkeletonRows rows={8} />
      ) : view === 'champions' ? (
        <ChampionsView summaries={summaries} />
      ) : view === 'records' ? (
        <RecordsView summaries={summaries} />
      ) : (
        <AllTimeStandings summaries={summaries} />
      )}
    </div>
  );
}
