import { useMemo, useState } from 'react';

import { TeamChip } from '../../shared/TeamChip';
import { PlayerChip } from '../../shared/PlayerChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ResolvedAward } from '@/domain/awards';
import type { SeasonModel, TeamWeek, Week } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPoints } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

/** Pair up the two sides of each matchup, keeping byes as single-sided rows. */
function pairMatchups(week: Week): [TeamWeek, TeamWeek | null][] {
  const seen = new Set<number>();
  const pairs: [TeamWeek, TeamWeek | null][] = [];

  for (const team of week.teams) {
    if (seen.has(team.rosterId)) continue;
    seen.add(team.rosterId);

    const opponent = week.teams.find((other) => other.rosterId === team.opponentRosterId) ?? null;
    if (opponent) seen.add(opponent.rosterId);
    pairs.push([team, opponent]);
  }

  return pairs;
}

function TeamRow({ side, season }: { side: TeamWeek; season: SeasonModel }) {
  const won = side.outcome === 'win';
  return (
    <div
      className={cn('flex items-center justify-between gap-3 px-4 py-3', won && 'bg-win/[0.06]')}
    >
      <TeamChip team={season.teamsByRosterId.get(side.rosterId)} />
      <span
        className={cn(
          'shrink-0 font-display text-lg font-bold tabular',
          won ? 'text-win' : side.outcome === 'loss' ? 'text-ink-dim' : 'text-ink',
        )}
      >
        {formatPoints(side.points)}
      </span>
    </div>
  );
}

export function ScoreboardTab({
  season,
  awards,
}: {
  season: SeasonModel;
  awards: ResolvedAward[];
}) {
  const playedWeeks = useMemo(() => season.weeks.filter((week) => week.played), [season.weeks]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const playerIndex = usePlayerIndex().data ?? {};

  const week =
    playedWeeks.find((candidate) => candidate.week === selectedWeek) ?? playedWeeks.at(-1);

  const punishment = useMemo(() => {
    const award = awards.find((candidate) => candidate.definition.id === 'weekly-punishment');
    const results = Array.isArray(award?.result) ? award.result : [];
    return { award, winner: results.find((result) => result.week === week?.week) };
  }, [awards, week?.week]);

  const topStarter = useMemo(() => {
    if (!week) return null;
    let best: { rosterId: number; playerId: string; points: number } | null = null;
    for (const team of week.teams) {
      for (const starter of team.starters) {
        if (!best || starter.points > best.points) {
          best = { rosterId: team.rosterId, playerId: starter.playerId, points: starter.points };
        }
      }
    }
    return best;
  }, [week]);

  if (playedWeeks.length === 0 || !week) {
    return (
      <EmptyState
        icon="🗓️"
        title="No weeks played yet"
        description="Matchups appear here as soon as Sleeper posts week 1 scores."
      />
    );
  }

  return (
    <div className="space-y-5">
      <nav aria-label="Week" className="-mx-5 overflow-x-auto px-5">
        <ul className="flex min-w-max gap-1.5">
          {playedWeeks.map((candidate) => {
            const isCurrent = candidate.week === week.week;
            return (
              <li key={candidate.week}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWeek(candidate.week);
                  }}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
                    isCurrent
                      ? 'bg-brand text-canvas'
                      : candidate.phase === 'postseason'
                        ? 'border border-gold/30 text-gold hover:bg-gold/10'
                        : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
                  )}
                >
                  {candidate.week}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Week {week.week}
              {week.phase === 'postseason' ? ' · Playoffs' : ''}
            </CardTitle>
            <Badge tone={week.phase === 'postseason' ? 'gold' : 'neutral'}>
              {week.phase === 'postseason' ? 'Postseason' : 'Regular season'}
            </Badge>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {pairMatchups(week).map(([home, away]) => (
              <div
                key={home.rosterId}
                className="overflow-hidden rounded-xl border border-hairline bg-surface/50"
              >
                <TeamRow side={home} season={season} />
                {away ? (
                  <>
                    <div className="h-px bg-hairline" />
                    <TeamRow side={away} season={season} />
                  </>
                ) : (
                  <p className="border-t border-hairline px-4 py-2 text-xs text-ink-dim">
                    Bye week
                  </p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="space-y-4">
          {punishment.winner && week.phase === 'regular' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span aria-hidden className="mr-2 text-base">
                    {punishment.award?.definition.icon}
                  </span>
                  {punishment.award?.definition.name}
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <TeamChip
                  team={season.teamsByRosterId.get(punishment.winner.rosterId)}
                  showManager
                  size="lg"
                />
                <p className="font-display text-3xl font-bold tabular text-loss">
                  {formatPoints(punishment.winner.value)}
                </p>
                <p className="border-t border-hairline pt-3 text-xs text-ink-dim">
                  {punishment.award?.definition.description}
                </p>
              </CardBody>
            </Card>
          ) : null}

          {topStarter ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span aria-hidden className="mr-2 text-base">
                    ⭐
                  </span>
                  Top starter
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <PlayerChip player={lookupPlayer(playerIndex, topStarter.playerId)} />
                <div className="flex items-center justify-between gap-3">
                  <TeamChip team={season.teamsByRosterId.get(topStarter.rosterId)} size="sm" />
                  <span className="font-display text-2xl font-bold tabular text-brand">
                    {formatPoints(topStarter.points)}
                  </span>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
