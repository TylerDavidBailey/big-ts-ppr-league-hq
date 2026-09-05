import { describe, expect, it } from 'vitest';

import { buildSeason } from './buildSeason';
import { lineupEfficiency, powerRankings, superlatives } from './stats';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

const fixture = seasonFixture();
const season = buildSeason(fixture);
const preDraft = buildSeason(seasonFixture({ matchupsByWeek: matchupsThrough(0) }));

describe('powerRankings', () => {
  const rows = powerRankings(season);

  it('counts all-play wins against every other team each week', () => {
    const row = rows.find((candidate) => candidate.rosterId === 1)!;

    let wins = 0;
    let losses = 0;
    for (const week of season.regularSeasonWeeks) {
      const own = week.teams.find((team) => team.rosterId === 1)!;
      for (const other of week.teams) {
        if (other.rosterId === 1) continue;
        if (own.points > other.points) wins += 1;
        else if (own.points < other.points) losses += 1;
      }
    }

    expect(row.allPlayWins).toBe(wins);
    expect(row.allPlayLosses).toBe(losses);
    expect(row.allPlayWins + row.allPlayLosses + row.allPlayTies).toBe(14 * 11);
  });

  it('sums expected wins to the games actually played', () => {
    const expected = rows.reduce((sum, row) => sum + row.expectedWins, 0);
    const actual = rows.reduce((sum, row) => sum + row.actualWins, 0);
    // 12 teams, 14 weeks, one win per matchup: 84 wins in total.
    expect(actual).toBe(84);
    expect(expected).toBeCloseTo(84, 1);
  });

  it('measures luck as actual minus expected wins', () => {
    for (const row of rows) {
      expect(row.luck).toBeCloseTo(row.actualWins - row.expectedWins, 2);
    }
  });

  it('ranks by all-play record, then points', () => {
    for (let index = 1; index < rows.length; index += 1) {
      const above = rows[index - 1]!;
      const below = rows[index]!;
      expect(
        above.allPlayPct > below.allPlayPct ||
          (above.allPlayPct === below.allPlayPct && above.pointsFor >= below.pointsFor),
      ).toBe(true);
      expect(below.rank).toBe(index + 1);
    }
  });

  it('is empty before any week is played', () => {
    expect(powerRankings(preDraft)).toEqual([]);
  });
});

describe('lineupEfficiency', () => {
  const rows = lineupEfficiency(season);

  it('divides points scored by the perfect-lineup total Sleeper reports', () => {
    const row = rows.find((candidate) => candidate.rosterId === 1)!;
    expect(row.pointsFor).toBe(1805.78);
    expect(row.maxPointsFor).toBe(1986.78);
    expect(row.efficiency).toBeCloseTo(1805.78 / 1986.78, 4);
  });

  it('totals bench points from the players who did not start', () => {
    const raw = fixture.matchupsByWeek.get(1)!.find((matchup) => matchup.roster_id === 1)!;
    const week1 = season.weeks.find((week) => week.week === 1)!;
    const team = week1.teams.find((candidate) => candidate.rosterId === 1)!;

    const allPoints = Object.values(raw.players_points ?? {}).reduce((sum, p) => sum + p, 0);
    const benchPoints = team.bench.reduce((sum, player) => sum + player.points, 0);
    expect(benchPoints).toBeCloseTo(allPoints - (raw.points ?? 0), 1);
    expect(team.bench.every((player) => !raw.starters?.includes(player.playerId))).toBe(true);
  });

  it('names the single biggest benched score with its week', () => {
    const row = rows.find((candidate) => candidate.rosterId === 1)!;
    const best = Math.max(
      ...season.regularSeasonWeeks.flatMap((week) =>
        week.teams
          .filter((team) => team.rosterId === 1)
          .flatMap((team) => team.bench.map((player) => player.points)),
      ),
    );
    expect(row.biggestBench?.points).toBe(best);
    expect(row.biggestBench?.week).toBeLessThanOrEqual(14);
  });

  it('ranks the most efficient manager first', () => {
    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index]!.efficiency!).toBeLessThanOrEqual(rows[index - 1]!.efficiency!);
    }
  });

  it('is empty before any week is played', () => {
    expect(lineupEfficiency(preDraft)).toEqual([]);
  });
});

