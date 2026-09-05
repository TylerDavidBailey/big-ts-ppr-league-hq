# Contributing

Thanks for taking a look. This is a small project, so the process is short.

## Set up

You need Node 22 or newer. Check `.nvmrc` for the exact version.

```bash
git clone https://github.com/TylerDavidBailey/sleeper-league-hq.git
cd sleeper-league-hq
make up
```

`make up` installs dependencies and starts the dev server at `http://localhost:5173/`. Run
`make` on its own to see every target.

## Before you push

```bash
make check
```

That runs lint, the formatting check, the typecheck, the tests, and a production build, in
the order CI runs them. If `make check` passes, CI passes.

To fix the mechanical failures automatically:

```bash
make fix
```

## Add an award

Read [Adding an award](docs/adding-an-award.md). It is one new file and one line in
`src/domain/awards/registry.ts`.

## Where code goes

| Directory            | Contents                                                   |
| -------------------- | ---------------------------------------------------------- |
| `src/domain/`        | League logic. Pure functions only, no React and no `fetch` |
| `src/lib/sleeper/`   | The API client, endpoint wrappers, and query hooks         |
| `src/lib/`           | Storage, the player index, formatting helpers              |
| `src/features/`      | The landing page and the season page with its tabs         |
| `src/components/ui/` | Reusable primitives with no league knowledge               |

One rule matters more than the rest: `src/domain/` must not import from `features/`,
`app/`, or `components/`. That boundary is what keeps the league logic testable without a
browser. Read [About the architecture](docs/architecture.md) for the reasoning.

## Tests

Unit tests live next to the code as `*.test.ts`. Run them with `make test`, or `make watch`
while you work.

Fixtures in `src/test/fixtures/` are real Sleeper responses captured from a finished
12-team season. Assert against real numbers rather than inventing them. To re-capture:

```bash
make fixtures
```

`src/domain/**` has a 90% coverage threshold, so new league logic needs a test.

## Browser tests

`e2e/app.spec.ts` drives the real app in Chromium. It intercepts every
`api.sleeper.app` request and answers from the same captured fixtures, so it is
deterministic and runs on every pull request.

```bash
make e2e       # run them
make e2e-ui    # run them in Playwright's interactive UI
```

`make browsers` downloads Chromium the first time, and `make e2e` does it for you.

`e2e/live.spec.ts` calls the real Sleeper API. It is tagged `@live` and skipped by
default, because a Sleeper outage must not fail a build. Run it by hand after
changing anything under `src/lib/sleeper/`:

```bash
make e2e-live
```

That is the check that catches a change on Sleeper's side which the captured fixtures
would hide.

`make check` runs the unit tests and the mocked browser tests. Use `make check-fast` to
skip the browser tests while iterating.

## Working with the API

Read [the Sleeper API reference](docs/sleeper-api.md) before adding an endpoint. It records
the behaviour that is easy to get wrong, such as an unplayed week returning `[]` under HTTP
200 while a missing league returns `null` under HTTP 404.

Do not add a call to `GET /players/nfl` from the browser. It is 14.6 MB. Player names come
from `public/data/players.min.json`, which CI regenerates weekly.

## Commits and branches

Branches are `<type>/<description>`, where type is `feat`, `fix`, `chore`, or `docs`, and
the description is lowercase words joined by hyphens.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`<type>(<scope>): <description>`. A breaking change adds `!` before the colon.

```
feat(awards): add most points in a loss
fix(standings): count ties as half a win when ranking
docs(api): record the empty-week response
```

## Pull requests

Fill in the template. Say which league ID and season you checked against, because a UI
change that works on a finished season can still break a pre-draft one.

Three cases worth testing by hand:

- A finished season, for example league `1252998165817208832` (2025).
- A pre-draft league with no scores, for example `1373305494734651392` (2026).
- A league ID that does not exist, such as `12345`, which should show "League not found".

## Reporting a bug

Open an issue with the league ID and season. League data is public, so the ID is enough for
anyone to reproduce what you saw.
