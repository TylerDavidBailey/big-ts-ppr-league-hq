import type { AwardDefinition, AwardWinner } from '../types';

/**
 * Highest single-week team score of the regular season.
 *
 * Every team matching the best score is returned. A strict `>` would hand the
 * award to whichever roster the loop happened to reach first, which is the
 * lowest roster id, and that is not a result anyone agreed to.
 */
export const highestTeamWeek: AwardDefinition = {
  id: 'highest-team-week',
  name: 'Highest Team Week',
  description: 'Most points scored by one team in a single regular-season week.',
  icon: '💥',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} pts`,
  compute: (season) => {
    let best = Number.NEGATIVE_INFINITY;
    let winners: AwardWinner[] = [];

    for (const week of season.regularSeasonWeeks) {
      for (const team of week.teams) {
        if (team.points > best) {
          best = team.points;
          winners = [{ rosterId: team.rosterId, week: week.week, value: team.points }];
        } else if (team.points === best) {
          winners.push({ rosterId: team.rosterId, week: week.week, value: team.points });
        }
      }
    }

    if (winners.length === 0) return null;
    return winners.length === 1 ? (winners[0] ?? null) : winners;
  },
};