describe('superlatives', () => {
  const stats = superlatives(season);

  it('finds the biggest blowout from the winner side', () => {
    const [blowout] = stats.biggestBlowout;
    const widest = Math.max(
      ...season.regularSeasonWeeks.flatMap((week) =>
        week.teams.map((team) => Math.abs(team.points - (team.opponentPoints ?? team.points))),
      ),
    );
    expect(blowout?.margin).toBeCloseTo(widest, 2);
    expect(blowout!.points).toBeGreaterThan(blowout!.opponentPoints);
  });

  it('finds the closest decided game', () => {
    const [closest] = stats.closestGame;
    expect(closest!.margin).toBeGreaterThan(0);
    expect(closest!.margin).toBeLessThan(stats.biggestBlowout[0]!.margin);
  });

  it('separates the best losing score from the worst winning score', () => {
    const [loss] = stats.highestScoringLoss;
    const [win] = stats.lowestScoringWin;
    expect(loss!.points).toBeLessThan(loss!.opponentPoints);
    expect(win!.points).toBeGreaterThan(win!.opponentPoints);
  });

  it('credits the undefeated team with a 14-game win streak', () => {
    const [streak] = stats.longestWinStreak;
    expect(streak?.length).toBe(14);
    expect(streak?.rosterId).toBe(season.standings[0]!.rosterId);
    expect(streak?.fromWeek).toBe(1);
    expect(streak?.toWeek).toBe(14);
  });

  it('tallies one weekly high per settled week', () => {
    const total = stats.weeklyHighs.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(14);
    expect(stats.weeklyHighs.every((row) => row.count > 0)).toBe(true);
  });

  it('orders consistency by standard deviation', () => {
    expect(stats.mostConsistent[0]!.stdDev).toBeLessThanOrEqual(stats.leastConsistent[0]!.stdDev);
  });

  it('is empty before any week is played', () => {
    const empty = superlatives(preDraft);
    expect(empty.biggestBlowout).toEqual([]);
    expect(empty.longestWinStreak).toEqual([]);
    expect(empty.weeklyHighs).toEqual([]);
    expect(empty.mostConsistent).toEqual([]);
  });
});

describe('stats edge cases', () => {
  const week1 = fixture.matchupsByWeek.get(1)!;
  const [home] = week1;
  const away = week1.find(
    (matchup) => matchup.matchup_id === home!.matchup_id && matchup.roster_id !== home!.roster_id,
  )!;

  const oneWeek = (rows: typeof week1) =>
    buildSeason(seasonFixture({ matchupsByWeek: new Map([[1, rows]]) }));

  it('counts an all-play tie as half a win', () => {
    const tied = oneWeek(week1.map((row, index) => (index < 2 ? { ...row, points: 100 } : row)));
    const rows = powerRankings(tied);
    const tiedRows = rows.filter((row) => row.allPlayTies > 0);

    expect(tiedRows).toHaveLength(2);
    expect(tiedRows[0]!.allPlayTies).toBe(1);
    expect(tiedRows[0]!.expectedWins).toBeCloseTo((tiedRows[0]!.allPlayWins + 0.5) / 11, 2);
  });

  it('treats a bye as neither a win nor a loss in a streak', () => {
    const winner = home!.points! > away.points! ? home! : away;
    const loser = winner === home ? away : home!;
    // Week 2: the winner sits out, so the loser has a bye, and every other
    // pair swaps scores so nobody else strings two wins together.
    const week2 = week1
      .filter((row) => row.roster_id !== winner.roster_id)
      .map((row) => {
        if (row.roster_id === loser.roster_id) return row;
        const opponent = week1.find(
          (other) => other.matchup_id === row.matchup_id && other.roster_id !== row.roster_id,
        )!;
        return { ...row, points: opponent.points };
      });
    const withBye = buildSeason(
      seasonFixture({
        matchupsByWeek: new Map([
          [1, week1],
          [2, week2],
          [3, week1],
        ]),
      }),
    );

    expect(superlatives(withBye).longestWinStreak).toEqual([
      { rosterId: winner.roster_id, length: 2, fromWeek: 1, toWeek: 3 },
    ]);
  });

  it('reports no consistency with a single week of scores', () => {
    const stats = superlatives(oneWeek(week1));
    expect(stats.mostConsistent).toEqual([]);
    expect(stats.leastConsistent).toEqual([]);
    expect(stats.longestLossStreak[0]?.length).toBe(1);
  });

  it('ranks a team with no possible points last, with null efficiency', () => {
    const zeroMax = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster) =>
        roster.roster_id === 1
          ? { ...roster, settings: { ...roster.settings, ppts: 0, ppts_decimal: 0 } }
          : roster,
      ),
    });
    const rows = lineupEfficiency(zeroMax);
    expect(rows.at(-1)?.rosterId).toBe(1);
    expect(rows.at(-1)?.efficiency).toBeNull();
  });

  it('ignores a week with only one roster', () => {
    const lonely = oneWeek([home!]);
    expect(powerRankings(lonely).every((row) => row.allPlayWins === 0)).toBe(true);
    expect(superlatives(lonely).biggestBlowout).toEqual([]);
  });
});
