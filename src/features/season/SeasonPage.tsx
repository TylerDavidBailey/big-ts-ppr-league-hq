import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { AwardsTab } from './tabs/AwardsTab';
import { HistoryTab } from './tabs/HistoryTab';
import { PlayoffsTab } from './tabs/PlayoffsTab';
import { ScoreboardTab } from './tabs/ScoreboardTab';
import { StandingsTab } from './tabs/StandingsTab';
import { SeasonTabs } from './SeasonTabs';
import { DEFAULT_TAB, isSeasonTab, type SeasonTabSlug } from './tabConfig';
import { SeasonSwitcher } from './SeasonSwitcher';
import { useSeason } from './useSeason';
import { Avatar } from '../shared/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { statusLabel } from '@/lib/format';
import { NotFoundError } from '@/lib/sleeper/client';
import { useLeagueChain } from '@/lib/sleeper/queries';
import { rememberLeague } from '@/lib/storage';

export function SeasonPage() {
  const { leagueId = '', tab } = useParams<{ leagueId: string; tab: string }>();
  const { season, awards, isLoading, isLoadingWeeks, error, weekProgress } = useSeason(leagueId);
  const chainQuery = useLeagueChain(leagueId);

  // A league is only worth remembering once it actually resolved.
  useEffect(() => {
    if (!season) return;
    rememberLeague({
      leagueId: season.leagueId,
      name: season.leagueName,
      season: season.season,
      avatarId: season.avatarId,
      totalRosters: season.teams.length,
    });
  }, [season]);

  if (tab !== undefined && !isSeasonTab(tab)) {
    return <Navigate to={`/l/${leagueId}/${DEFAULT_TAB}`} replace />;
  }
  const activeTab: SeasonTabSlug = tab ?? DEFAULT_TAB;

  if (error) {
    const notFound = error instanceof NotFoundError;
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-20">
        <EmptyState
          icon={notFound ? '🔍' : '📡'}
          title={notFound ? 'League not found' : 'Could not reach Sleeper'}
          description={
            notFound
              ? `Sleeper has no league with the ID ${leagueId}. Check the ID and try again.`
              : error.message
          }
          action={
            <Link
              to="/"
              className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
            >
              Back to search
            </Link>
          }
        />
      </main>
    );
  }

  if (isLoading || !season) {
    return (
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <SkeletonRows rows={8} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar avatarId={season.avatarId} name={season.leagueName} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {season.leagueName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-dim">
              <span className="tabular">{season.season}</span>
              <span aria-hidden>·</span>
              <span>{season.teams.length} teams</span>
              <Badge tone={season.status === 'complete' ? 'gold' : 'brand'}>
                {statusLabel(season.status)}
              </Badge>
            </p>
          </div>
        </div>

        <SeasonSwitcher
          chain={chainQuery.data ?? []}
          currentLeagueId={season.leagueId}
          tab={activeTab}
        />
      </header>

      <div className="mt-6">
        <SeasonTabs leagueId={season.leagueId} />
      </div>

      {isLoadingWeeks ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-dim">
          <Spinner className="size-3.5" />
          Loading weeks… {Math.round(weekProgress * 100)}%
        </p>
      ) : null}

      <div className="mt-6">
        {activeTab === 'awards' ? <AwardsTab season={season} awards={awards} /> : null}
        {activeTab === 'standings' ? <StandingsTab season={season} /> : null}
        {activeTab === 'scoreboard' ? <ScoreboardTab season={season} awards={awards} /> : null}
        {activeTab === 'playoffs' ? <PlayoffsTab season={season} /> : null}
        {activeTab === 'history' ? (
          <HistoryTab chain={chainQuery.data ?? []} isLoading={chainQuery.isPending} />
        ) : null}
      </div>
    </main>
  );
}
