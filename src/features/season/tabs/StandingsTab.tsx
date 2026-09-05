import { TeamChip } from '../../shared/TeamChip';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
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
          title={`Week ${form.length - recent.length + index + 1}: ${outcome}`}
          className={cn(
            'grid size-4 place-items-center rounded-[3px] text-[9px] font-bold uppercase',
            OUTCOME_TONE[outcome],
          )}
        >
          <span aria-hidden>{outcome[0]}</span>
          {/* `title` is invisible to keyboard and screen reader users. */}
          <span className="sr-only">
            Week {form.length - recent.length + index + 1}: {outcome}
          </span>
        </span>
      ))}
    </span>
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

  const playoffCutoff = season.playoffTeams;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-sm sm:min-w-[42rem]">
          <caption className="sr-only">
            {season.season} regular-season standings through week {season.regularSeasonEndWeek}
          </caption>
          <thead>
            <tr className="border-b border-hairline text-left font-display text-[11px] uppercase tracking-[0.12em] text-ink-dim">
              <th scope="col" className="px-4 py-3 font-semibold">
                #
              </th>
              <th scope="col" className="px-2 py-3 font-semibold">
                Team
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                Record
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                PF
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell">
                PA
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell">
                Streak
              </th>
              <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                Form
              </th>
            </tr>
          </thead>

          <tbody>
            {season.standings.map((row) => {
              const inPlayoffs = playoffCutoff > 0 && row.rank <= playoffCutoff;
              return (
                <tr
                  key={row.rosterId}
                  className={cn(
                    'border-b border-hairline/60 last:border-0 transition hover:bg-white/[0.03]',
                    row.rank === 1 && 'bg-gold/[0.06]',
                  )}
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'grid size-6 place-items-center rounded-md font-display text-xs font-bold tabular',
                        row.rank === 1
                          ? 'bg-gold text-canvas'
                          : inPlayoffs
                            ? 'bg-brand/15 text-brand'
                            : 'text-ink-dim',
                      )}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <TeamChip team={season.teamsByRosterId.get(row.rosterId)} showManager />
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular">
                    {formatRecord(row.wins, row.losses, row.ties)}
                  </td>
                  <td className="px-3 py-3 text-right tabular text-ink-muted">
                    {formatPoints(row.pointsFor)}
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular text-ink-dim sm:table-cell">
                    {formatPoints(row.pointsAgainst)}
                  </td>
                  <td className="hidden px-3 py-3 text-right sm:table-cell">
                    {row.streak ? (
                      <span
                        className={cn(
                          'font-semibold tabular',
                          row.streak.kind === 'win' ? 'text-win' : 'text-loss',
                        )}
                      >
                        {row.streak.length}
                        {row.streak.kind[0]?.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-ink-dim">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <FormStrip form={row.form} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {playoffCutoff > 0 ? (
        <p className="border-t border-hairline px-4 py-3 text-xs text-ink-dim">
          Top {playoffCutoff} make the playoffs, which start in week {season.playoffWeekStart}. Ties
          are broken by total points scored.
        </p>
      ) : null}
    </Card>
  );
}
