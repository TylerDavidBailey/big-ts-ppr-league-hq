# About the architecture

Why this codebase is shaped the way it is, and which constraints drove each decision.

For endpoint facts, read [the Sleeper API reference](sleeper-api.md). For the steps to add
an award, read [Adding an award](adding-an-award.md).

## One pure function at the centre

`buildSeason()` in `src/domain/buildSeason.ts` takes raw Sleeper JSON and returns one
`SeasonModel`. Standings, brackets, awards, and every tab read that model. Nothing below
`src/lib/sleeper/queries.ts` imports React or calls `fetch`.

That boundary buys two things.

The league logic is testable without a network or a browser. `scripts/capture-fixtures.mjs`
saved the real responses from a finished 12-team season into `src/test/fixtures/`, and the
tests assert against actual numbers. `scripts/anonymize-fixtures.mjs` swaps the handles,
user ids, avatars, and league name for synthetic ones before anything is written, so the
repo carries real scores without carrying real people. `src/domain/standings.test.ts` checks that computed
wins, losses, and points match what Sleeper itself reports for all 12 rosters, and that the
computed form strip matches the `metadata.record` string character for character. A
mistake in the pairing logic fails that test immediately.

The second gain is that awards stay trivial. An award is a loop over
`season.regularSeasonWeeks` and nothing more, because the model has already resolved
opponents, outcomes, and lineup slots.

The browser tests in `e2e/` reuse the same fixtures through Playwright request
interception. A test can assert that the Awards tab shows `200.52 pts` and the name
Jahmyr Gibbs, and still pass during a Sleeper outage. `e2e/live.spec.ts` calls the real
API and is opt-in, so a change on Sleeper's side gets caught deliberately rather than by
a red build on an unrelated pull request.

## Standings are computed, not read

Sleeper reports `wins`, `losses`, and `fpts` on each roster. The app ignores those for
ranking and computes standings from matchup results instead.

The reason is that "regular season" has to mean weeks 1 through
`playoff_week_start - 1` for the league being viewed. A league with a 16-week regular
season must work without a code change. Roster totals can also include consolation games,
depending on league settings.

Sleeper's reported totals are kept on `Team.reported` and used as a cross-check in the
tests, not as a source of truth for ranking.

## Awards are a registry of pure functions

`src/domain/awards/registry.ts` exports an array. Each entry is an `AwardDefinition` with a
`compute` function from `SeasonModel` to a winner. The Awards tab renders whatever is in
the array.

The stated goal for this project was that adding a season award later should be easy. A
registry delivers that: one new file under `definitions/`, one line in the array, and no
view code changes.

`resolveAwards` wraps each `compute` in a try/catch and reports a thrown award as
undecided. One broken award never blanks the page.

Four awards ship: `regular-season-champ`, `highest-team-week`, `highest-player-week`, and
`weekly-punishment`. They match the reference league's rules.

## No dollar amounts

The app shows placements and award winners. It never shows money.

Payout structures are private to a league and vary between them, and the site is meant to
be shareable with strangers. Rendering one league's numbers to everyone would be wrong.

## Fetching

`src/lib/sleeper/queries.ts` gives each endpoint its own TanStack Query hook. A season page
runs six single queries and one `useQueries` over every week.

Per-endpoint queries let the page render as soon as the league, users, and rosters land,
while week data streams in behind a progress line. Switching seasons reuses whatever is
already cached.

`staleTime` is `Infinity` for a league whose `status` is `complete`, because a finished
season never changes. Live leagues get five minutes.

The app requests every week from 1 through `playoffWeekStart + 3`, capped at 18. Unplayed
weeks cost one cheap `[]` response each, which is simpler than tracking the current week and
costs about 23 requests per season against a 1000-per-minute budget.

## Player names come from a committed file

`GET /players/nfl` is 14.6 MB. Fetching it in the browser would be slow on a phone and
would ignore Sleeper's once-per-day guidance.

Instead, `scripts/build-player-index.mjs` slims it to `{id: [name, position, team]}` and
writes `public/data/players.min.json` at 420 KB. The file is committed. The
`refresh-players.yml` workflow regenerates it weekly and opens a pull request when it
changes.

All 12,226 players are kept, including retired ones, because historical seasons reference
players who have left the league.

If the index fails to load, `lookupPlayer` returns `Player {id}` and the rest of the page
works. A CDN hiccup degrades one label, not the app.

## Hash routing

`src/app/providers.tsx` uses `HashRouter`.

GitHub Pages serves static files with no SPA rewrite. A path route such as
`/l/123/awards` would 404 on a cold load unless the build copies `index.html` to
`404.html`. A hash route needs no such trick, and a link like
`#/l/1252998165817208832/2025/awards` survives being pasted into a group chat.

## Base path

`vite.config.ts` reads `VITE_BASE`, which CI sets from the repository name. A fork under any
name deploys correctly without editing the file.

The dev server runs at `/` so local URLs stay short. Builds and `vite preview` both use the
sub-path, so `make preview-up` catches a base-path mistake before deploy. Anything that
needs the prefix reads `import.meta.env.BASE_URL`.

## Storage

`src/lib/storage.ts` keeps recently opened leagues in `localStorage` under
`slhq:v1:recent-leagues`, capped at 8 and ordered most recent first.

Every read is validated with a zod schema. A corrupt blob or a schema change between
releases returns an empty list rather than throwing on the landing page. The key carries a
version segment so a future format can change without colliding.

Storage access itself is wrapped in try/catch. Private browsing and blocked site data both
throw on access in some browsers, and losing the recent list is not worth an error message.

Node 26 defines a native `localStorage` global that stays disabled without
`--localstorage-file`, and it masks the one jsdom provides. `src/test/localStorageShim.ts`
installs a working in-memory `Storage` for tests. Browsers are unaffected.

## Styling

`src/styles/theme.css` defines the palette in a Tailwind v4 `@theme` block. The raw values
come from Sleeper's own production stylesheet, so the app reads as an extension of their
UI: `#05091d` for the page, `#252942` for cards, `#00fff9` for the brand accent.

Semantic aliases sit on top of the raw palette. Change `--color-brand`, not a hex value.

Sleeper uses Inter for UI and Druk Condensed for display type. Druk is proprietary, so the
app pairs Inter with Oswald, the closest free match, for scores and section headers. Both
are self-hosted through `@fontsource`, so the page makes no third-party font request.

## Layout

```
src/
	app/          providers, router, error boundary, query client
	components/   UI primitives and site chrome
	domain/       pure league logic. No React, no fetch
		awards/     the registry and one file per award
	features/     landing page and season page with its tabs
	lib/          Sleeper client, storage, player index, formatting
	styles/       the theme
	test/         setup, the localStorage shim, captured fixtures
```

The rule that keeps this honest: `domain/` may not import from `features/`, `app/`, or
`components/`.
