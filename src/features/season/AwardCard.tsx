import { Avatar } from '../shared/Avatar';
import { PlayerChip } from '../shared/PlayerChip';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RankedEntry } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import type { AwardConfig } from '@/league.config';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

/** A competition place, with a T when it is shared. */
export function PlaceNumber({ place, tied }: { place: number; tied: boolean }) {
  return (
    <span
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-md font-display text-xs font-bold tabular',
        place === 1 ? 'bg-gold text-canvas' : 'bg-white/5 text-ink-dim',
      )}
      title={tied ? 'Tied' : undefined}
    >
      {tied ? `T${place}` : place}
    </span>
  );
}

interface AwardCardProps {
  config: AwardConfig;
  entries: RankedEntry[];
  season: SeasonModel;
  formatValue: (value: number) => string;
}

/** One paid award: the rule, the winner large, then the places behind them. */
export function AwardCard({ config, entries, season, formatValue }: AwardCardProps) {
  const playerQuery = usePlayerIndex();
  const playerIndex = playerQuery.data ?? {};
  const winners = entries.filter((entry) => entry.place === 1);
  const runnersUp = entries.filter((entry) => entry.place > 1);
  const isTie = winners.length > 1;
  const throughWeek = season.regularSeasonWeeks.at(-1)?.week;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-start">
        <div className="min-w-0">
          <CardTitle>
            <span aria-hidden className="mr-2 text-base">
              {config.icon}
            </span>
            {config.name}
          </CardTitle>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">{config.rule}</p>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-display text-lg font-bold tabular text-gold">
            {formatMoney(config.payout)}
          </span>
          {isTie ? <Badge tone="purple">Tied</Badge> : null}
          {!season.isRegularSeasonComplete && throughWeek ? (
            <Badge tone="brand">Through wk {throughWeek}</Badge>
          ) : null}
        </span>
      </CardHeader>

      <CardBody className="flex flex-1 flex-col gap-4">
        {winners.length === 0 ? (
          <p className="py-4 text-sm text-ink-dim">Not decided yet.</p>
        ) : (
          <div className="space-y-2">
            {winners.map((winner) => {
              const team = season.teamsByRosterId.get(winner.rosterId);
              return (
                <div
                  key={`${winner.rosterId}-${winner.week ?? 0}-${winner.playerId ?? ''}`}
                  className="rounded-xl border border-gold/40 bg-gold/[0.06] px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      avatarId={team?.avatarId}
                      name={team?.name ?? '?'}
                      size={isTie ? 'md' : 'lg'}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {team?.name ?? 'Unknown team'}
                      </span>
                      {team && team.name !== team.managerName ? (
                        <span className="block truncate text-xs text-ink-dim">
                          {team.managerName}
                        </span>
                      ) : null}
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-3xl leading-none font-bold tabular text-brand">
                          {formatValue(winner.value)}
                        </span>
                        {winner.week ? (
                          <span className="text-xs text-ink-dim">Week {winner.week}</span>
                        ) : null}
                        {winner.detail ? (
                          <span className="text-xs text-ink-dim">{winner.detail}</span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                  {winner.playerId ? (
                    <div className="mt-3 border-t border-gold/20 pt-3">
                      {playerQuery.isPending ? (
                        <Skeleton className="h-7 w-40" />
                      ) : (
                        <PlayerChip player={lookupPlayer(playerIndex, winner.playerId)} size="sm" />
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {runnersUp.length > 0 ? (
          <ol className="divide-y divide-hairline/60 border-t border-hairline pt-2">
            {runnersUp.map((entry) => (
              <li
                key={`${entry.rosterId}-${entry.week ?? 0}-${entry.playerId ?? ''}`}
                className="flex items-center gap-2.5 py-2"
              >
                <PlaceNumber place={entry.place} tied={entry.tied} />
                <span className="min-w-0 flex-1">
                  <TeamChip team={season.teamsByRosterId.get(entry.rosterId)} size="sm" />
                  {entry.playerName ? (
                    <span className="mt-0.5 block truncate pl-8 text-xs text-ink-dim">
                      {entry.playerName}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular text-ink">
                    {formatValue(entry.value)}
                  </span>
                  <span className="block text-xs text-ink-dim">
                    {entry.week ? `Wk ${entry.week}` : entry.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {isTie ? (
          <p className="mt-auto border-t border-hairline pt-3 text-xs leading-relaxed text-ink-dim">
            Tied, so this award is the league’s to settle.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
