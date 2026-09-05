import type { AwardDefinition, AwardWinner } from '../types';

/**
 * Highest single-week score by a *starting* player.
 *
 * Reads `starters` only, so a monster week on someone's bench does not count.
 * Every player matching the best score is returned, because two managers can
 * start the same player in the same week.
 */
export const highestPlayerWeek: AwardDefinition = {
  id: 'highest-player-week',
  name: 'Highest Starter Week',
  description: 'Most points by a single started player in a regular-season week. Bench excluded.',
  icon: '🚀',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} pts`,
  compute: (season, { playerName }) => {
    let best = Number.NEGATIVE_INFINITY;
    let winners: AwardWinner[] = [];

    for (const week of season.regularSeasonWeeks) {
      for (const team of week.teams) {
        for (const starter of team.starters) {
          if (starter.points < best) continue;

          const winner: AwardWinner = {
            rosterId: team.rosterId,
            week: week.week,
            value: starter.points,
            playerId: starter.playerId,
            detail: playerName(starter.playerId),
          };

          if (starter.points > best) {
            best = starter.points;
            winners = [winner];
          } else {
            winners.push(winner);
          }
        }
      }
    }

    if (winners.length === 0) return null;
    return winners.length === 1 ? (winners[0] ?? null) : winners;
  },
};
