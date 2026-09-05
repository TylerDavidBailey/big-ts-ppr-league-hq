import type { AwardDefinition } from '../types';

/**
 * Highest single-week score by a *starting* player.
 *
 * Reads `starters` only, so a monster week on someone's bench does not count.
 */
export const highestPlayerWeek: AwardDefinition = {
  id: 'highest-player-week',
  name: 'Highest Starter Week',
  description: 'Most points by a single started player in a regular-season week. Bench excluded.',
  icon: '🚀',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} pts`,
  compute: (season, { playerName }) => {
    let best: { rosterId: number; week: number; playerId: string; points: number } | null = null;

    for (const week of season.regularSeasonWeeks) {
      for (const team of week.teams) {
        for (const starter of team.starters) {
          if (!best || starter.points > best.points) {
            best = {
              rosterId: team.rosterId,
              week: week.week,
              playerId: starter.playerId,
              points: starter.points,
            };
          }
        }
      }
    }

    if (!best) return null;
    return {
      rosterId: best.rosterId,
      week: best.week,
      value: best.points,
      playerId: best.playerId,
      detail: playerName(best.playerId),
    };
  },
};
