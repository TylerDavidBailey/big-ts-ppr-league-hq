import { PlayerChip } from '../shared/PlayerChip';
import { TeamChip } from '../shared/TeamChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { lineupEfficiency } from '@/domain/stats';
import type { SeasonModel } from '@/domain/types';
import { formatPercent, formatPoints } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

/** The percentage with a bar under it, so the column reads as a ladder. */
function Efficiency({ ratio }: { ratio: number | null }) {
  if (ratio === null) return <span className="text-ink-dim">—</span>;
  return (
    <span className="block">
      <span className="block font-semibold">{formatPercent(ratio)}</span>
      <span aria-hidden className="mt-1 block h-1 w-full rounded-full bg-white/[0.06]">
        <span
          className="block h-full rounded-full bg-brand/70"
          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
        />
      </span>
    </span>
  );
}

/** Points scored against the best possible lineup, from Sleeper's own totals. */
export function LineupEfficiency({ season }: { season: SeasonModel }) {
  const rows = lineupEfficiency(season);
  const playerQuery = usePlayerIndex();
  const playerIndex = playerQuery.data ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineup efficiency</CardTitle>
      </CardHeader>
      <Table caption={`${season.season} lineup efficiency`} className="min-w-[48rem]">
        <HeadRow>
          <Th sticky="first" className="w-[3.25rem]">
            #
          </Th>
          <Th sticky="after-rank">Team</Th>
          <Th align="right" abbr="Points scored by the starting lineup">
            Points
          </Th>
          <Th align="right" abbr="Points the best possible lineup would have scored">
            Max
          </Th>
          <Th align="right" abbr="Points as a share of the maximum" className="w-28">
            Eff.
          </Th>
          <Th align="right" abbr="Points scored by players left on the bench">
            Bench
          </Th>
          <Th>Biggest benched score</Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.rosterId}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} sticky="first" />
              <Td sticky="after-rank" className="min-w-[11rem]">
                <TeamChip team={season.teamsByRosterId.get(row.rosterId)} />
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPoints(row.pointsFor)}
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.maxPointsFor)}
              </Td>
              <Td align="right">
                <Efficiency ratio={row.efficiency} />
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.benchPoints)}
              </Td>
              <Td>
                {row.biggestBench ? (
                  <span className="flex items-center justify-between gap-3">
                    {playerQuery.isPending ? (
                      <Skeleton className="h-9 w-36" />
                    ) : (
                      <PlayerChip
                        player={lookupPlayer(playerIndex, row.biggestBench.playerId)}
                        size="sm"
                      />
                    )}
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
      <CardFooter>
        Max is what a perfect lineup would have scored, as Sleeper reports it. Bench is everything
        scored by players left on the bench.
      </CardFooter>
    </Card>
  );
}
