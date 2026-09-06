import { Link } from 'react-router-dom';

import { TeamChip } from '../shared/TeamChip';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatPoints } from '@/lib/format';

interface ThisWeekHeroProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** During the season, the newest beer duty is the thing people came for. */
export function ThisWeekHero({ season, awards }: ThisWeekHeroProps) {
  const latestWeek = season.regularSeasonWeeks.at(-1)?.week;
  if (season.status !== 'in_season' || !latestWeek) return null;
  const losers = awards.beerDuty.filter((entry) => entry.week === latestWeek);
  if (losers.length === 0) return null;

  return (
    <section
      aria-label="Latest beer duty"
      className="glow-brand flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-brand/30 bg-card/70 px-5 py-4"
    >
      <div className="min-w-0">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          {LEAGUE.punishment.icon} Beer duty, week {latestWeek}
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          {losers.map((loser) => (
            <TeamChip
              key={loser.rosterId}
              team={season.teamsByRosterId.get(loser.rosterId)}
              showManager
              size="lg"
            />
          ))}
        </div>
      </div>
      <div className="flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-0.5">
        <p className="font-display text-3xl font-bold tabular text-loss">
          {formatPoints(losers[0]?.value ?? 0)} pts
        </p>
        <Link
          to={`/${season.season}/beer-duty`}
          className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
        >
          Every week →
        </Link>
      </div>
    </section>
  );
}
