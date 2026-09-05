import type { AwardDefinition } from '../types';

/** Highest single-week team score of the regular season. */
export const highestTeamWeek: AwardDefinition = {
  id: 'highest-team-week',
  name: 'Highest Team Week',
  description: 'Most points scored by one team in a single regular-season week.',
  icon: '💥',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} pts`,
  compute: (season) => {
    let best: { rosterId: number; week: number; points: number } | null = null;

    for (const week of season.regularSeasonWeeks) {
      for (const team of week.teams) {
        if (!best || team.points > best.points) {
          best = { rosterId: team.rosterId, week: week.week, points: team.points };
        }
      }
    }

    if (!best) return null;
    return { rosterId: best.rosterId, week: best.week, value: best.points };
  },
};
