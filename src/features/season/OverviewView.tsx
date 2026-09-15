import { Podium } from './Podium';
import { RulesCard } from './RulesCard';
import { SectionLink } from './SectionLink';
import { WeekCard } from './WeekCard';
import { TeamChip } from '../shared/TeamChip';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, RankCell, Row, Table, Td, Th } from '@/components/ui/Table';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { formatPoints, formatRecord } from '@/lib/format';

interface OverviewViewProps {
  season: SeasonModel;
  awards: SeasonAwards;
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
 * Top to bottom: the podium once the playoffs are set, then the week card
 * beside the table. The card leads on a phone, because the newest beer duty
 * and the money leaders are what people open the site for on a Tuesday.
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
      {season.isRegularSeasonComplete ? <Podium season={season} awards={awards} /> : null}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <WeekCard season={season} awards={awards} mode="overview" />
        <PlayoffPicture season={season} />
      </div>
    </div>
  );
}
