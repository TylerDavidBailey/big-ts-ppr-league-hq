/**
 * Serve the captured Sleeper responses to the browser.
 *
 * The same JSON that backs the unit tests answers every `api.sleeper.app`
 * request, so a browser test asserts on real numbers without depending on
 * Sleeper being up or on a league's data staying frozen.
 */
import type { Page, Route } from '@playwright/test';

import league from '../src/test/fixtures/league.json' with { type: 'json' };
import losersBracket from '../src/test/fixtures/losersBracket.json' with { type: 'json' };
import matchups from '../src/test/fixtures/matchups.json' with { type: 'json' };
import rosters from '../src/test/fixtures/rosters.json' with { type: 'json' };
import users from '../src/test/fixtures/users.json' with { type: 'json' };
import winnersBracket from '../src/test/fixtures/winnersBracket.json' with { type: 'json' };

/** The finished 2025 season the fixtures were captured from. */
export const FINISHED_LEAGUE_ID = league.league_id;
/** The 2026 season, served as pre-draft so the empty states can be tested. */
export const PRE_DRAFT_LEAGUE_ID = '1373305494734651392';
/** The 2024 season, which ends the chain. Taken from the fixture's own link. */
export const OLDEST_LEAGUE_ID = league.previous_league_id;
export const UNKNOWN_LEAGUE_ID = '12345';

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

const seasons: Record<string, LeagueResponse> = {
  [PRE_DRAFT_LEAGUE_ID]: {
    ...league,
    league_id: PRE_DRAFT_LEAGUE_ID,
    season: '2026',
    status: 'pre_draft',
    previous_league_id: FINISHED_LEAGUE_ID,
  },
  [FINISHED_LEAGUE_ID]: league,
  [OLDEST_LEAGUE_ID]: {
    ...league,
    league_id: OLDEST_LEAGUE_ID,
    season: '2024',
    previous_league_id: null,
  },
};

export async function mockSleeper(page: Page): Promise<void> {
  await page.route('https://api.sleeper.app/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/v1/state/nfl') {
      return json(route, { season: '2026', week: 1, display_week: 1, season_type: 'regular' });
    }

    const leagueMatch = /^\/v1\/league\/(\d+)(\/(.*))?$/.exec(path);
    if (!leagueMatch) return notFound(route);

    const [, id, , resource] = leagueMatch;
    const season = id ? seasons[id] : undefined;
    if (!season) return notFound(route);

    const isPreDraft = id === PRE_DRAFT_LEAGUE_ID;

    switch (resource) {
      case undefined:
        return json(route, season);
      case 'users':
        return json(route, users);
      case 'rosters':
        return json(route, rosters);
      case 'winners_bracket':
        return json(route, isPreDraft ? [] : winnersBracket);
      case 'losers_bracket':
        return json(route, isPreDraft ? [] : losersBracket);
      default: {
        // `case undefined` above already handled the bare league endpoint.
        const week = /^matchups\/(\d+)$/.exec(resource)?.[1];
        if (!week) return notFound(route);
        // An unplayed week is an empty array under HTTP 200, which is what a
        // pre-draft league returns for every week.
        const rows = (matchups as Record<string, unknown[]>)[week] ?? [];
        return json(route, isPreDraft ? [] : rows);
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
