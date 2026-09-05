import { Link } from 'react-router-dom';

import { ManagerChip } from '../shared/ManagerChip';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { HeadRow, Row, Table, Td, Th } from '@/components/ui/Table';
import { allTimeStandings, champions, type SeasonSummary } from '@/domain/history';
import type { Team } from '@/domain/types';
import { LEAGUE } from '@/league.config';

/** Everyone with a title, most first. Level counts sit side by side. */
function TitleCount({ summaries }: { summaries: SeasonSummary[] }) {
  const rows = allTimeStandings(summaries)
    .filter((row) => row.titles > 0)
    .sort((a, b) => b.titles - a.titles || b.runnerUps - a.runnerUps);
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title count</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <StatTile
            key={row.key}
            label={row.titles === 1 ? '1 title' : `${row.titles} titles`}
            value={'🏆'.repeat(Math.min(row.titles, 5))}
            tone="gold"
            badge={
              row.runnerUps > 0 ? (
                <span className="text-xs text-ink-dim">
                  {row.runnerUps} {row.runnerUps === 1 ? 'final lost' : 'finals lost'}
                </span>
              ) : null
            }
          >
            <ManagerChip manager={row} size="sm" />
          </StatTile>
        ))}
      </CardBody>
    </Card>
  );
}

/** One row per season with scores, newest first. */
function ChampionsTable({ summaries }: { summaries: SeasonSummary[] }) {
  const rows = champions(summaries);
  const cell = (team: Team | null) =>
    team ? (
      <TeamChip team={team} size="sm" />
    ) : (
      <span className="text-xs text-ink-dim">Undecided</span>
    );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Champions by season</CardTitle>
      </CardHeader>
      <Table caption="Champions by season" className="min-w-[48rem]">
        <HeadRow>
          <Th>Season</Th>
          <Th>🏆 Champion</Th>
          <Th>🥈 Runner-up</Th>
          <Th>🥉 Third</Th>
          <Th>
            {LEAGUE.awards.regularSeasonChamp.icon} {LEAGUE.awards.regularSeasonChamp.name}
          </Th>
        </HeadRow>
        <tbody>
          {rows.map((row) => (
            <Row key={row.season.leagueId}>
              <Td>
                <Link
                  to={`/${row.season.season}`}
                  className="font-display text-lg font-bold tabular text-brand underline-offset-4 hover:underline"
                >
                  {row.season.season}
                </Link>
                {row.season.isComplete ? null : (
                  <Badge className="ml-2" tone="brand">
                    Live
                  </Badge>
                )}
              </Td>
              <Td>{cell(row.champion)}</Td>
              <Td>{cell(row.runnerUp)}</Td>
              <Td>{cell(row.third)}</Td>
              <Td>
                {row.topSeeds.length === 0 ? (
                  <span className="text-xs text-ink-dim">Undecided</span>
                ) : (
                  <span className="space-y-1">
                    {row.topSeeds.map((team) => (
                      <TeamChip key={team.rosterId} team={team} size="sm" />
                    ))}
                  </span>
                )}
              </Td>
            </Row>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

/** Who has won it, and how often. */
export function ChampionsView({ summaries }: { summaries: SeasonSummary[] }) {
  return (
    <div className="space-y-5">
      <TitleCount summaries={summaries} />
      <ChampionsTable summaries={summaries} />
    </div>
  );
}
