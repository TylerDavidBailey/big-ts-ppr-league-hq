import { TeamChip } from '../shared/TeamChip';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import type { SeasonModel, StandingsRow } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatPoints, formatRecord } from '@/lib/format';

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

function Streak({ streak }: { streak: StandingsRow['streak'] }) {
  if (!streak) return <span className="text-ink-dim">—</span>;
  return (
    <span className={cn('font-semibold', streak.kind === 'win' ? 'text-win' : 'text-loss')}>
      {streak.length}
      {streak.kind[0]?.toUpperCase()}
    </span>
  );
}

/** The full regular-season table, with the playoff line drawn through it. */
export function StandingsTable({ season }: { season: SeasonModel }) {
  const playoffCutoff = season.playoffTeams;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        {season.isRegularSeasonComplete ? (
          <span className="text-xs text-ink-dim">Regular season complete</span>
        ) : (
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
            const lastIn = playoffCutoff > 0 && row.rank === playoffCutoff;
            return (
              <Row
                key={row.rosterId}
                className={cn(
                  row.rank === 1 && 'bg-gold/[0.06]',
                  lastIn && 'border-b-2 border-b-brand/40',
                )}
              >
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
                  <Streak streak={row.streak} />
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
        <CardFooter>
          Top {playoffCutoff} make the playoffs, which start in week {season.playoffWeekStart}. Ties
          are broken by total points scored. A T marks teams level on both.
        </CardFooter>
      ) : null}
    </Card>
  );
}
