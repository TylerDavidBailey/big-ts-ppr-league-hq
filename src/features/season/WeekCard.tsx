import { AwardRow } from './AwardRow';
import { SectionLink } from './SectionLink';
import { Avatar } from '../shared/Avatar';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import type { RankedEntry, SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE, type AwardConfig } from '@/league.config';
import { formatPoints } from '@/lib/format';

interface WeekCardProps {
  season: SeasonModel;
  awards: SeasonAwards;
  /**
   * `overview` sits on the dashboard and links out to the sections behind it.
   * `snapshot` is the same card alone on a page, built to be screenshotted on
   * a phone, so it names the league itself and carries no links.
   */
  mode: 'overview' | 'snapshot';
}

/** Everyone sharing first place. */
const leadersOf = (entries: RankedEntry[]) => entries.filter((entry) => entry.place === 1);

/** The player and the week an award was earned in, or the record behind it. */
const awardDetail = (entry: RankedEntry) =>
  [entry.playerName, entry.week ? `Wk ${entry.week}` : entry.detail].filter(Boolean).join(' · ');

/** The newest settled week's punishment: the team, the score, and the rule they now owe. */
function BeerDuty({
  season,
  week,
  losers,
}: {
  season: SeasonModel;
  week: number;
  losers: RankedEntry[];
}) {
  return (
    <div className="rounded-xl border border-loss/40 bg-loss/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-loss">
          {LEAGUE.punishment.icon} {LEAGUE.punishment.name}, week {week}
        </p>
        {losers.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
      </div>
      {losers.length > 0 ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            {losers.map((loser) => (
              <TeamChip
                key={loser.rosterId}
                team={season.teamsByRosterId.get(loser.rosterId)}
                showManager
                size="md"
              />
            ))}
          </div>
          <p className="shrink-0 font-display text-2xl font-bold tabular text-loss">
            {formatPoints(losers[0]?.value ?? 0)} pts
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-dim">Nobody yet.</p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{LEAGUE.punishment.rule}</p>
    </div>
  );
}

/**
 * The week in one card: who owes the punishment this week and who leads the money.
 *
 * The week is the newest settled regular-season week, never the one being
 * played, so a Tuesday screenshot shows Monday night's result and a live
 * Sunday never names a loser from a half-played slate.
 */
export function WeekCard({ season, awards, mode }: WeekCardProps) {
  const week = season.regularSeasonWeeks.at(-1)?.week ?? 0;
  const losers = awards.beerDuty.filter((entry) => entry.week === week);
  const snapshot = mode === 'snapshot';

  const paid = (config: AwardConfig, entries: RankedEntry[], unit: string) => (
    <AwardRow
      icon={config.icon}
      name={config.name}
      payout={config.payout}
      leaders={leadersOf(entries)}
      season={season}
      value={(entry) => `${formatPoints(entry.value)} ${unit}`}
      detail={awardDetail}
      emptyText="Not decided yet."
    />
  );

  return (
    <section aria-label={`Week ${week}`} className="h-full">
      <Card className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            {snapshot ? <Avatar avatarId={season.avatarId} name={LEAGUE.name} size="md" /> : null}
            <div className="min-w-0">
              <p className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
                {snapshot ? `${LEAGUE.name} · ${season.season}` : `${season.season} season`}
              </p>
              <h3 className="font-display text-3xl leading-none font-bold uppercase text-ink">
                Week {week}
              </h3>
            </div>
          </div>
          {season.isRegularSeasonComplete ? (
            <Badge tone="gold">Final</Badge>
          ) : (
            <Badge tone="brand">In season</Badge>
          )}
        </div>

        <CardBody className="flex-1 space-y-4">
          <BeerDuty season={season} week={week} losers={losers} />
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Award leaders
              </p>
              <span className="text-xs text-ink-dim">
                {season.isRegularSeasonComplete ? 'Regular season final' : `Through week ${week}`}
              </span>
            </div>
            <ul aria-label="Award leaders" className="divide-y divide-hairline/60">
              {paid(LEAGUE.awards.regularSeasonChamp, awards.regularSeasonChamp, 'PF')}
              {paid(LEAGUE.awards.highestTeamWeek, awards.highestTeamWeek, 'pts')}
              {paid(LEAGUE.awards.highestStarterWeek, awards.highestStarterWeek, 'pts')}
            </ul>
          </div>
        </CardBody>

        {snapshot ? null : (
          <CardFooter className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>{LEAGUE.punishment.icon} is a punishment, not a payout.</span>
            <span className="flex flex-wrap items-center gap-4">
              <SectionLink to={`/${season.season}/awards`}>All places</SectionLink>
              <SectionLink to={`/${season.season}/beer-duty`}>Every week</SectionLink>
              <SectionLink to={`/${season.season}/snapshot`}>📸 Snapshot</SectionLink>
            </span>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
