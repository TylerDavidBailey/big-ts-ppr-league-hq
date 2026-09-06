import { AwardCard } from './AwardCard';
import { Podium } from './Podium';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatPoints } from '@/lib/format';

interface AwardsViewProps {
  season: SeasonModel;
  awards: SeasonAwards;
}

/** The podium and the three paid awards, each with the places behind the winner. */
export function AwardsView({ season, awards }: AwardsViewProps) {
  if (!season.hasScores) {
    return (
      <EmptyState
        icon="⏳"
        title="No games played yet"
        description="Every award is decided on final scores. Week 1 opens the race."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Podium season={season} awards={awards} />
      <section aria-label="Paid awards" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AwardCard
          config={LEAGUE.awards.regularSeasonChamp}
          entries={awards.regularSeasonChamp}
          season={season}
          formatValue={(value) => `${formatPoints(value)} PF`}
        />
        <AwardCard
          config={LEAGUE.awards.highestTeamWeek}
          entries={awards.highestTeamWeek}
          season={season}
          formatValue={(value) => `${formatPoints(value)} pts`}
        />
        <AwardCard
          config={LEAGUE.awards.highestStarterWeek}
          entries={awards.highestStarterWeek}
          season={season}
          formatValue={(value) => `${formatPoints(value)} pts`}
        />
      </section>
    </div>
  );
}
