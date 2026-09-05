import { Link } from 'react-router-dom';

import { ManagerChip } from '../shared/ManagerChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { allTimeRecords, type AllTimeRecord, type RecordHolder } from '@/domain/history';
import type { SeasonSummary } from '@/domain/history';
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

function RecordCard({ record }: { record: AllTimeRecord }) {
  const first = record.holders[0];

  return (
    <StatTile
      label={record.label}
      value={first ? formatRecordValue(record, first) : undefined}
      badge={record.holders.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
    >
      {first ? null : <p className="text-sm text-ink-dim">Not yet.</p>}
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
    </StatTile>
  );
}

/** Every single-week and single-season record, with everyone who holds it. */
export function RecordsView({ summaries }: { summaries: SeasonSummary[] }) {
  const records = allTimeRecords(summaries);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record book</CardTitle>
        <span className="text-xs text-ink-dim">Regular season only</span>
      </CardHeader>
      <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </CardBody>
    </Card>
  );
}
