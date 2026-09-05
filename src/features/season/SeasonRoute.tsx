import { Link } from 'react-router-dom';

import { AwardsTab } from './AwardsTab';
import { StandingsTab } from './StandingsTab';
import { useSeasonAwards } from './useSeasonAwards';
import { useRouteLeague } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { TabNav } from '../shared/TabNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import type { SeasonModel } from '@/domain/types';
import { formatRelativeTime, statusLabel } from '@/lib/format';
import { useSeasonModel } from '@/lib/sleeper/queries';

export type SeasonTab = 'awards' | 'standings';

/** Where the season stands, and how fresh the numbers are. */
function SeasonStatus({ season, updatedAt }: { season: SeasonModel; updatedAt: number }) {
  if (season.status === 'complete' || season.isComplete) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-dim">
        <Badge tone="gold">Final</Badge>
        <span>{season.season} season</span>
      </p>
    );
  }

  if (season.status === 'in_season') {
    const throughWeek = season.regularSeasonWeeks.at(-1)?.week;
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-dim">
        {season.liveWeek ? <Badge tone="brand">Week {season.liveWeek} in progress</Badge> : null}
        {throughWeek ? (
          <span>Settled through week {throughWeek}</span>
        ) : (
          <span>No week final yet</span>
        )}
        <span aria-hidden>·</span>
        <span>Updated {formatRelativeTime(updatedAt)}. Refresh for the latest scores.</span>
      </p>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-ink-dim">
      <Badge>{statusLabel(season.status)}</Badge>
      <span>The {season.season} season has not started.</span>
    </p>
  );
}

export function SeasonRoute({ tab }: { tab: SeasonTab }) {
  const { league, isLoading, missingSeason } = useRouteLeague();
  const seasonQuery = useSeasonModel(league);
  const awards = useSeasonAwards(seasonQuery.data);

  if (missingSeason) {
    return (
      <EmptyState
        icon="🕰️"
        title={`No ${missingSeason} season`}
        description="This league has no season for that year."
        action={
          <Link
            to="/"
            className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
          >
            Current season
          </Link>
        }
      />
    );
  }

  if (seasonQuery.error) return <FetchError error={seasonQuery.error} />;

  const season = seasonQuery.data;
  if (isLoading || !season || !awards) return <SkeletonRows rows={8} />;

  return (
    <div className="space-y-5">
      <SeasonStatus season={season} updatedAt={seasonQuery.dataUpdatedAt} />

      <TabNav
        label="Season sections"
        items={[
          { to: `/${season.season}`, label: 'Awards', active: tab === 'awards' },
          { to: `/${season.season}/standings`, label: 'Standings', active: tab === 'standings' },
        ]}
      />

      {season.usesMedianScoring ? (
        <p className="text-xs text-ink-dim">
          This league also scores against the weekly median, so records come from Sleeper&apos;s own
          totals.
        </p>
      ) : null}

      {tab === 'awards' ? (
        <AwardsTab season={season} awards={awards} />
      ) : (
        <StandingsTab season={season} />
      )}
    </div>
  );
}
