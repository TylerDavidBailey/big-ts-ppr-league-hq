import type { AwardDefinition, AwardWinner } from '../types';

/**
 * Beer duty: the lowest-scoring team each regular-season week.
 *
 * Week-scoped, so it returns one entry per settled week rather than a single
 * season winner. A tie for lowest names everyone who tied: the alternative is
 * letting the roster with the higher id off on a technicality.
 *
 * `season.regularSeasonWeeks` excludes the week currently being played, so a
 * team that has not kicked off yet is never handed the punishment on a 0.00.
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
      let worst = Number.POSITIVE_INFINITY;
      let weekLosers: AwardWinner[] = [];

      for (const team of week.teams) {
        if (team.points < worst) {
          worst = team.points;
          weekLosers = [{ rosterId: team.rosterId, week: week.week, value: team.points }];
        } else if (team.points === worst) {
          weekLosers.push({ rosterId: team.rosterId, week: week.week, value: team.points });
        }
      }

      losers.push(...weekLosers);
    }

    return losers.length > 0 ? losers : null;
  },
};
