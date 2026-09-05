/**
 * TanStack Query bindings for the Sleeper endpoints.
 *
 * Each endpoint gets its own query so the season page can render progressively
 * and so switching seasons reuses anything already cached. A whole season is
 * roughly two dozen requests, comfortably inside Sleeper's rate guidance.
 */
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  getLeague,
  getLeagueChain,
  getLeagueRosters,
  getLeagueUsers,
  getLosersBracket,
  getMatchups,
  getNflState,
  getUserByName,
  getUserLeagues,
  getWinnersBracket,
} from './endpoints';
import { NotFoundError } from './client';
import type { SleeperLeague, SleeperMatchup } from './types';
import { lastWeekOfSeason } from '@/domain/buildSeason';
import { loadPlayerIndex } from '@/lib/players';
import { rememberChain, resolveChainHead } from '@/lib/storage';

/** Completed seasons never change; live ones are refetched on a short leash. */
const FOREVER = Number.POSITIVE_INFINITY;
const FIVE_MINUTES = 5 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;

export const queryKeys = {
  nflState: () => ['nfl-state'] as const,
  playerIndex: () => ['player-index'] as const,
  league: (leagueId: string) => ['league', leagueId] as const,
  leagueChain: (leagueId: string) => ['league-chain', leagueId] as const,
  users: (leagueId: string) => ['league', leagueId, 'users'] as const,
  rosters: (leagueId: string) => ['league', leagueId, 'rosters'] as const,
  matchups: (leagueId: string, week: number) => ['league', leagueId, 'matchups', week] as const,
  winnersBracket: (leagueId: string) => ['league', leagueId, 'winners-bracket'] as const,
  losersBracket: (leagueId: string) => ['league', leagueId, 'losers-bracket'] as const,
  userByName: (username: string) => ['user', username] as const,
  userLeagues: (userId: string, season: string) => ['user', userId, 'leagues', season] as const,
} as const;

/**
 * Narrow an id inside a `queryFn`.
 *
 * Every query below is gated by `enabled`, so the id is present whenever the
 * function runs; TypeScript cannot see that, and a thrown error is a truthful
 * way to say so without scattering non-null assertions.
 */
function requireId(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const staleTimeFor = (league: SleeperLeague | undefined) =>
  league?.status === 'complete' ? FOREVER : FIVE_MINUTES;

/**
 * Poll a live league so scores move without a reload.
 *
 * A finished season never changes, so it is never polled. `false` is what
 * TanStack Query expects to mean "do not poll".
 */
const refetchIntervalFor = (league: SleeperLeague | undefined): number | false =>
  league?.status === 'in_season' ? TWO_MINUTES : false;

export const useNflState = () =>
  useQuery({
    queryKey: queryKeys.nflState(),
    queryFn: ({ signal }) => getNflState(signal),
    staleTime: FIVE_MINUTES,
  });

export const usePlayerIndex = () =>
  useQuery({
    queryKey: queryKeys.playerIndex(),
    queryFn: () => loadPlayerIndex(),
    staleTime: FOREVER,
  });

export const useLeague = (leagueId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.league(leagueId ?? ''),
    queryFn: ({ signal }) => getLeague(requireId(leagueId, 'leagueId'), signal),
    enabled: Boolean(leagueId),
    staleTime: FIVE_MINUTES,
    // A bad league id will never resolve; retrying just delays the error state.
    retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 2,
  });

/**
 * Every season of this league, most recent first.
 *
 * `previous_league_id` only points backwards, so opening a 2025 link directly
 * would hide the 2026 season. Each walk records the newest season for every
 * league it passes, and a later visit starts from that newest season instead.
 * When the recorded head turns out to be wrong or its chain no longer contains
 * this league, the walk falls back to starting here.
 */
