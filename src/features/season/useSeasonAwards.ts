import { useMemo } from 'react';

import { computeSeasonAwards, type SeasonAwards } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { playerNameResolver } from '@/lib/players';
import { usePlayerIndex } from '@/lib/sleeper/queries';

/** The four awards for one season, recomputed when the season or the names change. */
export function useSeasonAwards(season: SeasonModel | undefined): SeasonAwards | null {
  const playerIndex = usePlayerIndex().data;

  return useMemo(() => {
    if (!season) return null;
    return computeSeasonAwards(
      season,
      { playerName: playerNameResolver(playerIndex ?? {}) },
      LEAGUE.places,
    );
  }, [season, playerIndex]);
}
