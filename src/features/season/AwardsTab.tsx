import { RulesCard } from './RulesCard';
import { PlayerChip } from '../shared/PlayerChip';
import { TeamChip } from '../shared/TeamChip';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RankedEntry, SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE, type AwardConfig } from '@/league.config';
import { cn } from '@/lib/cn';
import { formatMoney, formatPoints, placementLabel } from '@/lib/format';
import { lookupPlayer } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

interface AwardsTabProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** Keyed by finishing place, so a bracket resolved out of order still reads right. */
const PODIUM_TONE: Record<number, BadgeTone> = { 1: 'gold', 2: 'neutral', 3: 'purple' };

/** Playoff finishes come from the bracket's placement games. Money from the config. */
function Podium({ season, awards }: AwardsTabProps) {
  const places = Object.keys(LEAGUE.playoffPayouts)
    .map(Number)
    .sort((a, b) => a - b);
  const decided = awards.podium.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playoffs</CardTitle>
        {season.isComplete ? null : <Badge>{season.hasScores ? 'Undecided' : 'Not started'}</Badge>}
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

function PlaceNumber({ place, tied }: { place: number; tied: boolean }) {
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

/** One paid award: the winner large, then the places behind them. */
function AwardCard({ config, entries, season, formatValue }: AwardCardProps) {
  const playerIndex = usePlayerIndex().data ?? {};
  const winners = entries.filter((entry) => entry.place === 1);
  const runnersUp = entries.filter((entry) => entry.place > 1);
  const isTie = winners.length > 1;
  const throughWeek = season.regularSeasonWeeks.at(-1)?.week;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            {config.icon}
          </span>
          {config.name}
        </CardTitle>
        <span className="flex items-center gap-2">
          {isTie ? <Badge tone="purple">Tied</Badge> : null}
          {!season.isRegularSeasonComplete && throughWeek ? (
            <Badge tone="brand">Through wk {throughWeek}</Badge>
          ) : null}
          <span className="font-display text-lg font-bold tabular text-gold">
            {formatMoney(config.payout)}
          </span>
        </span>
      </CardHeader>

      <CardBody className="flex flex-1 flex-col gap-4">
        {winners.length === 0 ? (
          <p className="py-4 text-sm text-ink-dim">Not decided yet.</p>
        ) : (
          <div className="space-y-3">
            {winners.map((winner) => (
              <div key={`${winner.rosterId}-${winner.week ?? 0}-${winner.playerId ?? ''}`}>
                <TeamChip
                  team={season.teamsByRosterId.get(winner.rosterId)}
                  showManager
                  size={isTie ? 'md' : 'lg'}
                />
                {winner.playerId ? (
                  <div className="mt-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2.5">
                    <PlayerChip player={lookupPlayer(playerIndex, winner.playerId)} />
                  </div>
                ) : null}
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold tabular text-brand">
                    {formatValue(winner.value)}
                  </span>
                  {winner.week ? (
                    <span className="text-xs text-ink-dim">Week {winner.week}</span>
                  ) : null}
                  {winner.detail ? (
                    <span className="text-xs text-ink-dim">{winner.detail}</span>
                  ) : null}
                </p>
              </div>
            ))}
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

        <p className="mt-auto border-t border-hairline pt-3 text-xs leading-relaxed text-ink-dim">
          {isTie ? 'Tied, so this award is the league’s to settle. ' : ''}
          {config.rule}
        </p>
      </CardBody>
    </Card>
  );
}

/** Every week's lowest scorer, plus the week still being played. */
function BeerDutyCard({ season, awards }: AwardsTabProps) {
  const weeks = new Map<number, RankedEntry[]>();
  for (const entry of awards.beerDuty) {
    const week = entry.week ?? 0;
    weeks.set(week, [...(weeks.get(week) ?? []), entry]);
  }
  const settled = [...weeks.entries()].sort(([a], [b]) => b - a);
  const liveWeek =
    season.liveWeek && season.liveWeek <= season.regularSeasonEndWeek && !weeks.has(season.liveWeek)
      ? season.liveWeek
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            {LEAGUE.punishment.icon}
          </span>
          {LEAGUE.punishment.name}
        </CardTitle>
        <span className="text-xs text-ink-dim">
          {settled.length} {settled.length === 1 ? 'week' : 'weeks'}
        </span>
      </CardHeader>

      <CardBody className="space-y-3">
        <p className="text-xs leading-relaxed text-ink-dim">{LEAGUE.punishment.rule}</p>

        {settled.length === 0 && !liveWeek ? (
          <p className="py-4 text-sm text-ink-dim">No weeks played yet.</p>
        ) : (
          <ul aria-label="Beer duty by week" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {liveWeek ? (
              <li className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-brand/40 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-brand">
                    Wk {liveWeek}
                  </span>
                  <span className="text-sm text-ink-dim">In progress</span>
                </span>
              </li>
            ) : null}
            {settled.map(([week, losers]) => (
              <li
                key={week}
                className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 font-display text-xs font-semibold uppercase tracking-wide text-ink-dim">
                    Wk {week}
                  </span>
                  <span className="min-w-0 space-y-1">
                    {losers.map((loser) => (
                      <TeamChip
                        key={loser.rosterId}
                        team={season.teamsByRosterId.get(loser.rosterId)}
                        size="sm"
                      />
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular text-loss">
                  {formatPoints(losers[0]?.value ?? 0)} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** During the season, the newest beer duty is the thing people came for. */
function ThisWeekHero({ season, awards }: AwardsTabProps) {
  const latestWeek = season.regularSeasonWeeks.at(-1)?.week;
  if (season.status !== 'in_season' || !latestWeek) return null;
  const losers = awards.beerDuty.filter((entry) => entry.week === latestWeek);
  if (losers.length === 0) return null;

  return (
    <section
      aria-label="Latest beer duty"
      className="glow-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand/30 bg-card/70 px-5 py-4"
    >
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          {LEAGUE.punishment.icon} Beer duty, week {latestWeek}
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          {losers.map((loser) => (
            <TeamChip
              key={loser.rosterId}
              team={season.teamsByRosterId.get(loser.rosterId)}
              showManager
              size="lg"
            />
          ))}
        </div>
      </div>
      <p className="font-display text-3xl font-bold tabular text-loss">
        {formatPoints(losers[0]?.value ?? 0)} pts
      </p>
    </section>
  );
}

export function AwardsTab({ season, awards }: AwardsTabProps) {
  if (!season.hasScores) {
    return (
      <div className="space-y-5">
        <EmptyState
          icon="⏳"
          title="No games played yet"
          description="Awards appear once week 1 is final. Here is what is on the line."
        />
        <RulesCard season={season} />
        <Podium season={season} awards={awards} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ThisWeekHero season={season} awards={awards} />
      <Podium season={season} awards={awards} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AwardCard
          config={LEAGUE.awards.regularSeasonChamp}
          entries={awards.regularSeasonChamp}
          season={season}
          formatValue={(value) => `${formatPoints(value)} PF`}
        />
        <AwardCard
          config={LEAGUE.awards.highestTeamWeek}
          entries={awards.highestTeamWeek}
          season={season}
          formatValue={(value) => `${formatPoints(value)} pts`}
        />
        <AwardCard
          config={LEAGUE.awards.highestStarterWeek}
          entries={awards.highestStarterWeek}
          season={season}
          formatValue={(value) => `${formatPoints(value)} pts`}
        />
      </div>

      <BeerDutyCard season={season} awards={awards} />
      <RulesCard season={season} />
    </div>
  );
}
