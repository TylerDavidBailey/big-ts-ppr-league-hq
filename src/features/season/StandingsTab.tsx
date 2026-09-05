import { PlayerChip } from '../shared/PlayerChip';
import { TeamChip } from '../shared/TeamChip';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import {
  lineupEfficiency,
  powerRankings,
  superlatives,
  type GameRecord,
  type Superlatives,
} from '@/domain/stats';
import type { SeasonModel, StandingsRow } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPercent, formatPoints, formatRecord, formatSigned } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

const OUTCOME_TONE = {
  win: 'bg-win/80 text-canvas',
  loss: 'bg-loss/70 text-white',
  tie: 'bg-white/20 text-ink',
} as const;

/** Compact W/L strip, most recent week last. */
function FormStrip({ form }: { form: StandingsRow['form'] }) {
  const recent = form.slice(-10);
  if (recent.length === 0) return <span className="text-xs text-ink-dim">—</span>;

  return (
    <span className="flex gap-1">
      {recent.map((outcome, index) => (
        <span
          key={index}
          className={cn(
            'grid size-4 place-items-center rounded-[3px] text-[9px] font-bold uppercase',
            OUTCOME_TONE[outcome],
          )}
        >
          <span aria-hidden>{outcome[0]}</span>
          <span className="sr-only">
            Week {form.length - recent.length + index + 1}: {outcome}
          </span>
        </span>
      ))}
    </span>
  );
}

function Standings({ season }: { season: SeasonModel }) {
  const playoffCutoff = season.playoffTeams;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        {season.isRegularSeasonComplete ? null : (
          <span className="text-xs text-ink-dim">
            Through week {season.regularSeasonWeeks.at(-1)?.week ?? 0}
          </span>
        )}
      </CardHeader>
      <Table caption={`${season.season} regular-season standings`} className="min-w-[36rem]">
        <HeadRow>
          <Th>#</Th>
          <Th>Team</Th>
          <Th align="right">Record</Th>
          <Th align="right">PF</Th>
          <Th align="right">PA</Th>
          <Th align="right">Streak</Th>
          <Th className="hidden md:table-cell">Form</Th>
        </HeadRow>
        <tbody>
          {season.standings.map((row) => {
            const inPlayoffs = playoffCutoff > 0 && row.rank <= playoffCutoff;
            return (
              <Row key={row.rosterId} className={cn(row.rank === 1 && 'bg-gold/[0.06]')}>
                <RankCell
                  rank={row.rank}
                  tone={row.rank === 1 ? 'gold' : inPlayoffs ? 'brand' : 'dim'}
                />
                <Td>
                  <TeamChip team={season.teamsByRosterId.get(row.rosterId)} showManager />
                </Td>
                <Td align="right" className="font-semibold">
                  {formatRecord(row.wins, row.losses, row.ties)}
                  {row.tied ? <span className="ml-1 text-xs text-ink-dim">T</span> : null}
                </Td>
                <Td align="right" className="text-ink-muted">
                  {formatPoints(row.pointsFor)}
                </Td>
                <Td align="right" className="text-ink-dim">
                  {formatPoints(row.pointsAgainst)}
                </Td>
                <Td align="right">
                  {row.streak ? (
                    <span
                      className={cn(
                        'font-semibold',
                        row.streak.kind === 'win' ? 'text-win' : 'text-loss',
                      )}
                    >
                      {row.streak.length}
                      {row.streak.kind[0]?.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-ink-dim">—</span>
                  )}
                </Td>
                <Td className="hidden md:table-cell">
                  <FormStrip form={row.form} />
                </Td>
              </Row>
            );
          })}
        </tbody>
      </Table>
      {playoffCutoff > 0 ? (
        <p className="border-t border-hairline px-4 py-3 text-xs text-ink-dim">
          Top {playoffCutoff} make the playoffs, which start in week {season.playoffWeekStart}. Ties
          are broken by total points scored. A T marks teams level on both.
        </p>
      ) : null}
    </Card>
  );
}

function PowerRankings({ season }: { season: SeasonModel }) {
  const rows = powerRankings(season);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Power rankings and luck</CardTitle>
      </CardHeader>
      <Table caption={`${season.season} all-play power rankings`} className="min-w-[40rem]">
        <HeadRow>
          <Th>#</Th>
          <Th>Team</Th>
          <Th align="right">All-play</Th>
          <Th align="right">Win %</Th>
          <Th align="right">Exp W</Th>
          <Th align="right">Act W</Th>
          <Th align="right">Luck</Th>
          <Th align="right">PA</Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.rosterId}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} />
              <Td>
                <TeamChip team={season.teamsByRosterId.get(row.rosterId)} />
              </Td>
              <Td align="right" className="font-semibold">
                {formatRecord(row.allPlayWins, row.allPlayLosses, row.allPlayTies)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPercent(row.allPlayPct)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {row.expectedWins.toFixed(2)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {row.actualWins}
              </Td>
              <Td
                align="right"
                className={cn(
                  'font-semibold',
                  row.luck > 0.5 ? 'text-win' : row.luck < -0.5 ? 'text-loss' : 'text-ink-muted',
                )}
              >
                {formatSigned(row.luck)}
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.pointsAgainst)}
              </Td>
            </Row>
          ))}
        </tbody>
      </Table>
      <p className="border-t border-hairline px-4 py-3 text-xs text-ink-dim">
        All-play scores each team against every other team every week. Expected wins is that record
        scaled to one game a week. Luck is actual wins minus expected: positive means the schedule
        helped.
      </p>
    </Card>
  );
}

