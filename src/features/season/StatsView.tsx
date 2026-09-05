import { LineupEfficiency } from './LineupEfficiency';
import { Superlatives } from './Superlatives';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SeasonModel } from '@/domain/types';

/** Lineup decisions and the season's extremes. */
export function StatsView({ season }: { season: SeasonModel }) {
  if (!season.hasScores) {
    return (
      <EmptyState
        icon="📈"
        title="Stats open in week 1"
        description="Lineup efficiency and the superlatives need a played week."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Superlatives season={season} />
      <LineupEfficiency season={season} />
    </div>
  );
}
