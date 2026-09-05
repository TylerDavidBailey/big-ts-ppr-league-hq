import { describe, expect, it } from 'vitest';

import { computeSeasonAwards } from './awards';
import { buildSeason } from './buildSeason';
import { allTimeRecords, allTimeStandings, champions, managerKey } from './history';
import type { SeasonSummary } from './history';
import type { SeasonModel } from './types';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

const context = { playerName: (id: string) => `Player ${id}` };

const summarise = (season: SeasonModel): SeasonSummary => ({
  season,
  awards: computeSeasonAwards(season, context, 5),
});

const fixture = seasonFixture();
const season2025 = buildSeason(fixture);
const season2024 = buildSeason({
  ...fixture,
  league: { ...fixture.league, league_id: 'older', season: '2024', previous_league_id: null },
});
const twoSeasons = [summarise(season2024), summarise(season2025)];

const champion = season2025.teamsByRosterId.get(7)!;

describe('allTimeStandings', () => {
  const rows = allTimeStandings(twoSeasons);

  it('matches managers across seasons by user id', () => {
    expect(rows).toHaveLength(12);
    expect(rows.every((row) => row.seasons === 2)).toBe(true);
  });

  it('adds up regular-season games across seasons', () => {
    const row = rows.find((candidate) => candidate.key === managerKey(champion))!;
    expect(row.wins + row.losses + row.ties).toBe(28);
    expect(row.pointsPerGame).toBeCloseTo(row.pointsFor / 28, 2);
  });

  it('counts titles from the bracket, twice for the same champion', () => {
    const row = rows.find((candidate) => candidate.key === managerKey(champion))!;
    expect(row.titles).toBe(2);
    expect(row.playoffAppearances).toBe(2);
    expect(row.playoffWins).toBeGreaterThan(0);
  });

  it('counts 1 seeds only for a finished regular season', () => {
    const leader = season2025.standings[0]!;
    const finished = rows.find(
      (row) => row.key === managerKey(season2025.teamsByRosterId.get(leader.rosterId)!),
    )!;
    expect(finished.topSeeds).toBe(2);

    const midSeason = buildSeason({
      ...fixture,
      matchupsByWeek: matchupsThrough(6),
      winnersBracket: [],
    });
    const partial = allTimeStandings([summarise(midSeason)]);
    expect(partial.every((row) => row.topSeeds === 0)).toBe(true);
    expect(partial.every((row) => row.titles === 0)).toBe(true);
  });

  it('ranks by win percentage, then points per game', () => {
    for (let index = 1; index < rows.length; index += 1) {
      const above = rows[index - 1]!;
      const below = rows[index]!;
      expect(
        above.winPct > below.winPct ||
          (above.winPct === below.winPct && above.pointsPerGame >= below.pointsPerGame),
      ).toBe(true);
    }
  });

  it('keys an unclaimed roster by roster id', () => {
    const orphaned = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster) => ({ ...roster, owner_id: null })),
    });
    const keys = allTimeStandings([summarise(orphaned)]).map((row) => row.key);
    expect(keys.every((key) => key.startsWith('roster:'))).toBe(true);
    expect(new Set(keys).size).toBe(12);
  });

  it('skips a season with no scores', () => {
    const preDraft = buildSeason(seasonFixture({ matchupsByWeek: matchupsThrough(0) }));
    expect(allTimeStandings([summarise(preDraft)]).every((row) => row.seasons === 0)).toBe(true);
  });
});

describe('allTimeRecords', () => {
  const records = allTimeRecords(twoSeasons);
  const byId = (id: string) => records.find((record) => record.id === id)!;

  it('names both holders when two seasons tie exactly', () => {
    // Identical seasons, so every record is shared by both years.
    const highest = byId('highest-team-week');
    expect(highest.holders).toHaveLength(2);
    expect(highest.holders.map((holder) => holder.season).sort()).toEqual(['2024', '2025']);
    expect(highest.holders[0]!.value).toBe(200.52);
  });

  it('prefers the higher of two seasons', () => {
    const inflated = buildSeason({
      ...fixture,
      league: { ...fixture.league, season: '2024' },
      matchupsByWeek: new Map(
        [...fixture.matchupsByWeek].map(([week, rows]) => [
          week,
          rows.map((row) => (row.roster_id === 3 && week === 3 ? { ...row, points: 300 } : row)),
        ]),
      ),
    });
    const highest = allTimeRecords([summarise(inflated), summarise(season2025)]).find(
      (record) => record.id === 'highest-team-week',
    )!;
    expect(highest.holders).toHaveLength(1);
    expect(highest.holders[0]!.value).toBe(300);
    expect(highest.holders[0]!.season).toBe('2024');
  });

  it('reads the best record with its detail', () => {
    const best = byId('best-record');
    expect(best.holders[0]!.detail).toBe('14-0');
    expect(best.holders[0]!.value).toBe(14);
  });

  it('keeps the handle a manager used that season', () => {
    const renamed = buildSeason({
      ...fixture,
      league: { ...fixture.league, season: '2026' },
      users: fixture.users.map((user) => ({ ...user, display_name: `new_${user.display_name}` })),
    });
    const best = allTimeRecords([summarise(renamed), summarise(season2025)]).find(
      (record) => record.id === 'best-record',
    )!;
    const [holder] = best.holders.filter((candidate) => candidate.season === '2025');
    expect(holder!.name).toMatch(/^new_/);
    expect(holder!.nameThen).toBe(holder!.name.replace(/^new_/, ''));
  });

  it('names the starter for the starter week record', () => {
    const starter = byId('highest-starter-week');
    expect(starter.holders[0]!.value).toBe(55.4);
    expect(starter.holders[0]!.playerName).toMatch(/^Player /);
  });

  it('records the longest streak and the biggest blowout', () => {
    expect(byId('longest-win-streak').holders[0]!.value).toBe(14);
    expect(byId('biggest-blowout').holders[0]!.value).toBeGreaterThan(0);
    expect(byId('biggest-blowout').holders[0]!.detail).toContain(' over ');
  });

  it('has no holders when no season has scores', () => {
    const preDraft = buildSeason(seasonFixture({ matchupsByWeek: matchupsThrough(0) }));
    expect(allTimeRecords([summarise(preDraft)]).every((r) => r.holders.length === 0)).toBe(true);
  });
});

describe('champions', () => {
  it('lists every season with scores, newest first', () => {
    const rows = champions(twoSeasons);
    expect(rows.map((row) => row.season.season)).toEqual(['2025', '2024']);
    expect(rows[0]!.champion?.rosterId).toBe(7);
    expect(rows[0]!.runnerUp?.rosterId).toBe(1);
    expect(rows[0]!.third?.rosterId).toBe(11);
    expect(rows[0]!.topSeeds.map((team) => team.rosterId)).toEqual([
      season2025.standings[0]!.rosterId,
    ]);
  });

  it('leaves undecided places null mid-season', () => {
    const midSeason = buildSeason({
      ...fixture,
      matchupsByWeek: matchupsThrough(6),
      winnersBracket: [],
    });
    const [row] = champions([summarise(midSeason)]);
    expect(row?.champion).toBeNull();
    expect(row?.topSeeds).toEqual([]);
  });
});
