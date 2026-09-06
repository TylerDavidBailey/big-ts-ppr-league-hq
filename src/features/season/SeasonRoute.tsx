import { Link } from 'react-router-dom';

import { AwardsView } from './AwardsView';
import { BeerDutyView } from './BeerDutyView';
import { OverviewView } from './OverviewView';
import { RulesView } from './RulesView';
import { SEASON_SECTIONS, type SeasonView } from './sections';
import { StandingsView } from './StandingsView';
import { StatsView } from './StatsView';
import { useSeasonAwards } from './useSeasonAwards';
import { useRouteLeague } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { TabNav } from '../shared/TabNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetaChip } from '@/components/ui/MetaChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatMoney, formatRelativeTime, statusLabel } from '@/lib/format';
import { useSeasonModel } from '@/lib/sleeper/queries';
import type { SleeperLeague } from '@/lib/sleeper/types';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/** Where the season stands. Reads the model when there is one, the league otherwise. */
function StatusBadge({ league, season }: { league: SleeperLeague; season?: SeasonModel }) {
  const status = season?.status ?? league.status;
  if (status === 'complete' || season?.isComplete) return <Badge tone="gold">Final</Badge>;
  if (status === 'in_season') {
    return season?.liveWeek ? (
      <Badge tone="brand">Week {season.liveWeek} in progress</Badge>
    ) : (
      <Badge tone="brand">In season</Badge>
    );
  }
  return <Badge>{statusLabel(status)}</Badge>;
}

/** How fresh the numbers are, one fact a chip. */
function StatusMeta({
  league,
  season,
  updatedAt,
}: {
  league: SleeperLeague;
  season?: SeasonModel;
  updatedAt: number;
}) {
  const teams = season?.teams.length ?? league.total_rosters;
  const throughWeek = season?.regularSeasonWeeks.at(-1)?.week;

  return (
    <>
      <MetaChip>{teams} teams</MetaChip>
      {!season ? null : season.status === 'in_season' ? (
        <>
          <MetaChip live>Live</MetaChip>
          <MetaChip>
            {throughWeek ? `Settled through week ${throughWeek}` : 'No week final yet'}
          </MetaChip>
          <MetaChip>Updated {formatRelativeTime(updatedAt)}</MetaChip>
        </>
      ) : !season.hasScores ? (
        <MetaChip>No games played yet</MetaChip>
      ) : (
        <MetaChip>Regular season weeks 1 to {season.regularSeasonEndWeek}</MetaChip>
      )}
    </>
  );
}

/** The pot, from the config and the roster count. */
function Pot({ teams, season }: { teams: number; season: string }) {
  return (
    <Link
      to={`/${season}/rules`}
      className="flex items-baseline gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] px-3.5 py-2 transition hover:border-gold/60"
    >
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        Pot
      </span>
      <span className="font-display text-xl font-bold tabular text-gold">
        {formatMoney(LEAGUE.buyIn * teams)}
      </span>
      <span className="text-xs text-ink-dim">{formatMoney(LEAGUE.buyIn)} a team</span>
    </Link>
  );
}

function View({
  view,
  season,
  awards,
}: {
  view: SeasonView;
  season: SeasonModel;
  awards: SeasonAwards;
}) {
  switch (view) {
    case 'awards':
      return <AwardsView season={season} awards={awards} />;
    case 'beer-duty':
      return <BeerDutyView season={season} awards={awards} />;
    case 'standings':
      return <StandingsView season={season} />;
    case 'stats':
      return <StatsView season={season} />;
    case 'rules':
      return <RulesView season={season} />;
    default:
      return <OverviewView season={season} awards={awards} />;
  }
}

const sectionLabel = (view: SeasonView) =>
  SEASON_SECTIONS.find((section) => section.view === view)?.label ?? 'Overview';

/**
 * One season, one section.
 *
 * The heading and the tabs come from the league record, which the shell has
 * before the season's weeks arrive, so only the body waits on the fetch and
 * the page does not jump when it lands.
 */
export function SeasonRoute({ view }: { view: SeasonView }) {
  const { league, isLoading, missingSeason } = useRouteLeague();
  const seasonQuery = useSeasonModel(league);
  const awards = useSeasonAwards(seasonQuery.data);
  const label = sectionLabel(view);
  useDocumentTitle(label, league?.season ? `${league.season} season` : undefined);

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

  if (isLoading || !league) return <SkeletonRows rows={8} />;

  const season = seasonQuery.data;
  const teams = season?.teams.length ?? league.total_rosters;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`${league.season} season`}
        title={label}
        badges={<StatusBadge league={league} season={season} />}
        meta={<StatusMeta league={league} season={season} updatedAt={seasonQuery.dataUpdatedAt} />}
        aside={<Pot teams={teams} season={league.season} />}
      />

      <TabNav
        label="Season sections"
        items={SEASON_SECTIONS.map((item) => ({
          to: `/${league.season}${item.path}`,
          label: item.label,
          active: item.view === view,
        }))}
      />

      {season?.usesMedianScoring ? (
        <p
          role="note"
          className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-ink-muted"
        >
          This league also scores every team against the weekly median, so records come from Sleeper
          rather than from the matchups.
        </p>
      ) : null}

      {seasonQuery.error ? (
        <FetchError
          error={seasonQuery.error}
          onRetry={() => {
            void seasonQuery.refetch();
          }}
        />
      ) : !season || !awards ? (
        <SkeletonRows rows={8} />
      ) : (
        <View view={view} season={season} awards={awards} />
      )}
    </div>
  );
}