export const useLeagueChain = (leagueId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.leagueChain(leagueId ?? ''),
    queryFn: async ({ signal }) => {
      const id = requireId(leagueId, 'leagueId');
      const head = resolveChainHead(id);

      if (head !== id) {
        try {
          const fromHead = await getLeagueChain(head, signal);
          if (fromHead.some((league) => league.league_id === id)) {
            rememberChain(fromHead);
            return fromHead;
          }
        } catch (error) {
          if (!(error instanceof NotFoundError)) throw error;
        }
      }

      const chain = await getLeagueChain(id, signal);
      rememberChain(chain);
      return chain;
    },
    enabled: Boolean(leagueId),
    staleTime: FIVE_MINUTES,
    retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 2,
  });

export const useLeagueUsers = (leagueId: string | undefined, league?: SleeperLeague) =>
  useQuery({
    queryKey: queryKeys.users(leagueId ?? ''),
    queryFn: ({ signal }) => getLeagueUsers(requireId(leagueId, 'leagueId'), signal),
    // Gated on the league resolving, so a bad id costs one request, not five.
    enabled: Boolean(leagueId) && Boolean(league),
    staleTime: staleTimeFor(league),
  });

export const useLeagueRosters = (leagueId: string | undefined, league?: SleeperLeague) =>
  useQuery({
    queryKey: queryKeys.rosters(leagueId ?? ''),
    queryFn: ({ signal }) => getLeagueRosters(requireId(leagueId, 'leagueId'), signal),
    enabled: Boolean(leagueId) && Boolean(league),
    staleTime: staleTimeFor(league),
  });

export const useWinnersBracket = (leagueId: string | undefined, league?: SleeperLeague) =>
  useQuery({
    queryKey: queryKeys.winnersBracket(leagueId ?? ''),
    queryFn: ({ signal }) => getWinnersBracket(requireId(leagueId, 'leagueId'), signal),
    enabled: Boolean(leagueId) && Boolean(league),
    staleTime: staleTimeFor(league),
  });

export const useLosersBracket = (leagueId: string | undefined, league?: SleeperLeague) =>
  useQuery({
    queryKey: queryKeys.losersBracket(leagueId ?? ''),
    queryFn: ({ signal }) => getLosersBracket(requireId(leagueId, 'leagueId'), signal),
    enabled: Boolean(leagueId) && Boolean(league),
    staleTime: staleTimeFor(league),
  });

/**
 * Fetch every week of the season in parallel.
 *
 * The range runs from week 1 through the end of this league's playoffs, which
 * `lastWeekOfSeason` derives from its own settings. Unplayed weeks come back as
 * `[]`, which `buildSeason` reads
 * as "not played", so there is nothing to skip and no need to know the current
 * week ahead of time.
 */
export function useSeasonMatchups(
  leagueId: string | undefined,
  league: SleeperLeague | undefined,
): UseQueryResult<SleeperMatchup[]>[] {
  const playoffWeekStart = league?.settings.playoff_week_start ?? 15;
  const lastWeek = lastWeekOfSeason(playoffWeekStart, league?.settings.playoff_round_type);
  const weeks = league ? Array.from({ length: lastWeek }, (_, index) => index + 1) : [];

  return useQueries({
    queries: weeks.map((week) => ({
      queryKey: queryKeys.matchups(leagueId ?? '', week),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getMatchups(requireId(leagueId, 'leagueId'), week, signal),
      enabled: Boolean(leagueId) && Boolean(league),
      staleTime: staleTimeFor(league),
      refetchInterval: refetchIntervalFor(league),
    })),
  });
}

export const useUserByName = (username: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.userByName(username),
    queryFn: ({ signal }) => getUserByName(username, signal),
    enabled: enabled && username.trim().length > 0,
    retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 2,
  });

export const useUserLeagues = (userId: string | undefined, season: string | undefined) =>
  useQuery({
    queryKey: queryKeys.userLeagues(userId ?? '', season ?? ''),
    queryFn: ({ signal }) =>
      getUserLeagues(requireId(userId, 'userId'), requireId(season, 'season'), signal),
    enabled: Boolean(userId) && Boolean(season),
    staleTime: FIVE_MINUTES,
  });
