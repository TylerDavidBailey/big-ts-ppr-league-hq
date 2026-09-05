/**
 * Assembles a `SeasonModel` from the individual Sleeper queries.
 *
 * The hook owns fetching and nothing else; every derived value comes from the
 * pure `buildSeason` in the domain layer.
 */
import { useMemo } from 'react';

import { buildSeason, type RawSeasonData } from '@/domain/buildSeason';
import type { SeasonModel } from '@/domain/types';
import { resolveAwards, type ResolvedAward } from '@/domain/awards';
import { playerNameResolver } from '@/lib/players';
import {
  useLeague,
  useLeagueRosters,
  useLeagueUsers,
  useLosersBracket,
  useNflState,
  usePlayerIndex,
  useSeasonMatchups,
  useWinnersBracket,
} from '@/lib/sleeper/queries';

export interface SeasonQueryResult {
  season: SeasonModel | null;
  awards: ResolvedAward[];
  /** True until the league, users and rosters are all in hand. */
  isLoading: boolean;
  /** True while week data is still arriving behind an already-rendered page. */
  isLoadingWeeks: boolean;
  error: Error | null;
  /** 0..1, for the week-fetch progress indicator. */
  weekProgress: number;
}

export function useSeason(leagueId: string | undefined): SeasonQueryResult {
  const leagueQuery = useLeague(leagueId);
  const league = leagueQuery.data;

  const usersQuery = useLeagueUsers(leagueId, league);
  const rostersQuery = useLeagueRosters(leagueId, league);
  const winnersQuery = useWinnersBracket(leagueId, league);
  const losersQuery = useLosersBracket(leagueId, league);
  const matchupQueries = useSeasonMatchups(leagueId, league);
  const playerIndexQuery = usePlayerIndex();
  const nflStateQuery = useNflState();

  const settledWeeks = matchupQueries.filter((query) => query.isSuccess).length;
  const weekProgress = matchupQueries.length === 0 ? 0 : settledWeeks / matchupQueries.length;

  /**
   * A fingerprint of the week data itself, not just how much of it has arrived.
   *
   * Keying the memo on a count froze the model once every week had resolved, so
   * a refetch during Sunday's games could never change what was on screen.
   */
  const weekDataVersion = matchupQueries.map((query) => query.dataUpdatedAt).join(',');

  const season = useMemo<SeasonModel | null>(() => {
    if (!league || !usersQuery.data || !rostersQuery.data) return null;

    const matchupsByWeek = new Map(
      matchupQueries.flatMap((query, index) =>
        query.data ? [[index + 1, query.data] as const] : [],
      ),
    );

    const raw: RawSeasonData = {
      league,
      users: usersQuery.data,
      rosters: rostersQuery.data,
      matchupsByWeek,
      winnersBracket: winnersQuery.data ?? [],
      losersBracket: losersQuery.data ?? [],
      nflState: nflStateQuery.data
        ? { season: nflStateQuery.data.season, week: nflStateQuery.data.week }
        : null,
    };

    return buildSeason(raw);
    // matchupQueries is a fresh array every render, so weekDataVersion stands in
    // for it: it changes whenever any week's data is actually refetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    league,
    usersQuery.data,
    rostersQuery.data,
    winnersQuery.data,
    losersQuery.data,
    nflStateQuery.data,
    weekDataVersion,
  ]);

  const awards = useMemo<ResolvedAward[]>(() => {
    if (!season) return [];
    return resolveAwards(season, { playerName: playerNameResolver(playerIndexQuery.data ?? {}) });
  }, [season, playerIndexQuery.data]);

  return {
    season,
    awards,
    // The dependent queries stay pending while disabled, so the league query
    // decides the loading state until it resolves.
    isLoading:
      leagueQuery.isPending ||
      (leagueQuery.isSuccess && (usersQuery.isPending || rostersQuery.isPending)),
    isLoadingWeeks: matchupQueries.some((query) => query.isPending),
    error: leagueQuery.error ?? usersQuery.error ?? rostersQuery.error ?? null,
    weekProgress,
  };
}
