# Sleeper League HQ

Paste a Sleeper league ID, get the whole season. Standings, weekly scoreboards, the playoff
bracket, and your league's season awards. Works for any Sleeper fantasy football league,
any season back to the league's first, with no login and no account.

It runs entirely in the browser on GitHub Pages. There is no backend. Your league ID goes
to Sleeper's public API and nowhere else, and the list of leagues you have opened stays in
your own browser's storage.

## Try it

Open the site, paste a league ID, hit **Load league**.

Your league ID is the number in the Sleeper URL:

```
https://sleeper.com/leagues/1373305494734651392/team
                            ^^^^^^^^^^^^^^^^^^^
```

Pasting the whole URL works too. If you don't know the ID, type your Sleeper username
instead and pick from the list of leagues you're in.

Leagues you open are remembered on that device, so the next visit shows them as one-click
cards. Nothing is sent anywhere to make that work.

## What you get

**Awards.** The season's award winners, resolved from real scoring data. Ships with the
1 seed, the highest single-week team score, the highest single-week score by a _started_
player, and a weekly lowest-score callout. Adding your own is one file. See
[docs/adding-an-award.md](docs/adding-an-award.md).

**Standings.** Records, points for and against, current streak, and a form strip, computed
from played matchups rather than read off Sleeper's totals. That keeps the regular season
tied to your league's own `playoff_week_start` instead of a hardcoded week 14.

**Scoreboard.** Every matchup week by week, with that week's lowest scorer and top starter
pulled out.

**Playoffs.** The winners and consolation brackets, with final placings read from Sleeper's
placement games.

**History.** Every prior season of the league, found by following Sleeper's
`previous_league_id` chain. Each season links to its own page.

## Run it locally

You need Node 22 or newer. Nothing else. No Docker, no database, no API key.

```bash
make up          # start the dev server in the background
make open        # open it in a browser
make down        # stop it
```

`make` on its own lists every target. The ones worth knowing:

| Target                  | What it does                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `make dev`              | Dev server in the foreground, Ctrl-C to stop                                          |
| `make up` / `make down` | Same server in the background, with `make logs` and `make status`                     |
| `make check`            | Lint, format check, typecheck, unit tests, build, browser tests. Exactly what CI runs |
| `make check-fast`       | The same, without the browser tests                                                   |
| `make fix`              | Auto-fix lint findings and reformat                                                   |
| `make e2e`              | Browser tests in Chromium against mocked Sleeper responses                            |
| `make e2e-live`         | Browser tests against the real Sleeper API                                            |
| `make preview-up`       | Build and serve `dist/` under the real GitHub Pages sub-path                          |
| `make players`          | Refresh the NFL player name index from Sleeper                                        |

`make up` is idempotent, and `make down` also sweeps anything left holding the port after a
crash.

## Deploy your own

Fork the repo, then in **Settings → Pages** set the source to **GitHub Actions**. Push to
`main` and the deploy workflow publishes to
`https://<your-username>.github.io/<your-repo-name>/`.

The base path comes from the repository name at build time, so a fork under any name works
without editing a config file. The rest of the settings worth turning on are in
[docs/repo-settings.md](docs/repo-settings.md), each with the `gh` command to apply it.

## How it works

The app is a single pure function with views hung off it. `buildSeason()` turns raw Sleeper
JSON into one `SeasonModel`, and standings, brackets, and every award read that model and
nothing else. No component fetches. No award touches the network.

That split is what makes the league logic testable: the unit tests run against real API
responses captured from a finished 12-team season, offline, and check the computed
standings against the wins, losses, and points Sleeper itself reports.

Two details worth knowing before you touch the data layer:

- Sleeper's `/players/nfl` endpoint is 14.6 MB and Sleeper asks that you call it at most
  once a day. The browser never touches it. A weekly GitHub Action slims it to a 420 KB
  name index and opens a PR when it changes.
- An unplayed week comes back as `[]` under HTTP 200, while a league that doesn't exist
  comes back as `null` under HTTP 404. Conflating those two is the easiest way to break
  this app.

[docs/architecture.md](docs/architecture.md) has the full picture.
[docs/sleeper-api.md](docs/sleeper-api.md) records every endpoint behaviour verified
against the live API, so nobody has to rediscover them.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). The short version: `make check` before you push.

## License

MIT. See [LICENSE](LICENSE).

Built on Sleeper's public read-only API. Not affiliated with or endorsed by Sleeper.
