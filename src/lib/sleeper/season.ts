/**
 * One season, fetched whole.
 *
 * Users, rosters, both brackets, every week, and the NFL clock are requested
 * in parallel and handed to the pure `buildSeason`. A pre-draft league skips
 * the weeks and brackets, which are known to be empty, so it costs two
 * requests rather than twenty.
 */
import {
  getLeagueRosters,
  getLeagueUsers,
  getLosersBracket,
  getMatchups,
  getNflState,
  getWinnersBracket,
} from './endpoints';
import type { SleeperLeague, SleeperMatchup, SleeperNflState } from './types';
import { buildSeason, lastWeekOfSeason } from '@/domain/buildSeason';
import type { SeasonModel } from '@/domain/types';

const hasNoGames = (league: SleeperLeague): boolean =>
  league.status === 'pre_draft' || league.status === 'drafting';

/** Weeks 1 through the championship week, derived from the league's own settings. */
export function seasonWeeks(league: SleeperLeague): number[] {
  if (hasNoGames(league)) return [];
  const { playoff_week_start, playoff_round_type, playoff_teams } = league.settings;
  const lastWeek = lastWeekOfSeason(playoff_week_start ?? 15, playoff_round_type, playoff_teams);
  return Array.from({ length: lastWeek }, (_, index) => index + 1);
}

/**
 * The NFL clock is only advisory: without it every week is treated as final,
 * which is the right answer for a past season and a tolerable one for a live
 * week. A failure there must not fail the whole season.
 */
async function nflStateOrNull(signal?: AbortSignal): Promise<SleeperNflState | null> {
  try {
    return await getNflState(signal);
  } catch (error) {
    console.error('Could not read the NFL clock; treating every week as final.', error);
    return null;
  }
}

export async function fetchSeason(
  league: SleeperLeague,
  signal?: AbortSignal,
): Promise<SeasonModel> {
  const id = league.league_id;
  const weeks = seasonWeeks(league);
  const skipGames = hasNoGames(league);

  const [users, rosters, winnersBracket, losersBracket, nflState, ...matchups] = await Promise.all([
    getLeagueUsers(id, signal),
    getLeagueRosters(id, signal),
    skipGames ? Promise.resolve([]) : getWinnersBracket(id, signal),
    skipGames ? Promise.resolve([]) : getLosersBracket(id, signal),
    nflStateOrNull(signal),
    ...weeks.map((week) => getMatchups(id, week, signal)),
  ]);

  const matchupsByWeek = new Map<number, SleeperMatchup[]>(
    weeks.map((week, index) => [week, matchups[index] ?? []]),
  );

  return buildSeason({
    league,
    users,
    rosters,
    matchupsByWeek,
    winnersBracket,
    losersBracket,
    nflState: nflState ? { season: nflState.season, week: nflState.week } : null,
  });
}
