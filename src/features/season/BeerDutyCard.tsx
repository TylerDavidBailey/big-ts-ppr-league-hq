import { TeamChip } from '../shared/TeamChip';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { RankedEntry, SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatPoints } from '@/lib/format';

interface BeerDutyCardProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** Every week's lowest scorer, newest first, plus the week still being played. */
export function BeerDutyCard({ season, awards }: BeerDutyCardProps) {
  const weeks = new Map<number, RankedEntry[]>();
  for (const entry of awards.beerDuty) {
    const week = entry.week ?? 0;
    weeks.set(week, [...(weeks.get(week) ?? []), entry]);
  }
  const settled = [...weeks.entries()].sort(([a], [b]) => b - a);
  const liveWeek =
    season.liveWeek && season.liveWeek <= season.regularSeasonEndWeek && !weeks.has(season.liveWeek)
      ? season.liveWeek
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            {LEAGUE.punishment.icon}
          </span>
          {LEAGUE.punishment.name}
        </CardTitle>
        <span className="text-xs text-ink-dim">
          {settled.length} {settled.length === 1 ? 'week' : 'weeks'}
        </span>
      </CardHeader>

      <CardBody>
        {settled.length === 0 && !liveWeek ? (
          <p className="py-4 text-sm text-ink-dim">No weeks played yet.</p>
        ) : (
          <ul aria-label="Beer duty by week" className="grid gap-2 sm:grid-cols-2">
            {liveWeek ? (
              <li className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-brand/40 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-brand">
                    Wk {liveWeek}
                  </span>
                  <span className="text-sm text-ink-dim">In progress</span>
                </span>
              </li>
            ) : null}
            {settled.map(([week, losers]) => (
              <li
                key={week}
                className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    Wk {week}
                  </span>
                  <span className="min-w-0 space-y-1">
                    {losers.map((loser) => (
                      <TeamChip
                        key={loser.rosterId}
                        team={season.teamsByRosterId.get(loser.rosterId)}
                        size="sm"
                      />
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular text-loss">
                  {formatPoints(losers[0]?.value ?? 0)} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
