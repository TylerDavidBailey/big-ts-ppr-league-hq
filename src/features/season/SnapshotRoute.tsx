import { Link } from 'react-router-dom';

import { useSeasonAwards } from './useSeasonAwards';
import { WeekCard } from './WeekCard';
import { useRouteLeague } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { LEAGUE } from '@/league.config';
import { useSeasonModel } from '@/lib/sleeper/queries';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/**
 * The week card alone, with no site chrome, sized for a phone.
 *
 * `#/snapshot` is the newest season, so a home-screen bookmark never goes
 * stale. The link back to the overview sits under the first screen, so a
 * screenshot taken on landing shows the card and nothing else.
 */
export function SnapshotRoute() {
  const { league, isLoading, missingSeason } = useRouteLeague();
  const seasonQuery = useSeasonModel(league);
  const awards = useSeasonAwards(seasonQuery.data);
  useDocumentTitle('Snapshot', league?.season ? `${league.season} season` : undefined);

  if (missingSeason) {
    return (
      <EmptyState
        icon="🕰️"
        title={`No ${missingSeason} season`}
        description="This league has no season for that year."
        action={
          <Link
            to="/snapshot"
            className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
          >
            Current season
          </Link>
        }
      />
    );
  }

  if (isLoading || !league) return <SkeletonRows rows={8} />;

  const season = seasonQuery.data;

  return (
    <>
      <div className="min-h-dvh">
        {seasonQuery.error ? (
          <FetchError
            error={seasonQuery.error}
            onRetry={() => {
              void seasonQuery.refetch();
            }}
          />
        ) : !season || !awards ? (
          <SkeletonRows rows={8} />
        ) : !season.hasScores ? (
          <EmptyState
            icon={LEAGUE.punishment.icon}
            title="No games played yet"
            description={`The ${season.season} season has no settled week to show.`}
          />
        ) : (
          <WeekCard season={season} awards={awards} mode="snapshot" />
        )}
      </div>
      <p className="py-6 text-center">
        <Link
          to={`/${league.season}`}
          className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
        >
          ← Overview
        </Link>
      </p>
    </>
  );
}
