/**
 * Find the newest season without editing the config every year.
 *
 * Sleeper links seasons backwards only: a league knows its `previous_league_id`
 * and nothing about the season that replaced it. A user's leagues can be
 * listed by year, though, so when the configured league is finished the app
 * asks its managers, commissioner first, for their leagues the following year
 * and picks the one that points back at it. Repeated until nothing newer turns
 * up, so a config id can fall several seasons behind and still resolve.
 *
 * A league that is not `complete` is the newest by definition, so in season
 * and in pre-draft this costs nothing.
 */
import { NotFoundError } from './client';
import { getLeagueUsers, getUserLeagues } from './endpoints';
import type { SleeperLeague, SleeperUser } from './types';

export interface HeadDeps {
  getLeagueUsers: (leagueId: string, signal?: AbortSignal) => Promise<SleeperUser[]>;
  getUserLeagues: (
    userId: string,
    season: string,
    signal?: AbortSignal,
  ) => Promise<SleeperLeague[]>;
}

const defaultDeps: HeadDeps = { getLeagueUsers, getUserLeagues };

/** Managers to ask before concluding there is no newer season. */
const MANAGERS_TO_ASK = 3;
/** Years the commissioner is checked ahead, so a skipped year still links up. */
const COMMISSIONER_LOOKAHEAD = 2;
/** Cycle guard for a chain that somehow points forward forever. */
const MAX_HOPS = 20;

const commissionerFirst = (users: readonly SleeperUser[]): SleeperUser[] =>
  [...users].sort((a, b) => Number(b.is_owner ?? false) - Number(a.is_owner ?? false));

async function findNextSeason(
  head: SleeperLeague,
  deps: HeadDeps,
  signal?: AbortSignal,
): Promise<SleeperLeague | null> {
  const managers = commissionerFirst(await deps.getLeagueUsers(head.league_id, signal)).slice(
    0,
    MANAGERS_TO_ASK,
  );

  for (const [index, manager] of managers.entries()) {
    const lookahead = index === 0 ? COMMISSIONER_LOOKAHEAD : 1;
    for (let ahead = 1; ahead <= lookahead; ahead += 1) {
      const season = String(Number(head.season) + ahead);
      let leagues: SleeperLeague[];
      try {
        leagues = await deps.getUserLeagues(manager.user_id, season, signal);
      } catch (error) {
        // A manager whose account is gone answers 404. Ask the next one.
        if (error instanceof NotFoundError) continue;
        throw error;
      }
      const next = leagues.find((league) => league.previous_league_id === head.league_id);
      if (next) return next;
    }
  }

  return null;
}

/** The newest season reachable from `league`, or `league` itself. */
export async function resolveHead(
  league: SleeperLeague,
  signal?: AbortSignal,
  deps: HeadDeps = defaultDeps,
): Promise<SleeperLeague> {
  let head = league;
  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    if (head.status !== 'complete') return head;
    const next = await findNextSeason(head, deps, signal);
    if (!next) return head;
    head = next;
  }
  return head;
}
