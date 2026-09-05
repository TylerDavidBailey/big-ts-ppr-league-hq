import { Link } from 'react-router-dom';

import { ManagerChip } from '../shared/ManagerChip';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { HeadRow, Row, Table, Td, Th } from '@/components/ui/Table';
import {
  allTimeRecords,
  champions,
  type AllTimeRecord,
  type RecordHolder,
  type SeasonSummary,
} from '@/domain/history';
import type { Team } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatPoints } from '@/lib/format';

function formatRecordValue(record: AllTimeRecord, holder: RecordHolder): string {
  switch (record.format) {
    case 'points':
      return `${formatPoints(holder.value)} pts`;
    case 'margin':
      return `by ${formatPoints(holder.value)}`;
    case 'record':
      return holder.detail ?? String(holder.value);
    case 'streak':
      return `${holder.value} games`;
    case 'count':
      return `${holder.value}×`;
  }
}

function Champions({ summaries }: { summaries: SeasonSummary[] }) {
  const rows = champions(summaries);
  const cell = (team: Team | null, season: string) =>
    team ? (
      <TeamChip team={team} size="sm" />
    ) : (
      <span className="text-xs text-ink-dim">{season} undecided</span>
    );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Champions</CardTitle>
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
              <Td>{cell(row.champion, '')}</Td>
              <Td>{cell(row.runnerUp, '')}</Td>
              <Td>{cell(row.third, '')}</Td>
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

function RecordCard({ record }: { record: AllTimeRecord }) {
  const first = record.holders[0];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          {record.label}
        </p>
        {record.holders.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
      </div>
      {first ? (
        <p className="font-display text-2xl font-bold tabular text-brand">
          {formatRecordValue(record, first)}
        </p>
      ) : (
        <p className="text-sm text-ink-dim">Not yet.</p>
      )}
      {record.holders.map((holder) => (
        <div key={`${holder.key}-${holder.season}-${holder.week ?? 0}`} className="space-y-1">
          <ManagerChip manager={holder} size="sm" />
          <p className="pl-8 text-xs text-ink-dim">
            <Link
              to={`/${holder.season}`}
              className="text-brand underline-offset-4 hover:underline"
            >
              {holder.season}
            </Link>
            {holder.nameThen !== holder.name ? ` · as ${holder.nameThen}` : ''}
            {holder.week ? ` · Week ${holder.week}` : ''}
            {holder.playerName ? ` · ${holder.playerName}` : ''}
            {holder.detail && record.format !== 'record' ? ` · ${holder.detail}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

export function RecordsTab({ summaries }: { summaries: SeasonSummary[] }) {
  const records = allTimeRecords(summaries);

  return (
    <div className="space-y-5">
      <Champions summaries={summaries} />
      <Card>
        <CardHeader>
          <CardTitle>Record book</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
