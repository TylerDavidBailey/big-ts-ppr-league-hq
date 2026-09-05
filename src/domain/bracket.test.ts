import { describe, expect, it } from 'vitest';

import { buildBracket, placementFor } from './bracket';
import { fixtureWinnersBracket } from '@/test/fixtures';
import type { SleeperBracketMatch } from '@/lib/sleeper/types';

describe('buildBracket', () => {
  it('reads placements from the p field of placement games', () => {
    const bracket = buildBracket(fixtureWinnersBracket);

    // The captured 2025 bracket: roster 7 beat roster 1 in the p:1 game, and
    // roster 11 beat roster 6 in the p:3 game.
    expect(bracket.placements).toEqual(
      expect.arrayContaining([
        { place: 1, rosterId: 7 },
        { place: 2, rosterId: 1 },
        { place: 3, rosterId: 11 },
        { place: 4, rosterId: 6 },
      ]),
    );
  });

  it('returns placements in finishing order', () => {
    const places = buildBracket(fixtureWinnersBracket).placements.map((p) => p.place);
    expect(places).toEqual([...places].sort((a, b) => a - b));
  });

  it('ignores advancement matches, which carry no p field', () => {
    const advancementCount = fixtureWinnersBracket.filter((m) => m.p === undefined).length;
    expect(advancementCount).toBeGreaterThan(0);
    // Two placements per placement game, and none from the advancement rounds.
    const placementGames = fixtureWinnersBracket.filter((m) => m.p !== undefined).length;
    expect(buildBracket(fixtureWinnersBracket).placements).toHaveLength(placementGames * 2);
  });

  it('skips an undecided placement game rather than inventing a winner', () => {
    const inProgress: SleeperBracketMatch[] = [
      { r: 3, m: 6, t1: 7, t2: 1, w: null, l: null, p: 1 },
    ];
    expect(buildBracket(inProgress).placements).toEqual([]);
  });

  it('handles an empty bracket', () => {
    const bracket = buildBracket([]);
    expect(bracket.matches).toEqual([]);
    expect(bracket.placements).toEqual([]);
  });
});

describe('placementFor', () => {
  it('finds a roster finish, or null when it has none', () => {
    const bracket = buildBracket(fixtureWinnersBracket);
    expect(placementFor(bracket, 7)).toBe(1);
    expect(placementFor(bracket, 999)).toBeNull();
  });
});
