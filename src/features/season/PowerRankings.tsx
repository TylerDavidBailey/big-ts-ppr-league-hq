import { TeamChip } from '../shared/TeamChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { powerRankings } from '@/domain/stats';
import type { SeasonModel } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPercent, formatPoints, formatRecord, formatSigned } from '@/lib/format';

/** A signed bar beside the luck figure, so the column reads without the numbers. */
function LuckBar({ luck, scale }: { luck: number; scale: number }) {
  const width = scale > 0 ? Math.min(100, (Math.abs(luck) / scale) * 100) : 0;
  return (
    <span aria-hidden className="relative block h-1.5 w-16 rounded-full bg-white/[0.06]">
      <span
        className={cn(
          'absolute top-0 h-full rounded-full',
          luck > 0 ? 'left-1/2 bg-win/80' : 'right-1/2 bg-loss/70',
        )}
        style={{ width: `${width / 2}%` }}
      />
    </span>
  );
}

/** All-play record, expected wins, and how lucky the schedule has been. */
export function PowerRankings({ season }: { season: SeasonModel }) {
  const rows = powerRankings(season);
  const luckScale = Math.max(...rows.map((row) => Math.abs(row.luck)), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Power rankings and luck</CardTitle>
      </CardHeader>
      <Table caption={`${season.season} all-play power rankings`} className="min-w-[44rem]">
        <HeadRow>
          <Th sticky="first" className="w-[3.25rem]">
            #
          </Th>
          <Th sticky="after-rank">Team</Th>
          <Th align="right" abbr="Record against every team, every week">
            All-play
          </Th>
          <Th align="right" abbr="All-play win percentage">
            Win %
          </Th>
          <Th align="right" abbr="Expected wins from the all-play record">
            Exp W
          </Th>
          <Th align="right" abbr="Actual wins">
            Act W
          </Th>
          <Th align="right" abbr="Actual wins minus expected wins">
            Luck
          </Th>
          <Th align="right" abbr="Points against">
            PA
          </Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.rosterId}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} sticky="first" />
              <Td sticky="after-rank" className="min-w-[11rem]">
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
              <Td align="right">
                <span className="flex items-center justify-end gap-2">
                  <LuckBar luck={row.luck} scale={luckScale} />
                  <span
                    className={cn(
                      'w-12 font-semibold',
                      row.luck > 0.5
                        ? 'text-win'
                        : row.luck < -0.5
                          ? 'text-loss'
                          : 'text-ink-muted',
                    )}
                  >
                    {formatSigned(row.luck)}
                  </span>
                </span>
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
