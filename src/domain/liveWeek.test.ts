import { describe, expect, it } from 'vitest';

import { weeklyLowScorers } from './awards';
import { buildSeason } from './buildSeason';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

/**
 * A week that is still being played must decide nothing.
 *
 * Sleeper starts returning scores on Thursday night. Until Sunday evening most
 * rosters sit near zero, so treating the week as final hands out a record and
 * names a beer-duty loser from a partial slate.
 */
describe('a week still being played', () => {
  const fixture = seasonFixture();

  /**
   * The league as it looks on a Sunday in week 5: weeks 1 to 5 have scores,
   * week 5 is still being played, and weeks 6 onward do not exist yet.
   */
  const liveSeason = () =>
    buildSeason({
      ...fixture,
      matchupsByWeek: matchupsThrough(5),
      nflState: { season: fixture.league.season, week: 5 },
    });

  it('is marked provisional rather than played-and-final', () => {
    const week5 = liveSeason().weeks.find((week) => week.week === 5);

    expect(week5?.played).toBe(true);
    expect(week5?.provisional).toBe(true);
  });

  it('leaves earlier weeks settled', () => {
    const weeks = liveSeason().weeks.filter((week) => week.week < 5 && week.played);
    expect(weeks).toHaveLength(4);
    expect(weeks.every((week) => !week.provisional)).toBe(true);
  });

  it('counts only the four finished weeks', () => {
    expect(liveSeason().regularSeasonWeeks).toHaveLength(4);
    expect(liveSeason().isRegularSeasonComplete).toBe(false);
  });

  it('is excluded from the settled weeks that decide records and awards', () => {
    const settled = liveSeason().regularSeasonWeeks.map((week) => week.week);
    expect(settled).not.toContain(5);
    expect(settled).toContain(4);
  });

  it('does not add a win or a loss for the week in progress', () => {
    const live = liveSeason();
    const final = buildSeason(fixture);

    // Four finished weeks, so four results. Week 5's partial scores add none.
    for (const row of live.standings) {
      expect(row.wins + row.losses + row.ties).toBe(4);
    }
    // The same league with every week finished counts all 14.
    expect(final.standings[0]!.wins + final.standings[0]!.losses).toBe(14);
    expect(final.isRegularSeasonComplete).toBe(true);
  });

  it('names no beer duty for the week in progress', () => {
    const weeks = weeklyLowScorers(liveSeason()).map((loser) => loser.week);

    expect(weeks).not.toContain(5);
    expect(weeks).toContain(4);
  });

  it('reports which week is live', () => {
    expect(liveSeason().liveWeek).toBe(5);
  });

  it('treats a past season as fully settled whatever the NFL clock says', () => {
    // The fixture season is 2025; the league being viewed is not the live one.
    const past = buildSeason({ ...fixture, nflState: { season: '2030', week: 5 } });

    expect(past.liveWeek).toBeNull();
    expect(past.weeks.every((week) => !week.provisional)).toBe(true);
    expect(past.regularSeasonWeeks).toHaveLength(14);
  });

  it('falls back to treating every week as final when the clock is unknown', () => {
    // /state/nfl failing must not stop the app deciding a finished season.
    const noClock = buildSeason({ ...fixture, nflState: null });
    expect(noClock.liveWeek).toBeNull();
    expect(noClock.regularSeasonWeeks).toHaveLength(14);
  });
});
