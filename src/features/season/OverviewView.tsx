import { Link } from 'react-router-dom';

import { Podium } from './Podium';
import { RulesCard } from './RulesCard';
import { ThisWeekHero } from './ThisWeekHero';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import { beerDutyTally, type RankedEntry, type SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE, type AwardConfig } from '@/league.config';
import { formatMoney, formatPoints, formatRecord } from '@/lib/format';

interface OverviewViewProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** The link from a card to the section behind it. Lives in the card header, every time. */
function SectionLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="shrink-0 text-xs font-semibold whitespace-nowrap text-brand underline-offset-4 hover:underline"
    >
      {children} →
    </Link>
  );
}

interface AwardRowProps {
  icon: string;
  name: string;
  payout?: number;
  /** Everyone in first place. */
  leaders: RankedEntry[];
  season: SeasonModel;
  value: (entry: RankedEntry) => string;
  detail: (entry: RankedEntry) => string;
  tone?: 'brand' | 'loss';
  emptyText: string;
}

/** One award as a row: what it is, who leads, and by how much. */
function AwardRow({
  icon,
  name,
  payout,
  leaders,
  season,
  value,
  detail,
  tone = 'brand',
  emptyText,
}: AwardRowProps) {
  const first = leaders[0];

  return (
    <li className="flex items-start gap-3 py-3">
      <span aria-hidden className="mt-0.5 w-6 shrink-0 text-center text-lg leading-none">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            {name}
          </span>
          {leaders.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
        </div>
        {first ? (
          <div className="mt-1.5 space-y-1.5">
            {leaders.map((leader) => (
              <div
                key={`${leader.rosterId}-${leader.week ?? 0}-${leader.playerId ?? ''}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <TeamChip team={season.teamsByRosterId.get(leader.rosterId)} size="sm" />
                  <span className="block truncate pl-8 text-xs text-ink-dim">{detail(leader)}</span>
                </span>
                <span
                  className={`shrink-0 font-display text-lg font-bold tabular ${tone === 'loss' ? 'text-loss' : 'text-brand'}`}
                >
                  {value(leader)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink-dim">{emptyText}</p>
        )}
      </div>
      {payout !== undefined ? (
        <span className="shrink-0 font-display text-sm font-bold tabular text-gold">
          {formatMoney(payout)}
        </span>
      ) : null}
    </li>
  );
}

const leadersOf = (entries: RankedEntry[]) => entries.filter((entry) => entry.place === 1);

const awardDetail = (entry: RankedEntry) =>
  [entry.playerName, entry.week ? `Week ${entry.week}` : entry.detail].filter(Boolean).join(' · ');

/** The three paid awards and the punishment, one row each, leaders only. */
function AwardsCard({ season, awards }: OverviewViewProps) {
  const throughWeek = season.regularSeasonWeeks.at(-1)?.week;
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
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Awards</CardTitle>
        <span className="flex items-center gap-3">
          {!season.isRegularSeasonComplete && throughWeek ? (
            <span className="text-xs text-ink-dim">Through week {throughWeek}</span>
          ) : null}
          <SectionLink to={`/${season.season}/awards`}>All places</SectionLink>
        </span>
      </CardHeader>
      <CardBody className="flex-1">
        <ul aria-label="Award leaders" className="divide-y divide-hairline/60">
          {paid(LEAGUE.awards.regularSeasonChamp, awards.regularSeasonChamp, 'PF')}
          {paid(LEAGUE.awards.highestTeamWeek, awards.highestTeamWeek, 'pts')}
          {paid(LEAGUE.awards.highestStarterWeek, awards.highestStarterWeek, 'pts')}
          <AwardRow
            icon={LEAGUE.punishment.icon}
            name={`Most ${LEAGUE.punishment.name.toLowerCase()}`}
            leaders={leadersOf(beerDutyTally(awards.beerDuty))}
            season={season}
            value={(entry) => `${entry.value}×`}
            detail={(entry) => entry.detail ?? ''}
            tone="loss"
            emptyText="Nobody yet."
          />
        </ul>
      </CardBody>
      <CardFooter className="flex items-center justify-between gap-3">
        <span>{LEAGUE.punishment.icon} is a punishment, not a payout.</span>
        <SectionLink to={`/${season.season}/beer-duty`}>Every week</SectionLink>
      </CardFooter>
    </Card>
  );
}

/** The top of the table: everyone in a playoff spot right now. */
function PlayoffPicture({ season }: { season: SeasonModel }) {
  const cutoff = season.playoffTeams > 0 ? season.playoffTeams : season.standings.length;
  const rows = season.standings.slice(0, cutoff);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>
          {season.isRegularSeasonComplete ? 'Playoff seeds' : 'Playoff picture'}
        </CardTitle>
        <span className="flex items-center gap-3">
          <span className="text-xs text-ink-dim">
            {season.isRegularSeasonComplete
              ? 'Regular season final'
              : `Through week ${season.regularSeasonWeeks.at(-1)?.week ?? 0}`}
          </span>
          <SectionLink to={`/${season.season}/standings`}>Full standings</SectionLink>
        </span>
      </CardHeader>
      <div className="flex-1">
        <Table caption={`${season.season} playoff picture`}>
          <HeadRow>
            <Th className="w-[3.25rem]">#</Th>
            <Th>Team</Th>
            <Th align="right">Record</Th>
            <Th align="right" abbr="Points for">
              PF
            </Th>
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
      </div>
      <CardFooter>
        {season.playoffTeams > 0
          ? `${season.playoffTeams} teams make the playoffs, from week ${season.playoffWeekStart}.`
          : 'Every team is listed.'}
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

/**
 * The dashboard.
 *
 * Top to bottom: the newest beer duty while the season runs, the podium once
 * the playoffs are set, then the table beside the awards so a glance covers
 * both the race and the money.
 */
export function OverviewView({ season, awards }: OverviewViewProps) {
  if (!season.hasScores) {
    return (
      <div className="space-y-5">
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PlayoffPicture season={season} />
        <AwardsCard season={season} awards={awards} />
      </div>
    </div>
  );
}
