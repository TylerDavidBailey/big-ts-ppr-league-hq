/**
 * One typed function per Sleeper endpoint the app uses.
 *
 * Nothing here transforms data. Each function names an endpoint and applies
 * the narrow normalisations the wire format forces, such as a 404 body of
 * `null` and an unplayed week's `[]`.
 */
import { fetchSleeper, NotFoundError } from './client';
import type {
  SleeperBracketMatch,
  SleeperLeague,
  SleeperMatchup,
  SleeperNflState,
  SleeperRoster,
  SleeperUser,
} from './types';

export const getNflState = (signal?: AbortSignal) =>
  fetchSleeper<SleeperNflState>('/state/nfl', { signal });

export const getLeague = (leagueId: string, signal?: AbortSignal) =>
  fetchSleeper<SleeperLeague>(`/league/${leagueId}`, { signal });

export const getLeagueUsers = (leagueId: string, signal?: AbortSignal) =>
  fetchSleeper<SleeperUser[]>(`/league/${leagueId}/users`, { signal });

export const getLeagueRosters = (leagueId: string, signal?: AbortSignal) =>
  fetchSleeper<SleeperRoster[]>(`/league/${leagueId}/rosters`, { signal });

/** Returns `[]` for a week that has not been played yet. */
export const getMatchups = (leagueId: string, week: number, signal?: AbortSignal) =>
  fetchSleeper<SleeperMatchup[]>(`/league/${leagueId}/matchups/${week}`, { signal });

/**
 * Brackets 404 on leagues that never reached the playoffs, which is an expected
 * state rather than an error, so hand back an empty bracket instead.
 */
async function getBracket(
  leagueId: string,
  kind: 'winners_bracket' | 'losers_bracket',
  signal?: AbortSignal,
): Promise<SleeperBracketMatch[]> {
  try {
    const bracket = await fetchSleeper<SleeperBracketMatch[] | null>(
      `/league/${leagueId}/${kind}`,
      { signal },
    );
    return bracket ?? [];
  } catch (error) {
    if (error instanceof NotFoundError) return [];
    throw error;
  }
}

export const getWinnersBracket = (leagueId: string, signal?: AbortSignal) =>
  getBracket(leagueId, 'winners_bracket', signal);

export const getLosersBracket = (leagueId: string, signal?: AbortSignal) =>
  getBracket(leagueId, 'losers_bracket', signal);

/**
 * A user's leagues for one season. `[]` when they were in none.
 *
 * This is the only way to walk the season chain forwards: `previous_league_id`
 * points backwards, so the newest season is found by asking a manager for
 * their leagues the following year. See `head.ts`.
 */
export const getUserLeagues = (userId: string, season: string, signal?: AbortSignal) =>
  fetchSleeper<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`, { signal });

/**
 * Walk `previous_league_id` back through every prior season of a league.
 *
 * Starts from an already-fetched newest season, so the walk costs one request
 * per earlier season and nothing for the head. Most recent season first.
 * `maxSeasons` is a cycle guard rather than a real limit: a `seen` set already
 * stops a loop, and this caps the damage if Sleeper ever returns a chain that
 * grows without repeating.
 */
export async function getLeagueChain(
  head: SleeperLeague,
  signal?: AbortSignal,
  maxSeasons = 60,
): Promise<SleeperLeague[]> {
  const chain: SleeperLeague[] = [head];
  const seen = new Set<string>([head.league_id]);
  let cursor: string | null = head.previous_league_id;

  while (cursor && !seen.has(cursor) && chain.length < maxSeasons) {
    seen.add(cursor);
    const league: SleeperLeague = await getLeague(cursor, signal);
    chain.push(league);
    cursor = league.previous_league_id;
  }

  return chain;
}
