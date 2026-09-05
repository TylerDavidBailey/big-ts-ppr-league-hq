import { RulesCard } from './RulesCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SeasonModel } from '@/domain/types';

/** The shape of the season, read from Sleeper's league settings. */
function SeasonFormat({ season }: { season: SeasonModel }) {
  const lastWeek = season.weeks.at(-1)?.week ?? season.playoffWeekStart;
  const rows: [string, string][] = [
    ['Teams', String(season.teams.length)],
    ['Regular season', `Weeks 1 to ${season.regularSeasonEndWeek}`],
    ['Playoffs', `${season.playoffTeams} teams, weeks ${season.playoffWeekStart} to ${lastWeek}`],
    ['Scoring', season.usesMedianScoring ? 'Head to head, plus the weekly median' : 'Head to head'],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season format</CardTitle>
      </CardHeader>
      <CardBody>
        <dl className="divide-y divide-hairline/60">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-sm text-ink-dim">{label}</dt>
              <dd className="text-sm font-semibold text-ink tabular">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-ink-dim">
          Read from the league&apos;s Sleeper settings. Change the format there and this follows.
        </p>
      </CardBody>
    </Card>
  );
}

/** The money and the wording, then the format Sleeper enforces. */
export function RulesView({ season }: { season: SeasonModel }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <RulesCard season={season} />
      <SeasonFormat season={season} />
    </div>
  );
}
