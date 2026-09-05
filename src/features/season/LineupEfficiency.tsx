import { PlayerChip } from '../shared/PlayerChip';
import { TeamChip } from '../shared/TeamChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { lineupEfficiency } from '@/domain/stats';
import type { SeasonModel } from '@/domain/types';
import { formatPercent, formatPoints } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

/** Points scored against the best possible lineup, from Sleeper's own totals. */
export function LineupEfficiency({ season }: { season: SeasonModel }) {
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
                  <span className="flex items-center justify-between gap-3">
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
      <CardFooter>
        Max is what a perfect lineup would have scored, as Sleeper reports it. Bench points are
        everything scored by players left on the bench.
      </CardFooter>
    </Card>
  );
}
