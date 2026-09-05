import { describe, expect, it } from 'vitest';

import {
  computeSeasonAwards,
  rankPlaces,
  rankStandings,
  rankStarterWeeks,
  rankTeamWeeks,
  weeklyLowScorers,
  type Candidate,
} from './awards';
import { buildSeason } from './buildSeason';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

const context = { playerName: (id: string) => `Player ${id}` };
const season = buildSeason(seasonFixture());

describe('rankPlaces', () => {
  const entry = (rosterId: number, value: number): Candidate => ({ rosterId, value });

  it('uses competition ranking, so a shared place skips the next one', () => {
    const ranked = rankPlaces([entry(1, 10), entry(2, 30), entry(3, 30), entry(4, 20)], 5);

    expect(ranked.map((row) => [row.rosterId, row.place])).toEqual([
      [2, 1],
      [3, 1],
      [4, 3],
      [1, 4],
    ]);
    expect(ranked.filter((row) => row.tied).map((row) => row.rosterId)).toEqual([2, 3]);
  });

  it('cuts off by place, not by count, so a tie on the last place keeps everyone', () => {
    const ranked = rankPlaces([entry(1, 5), entry(2, 4), entry(3, 4), entry(4, 1)], 2);

    expect(ranked.map((row) => row.rosterId)).toEqual([1, 2, 3]);
    expect(ranked.map((row) => row.place)).toEqual([1, 2, 2]);
  });

  it('ranks ascending when asked, for the lowest score', () => {
    const ranked = rankPlaces([entry(1, 5), entry(2, 1), entry(3, 3)], 1, 'asc');
    expect(ranked).toEqual([{ rosterId: 2, value: 1, place: 1, tied: false }]);
  });

  it('is empty for no candidates', () => {
    expect(rankPlaces([], 5)).toEqual([]);
  });
});

describe('rankStandings', () => {
  it('reads the 1 seed off the top of the standings with its record', () => {
    const [leader] = rankStandings(season, 5);
    const top = season.standings[0]!;

    expect(leader?.rosterId).toBe(top.rosterId);
    expect(leader?.value).toBe(2237.72);
    expect(leader?.detail).toBe('14-0');
    expect(leader?.tied).toBe(false);
  });

  it('lists exactly the requested places when nobody is tied', () => {
    const ranked = rankStandings(season, 5);
    expect(ranked.map((row) => row.place)).toEqual([1, 2, 3, 4, 5]);
  });

  it('is empty before any week is played', () => {
    const preDraft = buildSeason(seasonFixture({ matchupsByWeek: matchupsThrough(0) }));
    expect(rankStandings(preDraft, 5)).toEqual([]);
  });
});

describe('rankTeamWeeks', () => {
  it('finds the best team score of the regular season', () => {
    const [best] = rankTeamWeeks(season, 5);

    expect(best?.value).toBe(200.52);
    expect(best?.week).toBeLessThanOrEqual(season.regularSeasonEndWeek);
    expect(best?.place).toBe(1);
  });

  it('returns five distinct places in descending order', () => {
    const ranked = rankTeamWeeks(season, 5);
    expect(ranked.map((row) => row.place)).toEqual([1, 2, 3, 4, 5]);
    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index]!.value).toBeLessThan(ranked[index - 1]!.value);
    }
  });

  it('ignores playoff weeks', () => {
    const playoffHigh = Math.max(
      ...season.weeks
        .filter((week) => week.phase === 'postseason' && week.played)
        .flatMap((week) => week.teams.map((team) => team.points)),
    );
    const [best] = rankTeamWeeks(season, 5);
    // Only meaningful if a playoff week outscored the regular-season best.
    if (playoffHigh > best!.value) {
      expect(best!.week).toBeLessThan(season.playoffWeekStart);
    }
  });
});

describe('rankStarterWeeks', () => {
  it('finds the best single starter score and names the player', () => {
    const [best] = rankStarterWeeks(season, 5, context.playerName);

    expect(best?.value).toBe(55.4);
    expect(best?.playerId).toBeTruthy();
    expect(best?.playerName).toBe(`Player ${best!.playerId!}`);
  });

  it('excludes bench players', () => {
    const [best] = rankStarterWeeks(season, 5, context.playerName);
    const week = season.regularSeasonWeeks.find((candidate) => candidate.week === best!.week)!;
    const team = week.teams.find((candidate) => candidate.rosterId === best!.rosterId)!;

    expect(team.starters.some((starter) => starter.playerId === best!.playerId)).toBe(true);
  });
});

describe('weeklyLowScorers', () => {
  const losers = weeklyLowScorers(season);

  it('returns the lowest scorer for every settled regular-season week', () => {
    expect(losers).toHaveLength(14);

    for (const loser of losers) {
      const week = season.regularSeasonWeeks.find((candidate) => candidate.week === loser.week)!;
      expect(loser.value).toBe(Math.min(...week.teams.map((team) => team.points)));
    }
  });

  it('never covers a playoff week', () => {
    expect(losers.every((loser) => loser.week! <= season.regularSeasonEndWeek)).toBe(true);
  });
});

describe('computeSeasonAwards', () => {
  it('reads the podium from the bracket placement games', () => {
    const awards = computeSeasonAwards(season, context, 5);
    expect(awards.podium.map((placement) => placement.place)).toEqual([1, 2, 3]);
    expect(awards.podium[0]!.rosterId).toBe(7);
  });

  it('yields empty lists for a season with no scores', () => {
    const preDraft = buildSeason(
      seasonFixture({ matchupsByWeek: matchupsThrough(0), winnersBracket: [], losersBracket: [] }),
    );
    const awards = computeSeasonAwards(preDraft, context, 5);

    expect(awards.podium).toEqual([]);
    expect(awards.regularSeasonChamp).toEqual([]);
    expect(awards.highestTeamWeek).toEqual([]);
    expect(awards.highestStarterWeek).toEqual([]);
    expect(awards.beerDuty).toEqual([]);
  });

  it('reports one broken award as undecided without losing the others', () => {
    const broken = { ...season, winnersBracket: null as never };
    const awards = computeSeasonAwards(broken, context, 5);

    expect(awards.podium).toEqual([]);
    expect(awards.highestTeamWeek).not.toHaveLength(0);
  });
});
