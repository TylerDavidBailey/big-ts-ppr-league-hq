/**
 * Serve the captured Sleeper responses to the browser.
 *
 * The same JSON that backs the unit tests answers every `api.sleeper.app`
 * request, so a browser test asserts on real numbers without depending on
 * Sleeper being up or on a league's data staying frozen.
 */
import type { Page, Route } from '@playwright/test';

import { LEAGUE } from '../src/league.config';

import league from '../src/test/fixtures/league.json' with { type: 'json' };
import losersBracket from '../src/test/fixtures/losersBracket.json' with { type: 'json' };
import matchups from '../src/test/fixtures/matchups.json' with { type: 'json' };
import rosters from '../src/test/fixtures/rosters.json' with { type: 'json' };
import users from '../src/test/fixtures/users.json' with { type: 'json' };
import winnersBracket from '../src/test/fixtures/winnersBracket.json' with { type: 'json' };

/** The configured league, served as the 2026 pre-draft season. */
export const CURRENT_LEAGUE_ID = LEAGUE.leagueId;
/** The finished 2025 season the fixtures were captured from. */
export const FINISHED_LEAGUE_ID = league.league_id;
/** The 2024 season, which ends the chain. Taken from the fixture's own link. */
export const OLDEST_LEAGUE_ID = league.previous_league_id;
/** A 2026 season the config does not know about, for the forward walk. */
export const NEWER_LEAGUE_ID = '8000000000000000004';

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const notFound = (route: Route) =>
  route.fulfill({ status: 404, contentType: 'application/json', body: 'null' });

/**
 * Three seasons linked the way Sleeper links them.
 *
 * Each season is its own league, and `previous_league_id` on the oldest is
 * null, which is what ends the walk in `getLeagueChain`. Serving the same
 * league object for every id would make the chain fold back on itself.
 */
type LeagueResponse = Omit<typeof league, 'previous_league_id'> & {
  previous_league_id: string | null;
};

const oldest: LeagueResponse = {
  ...league,
  league_id: OLDEST_LEAGUE_ID,
  season: '2024',
  previous_league_id: null,
};

/** The configured id is the 2026 pre-draft season, chained to the fixture. */
const configIsNewest: Record<string, LeagueResponse> = {
  [CURRENT_LEAGUE_ID]: {
    ...league,
    league_id: CURRENT_LEAGUE_ID,
    season: '2026',
    status: 'pre_draft',
    previous_league_id: FINISHED_LEAGUE_ID,
  },
  [FINISHED_LEAGUE_ID]: league,
  [OLDEST_LEAGUE_ID]: oldest,
};

/**
 * The configured id is the finished 2025 season, and a 2026 season exists
 * that only a manager's league list reveals.
 */
const configIsStale: Record<string, LeagueResponse> = {
  [NEWER_LEAGUE_ID]: {
    ...league,
    league_id: NEWER_LEAGUE_ID,
    season: '2026',
    status: 'pre_draft',
    previous_league_id: CURRENT_LEAGUE_ID,
  },
  [CURRENT_LEAGUE_ID]: { ...league, league_id: CURRENT_LEAGUE_ID },
  [OLDEST_LEAGUE_ID]: oldest,
};

export interface MockOptions {
  /** Answer the configured league with a server error, to test the failure state. */
  failCurrentLeague?: boolean;
  /** Serve the configured id as a finished season with a newer one to discover. */
  newerSeasonExists?: boolean;
  /**
   * Serve the configured 2026 season as in progress, with this week being
   * played. Weeks before it carry the 2025 fixture's scores and weeks after
   * it are unplayed, so the live week is provisional and settles nothing.
   */
  liveWeek?: number;
}

export async function mockSleeper(page: Page, options: MockOptions = {}): Promise<void> {
  const seasons = options.newerSeasonExists ? configIsStale : configIsNewest;
  const liveWeek = options.liveWeek ?? null;

  await page.route('https://api.sleeper.app/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/v1/state/nfl') {
      // 2026 is the live season, so the 2025 fixture league has no week in
      // progress and every one of its weeks is final.
      return json(route, {
        season: '2026',
        previous_season: '2025',
        week: liveWeek ?? 1,
        display_week: liveWeek ?? 1,
        season_type: 'regular',
      });
    }

    // A manager's leagues for a year. Only the stale-config scenario has one.
    const userLeagues = /^\/v1\/user\/\d+\/leagues\/nfl\/(\d{4})$/.exec(path);
    if (userLeagues) {
      const found = options.newerSeasonExists && userLeagues[1] === '2026';
      return json(route, found ? [seasons[NEWER_LEAGUE_ID]] : []);
    }

    const leagueMatch = /^\/v1\/league\/(\d+)(\/(.*))?$/.exec(path);
    if (!leagueMatch) return notFound(route);

    const [, id, , resource] = leagueMatch;
    if (options.failCurrentLeague && id === CURRENT_LEAGUE_ID) {
      return route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' });
    }

    const stored = id ? seasons[id] : undefined;
    if (!stored) return notFound(route);

    // The live scenario turns the pre-draft 2026 season into one mid-season.
    const isLive = liveWeek !== null && stored.status === 'pre_draft';
    const season: LeagueResponse = isLive ? { ...stored, status: 'in_season' } : stored;
    const unplayedFrom = liveWeek === null ? Number.POSITIVE_INFINITY : liveWeek + 1;
    const isPreDraft = season.status === 'pre_draft';

    switch (resource) {
      case undefined:
        return json(route, season);
      case 'users':
        return json(route, users);
      case 'rosters':
        return json(route, rosters);
      case 'winners_bracket':
        return json(route, isPreDraft || isLive ? [] : winnersBracket);
      case 'losers_bracket':
        return json(route, isPreDraft || isLive ? [] : losersBracket);
      default: {
        // `case undefined` above already handled the bare league endpoint.
        const week = /^matchups\/(\d+)$/.exec(resource)?.[1];
        if (!week) return notFound(route);
        // An unplayed week is an empty array under HTTP 200, which is what a
        // pre-draft league returns for every week.
        const rows = (matchups as Record<string, unknown[]>)[week] ?? [];
        if (isPreDraft) return json(route, []);
        if (isLive && Number(week) >= unplayedFrom) return json(route, []);
        return json(route, rows);
      }
    }
  });

  // Avatars and headshots come from Sleeper's CDN. Serve a pixel so the tests
  // do not depend on the network or on a particular player having a photo.
  await page.route('https://sleepercdn.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    }),
  );
}
