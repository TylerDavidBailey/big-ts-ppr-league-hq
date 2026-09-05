import { PowerRankings } from './PowerRankings';
import { StandingsTable } from './StandingsTable';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SeasonModel } from '@/domain/types';

/** The table, then what the table hides: all-play strength and luck. */
export function StandingsView({ season }: { season: SeasonModel }) {
  if (!season.hasScores) {
    return (
      <EmptyState
        icon="📊"
        title="Standings open in week 1"
        description="Records are computed from played regular-season matchups, so there is nothing to rank yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      <StandingsTable season={season} />
      <PowerRankings season={season} />
    </div>
  );
}
