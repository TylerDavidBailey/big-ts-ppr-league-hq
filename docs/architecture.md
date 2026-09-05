# About the architecture

Why this codebase is shaped the way it is, and which constraints drove each decision.

For endpoint facts, read [the Sleeper API reference](sleeper-api.md).

## One league, one config

The site serves one league. Its Sleeper id, the buy-in, every payout, the award names and
rules, and the punishment text live in `src/league.config.ts`. Nothing else in the repo
knows a dollar amount or an award name.

The config holds only the newest season's id. Every earlier season is found by walking
`previous_league_id` from there, so a new season costs one line: the new id.

## One pure function at the centre

`buildSeason()` in `src/domain/buildSeason.ts` takes raw Sleeper JSON and returns one
`SeasonModel`. Every award, every stat, and every tab reads that model. Nothing under
`src/domain/` imports React or calls `fetch`.

That boundary buys testability. `scripts/capture-fixtures.mjs` saved the real responses from
the league's finished 2025 season into `src/test/fixtures/`, and the tests assert against
actual numbers. `scripts/anonymize-fixtures.mjs` swaps the handles, user ids, avatars, and
league name for synthetic ones before anything is written, so the repo carries real scores
without carrying real people.

The browser tests in `e2e/` reuse the same fixtures through Playwright request
interception. A test can assert that the awards page shows `200.52 pts` and the name
Jahmyr Gibbs, and still pass during a Sleeper outage. `e2e/live.spec.ts` calls the real
API and is opt-in, so a change on Sleeper's side gets caught deliberately rather than by a
red build on an unrelated pull request.

## Three pure layers on top of the model

`src/domain/awards.ts` computes the four awards. Each is a ranked list, not a single
winner, so a card can show the places behind the winner. `rankPlaces` assigns competition
places, where two teams level for first are both 1 and the next is 3, and marks every tie.
An award decided by a strict comparison would hand the win to whichever roster the loop
reached first, and no league agreed to that.

`src/domain/stats.ts` derives power rankings, lineup efficiency, and season superlatives.
Power rankings use the all-play record: each week a team is scored against every other
team, and luck is the gap between the wins it has and the wins that scoring deserved.
Lineup efficiency divides Sleeper's `fpts` by its `ppts`, which is the optimal-lineup
total, so no lineup solver is needed.

`src/domain/history.ts` tallies across seasons. Each season is its own Sleeper league with
its own roster ids, so managers are matched by Sleeper user id, which is stable, and named
from the newest season they appear in. A season still in progress contributes its games so
far and nothing else: no title, no 1 seed, no season-total record.

## Managers come and go, and rename themselves

Each season is a separate Sleeper league, so roster numbers mean nothing across years.
`managerKey` in `src/domain/history.ts` identifies a manager by Sleeper user id, which
survives a handle change. A renamed manager keeps one all-time row under their current
handle, with the old handles listed as aliases, and a record holder shows the handle they
used that season.

A manager who left keeps their row, named from the last season they played. A manager who
joined for a season that has not started yet has no row until week 1 is final. A roster
with no owner is keyed by league and roster number, so two orphaned rosters from different
years never merge.

Three cases the API cannot resolve, so the site does not try:

- A roster's owner changes mid-season. Sleeper reports only the current owner, so the
  whole season is credited to whoever holds the roster when the page loads.
- A co-managed roster is credited to its primary owner, `owner_id`. If two people swap
  primary and co-owner between seasons, they become two rows.
- A season created without `previous_league_id` is not in the chain and does not appear.

All three stats layers read `season.regularSeasonWeeks`, which excludes the week being played. Sleeper
posts scores from Thursday night, and a half-played week would otherwise hand out a record
and a beer duty from a partial slate.

## Standings are computed, not read

Sleeper reports `wins`, `losses`, and `fpts` on each roster. The app computes standings
from matchup results instead, so "regular season" means weeks 1 through
`playoff_week_start - 1` for this league and stays correct mid-season.

The reported totals are kept on `Team.reported`. The tests check that computed wins,
losses, and points match them for all 12 rosters, and lineup efficiency reads `ppts` from
there.

## One query per season

`src/lib/sleeper/season.ts` fetches a season whole: users, rosters, both brackets, every
week, and the NFL clock, in parallel, then calls `buildSeason`. `src/lib/sleeper/queries.ts`
wraps that in one TanStack Query per league id.

One query per season means the season tabs and the all-time tabs share a cache entry. A
season opened once costs nothing on the all-time page. `staleTime` is `Infinity` for a
season whose `status` is `complete`, because a finished season never changes. The live
season is refetched every two minutes while the tab is open.

Two trims keep the request count down. A pre-draft league fetches only users and rosters,
because its weeks and brackets are known to be empty. Weeks are requested through the
championship week, which `lastWeekOfSeason` derives from `playoff_week_start` and
`playoff_teams`. A finished season costs 21 requests. The all-time page, with three played
seasons and one pre-draft, costs about 70, against Sleeper's guidance of 1000 a minute.

Nothing is persisted across refreshes. Every load reads fresh from Sleeper, which is the
point of the site.

## Player names come from a committed file

`GET /players/nfl` is 14.6 MB. Fetching it in the browser would be slow on a phone and
would ignore Sleeper's once-per-day guidance.

Instead, `scripts/build-player-index.mjs` slims it to `{id: [name, position, team]}` and
writes `public/data/players.min.json` at 420 KB. The file is committed. The
`refresh-players.yml` workflow regenerates it weekly and opens a pull request when it
changes.

If the index fails to load, `lookupPlayer` returns `Player {id}` and the rest of the page
works.

## Hash routing

`src/app/providers.tsx` uses `HashRouter`. GitHub Pages serves static files with no SPA
rewrite, so a path route would 404 on a cold load. A hash route needs no trick, and
`#/2025/standings` survives being pasted into a group chat.

`/` is the newest season, so the shared link never goes stale. A year reaches any season.
`all-time` reads them all.

## Base path

`vite.config.ts` reads `VITE_BASE`, which CI sets from the repository name. The dev server
runs at `/` so local URLs stay short. Builds and `vite preview` both use the sub-path, so
`make preview-up` catches a base-path mistake before deploy.

## Styling

`src/styles/theme.css` defines the palette in a Tailwind v4 `@theme` block. The raw values
come from Sleeper's own production stylesheet, so the app reads as an extension of their
UI. Semantic aliases sit on top of the raw palette. Change `--color-brand`, not a hex value.

Sleeper uses Inter for UI and Druk Condensed for display type. Druk is proprietary, so the
app pairs Inter with Oswald, the closest free match. Both are self-hosted through
`@fontsource`.

## Layout

```
src/
	league.config.ts  the league id, money, and rule text
	app/              providers, router, error boundary, query client
	components/       UI primitives and site chrome
	domain/           pure league logic. No React, no fetch
	features/         the page shell, the season tabs, the all-time tabs
	lib/              Sleeper client, one-query-per-season fetch, player index, formatting
	styles/           the theme
	test/             setup and captured fixtures
```

The rule that keeps this honest: `domain/` may not import from `features/`, `app/`, or
`components/`.