function LineupEfficiency({ season }: { season: SeasonModel }) {
  const rows = lineupEfficiency(season);
  const playerIndex = usePlayerIndex().data ?? {};

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Lineup efficiency</CardTitle>
      </CardHeader>
      <Table caption={`${season.season} lineup efficiency`} className="min-w-[44rem]">
        <HeadRow>
          <Th>#</Th>
          <Th>Team</Th>
          <Th align="right">Points</Th>
          <Th align="right">Max</Th>
          <Th align="right">Eff.</Th>
          <Th align="right">Bench pts</Th>
          <Th>Biggest benched score</Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.rosterId}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} />
              <Td>
                <TeamChip team={season.teamsByRosterId.get(row.rosterId)} />
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPoints(row.pointsFor)}
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.maxPointsFor)}
              </Td>
              <Td align="right" className="font-semibold">
                {row.efficiency === null ? '—' : formatPercent(row.efficiency)}
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.benchPoints)}
              </Td>
              <Td>
                {row.biggestBench ? (
                  <span className="flex items-center gap-3">
                    <PlayerChip player={lookupPlayer(playerIndex, row.biggestBench.playerId)} />
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular text-ink">
                        {formatPoints(row.biggestBench.points)}
                      </span>
                      <span className="block text-xs text-ink-dim">Wk {row.biggestBench.week}</span>
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-dim">—</span>
                )}
              </Td>
            </Row>
          ))}
        </tbody>
      </Table>
      <p className="border-t border-hairline px-4 py-3 text-xs text-ink-dim">
        Max is what a perfect lineup would have scored, as Sleeper reports it. Bench points are
        everything scored by players left on the bench.
      </p>
    </Card>
  );
}

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

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface/60 p-4">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        {label}
      </p>
      {value ? <p className="font-display text-2xl font-bold tabular text-brand">{value}</p> : null}
      {children}
    </div>
  );
}

function SuperlativesGrid({ season }: { season: SeasonModel }) {
  const stats: Superlatives = superlatives(season);
  const team = (rosterId: number) => season.teamsByRosterId.get(rosterId);

  const games = (label: string, list: GameRecord[], value: (game: GameRecord) => string) => {
    const first = list[0];
    return (
      <StatCard label={label} value={first ? value(first) : null}>
        {list.length === 0 ? (
          <p className="text-sm text-ink-dim">Not yet.</p>
        ) : (
          list.map((game) => (
            <GameLine key={`${game.week}-${game.rosterId}`} game={game} season={season} />
          ))
        )}
      </StatCard>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season superlatives</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        <StatCard
          label="Longest win streak"
          value={stats.longestWinStreak[0] ? `${stats.longestWinStreak[0].length} games` : null}
        >
          {stats.longestWinStreak.length === 0 ? (
            <p className="text-sm text-ink-dim">Not yet.</p>
          ) : (
            stats.longestWinStreak.map((streak) => (
              <div key={streak.rosterId} className="space-y-1.5">
                <TeamChip team={team(streak.rosterId)} size="sm" />
                <p className="text-xs text-ink-dim">
                  Weeks {streak.fromWeek} to {streak.toWeek}
                </p>
              </div>
            ))
          )}
        </StatCard>

        <StatCard
          label="Longest losing streak"
          value={stats.longestLossStreak[0] ? `${stats.longestLossStreak[0].length} games` : null}
        >
          {stats.longestLossStreak.length === 0 ? (
            <p className="text-sm text-ink-dim">Not yet.</p>
          ) : (
            stats.longestLossStreak.map((streak) => (
              <div key={streak.rosterId} className="space-y-1.5">
                <TeamChip team={team(streak.rosterId)} size="sm" />
                <p className="text-xs text-ink-dim">
                  Weeks {streak.fromWeek} to {streak.toWeek}
                </p>
              </div>
            ))
          )}
        </StatCard>

        <StatCard label="Weekly top scores" value={null}>
          {stats.weeklyHighs.length === 0 ? (
            <p className="text-sm text-ink-dim">Not yet.</p>
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
        </StatCard>

        <StatCard
          label="Most consistent"
          value={
            stats.mostConsistent[0] ? `±${formatPoints(stats.mostConsistent[0].stdDev)}` : null
          }
        >
          {stats.mostConsistent.map((row) => (
            <div key={row.rosterId} className="space-y-1.5">
              <TeamChip team={team(row.rosterId)} size="sm" />
              <p className="text-xs text-ink-dim">Averages {formatPoints(row.mean)} a week</p>
            </div>
          ))}
        </StatCard>

        <StatCard
          label="Least consistent"
          value={
            stats.leastConsistent[0] ? `±${formatPoints(stats.leastConsistent[0].stdDev)}` : null
          }
        >
          {stats.leastConsistent.map((row) => (
            <div key={row.rosterId} className="space-y-1.5">
              <TeamChip team={team(row.rosterId)} size="sm" />
              <p className="text-xs text-ink-dim">Averages {formatPoints(row.mean)} a week</p>
            </div>
          ))}
        </StatCard>
      </CardBody>
    </Card>
  );
}

export function StandingsTab({ season }: { season: SeasonModel }) {
  if (!season.hasScores) {
    return (
      <EmptyState
        icon="📊"
        title="Standings open in week 1"
        description="Records are computed from played regular-season matchups, so there is nothing to rank yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Standings season={season} />
      <PowerRankings season={season} />
      <LineupEfficiency season={season} />
      <SuperlativesGrid season={season} />
    </div>
  );
}
