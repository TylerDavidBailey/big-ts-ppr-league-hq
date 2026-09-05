import { TeamChip } from '../shared/TeamChip';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { cn } from '@/lib/cn';
import { formatMoney, placementLabel } from '@/lib/format';

/** Keyed by finishing place, so a bracket resolved out of order still reads right. */
const PODIUM_TONE: Record<number, BadgeTone> = { 1: 'gold', 2: 'neutral', 3: 'purple' };

interface PodiumProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** Playoff finishes come from the bracket's placement games. Money from the config. */
export function Podium({ season, awards }: PodiumProps) {
  const places = Object.keys(LEAGUE.playoffPayouts)
    .map(Number)
    .sort((a, b) => a - b);
  const decided = awards.podium.length > 0;
  const status = season.isComplete
    ? null
    : season.isRegularSeasonComplete
      ? 'In progress'
      : season.hasScores
        ? `Start week ${season.playoffWeekStart}`
        : 'Not started';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            🏆
          </span>
          Playoffs
        </CardTitle>
        {status ? <Badge>{status}</Badge> : null}
      </CardHeader>
      <CardBody>
        <ol aria-label="Playoff finishes" className="grid gap-3 sm:grid-cols-3">
          {places.map((place) => {
            const placement = awards.podium.find((candidate) => candidate.place === place);
            const team = placement ? season.teamsByRosterId.get(placement.rosterId) : undefined;
            return (
              <li
                key={place}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border px-4 py-3',
                  place === 1 ? 'border-gold/40 bg-gold/[0.06]' : 'border-hairline bg-surface/60',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={PODIUM_TONE[place] ?? 'neutral'}>{placementLabel(place)}</Badge>
                  <span className="font-display text-lg font-bold tabular text-gold">
                    {formatMoney(LEAGUE.playoffPayouts[place] ?? 0)}
                  </span>
                </div>
                {team ? (
                  <TeamChip team={team} showManager size="lg" />
                ) : (
                  <span className="text-sm text-ink-dim">{decided ? 'Undecided' : 'TBD'}</span>
                )}
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
