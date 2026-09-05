/**
 * TanStack Query bindings for the Sleeper endpoints.
 *
 * A season is one query, so the season tabs and the all-time tabs share a
 * single cache entry per league id. Completed seasons never change and are
 * cached for the visit; the live season is polled while the tab is open.
 */
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { NotFoundError } from './client';
import { getLeague, getLeagueChain } from './endpoints';
import { fetchSeason } from './season';
import type { SleeperLeague } from './types';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { loadPlayerIndex } from '@/lib/players';

/** Completed seasons never change; live ones are refetched on a short leash. */
const FOREVER = Number.POSITIVE_INFINITY;
const FIVE_MINUTES = 5 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;

export const queryKeys = {
  playerIndex: () => ['player-index'] as const,
  league: (leagueId: string) => ['league', leagueId] as const,
  leagueChain: () => ['league-chain', LEAGUE.leagueId] as const,
  season: (leagueId: string) => ['season', leagueId] as const,
} as const;

const notFoundRetry = (failureCount: number, error: Error) =>
  !(error instanceof NotFoundError) && failureCount < 2;

export const usePlayerIndex = () =>
  useQuery({
    queryKey: queryKeys.playerIndex(),
    queryFn: () => loadPlayerIndex(),
    staleTime: FOREVER,
  });

/** The configured league, which is the newest season. */
export const useCurrentLeague = () =>
  useQuery({
    queryKey: queryKeys.league(LEAGUE.leagueId),
    queryFn: ({ signal }) => getLeague(LEAGUE.leagueId, signal),
    staleTime: FIVE_MINUTES,
    retry: notFoundRetry,
  });

/**
 * Every season of the league, newest first.
 *
 * The walk starts from the already-fetched newest season and follows
 * `previous_league_id` back to the first one, so the landing page never waits
 * on it: the current season renders as soon as its own league resolves.
 */
export const useLeagueChain = (head: SleeperLeague | undefined) =>
  useQuery({
    queryKey: queryKeys.leagueChain(),
    queryFn: ({ signal }) => getLeagueChain(head ?? emptyLeague, signal),
    enabled: Boolean(head),
    staleTime: FIVE_MINUTES,
    retry: notFoundRetry,
  });

/**
 * Poll a live league so scores move without a reload.
 *
 * A finished season never changes, so it is never polled. `false` is what
 * TanStack Query expects to mean "do not poll".
 */
const refetchIntervalFor = (league: SleeperLeague): number | false =>
  league.status === 'in_season' ? TWO_MINUTES : false;

const seasonQuery = (league: SleeperLeague) => ({
  queryKey: queryKeys.season(league.league_id),
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchSeason(league, signal),
  staleTime: league.status === 'complete' ? FOREVER : FIVE_MINUTES,
  refetchInterval: refetchIntervalFor(league),
  retry: notFoundRetry,
});

export const useSeasonModel = (league: SleeperLeague | undefined) =>
  useQuery({
    ...seasonQuery(league ?? emptyLeague),
    enabled: Boolean(league),
  });

/** One query per season, sharing keys with `useSeasonModel`. */
export const useAllSeasonModels = (
  chain: readonly SleeperLeague[],
): UseQueryResult<SeasonModel>[] =>
  useQueries({ queries: chain.map((league) => seasonQuery(league)) });

/** Placeholder so a disabled season query has a stable key. Never fetched. */
const emptyLeague: SleeperLeague = {
  league_id: '',
  name: '',
  season: '',
  season_type: '',
  status: 'pre_draft',
  sport: 'nfl',
  avatar: null,
  total_rosters: 0,
  roster_positions: [],
  previous_league_id: null,
  draft_id: null,
  settings: {},
  scoring_settings: {},
  metadata: null,
};
