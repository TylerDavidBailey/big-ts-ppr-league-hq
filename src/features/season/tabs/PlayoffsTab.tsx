import { TeamChip } from '../../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { groupByRound } from '@/domain/bracket';
import type { Bracket, SeasonModel } from '@/domain/types';
import { cn } from '@/lib/cn';
import { ordinal, placementLabel, statusLabel } from '@/lib/format';
import type { SleeperBracketMatch } from '@/lib/sleeper/types';

function MatchSlot({
  rosterId,
  isWinner,
  season,
}: {
  rosterId: number | null;
  isWinner: boolean;
  season: SeasonModel;
}) {
  if (rosterId === null) {
    return <p className="px-3 py-2.5 text-sm italic text-ink-dim">To be decided</p>;
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2.5', isWinner && 'bg-win/[0.08]')}>
      <TeamChip
        team={season.teamsByRosterId.get(rosterId)}
        size="sm"
        className={cn(!isWinner && 'opacity-60')}
      />
    </div>
  );
}

type BracketKind = 'winners' | 'losers';

/**
 * Name a placement game.
 *
 * A bracket's `p` values are relative to that bracket. In the winners bracket
 * `p: 1` really is the championship. In the consolation bracket it decides the
 * best of the non-playoff teams, so it must not claim a league-wide place.
 */
function placementGameLabel(place: number, kind: BracketKind): string {
  if (kind === 'losers') {
    return place === 1 ? 'Consolation final' : `Consolation ${ordinal(place)} place game`;
  }
  return place === 1 ? 'Championship' : `${ordinal(place)} place game`;
}

function MatchCard({
  match,
  season,
  kind,
}: {
  match: SleeperBracketMatch;
  season: SeasonModel;
  kind: BracketKind;
}) {
  return (
    <li className="overflow-hidden rounded-xl border border-hairline bg-surface/50">
      {match.p !== undefined ? (
        <p className="border-b border-hairline bg-white/[0.03] px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
          {placementGameLabel(match.p, kind)}
        </p>
      ) : null}
      <MatchSlot rosterId={match.t1} isWinner={match.w === match.t1} season={season} />
      <div className="h-px bg-hairline" />
      <MatchSlot rosterId={match.t2} isWinner={match.w === match.t2} season={season} />
    </li>
  );
}

function BracketView({
  bracket,
  season,
  kind,
}: {
  bracket: Bracket;
  season: SeasonModel;
  kind: BracketKind;
}) {
  const rounds = groupByRound(bracket.matches);

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex min-w-max gap-4">
        {rounds.map((matches, index) => (
          <div key={index} className="w-60 shrink-0 space-y-2">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
              Round {index + 1}
            </p>
            <ul className="space-y-2">
              {matches.map((match) => (
                <MatchCard key={match.m} match={match} season={season} kind={kind} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlayoffsTab({ season }: { season: SeasonModel }) {
  const { winnersBracket, losersBracket } = season;

  if (winnersBracket.matches.length === 0) {
    // Before kickoff there is no bracket and no season either, so pointing at a
    // playoff week that is months away reads as though something is missing.
    return season.hasScores ? (
      <EmptyState
        icon="🏆"
        title="No playoff bracket yet"
        description={`Sleeper builds the bracket when the playoffs start in week ${season.playoffWeekStart}.`}
      />
    ) : (
      <EmptyState
        icon="🏈"
        title="The season hasn't started"
        description={`This league is ${statusLabel(season.status).toLowerCase()}. The playoff bracket appears once week ${season.playoffWeekStart} arrives.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      {winnersBracket.placements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Final placings</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {winnersBracket.placements.map((placement) => (
                <li
                  key={placement.place}
                  className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2.5"
                >
                  <TeamChip team={season.teamsByRosterId.get(placement.rosterId)} size="sm" />
                  <Badge tone={placement.place === 1 ? 'gold' : 'neutral'}>
                    {placementLabel(placement.place)}
                  </Badge>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Championship bracket</CardTitle>
        </CardHeader>
        <CardBody>
          <BracketView bracket={winnersBracket} season={season} kind="winners" />
        </CardBody>
      </Card>

      {losersBracket.matches.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Consolation bracket</CardTitle>
          </CardHeader>
          <CardBody>
            <BracketView bracket={losersBracket} season={season} kind="losers" />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
