import type { AwardDefinition, AwardWinner } from '../types';

/**
 * The 1 seed: whoever tops the computed regular-season standings.
 *
 * Standings already apply the record-then-points-scored order, so this is the
 * head of that list. When the leader is level with another team on both, both
 * are named: the sort order between them is arbitrary and the league has a real
 * tie to settle its own way.
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

    const asWinner = (row: (typeof season.standings)[number]): AwardWinner => ({
      rosterId: row.rosterId,
      value: row.pointsFor,
      detail: `${row.wins}-${row.losses}${row.ties > 0 ? `-${row.ties}` : ''}`,
    });

    if (!leader.tied) return asWinner(leader);

    const coLeaders = season.standings.filter(
      (row) =>
        row.wins + row.ties * 0.5 === leader.wins + leader.ties * 0.5 &&
        row.pointsFor === leader.pointsFor,
    );
    return coLeaders.map(asWinner);
  },
};
