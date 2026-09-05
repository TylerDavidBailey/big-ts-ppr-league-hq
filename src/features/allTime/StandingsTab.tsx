import { ManagerChip } from '../shared/ManagerChip';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { allTimeStandings, type SeasonSummary } from '@/domain/history';
import { LEAGUE } from '@/league.config';
import { cn } from '@/lib/cn';
import { formatPercent, formatPoints, formatRecord } from '@/lib/format';

const Trophy = ({ count, tone }: { count: number; tone: string }) => (
  <Td align="right" className={cn('font-semibold', count > 0 ? tone : 'text-ink-dim/50')}>
    {count}
  </Td>
);

export function StandingsTab({ summaries }: { summaries: SeasonSummary[] }) {
  const rows = allTimeStandings(summaries);
  const seasons = summaries.filter(({ season }) => season.hasScores).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>All-time standings</CardTitle>
        <span className="text-xs text-ink-dim">
          {seasons} {seasons === 1 ? 'season' : 'seasons'}
        </span>
      </CardHeader>
      <Table caption="All-time standings by manager" className="min-w-[64rem]">
        <HeadRow>
          <Th>#</Th>
          <Th>Manager</Th>
          <Th align="right">Yrs</Th>
          <Th align="right">Record</Th>
          <Th align="right">Win %</Th>
          <Th align="right">PF</Th>
          <Th align="right">PA</Th>
          <Th align="right">PPG</Th>
          <Th align="right">Playoffs</Th>
          <Th align="right">Playoff W-L</Th>
          <Th align="right" title="Championships">
            🏆
          </Th>
          <Th align="right" title="Runner-up finishes">
            🥈
          </Th>
          <Th align="right" title="Third-place finishes">
            🥉
          </Th>
          <Th align="right" title={LEAGUE.awards.regularSeasonChamp.name}>
            {LEAGUE.awards.regularSeasonChamp.icon}
          </Th>
          <Th align="right" title={LEAGUE.punishment.name}>
            {LEAGUE.punishment.icon}
          </Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.key} className={cn(row.rank === 1 && 'bg-gold/[0.06]')}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} />
              <Td>
                <ManagerChip manager={row} />
              </Td>
              <Td align="right" className="text-ink-dim">
                {row.seasons}
              </Td>
              <Td align="right" className="font-semibold">
                {formatRecord(row.wins, row.losses, row.ties)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPercent(row.winPct)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPoints(row.pointsFor)}
              </Td>
              <Td align="right" className="text-ink-dim">
                {formatPoints(row.pointsAgainst)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatPoints(row.pointsPerGame)}
              </Td>
              <Td align="right" className="text-ink-muted">
                {row.playoffAppearances}
              </Td>
              <Td align="right" className="text-ink-muted">
                {formatRecord(row.playoffWins, row.playoffLosses, 0)}
              </Td>
              <Trophy count={row.titles} tone="text-gold" />
              <Trophy count={row.runnerUps} tone="text-ink" />
              <Trophy count={row.thirds} tone="text-palette-lavender" />
              <Trophy count={row.topSeeds} tone="text-brand" />
              <Trophy count={row.beerDuties} tone="text-loss" />
            </Row>
          ))}
        </tbody>
      </Table>
      <p className="border-t border-hairline px-4 py-3 text-xs text-ink-dim">
        Regular-season records, ranked by win percentage then points per game. Managers are matched
        across seasons by their Sleeper account. Playoffs counts winners-bracket appearances.
      </p>
    </Card>
  );
}
