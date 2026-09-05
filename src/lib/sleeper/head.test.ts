import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from './client';
import { resolveHead, type HeadDeps } from './head';
import type { SleeperLeague, SleeperUser } from './types';
import { fixtureLeague, fixtureUsers } from '@/test/fixtures';

const league = (season: string, status: string, previous: string | null): SleeperLeague => ({
  ...fixtureLeague,
  league_id: `id-${season}`,
  season,
  status,
  previous_league_id: previous,
});

const users: SleeperUser[] = fixtureUsers.map((user, index) => ({
  ...user,
  is_owner: index === 3,
}));

const deps = (leaguesByUserSeason: Record<string, SleeperLeague[] | Error>): HeadDeps => ({
  getLeagueUsers: vi.fn(() => Promise.resolve(users)),
  getUserLeagues: vi.fn((userId: string, season: string) => {
    const answer = leaguesByUserSeason[`${userId}:${season}`] ?? [];
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  }),
});

const commissioner = users[3]!.user_id;

describe('resolveHead', () => {
  it('leaves a season that is not finished alone, without a single request', async () => {
    const live = league('2026', 'in_season', 'id-2025');
    const d = deps({});
    await expect(resolveHead(live, undefined, d)).resolves.toBe(live);
    expect(d.getLeagueUsers).not.toHaveBeenCalled();
  });

  it('asks the commissioner first and follows the league that points back', async () => {
    const finished = league('2025', 'complete', null);
    const next = league('2026', 'pre_draft', finished.league_id);
    const unrelated = { ...league('2026', 'pre_draft', null), league_id: 'someone-elses' };
    const d = deps({ [`${commissioner}:2026`]: [unrelated, next] });

    await expect(resolveHead(finished, undefined, d)).resolves.toBe(next);
    expect(d.getUserLeagues).toHaveBeenCalledTimes(1);
    expect(d.getUserLeagues).toHaveBeenCalledWith(commissioner, '2026', undefined);
  });

  it('hops through several finished seasons', async () => {
    const s2024 = league('2024', 'complete', null);
    const s2025 = league('2025', 'complete', s2024.league_id);
    const s2026 = league('2026', 'in_season', s2025.league_id);
    const d = deps({
      [`${commissioner}:2025`]: [s2025],
      [`${commissioner}:2026`]: [s2026],
    });

    await expect(resolveHead(s2024, undefined, d)).resolves.toBe(s2026);
  });

  it('looks a year further ahead when the league skipped a season', async () => {
    const s2024 = league('2024', 'complete', null);
    const s2026 = league('2026', 'pre_draft', s2024.league_id);
    const d = deps({ [`${commissioner}:2026`]: [s2026] });

    await expect(resolveHead(s2024, undefined, d)).resolves.toBe(s2026);
  });

  it('asks another manager when the commissioner has left Sleeper', async () => {
    const finished = league('2025', 'complete', null);
    const next = league('2026', 'pre_draft', finished.league_id);
    const other = users[0]!.user_id;
    const d = deps({
      [`${commissioner}:2026`]: new NotFoundError('gone'),
      [`${commissioner}:2027`]: new NotFoundError('gone'),
      [`${other}:2026`]: [next],
    });

    await expect(resolveHead(finished, undefined, d)).resolves.toBe(next);
  });

  it('keeps the finished season when nothing newer exists yet', async () => {
    const finished = league('2025', 'complete', null);
    const d = deps({});

    await expect(resolveHead(finished, undefined, d)).resolves.toBe(finished);
    // Commissioner two years ahead, two more managers one year each.
    expect(d.getUserLeagues).toHaveBeenCalledTimes(4);
  });

  it('surfaces a real failure rather than hiding it as "no newer season"', async () => {
    const finished = league('2025', 'complete', null);
    const d = deps({ [`${commissioner}:2026`]: new Error('Sleeper is down') });

    await expect(resolveHead(finished, undefined, d)).rejects.toThrow('Sleeper is down');
  });
});
