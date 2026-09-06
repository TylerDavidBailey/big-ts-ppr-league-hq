# Big-T's PPR League HQ

**[Open the site](https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/)**

[![CI](https://github.com/TylerDavidBailey/big-ts-ppr-league-hq/actions/workflows/ci.yml/badge.svg)](https://github.com/TylerDavidBailey/big-ts-ppr-league-hq/actions/workflows/ci.yml)
[![Deploy](https://github.com/TylerDavidBailey/big-ts-ppr-league-hq/actions/workflows/deploy.yml/badge.svg)](https://github.com/TylerDavidBailey/big-ts-ppr-league-hq/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

The league's home page. Who is winning money, who is on beer duty this week, and every
season back to 2023, read live from Sleeper each time you open the link.

It runs entirely in the browser on GitHub Pages. There is no backend, no login, and nothing
is stored. The page calls Sleeper's public API directly.

## What is on it

The year pills in the top bar pick a season. The newest season is also the home page, so
the link you share never goes stale. Each season has six sections.

**Overview.** During the season, the latest beer duty sits at the top. Then the podium once
the playoffs begin, each paid award's current leader with its payout, who has drawn beer
duty most often, and the teams in a playoff spot. Before the draft it shows the rules, the
payouts, and everyone in the league.

**Awards.** The playoff podium with the money, and the three paid awards, each with its
payout, its rule, and the five places behind the winner.

**Beer duty.** The lowest scorer of every week, newest first, and a running tally of who
owes the most beers.

**Standings.** Records, points for and against, streak, and form, with the playoff line
drawn through the table. Below that, power rankings from the all-play record and a luck
score.

**Stats.** Season superlatives: biggest blowout, closest game, longest streaks, weekly top
scores, and consistency. Then lineup efficiency against Sleeper's max-possible points.

**Rules.** The buy-in, the pot, every payout, the wording of each award, and the season
format read from Sleeper's settings.

**All-time** has three sections: career standings for every manager across seasons, with
titles, 1 seeds, and beer duties; the champions of every season and a title count; and a
record book of single-season and single-week records.

Every view has its own link:

```
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025/awards
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025/beer-duty
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025/standings
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025/stats
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/2025/rules
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/all-time
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/all-time/champions
https://tylerdavidbailey.github.io/big-ts-ppr-league-hq/#/all-time/records
```

## Change the rules or the money

Everything Sleeper does not know lives in one file: [src/league.config.ts](src/league.config.ts).
The league id, the buy-in, each payout, the award names and rules, and the punishment
text. Edit it, push to `main`, and the site redeploys.

A new season needs no edit. Sleeper creates a new league id each year, and the site finds
it by asking a manager for their leagues the following year. `leagueId` can be any season
of the league; earlier seasons are found by walking `previous_league_id` back from it.

## Run it locally

You need Node 22 or newer. Nothing else.

```bash
make up          # start the dev server in the background
make open        # open it in a browser
make down        # stop it
```

`make` on its own lists every target. `make check` runs exactly what CI runs. `make shots`
screenshots every page state on a desktop and a phone into `screenshots/`.

## How it works

`buildSeason()` turns raw Sleeper JSON into one `SeasonModel`. Awards, stats, and the
all-time tallies are pure functions over that model, tested against real responses captured
from a finished season. [docs/architecture.md](docs/architecture.md) explains the shape.
[docs/sleeper-api.md](docs/sleeper-api.md) records what the API does that its docs do not
say.

## License

MIT. See [LICENSE](LICENSE).

Built on Sleeper's public read-only API. Not affiliated with or endorsed by Sleeper.
