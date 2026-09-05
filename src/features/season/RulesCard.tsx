import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatMoney, placementLabel } from '@/lib/format';

/** Buy-in, pot, and every payout, read from the config and nothing else. */
export function RulesCard({ season }: { season: SeasonModel }) {
  const teams = season.teams.length;
  const pot = LEAGUE.buyIn * teams;
  const playoffPlaces = Object.entries(LEAGUE.playoffPayouts)
    .map(([place, payout]) => ({ place: Number(place), payout }))
    .sort((a, b) => a.place - b.place);
  const awards = Object.values(LEAGUE.awards);
  const paidOut =
    playoffPlaces.reduce((sum, row) => sum + row.payout, 0) +
    awards.reduce((sum, award) => sum + award.payout, 0);

  const row = (label: string, value: string, key: string) => (
    <li key={key} className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-ink">{label}</span>
      <span className="font-display text-base font-bold tabular text-gold">{value}</span>
    </li>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden className="mr-2 text-base">
            🏈
          </span>
          Rules and payouts
        </CardTitle>
        <Badge tone="gold">{formatMoney(pot)} pot</Badge>
      </CardHeader>
      <CardBody className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-ink-muted">
            {formatMoney(LEAGUE.buyIn)} per team, {teams} teams.
          </p>
          <h3 className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Playoffs
          </h3>
          <ul className="mt-1 divide-y divide-hairline/60">
            {playoffPlaces.map(({ place, payout }) =>
              row(placementLabel(place), formatMoney(payout), `place-${place}`),
            )}
          </ul>
          <h3 className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Season awards, weeks 1 to {season.regularSeasonEndWeek}
          </h3>
          <ul className="mt-1 divide-y divide-hairline/60">
            {awards.map((award) =>
              row(`${award.icon} ${award.name}`, formatMoney(award.payout), award.name),
            )}
          </ul>
          {paidOut !== pot ? (
            <p className="mt-3 text-xs text-ink-dim">
              Payouts total {formatMoney(paidOut)} against a {formatMoney(pot)} pot.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {awards.map((award) => (
            <div key={award.name}>
              <p className="text-sm font-semibold text-ink">
                <span aria-hidden className="mr-1.5">
                  {award.icon}
                </span>
                {award.name}
              </p>
              <p className="mt-0.5 text-sm text-ink-dim">{award.rule}</p>
            </div>
          ))}
          <div className="rounded-xl border border-loss/30 bg-loss/5 p-3">
            <p className="text-sm font-semibold text-ink">
              <span aria-hidden className="mr-1.5">
                {LEAGUE.punishment.icon}
              </span>
              {LEAGUE.punishment.name}
            </p>
            <p className="mt-0.5 text-sm text-ink-dim">{LEAGUE.punishment.rule}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
