import { TeamChip } from '../shared/TeamChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { powerRankings } from '@/domain/stats';
import type { SeasonModel } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPercent, formatPoints, formatRecord, formatSigned } from '@/lib/format';

/** All-play record, expected wins, and how lucky the schedule has been. */
export function PowerRankings({ season }: { season: SeasonModel }) {
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
      <CardFooter>
        All-play scores each team against every other team every week. Expected wins is that record
        scaled to one game a week. Luck is actual wins minus expected: positive means the schedule
        helped.
      </CardFooter>
    </Card>
  );
}
