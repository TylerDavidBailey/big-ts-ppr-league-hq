import { Link } from 'react-router-dom';

import { AwardsView } from './AwardsView';
import { BeerDutyView } from './BeerDutyView';
import { OverviewView } from './OverviewView';
import { RulesView } from './RulesView';
import { StandingsView } from './StandingsView';
import { StatsView } from './StatsView';
import { useSeasonAwards } from './useSeasonAwards';
import { useRouteLeague } from '../league/useRouteLeague';
import { FetchError } from '../shared/FetchError';
import { TabNav } from '../shared/TabNav';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonRows } from '@/components/ui/Skeleton';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatMoney, formatRelativeTime, statusLabel } from '@/lib/format';
import { useSeasonModel } from '@/lib/sleeper/queries';

export type SeasonView = 'overview' | 'awards' | 'beer-duty' | 'standings' | 'stats' | 'rules';

const VIEWS: { view: SeasonView; label: string; path: string }[] = [
  { view: 'overview', label: 'Overview', path: '' },
  { view: 'awards', label: 'Awards', path: '/awards' },
  { view: 'beer-duty', label: 'Beer duty', path: '/beer-duty' },
  { view: 'standings', label: 'Standings', path: '/standings' },
  { view: 'stats', label: 'Stats', path: '/stats' },
  { view: 'rules', label: 'Rules', path: '/rules' },
];

/** Where the season stands. */
function StatusBadge({ season }: { season: SeasonModel }) {
  if (season.status === 'complete' || season.isComplete) return <Badge tone="gold">Final</Badge>;
  if (season.status === 'in_season') {
    return season.liveWeek ? (
      <Badge tone="brand">Week {season.liveWeek} in progress</Badge>
    ) : (
      <Badge tone="brand">In season</Badge>
    );
  }
  return <Badge>{statusLabel(season.status)}</Badge>;
}

/** How fresh the numbers are, and any caveat about them. */
function StatusMeta({ season, updatedAt }: { season: SeasonModel; updatedAt: number }) {
  const throughWeek = season.regularSeasonWeeks.at(-1)?.week;
  const parts: string[] = [`${season.teams.length} teams`];

  if (season.status === 'in_season') {
    parts.push(throughWeek ? `Settled through week ${throughWeek}` : 'No week final yet');
    parts.push(`Updated ${formatRelativeTime(updatedAt)}`);
  } else if (!season.hasScores) {
    parts.push(`The ${season.season} season has not started`);
  }
  if (season.usesMedianScoring) {
    parts.push('Scores against the weekly median too, so records come from Sleeper');
  }

  return (
    <>
      {parts.map((part, index) => (
        <span key={part} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden>·</span> : null}
          <span>{part}</span>
        </span>
      ))}
    </>
  );
}

/** The pot, from the config and the roster count. */
function Pot({ season }: { season: SeasonModel }) {
  const teams = season.teams.length;
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-2 text-right">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        Pot
      </p>
      <p className="font-display text-2xl font-bold tabular text-gold">
        {formatMoney(LEAGUE.buyIn * teams)}
      </p>
      <p className="text-xs text-ink-dim">{formatMoney(LEAGUE.buyIn)} a team</p>
    </div>
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

export function SeasonRoute({ view }: { view: SeasonView }) {
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
      <PageHeader
        eyebrow={LEAGUE.name}
        title={`${season.season} season`}
        badges={<StatusBadge season={season} />}
        meta={<StatusMeta season={season} updatedAt={seasonQuery.dataUpdatedAt} />}
        aside={<Pot season={season} />}
      />

      <TabNav
        label="Season sections"
        items={VIEWS.map((item) => ({
          to: `/${season.season}${item.path}`,
          label: item.label,
          active: item.view === view,
        }))}
      />

      <View view={view} season={season} awards={awards} />
    </div>
  );
}
