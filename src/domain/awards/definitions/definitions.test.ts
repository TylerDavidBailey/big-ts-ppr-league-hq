import { describe, expect, it } from 'vitest';

import { highestPlayerWeek } from './highestPlayerWeek';
import { highestTeamWeek } from './highestTeamWeek';
import { regularSeasonChamp } from './regularSeasonChamp';
import { weeklyPunishment } from './weeklyPunishment';
import type { AwardContext, AwardWinner } from '../types';
import { buildSeason } from '../../buildSeason';
import type { SeasonModel } from '../../types';
import { seasonFixture } from '@/test/fixtures';

const context: AwardContext = { playerName: (id) => `Player ${id}` };
const season = buildSeason(seasonFixture());

const one = (result: AwardWinner | AwardWinner[] | null): AwardWinner => {
  expect(Array.isArray(result)).toBe(false);
  expect(result).not.toBeNull();
  return result as AwardWinner;
};

describe('regularSeasonChamp', () => {
  it('picks the top of the standings and reports its record', () => {
    const winner = one(regularSeasonChamp.compute(season, context));
    const leader = season.standings[0]!;

    expect(winner.rosterId).toBe(leader.rosterId);
    expect(winner.value).toBeCloseTo(leader.pointsFor, 2);
    expect(winner.detail).toBe(`${leader.wins}-${leader.losses}`);
  });
});

describe('highestTeamWeek', () => {
  it('finds the single best team score of the regular season', () => {
    const winner = one(highestTeamWeek.compute(season, context));

    const everyScore = season.regularSeasonWeeks.flatMap((week) =>
      week.teams.map((team) => team.points),
    );
    expect(winner.value).toBe(Math.max(...everyScore));
    expect(winner.week).toBeLessThanOrEqual(season.regularSeasonEndWeek);
  });

  it('ignores playoff weeks', () => {
    const winner = one(highestTeamWeek.compute(season, context));
    const playoffHigh = Math.max(
      ...season.weeks
        .filter((week) => week.phase === 'postseason' && week.played)
        .flatMap((week) => week.teams.map((team) => team.points)),
    );
    // Only meaningful if a playoff week outscored the regular-season best.
    if (playoffHigh > winner.value) {
      expect(winner.week).toBeLessThan(season.playoffWeekStart);
    }
  });
});

describe('highestPlayerWeek', () => {
  it('finds the best single starter score and names the player', () => {
    const winner = one(highestPlayerWeek.compute(season, context));

    const everyStarter = season.regularSeasonWeeks.flatMap((week) =>
      week.teams.flatMap((team) => team.starters.map((starter) => starter.points)),
    );
    expect(winner.value).toBe(Math.max(...everyStarter));
    expect(winner.playerId).toBeTruthy();
    expect(winner.detail).toBe(`Player ${winner.playerId!}`);
  });

  it('excludes bench players', () => {
    const winner = one(highestPlayerWeek.compute(season, context));
    const week = season.regularSeasonWeeks.find((candidate) => candidate.week === winner.week)!;
    const team = week.teams.find((candidate) => candidate.rosterId === winner.rosterId)!;

    expect(team.starters.some((starter) => starter.playerId === winner.playerId)).toBe(true);
  });
});

describe('weeklyPunishment', () => {
  it('returns the lowest scorer for every played regular-season week', () => {
    const result = weeklyPunishment.compute(season, context);
    expect(Array.isArray(result)).toBe(true);

    const losers = result as AwardWinner[];
    expect(losers).toHaveLength(season.regularSeasonWeeks.length);

    for (const loser of losers) {
      const week = season.regularSeasonWeeks.find((candidate) => candidate.week === loser.week)!;
      const lowest = Math.min(...week.teams.map((team) => team.points));
      expect(loser.value).toBe(lowest);
    }
  });

  it('never covers a playoff week', () => {
    const losers = weeklyPunishment.compute(season, context) as AwardWinner[];
    expect(losers.every((loser) => loser.week! <= season.regularSeasonEndWeek)).toBe(true);
  });
});

describe('regularSeasonChamp edge cases', () => {
  /** A season model with a single hand-built standings row. */
  const withStandings = (row: Partial<SeasonModel['standings'][number]>): SeasonModel => ({
    ...season,
    hasScores: true,
    standings: [
      {
        rosterId: 1,
        rank: 1,
        wins: 10,
        losses: 4,
        ties: 0,
        pointsFor: 1500,
        pointsAgainst: 1400,
        form: [],
        streak: null,
        ...row,
      },
    ],
  });

  it('includes ties in the record only when there are some', () => {
    expect(one(regularSeasonChamp.compute(withStandings({ ties: 0 }), context)).detail).toBe(
      '10-4',
    );
    expect(
      one(regularSeasonChamp.compute(withStandings({ losses: 3, ties: 1 }), context)).detail,
    ).toBe('10-3-1');
  });

  it('is undecided before any week is played', () => {
    expect(regularSeasonChamp.compute({ ...season, hasScores: false }, context)).toBeNull();
  });

  it('is undecided when the league somehow has no teams', () => {
    expect(
      regularSeasonChamp.compute({ ...season, hasScores: true, standings: [] }, context),
    ).toBeNull();
  });
});
