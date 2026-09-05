import type { AwardWinner, AwardDefinition } from '../types';

/**
 * Beer duty: the lowest-scoring team each regular-season week.
 *
 * Week-scoped, so it returns one winner per played week rather than a single
 * season winner.
 */
export const weeklyPunishment: AwardDefinition = {
  id: 'weekly-punishment',
  name: 'Beer Duty',
  description: 'Lowest team score of the week. Shotgun a beer before the 1:00 PM Sunday kickoff.',
  icon: '🍺',
  scope: 'weekly',
  formatValue: (value) => `${value.toFixed(2)} pts`,
  compute: (season) => {
    const losers: AwardWinner[] = [];

    for (const week of season.regularSeasonWeeks) {
      let worst: { rosterId: number; points: number } | null = null;
      for (const team of week.teams) {
        if (!worst || team.points < worst.points) {
          worst = { rosterId: team.rosterId, points: team.points };
        }
      }
      if (worst) {
        losers.push({ rosterId: worst.rosterId, week: week.week, value: worst.points });
      }
    }

    return losers.length > 0 ? losers : null;
  },
};
