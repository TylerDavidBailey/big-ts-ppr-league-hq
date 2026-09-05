import { describe, expect, it } from 'vitest';

import { buildSeason } from './buildSeason';
import { resolveAwards } from './awards';
import type { AwardWinner } from './awards';
import { seasonFixture } from '@/test/fixtures';
import type { SleeperMatchup } from '@/lib/sleeper/types';

const context = { playerName: (id: string) => `Player ${id}` };

/**
 * An award decided by a strict comparison hands the win to whichever roster the
 * loop reached first, which is the lowest roster id. That is not a result the
 * league agreed to, so a genuine tie must name everyone involved.
 */
describe('ties', () => {
  const fixture = seasonFixture();
  const week1 = fixture.matchupsByWeek.get(1)!;

  /** One week where two separate matchups produce identical scores. */
  function weekWithTiedScores(points: number): Map<number, SleeperMatchup[]> {
    const rows = week1.map((matchup, index) =>
      index < 4 ? { ...matchup, points } : { ...matchup, points: 100 },
    );
    return new Map([[1, rows]]);
  }

  const awardsFor = (matchupsByWeek: Map<number, SleeperMatchup[]>) =>
    resolveAwards(buildSeason({ ...fixture, matchupsByWeek }), context);

  const winnersOf = (id: string, matchupsByWeek: Map<number, SleeperMatchup[]>): AwardWinner[] => {
    const result = awardsFor(matchupsByWeek).find((award) => award.definition.id === id)?.result;
    return Array.isArray(result) ? result : result ? [result] : [];
  };

  it('names every team tied for the highest week', () => {
    // Four rosters share the top score of 200.
    const winners = winnersOf('highest-team-week', weekWithTiedScores(200));

    expect(winners).toHaveLength(4);
    expect(winners.every((winner) => winner.value === 200)).toBe(true);
    expect(new Set(winners.map((winner) => winner.rosterId)).size).toBe(4);
  });

  it('names every team tied for beer duty', () => {
    // Four rosters share the low score of 10.
    const winners = winnersOf('weekly-punishment', weekWithTiedScores(10));

    expect(winners).toHaveLength(4);
    expect(winners.every((winner) => winner.value === 10)).toBe(true);
  });

  it('returns a single winner when there is no tie', () => {
    const result = awardsFor(fixture.matchupsByWeek as Map<number, SleeperMatchup[]>).find(
      (award) => award.definition.id === 'highest-team-week',
    )?.result;

    expect(Array.isArray(result)).toBe(false);
  });

  it('flags standings rows that are level on record and points', () => {
    // Two rosters play each other to identical totals across a single week.
    const [home] = week1;
    const away = week1.find(
      (matchup) => matchup.matchup_id === home!.matchup_id && matchup.roster_id !== home!.roster_id,
    )!;
    const season = buildSeason({
      ...fixture,
      matchupsByWeek: new Map([
        [
          1,
          [
            { ...home!, points: 100 },
            { ...away, points: 100 },
          ],
        ],
      ]),
    });

    const tiedPair = season.standings.filter((row) =>
      [home!.roster_id, away.roster_id].includes(row.rosterId),
    );
    expect(tiedPair).toHaveLength(2);
    expect(tiedPair.every((row) => row.tied)).toBe(true);
  });

  it('does not flag a team that leads outright', () => {
    const season = buildSeason(fixture);
    expect(season.standings[0]!.tied).toBe(false);
  });

  it('names co-leaders for the 1 seed when the top of the table is tied', () => {
    // Every roster scores the same, so nobody separates from the field.
    const level = new Map([[1, week1.map((matchup) => ({ ...matchup, points: 100 }))]]);
    const result = awardsFor(level).find(
      (award) => award.definition.id === 'regular-season-champ',
    )?.result;

    expect(Array.isArray(result)).toBe(true);
    expect((result as AwardWinner[]).length).toBeGreaterThan(1);
  });
});
