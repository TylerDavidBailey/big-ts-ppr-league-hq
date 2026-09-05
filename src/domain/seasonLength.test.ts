import { describe, expect, it } from 'vitest';

import {
  MAX_SEASON_WEEK,
  lastWeekOfSeason,
  playoffRounds,
  weeksPerPlayoffRound,
} from './buildSeason';

describe('weeksPerPlayoffRound', () => {
  it('is one week per round by default', () => {
    expect(weeksPerPlayoffRound(undefined)).toBe(1);
    expect(weeksPerPlayoffRound(0)).toBe(1);
    // `1` is Sleeper's two-week championship only, which still fits one week
    // per round across the bracket span.
    expect(weeksPerPlayoffRound(1)).toBe(1);
  });

  it('is two weeks per round when every round runs long', () => {
    expect(weeksPerPlayoffRound(2)).toBe(2);
  });
});

describe('lastWeekOfSeason', () => {
  it('covers a standard season with room for the whole bracket', () => {
    // Regular season 1-14, playoffs from 15. Four rounds reach week 18.
    expect(lastWeekOfSeason(15, 0)).toBe(19);
  });

  it('follows a league whose regular season runs longer', () => {
    // A 16-week regular season must not be truncated by an NFL-shaped constant.
    expect(lastWeekOfSeason(17, 0)).toBe(21);
  });

  it('makes room for two-week playoff rounds', () => {
    expect(lastWeekOfSeason(15, 2)).toBe(23);
    expect(lastWeekOfSeason(15, 2)).toBeGreaterThan(lastWeekOfSeason(15, 0));
  });

  it('caps a nonsense playoff week rather than requesting forever', () => {
    expect(lastWeekOfSeason(9999, 2)).toBe(MAX_SEASON_WEEK);
  });

  it('still reaches the playoffs for a short season', () => {
    expect(lastWeekOfSeason(1, 0)).toBeGreaterThanOrEqual(1);
  });

  it('ends on the championship week when the bracket size is known', () => {
    // Six teams play three rounds: weeks 15, 16 and 17.
    expect(lastWeekOfSeason(15, 0, 6)).toBe(17);
    expect(lastWeekOfSeason(15, 0, 4)).toBe(16);
    expect(lastWeekOfSeason(15, 0, 12)).toBe(18);
    expect(lastWeekOfSeason(15, 2, 6)).toBe(20);
  });

  it('falls back to the widest bracket for a nonsense team count', () => {
    expect(lastWeekOfSeason(15, 0, 0)).toBe(19);
    expect(lastWeekOfSeason(15, 0, 1)).toBe(19);
  });
});

describe('playoffRounds', () => {
  it('is the number of knockout rounds a bracket needs', () => {
    expect(playoffRounds(2)).toBe(1);
    expect(playoffRounds(4)).toBe(2);
    expect(playoffRounds(6)).toBe(3);
    expect(playoffRounds(8)).toBe(3);
    expect(playoffRounds(12)).toBe(4);
  });

  it('caps at the widest bracket Sleeper offers', () => {
    expect(playoffRounds(32)).toBe(4);
    expect(playoffRounds(undefined)).toBe(4);
  });
});
