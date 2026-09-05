import { useOutletContext, useParams } from 'react-router-dom';

import type { SleeperLeague } from '@/lib/sleeper/types';

/** What the page shell hands to every route beneath it. */
export interface LeagueContext {
  /** The configured, newest season. Undefined until it resolves. */
  head: SleeperLeague | undefined;
  /** Every season, newest first. Just the head until the chain resolves. */
  chain: SleeperLeague[];
  chainLoading: boolean;
}

export const useLeagueContext = () => useOutletContext<LeagueContext>();

export interface RouteLeague {
  league: SleeperLeague | undefined;
  isLoading: boolean;
  /** The year asked for, when the chain has resolved and does not contain it. */
  missingSeason: string | null;
}

/**
 * The season a route is about.
 *
 * `/` is the newest season, which needs only the head league. `/:season` is a
 * year, found in the chain, so it waits on the chain unless the year is the
 * head's own.
 */
export function useRouteLeague(): RouteLeague {
  const { season } = useParams<{ season: string }>();
  const { head, chain, chainLoading } = useLeagueContext();

  if (!season || head?.season === season) {
    return { league: head, isLoading: !head, missingSeason: null };
  }

  const match = chain.find((league) => league.season === season);
  if (match) return { league: match, isLoading: false, missingSeason: null };

  return {
    league: undefined,
    isLoading: !head || chainLoading,
    missingSeason: head && !chainLoading ? season : null,
  };
}
