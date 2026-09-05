import { Link } from 'react-router-dom';

import { Podium } from './Podium';
import { RulesCard } from './RulesCard';
import { ThisWeekHero } from './ThisWeekHero';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatTile } from '@/components/ui/StatTile';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { beerDutyTally, type RankedEntry, type SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE, type AwardConfig } from '@/league.config';
import { formatMoney, formatPoints, formatRecord } from '@/lib/format';

interface OverviewViewProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

function SectionLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="text-xs font-semibold text-brand underline-offset-4 hover:underline">
      {children} →
    </Link>
  );
}

interface AwardGlanceProps {
  config: AwardConfig;
  entries: RankedEntry[];
  season: SeasonModel;
  unit: string;
}

/** One paid award, winner only. The places behind them live on the awards page. */
function AwardGlance({ config, entries, season, unit }: AwardGlanceProps) {
  const winners = entries.filter((entry) => entry.place === 1);
  const first = winners[0];
  const throughWeek = season.regularSeasonWeeks.at(-1)?.week;

  return (
    <StatTile
      label={
        <>
          <span aria-hidden className="mr-1.5">
            {config.icon}
          </span>
          {config.name}
        </>
      }
      value={first ? `${formatPoints(first.value)} ${unit}` : undefined}
      badge={
        <span className="flex items-center gap-1.5">
          {winners.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
          {first && !season.isRegularSeasonComplete && throughWeek ? (
            <Badge tone="brand">Wk {throughWeek}</Badge>
          ) : null}
          <span className="font-display text-sm font-bold tabular text-gold">
            {formatMoney(config.payout)}
          </span>
        </span>
      }
    >
      {winners.length === 0 ? (
        <p className="text-sm text-ink-dim">Not decided yet.</p>
      ) : (
        winners.map((winner) => (
          <div key={`${winner.rosterId}-${winner.week ?? 0}-${winner.playerId ?? ''}`}>
            <TeamChip team={season.teamsByRosterId.get(winner.rosterId)} size="sm" />
            <p className="pl-8 text-xs text-ink-dim">
              {[winner.playerName, winner.week ? `Week ${winner.week}` : winner.detail]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        ))
      )}
    </StatTile>
  );
}

/** Who has drawn beer duty most often so far. */
function BeerDutyGlance({ season, awards }: OverviewViewProps) {
  const tally = beerDutyTally(awards.beerDuty);
  const leaders = tally.filter((entry) => entry.place === 1);
  const first = leaders[0];

  return (
    <StatTile
      label={
        <>
          <span aria-hidden className="mr-1.5">
            {LEAGUE.punishment.icon}
          </span>
          {LEAGUE.punishment.name}
        </>
      }
      value={first ? `${first.value}×` : undefined}
      tone="loss"
      badge={leaders.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
    >
      {first ? (
        leaders.map((leader) => (
          <div key={leader.rosterId}>
            <TeamChip team={season.teamsByRosterId.get(leader.rosterId)} size="sm" />
            <p className="pl-8 text-xs text-ink-dim">{leader.detail}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-ink-dim">Nobody yet.</p>
      )}
    </StatTile>
  );
}

/** The top of the table: everyone in a playoff spot right now. */
function PlayoffPicture({ season }: { season: SeasonModel }) {
  const cutoff = season.playoffTeams > 0 ? season.playoffTeams : season.standings.length;
  const rows = season.standings.slice(0, cutoff);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>
          {season.isRegularSeasonComplete ? 'Playoff seeds' : 'Playoff picture'}
        </CardTitle>
        <span className="text-xs text-ink-dim">
          {season.isRegularSeasonComplete
            ? 'Regular season final'
            : `Through week ${season.regularSeasonWeeks.at(-1)?.week ?? 0}`}
        </span>
      </CardHeader>
      <Table caption={`${season.season} playoff picture`}>
        <HeadRow>
          <Th>#</Th>
          <Th>Team</Th>
          <Th align="right">Record</Th>
          <Th align="right">PF</Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.rosterId}>
              <RankCell rank={row.rank} tone={row.rank === 1 ? 'gold' : 'brand'} />
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
            </Row>
          ))}
        </tbody>
      </Table>
      <CardFooter className="flex items-center justify-between gap-3">
        <span>
          {season.playoffTeams > 0
            ? `${season.playoffTeams} teams make the playoffs.`
            : 'Every team is listed.'}
        </span>
        <SectionLink to={`/${season.season}/standings`}>Full standings</SectionLink>
      </CardFooter>
    </Card>
  );
}

/** Everyone in the league this season, for the pre-draft page. */
function Managers({ season }: { season: SeasonModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Managers</CardTitle>
        <span className="text-xs text-ink-dim">{season.teams.length} teams</span>
      </CardHeader>
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {season.teams.map((team) => (
            <li
              key={team.rosterId}
              className="rounded-xl border border-hairline bg-surface/60 px-3 py-2.5"
            >
              <TeamChip team={team} showManager />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/** The dashboard: the latest beer duty, the podium, each award's leader, and the top of the table. */
export function OverviewView({ season, awards }: OverviewViewProps) {
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
        <Managers season={season} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ThisWeekHero season={season} awards={awards} />
      {season.isRegularSeasonComplete ? <Podium season={season} awards={awards} /> : null}

      <section aria-label="Awards at a glance" className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Awards at a glance
          </h3>
          <SectionLink to={`/${season.season}/awards`}>All awards</SectionLink>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AwardGlance
            config={LEAGUE.awards.regularSeasonChamp}
            entries={awards.regularSeasonChamp}
            season={season}
            unit="PF"
          />
          <AwardGlance
            config={LEAGUE.awards.highestTeamWeek}
            entries={awards.highestTeamWeek}
            season={season}
            unit="pts"
          />
          <AwardGlance
            config={LEAGUE.awards.highestStarterWeek}
            entries={awards.highestStarterWeek}
            season={season}
            unit="pts"
          />
          <BeerDutyGlance season={season} awards={awards} />
        </div>
      </section>

      <PlayoffPicture season={season} />
    </div>
  );
}
