import { describe, expect, it, vi } from 'vitest';

import { AWARDS, getAward, resolveAwards } from './registry';
import type { AwardContext, AwardDefinition } from './types';
import { buildSeason } from '../buildSeason';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

const context: AwardContext = { playerName: (id) => `Player ${id}` };
const season = buildSeason(seasonFixture());

describe('award registry', () => {
  it('exposes every award with a unique id', () => {
    const ids = AWARDS.map((award) => award.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('looks an award up by id', () => {
    expect(getAward('highest-team-week')?.name).toBe('Highest Team Week');
    expect(getAward('does-not-exist')).toBeUndefined();
  });

  it('resolves every registered award for a completed season', () => {
    const resolved = resolveAwards(season, context);
    expect(resolved).toHaveLength(AWARDS.length);
    expect(resolved.every((award) => award.result !== null)).toBe(true);
  });

  it('reports awards as undecided rather than throwing on an empty season', () => {
    const preDraft = buildSeason(
      seasonFixture({ matchupsByWeek: matchupsThrough(0), winnersBracket: [], losersBracket: [] }),
    );

    const resolved = resolveAwards(preDraft, context);
    expect(resolved.every((award) => award.result === null)).toBe(true);
  });

  it('isolates a failing award so the others still resolve', () => {
    const exploding: AwardDefinition = {
      id: 'boom',
      name: 'Boom',
      description: 'Always throws',
      icon: '💣',
      scope: 'season',
      formatValue: String,
      compute: () => {
        throw new Error('boom');
      },
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const resolved = resolveAwards(season, context, [exploding, ...AWARDS]);

    expect(resolved[0]!.result).toBeNull();
    expect(resolved.slice(1).every((award) => award.result !== null)).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
