import type { ReactNode } from 'react';

import { TeamChip } from '../shared/TeamChip';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { superlatives, type GameRecord, type StreakRecord } from '@/domain/stats';
import type { SeasonModel } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPoints } from '@/lib/format';

function GameLine({ game, season }: { game: GameRecord; season: SeasonModel }) {
  return (
    <div className="space-y-1.5">
      <TeamChip team={season.teamsByRosterId.get(game.rosterId)} size="sm" />
      <p className="text-xs text-ink-dim">
        {formatPoints(game.points)} to {formatPoints(game.opponentPoints)} vs{' '}
        {season.teamsByRosterId.get(game.opponentRosterId)?.name ?? 'unknown'}, week {game.week}
      </p>
    </div>
  );
}

function StreakLine({ streak, season }: { streak: StreakRecord; season: SeasonModel }) {
  return (
    <div className="space-y-1.5">
      <TeamChip team={season.teamsByRosterId.get(streak.rosterId)} size="sm" />
      <p className="text-xs text-ink-dim">
        Weeks {streak.fromWeek} to {streak.toWeek}
      </p>
    </div>
  );
}

const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const;

/** A named group of tiles, so games, streaks and consistency read apart. */
export function TileGroup({
  title,
  columns = 3,
  children,
}: {
  title: string;
  /** How many tiles across on a wide screen. Match it to the count, so no tile sits alone. */
  columns?: keyof typeof COLUMNS;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <h4 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
        {title}
      </h4>
      <div className={cn('grid gap-3', COLUMNS[columns])}>{children}</div>
    </section>
  );
}

const notYet = <p className="text-sm text-ink-dim">Not yet.</p>;

/** The season's extremes, each listing everyone who holds it. */
export function Superlatives({ season }: { season: SeasonModel }) {
  const stats = superlatives(season);
  const team = (rosterId: number) => season.teamsByRosterId.get(rosterId);

  const games = (label: string, list: GameRecord[], value: (game: GameRecord) => string) => {
    const first = list[0];
    return (
      <StatTile label={label} value={first ? value(first) : undefined}>
        {list.length === 0
          ? notYet
          : list.map((game) => (
              <GameLine key={`${game.week}-${game.rosterId}`} game={game} season={season} />
            ))}
      </StatTile>
    );
  };

  const streaks = (label: string, list: StreakRecord[]) => (
    <StatTile label={label} value={list[0] ? `${list[0].length} games` : undefined}>
      {list.length === 0
        ? notYet
        : list.map((streak) => (
            <StreakLine key={streak.rosterId} streak={streak} season={season} />
          ))}
    </StatTile>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season superlatives</CardTitle>
      </CardHeader>
      <CardBody className="space-y-6">
        <TileGroup title="Games" columns={4}>
          {games(
            'Biggest blowout',
            stats.biggestBlowout,
            (game) => `by ${formatPoints(game.margin)}`,
          )}
          {games('Closest game', stats.closestGame, (game) => `by ${formatPoints(game.margin)}`)}
          {games(
            'Highest-scoring loss',
            stats.highestScoringLoss,
            (game) => `${formatPoints(game.points)} pts`,
          )}
          {games(
            'Lowest-scoring win',
            stats.lowestScoringWin,
            (game) => `${formatPoints(game.points)} pts`,
          )}
        </TileGroup>

        <TileGroup title="Streaks" columns={2}>
          {streaks('Longest win streak', stats.longestWinStreak)}
          {streaks('Longest losing streak', stats.longestLossStreak)}
        </TileGroup>

        <TileGroup title="Week to week">
          <StatTile label="Weekly top scores">
            {stats.weeklyHighs.length === 0 ? (
              notYet
            ) : (
              <ol className="space-y-1.5">
                {stats.weeklyHighs.slice(0, 5).map((row) => (
                  <li key={row.rosterId} className="flex items-center justify-between gap-2">
                    <TeamChip team={team(row.rosterId)} size="sm" />
                    <span className="font-display text-lg font-bold tabular text-brand">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </StatTile>

          <StatTile
            label="Most consistent"
            value={
              stats.mostConsistent[0]
                ? `±${formatPoints(stats.mostConsistent[0].stdDev)}`
                : undefined
            }
          >
            {stats.mostConsistent.map((row) => (
              <div key={row.rosterId} className="space-y-1.5">
                <TeamChip team={team(row.rosterId)} size="sm" />
                <p className="text-xs text-ink-dim">Averages {formatPoints(row.mean)} a week</p>
              </div>
            ))}
          </StatTile>

          <StatTile
            label="Least consistent"
            value={
              stats.leastConsistent[0]
                ? `±${formatPoints(stats.leastConsistent[0].stdDev)}`
                : undefined
            }
          >
            {stats.leastConsistent.map((row) => (
              <div key={row.rosterId} className="space-y-1.5">
                <TeamChip team={team(row.rosterId)} size="sm" />
                <p className="text-xs text-ink-dim">Averages {formatPoints(row.mean)} a week</p>
              </div>
            ))}
          </StatTile>
        </TileGroup>
      </CardBody>
    </Card>
  );
}
