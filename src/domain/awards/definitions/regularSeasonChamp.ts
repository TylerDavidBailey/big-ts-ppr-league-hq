import type { AwardDefinition } from '../types';

/**
 * The 1 seed: whoever tops the computed regular-season standings.
 *
 * Standings already apply Sleeper's tiebreak (record, then points for), so this
 * is just the head of that list.
 */
export const regularSeasonChamp: AwardDefinition = {
  id: 'regular-season-champ',
  name: '1 Seed',
  description: 'Best regular-season record. Ties broken by total points scored.',
  icon: '🥇',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} PF`,
  compute: (season) => {
    if (!season.hasScores) return null;
    const leader = season.standings[0];
    if (!leader) return null;

    return {
      rosterId: leader.rosterId,
      value: leader.pointsFor,
      detail: `${leader.wins}-${leader.losses}${leader.ties > 0 ? `-${leader.ties}` : ''}`,
    };
  },
};
