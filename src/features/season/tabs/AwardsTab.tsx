import { TeamChip } from '../../shared/TeamChip';
import { PlayerChip } from '../../shared/PlayerChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AwardWinner, ResolvedAward } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { placementLabel, statusLabel } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

interface AwardsTabProps {
  season: SeasonModel;
  awards: ResolvedAward[];
}

const PODIUM_TONE = ['gold', 'neutral', 'purple'] as const;

/** Placement finishes come from the playoff bracket's placement games. */
function Podium({ season }: { season: SeasonModel }) {
  const podium = season.winnersBracket.placements.filter((placement) => placement.place <= 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playoff finish</CardTitle>
        {season.isComplete ? null : <Badge>Undecided</Badge>}
      </CardHeader>
      <CardBody>
        {podium.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-dim">
            The playoff bracket has not been decided yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {podium.map((placement, index) => (
              <li
                key={placement.place}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface/60 px-4 py-3"
              >
                <TeamChip team={season.teamsByRosterId.get(placement.rosterId)} showManager />
                <Badge tone={PODIUM_TONE[index] ?? 'neutral'}>
                  {placementLabel(placement.place)}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

function SeasonAwardCard({ award, season }: { award: ResolvedAward; season: SeasonModel }) {
  const { definition, result } = award;
  const winner = Array.isArray(result) ? null : result;
  const playerIndex = usePlayerIndex().data ?? {};

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            {definition.icon}
          </span>
          {definition.name}
        </CardTitle>
        {winner?.week ? <Badge tone="brand">Week {winner.week}</Badge> : null}
      </CardHeader>

      <CardBody className="flex flex-1 flex-col justify-between gap-4">
        {winner ? (
          <>
            <div className="space-y-3">
              <TeamChip team={season.teamsByRosterId.get(winner.rosterId)} showManager size="lg" />
              {winner.playerId ? (
                <div className="rounded-xl border border-hairline bg-surface/60 px-3 py-2.5">
                  <PlayerChip player={lookupPlayer(playerIndex, winner.playerId)} />
                </div>
              ) : winner.detail ? (
                <p className="text-sm text-ink-muted">{winner.detail}</p>
              ) : null}
            </div>

            <p className="font-display text-3xl font-bold tabular text-brand">
              {definition.formatValue(winner.value)}
            </p>
          </>
        ) : (
          <p className="py-4 text-sm text-ink-dim">Not decided yet.</p>
        )}

        <p className="border-t border-hairline pt-3 text-xs leading-relaxed text-ink-dim">
          {definition.description}
        </p>
      </CardBody>
    </Card>
  );
}

function WeeklyAwardCard({ award, season }: { award: ResolvedAward; season: SeasonModel }) {
  const { definition, result } = award;
  const winners: AwardWinner[] = Array.isArray(result) ? result : result ? [result] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            {definition.icon}
          </span>
          {definition.name}
        </CardTitle>
        <span className="text-xs text-ink-dim">{winners.length} weeks</span>
      </CardHeader>

      <CardBody className="space-y-3">
        <p className="text-xs leading-relaxed text-ink-dim">{definition.description}</p>

        {winners.length === 0 ? (
          <p className="py-4 text-sm text-ink-dim">No weeks played yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((winner) => (
              <li
                key={winner.week}
                className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    Wk {winner.week}
                  </span>
                  <TeamChip team={season.teamsByRosterId.get(winner.rosterId)} size="sm" />
                </span>
                <span className="shrink-0 text-sm font-semibold tabular text-loss">
                  {winner.value.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function AwardsTab({ season, awards }: AwardsTabProps) {
  const seasonScoped = awards.filter((award) => award.definition.scope === 'season');
  const weeklyScoped = awards.filter((award) => award.definition.scope === 'weekly');

  if (!season.hasScores) {
    return (
      <EmptyState
        icon="⏳"
        title="No games played yet"
        description={`This league is ${statusLabel(season.status).toLowerCase()}. Awards appear once week 1 scores are in.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Podium season={season} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seasonScoped.map((award) => (
          <SeasonAwardCard key={award.definition.id} award={award} season={season} />
        ))}
      </div>

      {weeklyScoped.map((award) => (
        <WeeklyAwardCard key={award.definition.id} award={award} season={season} />
      ))}
    </div>
  );
}
