/**
 * Real Sleeper responses, captured from a completed 12-team season by
 * `scripts/capture-fixtures.mjs`. Tests assert against actual wire shapes
 * without needing the network.
 */
import leagueJson from './league.json';
import losersBracketJson from './losersBracket.json';
import matchupsJson from './matchups.json';
import rostersJson from './rosters.json';
import usersJson from './users.json';
import winnersBracketJson from './winnersBracket.json';

import type { RawSeasonData } from '@/domain/buildSeason';
import type {
  SleeperBracketMatch,
  SleeperLeague,
  SleeperMatchup,
  SleeperRoster,
  SleeperUser,
} from '@/lib/sleeper/types';

export const fixtureLeague = leagueJson as unknown as SleeperLeague;
export const fixtureUsers = usersJson as unknown as SleeperUser[];
export const fixtureRosters = rostersJson as unknown as SleeperRoster[];
export const fixtureWinnersBracket = winnersBracketJson as unknown as SleeperBracketMatch[];
export const fixtureLosersBracket = losersBracketJson as unknown as SleeperBracketMatch[];

const rawMatchups = matchupsJson as unknown as Record<string, SleeperMatchup[]>;

export const fixtureMatchupsByWeek = new Map<number, SleeperMatchup[]>(
  Object.entries(rawMatchups).map(([week, matchups]) => [Number(week), matchups]),
);

/**
 * The full captured season.
 *
 * `overrides` lets a test narrow the data. Drop weeks to simulate a season in
 * progress, or empty the rosters to simulate a pre-draft league.
 */
export function seasonFixture(overrides: Partial<RawSeasonData> = {}): RawSeasonData {
  return {
    league: fixtureLeague,
    users: fixtureUsers,
    rosters: fixtureRosters,
    matchupsByWeek: fixtureMatchupsByWeek,
    winnersBracket: fixtureWinnersBracket,
    losersBracket: fixtureLosersBracket,
    ...overrides,
  };
}

/** Only the first `throughWeek` weeks, for mid-season cases. */
export function matchupsThrough(throughWeek: number): Map<number, SleeperMatchup[]> {
  return new Map(
    [...fixtureMatchupsByWeek.entries()].map(([week, matchups]) => [
      week,
      week <= throughWeek ? matchups : [],
    ]),
  );
}
