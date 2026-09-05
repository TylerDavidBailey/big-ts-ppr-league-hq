# Sleeper API reference

Facts about `https://api.sleeper.app/v1` verified against the live API. Read this before
you add an endpoint, so you do not rediscover the same behaviour.

The official docs are at [docs.sleeper.com](https://docs.sleeper.com/). This page records
what the API does that the docs do not say.

## Access

The API is public and read-only. It needs no key and no account.

Every response carries `access-control-allow-origin: *`, so the browser calls it directly.
The app has no backend and no proxy.

Sleeper asks callers to stay under 1000 requests per minute. One finished season costs 21
requests, a pre-draft season costs 2, and the chain walk costs one per season.

## Endpoints the app uses

| Endpoint                           | Returns                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `GET /state/nfl`                   | `week`, `display_week`, `season`, `season_type`           |
| `GET /league/{id}`                 | One league, including `settings` and `previous_league_id` |
| `GET /league/{id}/users`           | Managers in the league                                    |
| `GET /league/{id}/rosters`         | Rosters with season totals                                |
| `GET /league/{id}/matchups/{week}` | One week of scores for every roster                       |
| `GET /league/{id}/winners_bracket` | Championship bracket                                      |
| `GET /league/{id}/losers_bracket`  | Consolation bracket                                       |

`src/lib/sleeper/endpoints.ts` wraps each one.

## Behaviour that is easy to get wrong

### An unplayed week returns `[]` under HTTP 200

`GET /league/{id}/matchups/{week}` answers with an empty array for a week that has not been
played. A league that does not exist answers with the body `null` under HTTP 404.

Treat those as different states. `buildSeason` reads `[]` as "not played" and renders an
empty state. It reads a 404 as "no such league" and shows an error.

Because unplayed weeks are cheap and self-identifying, the app requests every week of the
season up front. It does not need to know the current week first.

### Points arrive split into two integers

`SleeperRosterSettings` reports `fpts: 1805` and `fpts_decimal: 78`. The real value is
`1805.78`.

Compute it as `fpts + fpts_decimal / 100`. The same split applies to `fpts_against` and
`ppts`. `src/domain/buildSeason.ts` does this in one helper.

### `starters_points` is index-aligned to `starters`

In a matchup row, `starters` holds player ids in lineup order and `starters_points` holds
their scores at the same indexes. Position `n` in one matches position `n` in the other.

`players_points` covers the whole roster, bench included. A per-starter award must read
`starters_points` and never `players_points`. Bench points are `players_points` for every
id in `players` that is not in `starters`.

Sleeper pads empty lineup slots with the player id `"0"`. Drop those.

### `fpts` and `ppts` are regular-season totals

Roster `settings.fpts` covers weeks 1 through `playoff_week_start - 1` and nothing after.
Verified on the reference league: the reported 1805.78 equals the sum of weeks 1 to 14,
while the sum of all 17 played weeks is 2239.98.

`ppts` is the total a perfect lineup would have scored over the same weeks. Lineup
efficiency is `fpts / ppts` with no lineup solver.

### The regular season ends at `playoff_week_start - 1`

`settings.playoff_week_start` is 15 in the reference league, so the regular season is weeks
1 through 14. Never hardcode 14. A league with a longer season sets a higher value.

### The bracket's `p` field decides final placings

A bracket row with a `p` field is a placement game. The winner of `p: 1` finishes first and
its loser finishes second. The winner of `p: 3` finishes third and its loser fourth.

Rows without a `p` field are ordinary advancement matches and decide no placing.

`w` and `l` are `null` until the match is played, so an unfinished placement game yields no
placing. `src/domain/bracket.ts` implements this.

### A bracket 404s before the playoffs start

Sleeper returns 404 for both bracket endpoints on a league that never reached the
postseason. That is an expected state. `getWinnersBracket` and `getLosersBracket` return an
empty array instead of raising.

### `metadata.team_name` is often absent

Many managers never set a team name. When `metadata.team_name` is missing, fall back to the
user's `display_name`, which is what Sleeper's own UI shows.

`metadata` itself can be `null`.

### Seasons chain backwards through `previous_league_id`

Each season is a separate league with its own id. `previous_league_id` points at the prior
season and is `null` on the first one.

The league chains 2026 to 2025 to 2024 to 2023. `getLeagueChain` starts from the
already-fetched newest season and walks back with a visited set and a 60-season cycle
guard, so bad data cannot loop forever.

There is no forward link. To find the season that replaced a finished league, list a
manager's leagues for the next year with `GET /user/{userId}/leagues/nfl/{season}` and
pick the one whose `previous_league_id` matches. `resolveHead` in `src/lib/sleeper/head.ts`
does this, commissioner first, and a deleted account answers 404 there.

### `/players/nfl` is 14.6 MB

The full player payload is 14.6 MB of JSON for 12,226 players, 2.6 MB gzipped. Sleeper asks
that you call it at most once per day.

The browser never calls it. `scripts/build-player-index.mjs` slims it to
`{id: [name, position, team]}` at 420 KB and commits the result. The
`refresh-players.yml` workflow regenerates it weekly.

Team defenses use a team abbreviation as the player id, such as `"SF"`. A defense has
`first_name` and `last_name` but no `full_name`. Build the name as
`full_name || `${first_name} ${last_name}``. With that fallback, all 12,226 players resolve
to a name.

## CDN assets

| Asset                 | URL                                                                   |
| --------------------- | --------------------------------------------------------------------- |
| League or user avatar | `https://sleepercdn.com/avatars/thumbs/{avatarId}`                    |
| Player headshot       | `https://sleepercdn.com/content/nfl/players/thumb/{playerId}.jpg`     |
| Team logo             | `https://sleepercdn.com/images/team_logos/nfl/{team}.png` (lowercase) |

`src/lib/sleeper/assets.ts` builds these. Defenses have no headshot, so `playerImageUrl`
returns the team logo for them.

## Error codes

| Code | Meaning           | How the client responds          |
| ---- | ----------------- | -------------------------------- |
| 404  | No such resource  | Raises `NotFoundError`. No retry |
| 429  | Rate limited      | Retries with exponential backoff |
| 5xx  | Sleeper is unwell | Retries with exponential backoff |

`src/lib/sleeper/client.ts` retries up to three times, starting at 400 ms and doubling.
