import { describe, expect, it } from 'vitest';

import { lookupPlayer, playerNameResolver } from './players';

const index = {
  '3294': ['Dak Prescott', 'QB', 'DAL'] as [string, string | null, string | null],
  SF: ['San Francisco 49ers', 'DEF', 'SF'] as [string, string | null, string | null],
};

describe('lookupPlayer', () => {
  it('resolves a known player', () => {
    expect(lookupPlayer(index, '3294')).toEqual({
      id: '3294',
      name: 'Dak Prescott',
      position: 'QB',
      team: 'DAL',
      known: true,
    });
  });

  it('resolves a team defense, which Sleeper keys by team abbreviation', () => {
    expect(lookupPlayer(index, 'SF').name).toBe('San Francisco 49ers');
    expect(lookupPlayer(index, 'SF').position).toBe('DEF');
  });

  it('degrades to a readable placeholder for an id the index does not have', () => {
    const unknown = lookupPlayer(index, '99999');
    expect(unknown.known).toBe(false);
    expect(unknown.name).toBe('Player 99999');
  });
});

describe('playerNameResolver', () => {
  it('returns just the name, for the award context', () => {
    const resolve = playerNameResolver(index);
    expect(resolve('3294')).toBe('Dak Prescott');
    expect(resolve('nope')).toBe('Player nope');
  });

  it('works against an empty index when the file failed to load', () => {
    expect(playerNameResolver({})('3294')).toBe('Player 3294');
  });
});
