import { describe, expect, it } from 'vitest';

import { buildSeason } from './buildSeason';
import { computeStandings } from './standings';
import type { Team, Week } from './types';
import { fixtureRosters, seasonFixture } from '@/test/fixtures';

const team = (rosterId: number): Team => ({
  rosterId,
  name: `Team ${rosterId}`,
  managerName: `Manager ${rosterId}`,
  userId: String(rosterId),
  avatarId: null,
  reported: { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 },
});

/** One head-to-head week between rosters 1 and 2. */
const week = (weekNumber: number, oneScores: number, twoScores: number): Week => ({
  week: weekNumber,
  phase: 'regular',
  played: true,
  teams: [
    {
      rosterId: 1,
      week: weekNumber,
      points: oneScores,
      opponentRosterId: 2,
      opponentPoints: twoScores,
      outcome: oneScores > twoScores ? 'win' : oneScores < twoScores ? 'loss' : 'tie',
      starters: [],
    },
    {
      rosterId: 2,
      week: weekNumber,
      points: twoScores,
      opponentRosterId: 1,
      opponentPoints: oneScores,
      outcome: twoScores > oneScores ? 'win' : twoScores < oneScores ? 'loss' : 'tie',
      starters: [],
    },
  ],
});

describe('computeStandings', () => {
  it('accumulates records, points for and points against', () => {
    const rows = computeStandings(
      [team(1), team(2)],
      [week(1, 100, 90), week(2, 80, 95), week(3, 110, 110)],
    );

    const first = rows.find((row) => row.rosterId === 1)!;
    expect(first.wins).toBe(1);
    expect(first.losses).toBe(1);
    expect(first.ties).toBe(1);
    expect(first.pointsFor).toBeCloseTo(290, 2);
    expect(first.pointsAgainst).toBeCloseTo(295, 2);
  });

  it('breaks a tie on record with total points scored', () => {
    // Both finish 1-1; roster 2 scored more overall and must rank first.
    const rows = computeStandings([team(1), team(2)], [week(1, 100, 90), week(2, 50, 200)]);

    expect(rows[0]!.rosterId).toBe(2);
    expect(rows[0]!.rank).toBe(1);
    expect(rows[1]!.rank).toBe(2);
  });

  it('counts a tie as half a win when ranking', () => {
    const rows = computeStandings(
      [team(1), team(2)],
      [week(1, 100, 100), week(2, 100, 100), week(3, 120, 80)],
    );
    expect(rows[0]!.rosterId).toBe(1);
  });

  it('reports the trailing streak', () => {
    const rows = computeStandings(
      [team(1), team(2)],
      [week(1, 60, 90), week(2, 100, 90), week(3, 110, 90)],
    );

    expect(rows.find((row) => row.rosterId === 1)!.streak).toEqual({ kind: 'win', length: 2 });
    expect(rows.find((row) => row.rosterId === 2)!.streak).toEqual({ kind: 'loss', length: 2 });
  });

  it('ignores weeks that were never played', () => {
    const unplayed: Week = { week: 4, phase: 'regular', played: false, teams: [] };
    const rows = computeStandings([team(1), team(2)], [week(1, 100, 90), unplayed]);
    expect(rows[0]!.form).toHaveLength(1);
  });

  it('matches the records Sleeper reports for a real completed season', () => {
    const season = buildSeason(seasonFixture());

    for (const row of season.standings) {
      const roster = fixtureRosters.find((candidate) => candidate.roster_id === row.rosterId)!;
      expect(row.wins).toBe(roster.settings.wins);
      expect(row.losses).toBe(roster.settings.losses);
      expect(row.pointsFor).toBeCloseTo(
        (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100,
        1,
      );
    }
  });

  it('matches the per-week form string Sleeper stores on the roster', () => {
    const season = buildSeason(seasonFixture());

    for (const row of season.standings) {
      const roster = fixtureRosters.find((candidate) => candidate.roster_id === row.rosterId)!;
      const reported = roster.metadata?.record;
      if (!reported) continue;

      const computed = row.form.map((outcome) => outcome[0]!.toUpperCase()).join('');
      expect(computed).toBe(reported);
    }
  });
});
