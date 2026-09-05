import { describe, expect, it } from 'vitest';

import {
  clearChainHeads,
  clearRecentLeagues,
  forgetLeague,
  getRecentLeagues,
  rememberChain,
  rememberLeague,
  resolveChainHead,
} from './storage';

const STORAGE_KEY = 'slhq:v1:recent-leagues';

const league = (id: string, name = `League ${id}`) => ({
  leagueId: id,
  name,
  season: '2025',
  avatarId: null,
  totalRosters: 12,
});

describe('recent leagues storage', () => {
  it('starts empty', () => {
    expect(getRecentLeagues()).toEqual([]);
  });

  it('round-trips a remembered league', () => {
    rememberLeague(league('123456789'));

    const [stored] = getRecentLeagues();
    expect(stored?.leagueId).toBe('123456789');
    expect(stored?.name).toBe('League 123456789');
    expect(stored?.lastOpenedAt).toBeGreaterThan(0);
  });

  it('moves a revisited league to the front without duplicating it', () => {
    rememberLeague(league('111111111'));
    rememberLeague(league('222222222'));
    rememberLeague(league('111111111', 'Renamed'));

    const stored = getRecentLeagues();
    expect(stored).toHaveLength(2);
    expect(stored[0]?.leagueId).toBe('111111111');
    expect(stored[0]?.name).toBe('Renamed');
  });

  it('keeps at most eight leagues, dropping the oldest', () => {
    for (let index = 0; index < 12; index += 1) {
      rememberLeague(league(`10000000${index}`));
    }

    const stored = getRecentLeagues();
    expect(stored).toHaveLength(8);
    expect(stored[0]?.leagueId).toBe('1000000011');
  });

  it('forgets a single league', () => {
    rememberLeague(league('111111111'));
    rememberLeague(league('222222222'));

    const remaining = forgetLeague('111111111');
    expect(remaining.map((entry) => entry.leagueId)).toEqual(['222222222']);
    expect(getRecentLeagues()).toHaveLength(1);
  });

  it('clears everything', () => {
    rememberLeague(league('111111111'));
    clearRecentLeagues();
    expect(getRecentLeagues()).toEqual([]);
  });

  it('recovers from a corrupt blob instead of throwing', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'not json at all');
    expect(getRecentLeagues()).toEqual([]);
  });

  it('discards data that no longer matches the schema', () => {
    // A shape from a hypothetical older release.
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: '123', label: 'old' }]));
    expect(getRecentLeagues()).toEqual([]);
  });

  it('sorts by most recently opened', () => {
    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { ...league('111111111'), lastOpenedAt: 100 },
        { ...league('222222222'), lastOpenedAt: 900 },
      ]),
    );

    expect(getRecentLeagues().map((entry) => entry.leagueId)).toEqual(['222222222', '111111111']);
  });
});

describe('season chain heads', () => {
  const chain = [{ league_id: '2026' }, { league_id: '2025' }, { league_id: '2024' }];

  it('reports a league as its own head before anything is recorded', () => {
    expect(resolveChainHead('2025')).toBe('2025');
  });

  it('points every season in a chain at the newest one', () => {
    rememberChain(chain);

    expect(resolveChainHead('2024')).toBe('2026');
    expect(resolveChainHead('2025')).toBe('2026');
    expect(resolveChainHead('2026')).toBe('2026');
  });

  it('moves the head forward when a newer season appears', () => {
    rememberChain(chain);
    rememberChain([{ league_id: '2027' }, ...chain]);

    expect(resolveChainHead('2025')).toBe('2027');
  });

  it('leaves other leagues alone', () => {
    rememberChain(chain);
    expect(resolveChainHead('999')).toBe('999');
  });

  it('ignores an empty chain', () => {
    rememberChain([]);
    expect(resolveChainHead('2025')).toBe('2025');
  });

  it('recovers from a corrupt blob', () => {
    globalThis.localStorage.setItem('slhq:v1:chain-heads', '{{{');
    expect(resolveChainHead('2025')).toBe('2025');
  });

  it('clears', () => {
    rememberChain(chain);
    clearChainHeads();
    expect(resolveChainHead('2025')).toBe('2025');
  });
});
