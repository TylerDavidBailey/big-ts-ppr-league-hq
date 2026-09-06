import { PlaceNumber } from './AwardCard';
import { BeerDutyCard } from './BeerDutyCard';
import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { beerDutyTally, type SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';

interface BeerDutyViewProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** How many beers each team owes so far, most first. The rule sits under it, once. */
function SeasonTally({ season, awards }: BeerDutyViewProps) {
  const tally = beerDutyTally(awards.beerDuty);
  const leaders = tally.filter((entry) => entry.place === 1);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Season tally</CardTitle>
        {leaders.length > 1 ? <Badge tone="purple">Tied for most</Badge> : null}
      </CardHeader>
      <CardBody className="flex-1">
        {tally.length === 0 ? (
          <p className="py-4 text-sm text-ink-dim">Nobody yet.</p>
        ) : (
          <ol aria-label="Beer duties by team" className="divide-y divide-hairline/60">
            {tally.map((entry) => (
              <li key={entry.rosterId} className="flex items-center gap-3 py-2.5">
                <PlaceNumber place={entry.place} tied={entry.tied} />
                <span className="min-w-0 flex-1">
                  <TeamChip team={season.teamsByRosterId.get(entry.rosterId)} showManager />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-xl font-bold tabular text-loss">
                    {entry.value}×
                  </span>
                  <span className="block text-xs text-ink-dim">{entry.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
      <CardFooter>
        <span aria-hidden className="mr-1.5">
          {LEAGUE.punishment.icon}
        </span>
        {LEAGUE.punishment.rule}
      </CardFooter>
    </Card>
  );
}

/** The weekly losers and the running count. */
export function BeerDutyView({ season, awards }: BeerDutyViewProps) {
  if (!season.hasScores) {
    return (
      <EmptyState
        icon={LEAGUE.punishment.icon}
        title="Nobody owes a beer yet"
        description={LEAGUE.punishment.rule}
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <BeerDutyCard season={season} awards={awards} />
      <SeasonTally season={season} awards={awards} />
    </div>
  );
}
