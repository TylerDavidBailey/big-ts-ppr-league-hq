import { useState } from 'react';

import { ManagerChip } from '../shared/ManagerChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { allTimeStandings, type AllTimeRow, type SeasonSummary } from '@/domain/history';
import { LEAGUE } from '@/league.config';
import { cn } from '@/lib/cn';
import { formatPercent, formatPoints, formatRecord } from '@/lib/format';

type Facet = 'record' | 'finishes';

const FACETS: { value: Facet; label: string }[] = [
  { value: 'record', label: 'Record' },
  { value: 'finishes', label: 'Finishes' },
];

/** A count of finishes, dimmed to nothing when it is zero. */
const Count = ({ count, tone }: { count: number; tone: string }) => (
  <Td align="right" className={cn('font-semibold', count > 0 ? tone : 'text-ink-dim/40')}>
    {count}
  </Td>
);

/** A finish column heading: a glyph and a word, so it needs no tooltip. */
const FinishTh = ({ icon, children, abbr }: { icon: string; children: string; abbr: string }) => (
  <Th align="right" abbr={abbr}>
    <span aria-hidden className="mr-1">
      {icon}
    </span>
    {children}
  </Th>
);

function RecordCells({ row }: { row: AllTimeRow }) {
  return (
    <>
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
    </>
  );
}

function FinishCells({ row }: { row: AllTimeRow }) {
  return (
    <>
      <Td align="right" className="text-ink-muted">
        {row.playoffAppearances}
      </Td>
      <Td align="right" className="text-ink-muted">
        {formatRecord(row.playoffWins, row.playoffLosses, 0)}
      </Td>
      <Count count={row.titles} tone="text-gold" />
      <Count count={row.runnerUps} tone="text-ink" />
      <Count count={row.thirds} tone="text-palette-lavender" />
      <Count count={row.topSeeds} tone="text-brand" />
      <Count count={row.beerDuties} tone="text-loss" />
    </>
  );
}

/**
 * Career regular-season records, one row per manager.
 *
 * Sixteen columns is too many for any screen, so the table shows one facet
 * at a time: the record, or the finishes. The rank and the manager stay put
 * while the rest scrolls.
 */
export function AllTimeStandings({ summaries }: { summaries: SeasonSummary[] }) {
  const [facet, setFacet] = useState<Facet>('record');
  const rows = allTimeStandings(summaries);
  const seasons = summaries.filter(({ season }) => season.hasScores).length;

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle>All-time standings</CardTitle>
        <span className="flex items-center gap-3">
          <span className="text-xs text-ink-dim">
            {seasons} {seasons === 1 ? 'season' : 'seasons'}
          </span>
          <Segmented label="Columns" options={FACETS} value={facet} onChange={setFacet} />
        </span>
      </CardHeader>
      <Table caption="All-time standings by manager" className="min-w-[40rem]">
        <HeadRow>
          <Th sticky="first" className="w-[3.25rem]">
            #
          </Th>
          <Th sticky="after-rank">Manager</Th>
          {facet === 'record' ? (
            <>
              <Th align="right" abbr="Seasons played">
                Yrs
              </Th>
              <Th align="right">Record</Th>
              <Th align="right" abbr="Win percentage">
                Win %
              </Th>
              <Th align="right" abbr="Points for">
                PF
              </Th>
              <Th align="right" abbr="Points against">
                PA
              </Th>
              <Th align="right" abbr="Points per game">
                PPG
              </Th>
            </>
          ) : (
            <>
              <Th align="right" abbr="Winners-bracket appearances">
                Playoffs
              </Th>
              <Th align="right" abbr="Playoff wins and losses">
                Playoff W-L
              </Th>
              <FinishTh icon="🏆" abbr="Championships">
                Titles
              </FinishTh>
              <FinishTh icon="🥈" abbr="Runner-up finishes">
                2nd
              </FinishTh>
              <FinishTh icon="🥉" abbr="Third-place finishes">
                3rd
              </FinishTh>
              <FinishTh
                icon={LEAGUE.awards.regularSeasonChamp.icon}
                abbr={LEAGUE.awards.regularSeasonChamp.name}
              >
                1 seeds
              </FinishTh>
              <FinishTh icon={LEAGUE.punishment.icon} abbr={`${LEAGUE.punishment.name} weeks`}>
                Beers
              </FinishTh>
            </>
          )}
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.key} className={cn(row.rank === 1 && 'bg-gold/[0.06]')}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'dim'} sticky="first" />
              <Td sticky="after-rank" className="min-w-[11rem]">
                <ManagerChip manager={row} />
              </Td>
              {facet === 'record' ? <RecordCells row={row} /> : <FinishCells row={row} />}
            </Row>
          ))}
        </tbody>
      </Table>
      <CardFooter>
        Regular-season records, ranked by win percentage then points per game. Managers are matched
        across seasons by their Sleeper account. Playoffs counts winners-bracket appearances.
      </CardFooter>
    </Card>
  );
}
