# Adding an award

An award is a pure function from a season to a winner. Adding one means writing one file
and adding one line. Nothing in the view layer changes, and the Awards tab picks it up on
the next render.

## Write the definition

Create a file under `src/domain/awards/definitions/`. Say your league pays out for the most
points scored in a losing week.

```ts
// src/domain/awards/definitions/mostPointsInLoss.ts
import type { AwardDefinition } from '../types';

export const mostPointsInLoss: AwardDefinition = {
  id: 'most-points-in-loss',
  name: 'Hard Luck',
  description: 'Most points scored in a regular-season loss.',
  icon: '😤',
  scope: 'season',
  formatValue: (value) => `${value.toFixed(2)} pts`,

  compute: (season) => {
    let best: { rosterId: number; week: number; points: number } | null = null;

    for (const week of season.regularSeasonWeeks) {
      for (const team of week.teams) {
        if (team.outcome !== 'loss') continue;
        if (!best || team.points > best.points) {
          best = { rosterId: team.rosterId, week: week.week, points: team.points };
        }
      }
    }

    if (!best) return null;
    return { rosterId: best.rosterId, week: best.week, value: best.points };
  },
};
```

## Register it

```ts
// src/domain/awards/registry.ts
import { mostPointsInLoss } from './definitions/mostPointsInLoss';

export const AWARDS: readonly AwardDefinition[] = [
  regularSeasonChamp,
  highestTeamWeek,
  highestPlayerWeek,
  mostPointsInLoss, // <- here
  weeklyPunishment,
];
```

That is the whole change. The Awards tab renders season-scoped awards as cards in registry
order and week-scoped awards as their own section below.

## The rules

**`id` is permanent.** It shows up in URLs and stored state. Renaming a shipped award
breaks links.

**`compute` returns `null`, it never throws.** A season with no data yet is normal, not an
error. `resolveAwards` does catch a throw and reports the award as undecided so one bad
award can't take the page down, but relying on that is sloppy.

**Iterate `season.regularSeasonWeeks`, not `season.weeks`.** `regularSeasonWeeks` is already
filtered to played weeks 1 through `playoffWeekStart - 1`. Using `weeks` pulls playoff
scores into a regular-season award. If your award is _meant_ to cover the playoffs, use
`season.weeks` and filter on `week.phase === 'postseason'`.

**Never hardcode week 14.** It comes from the league's own `playoff_week_start`. A league
with a 16-week regular season should just work.

**`scope: 'weekly'` returns an array**, one winner per played week, each with its `week`
set. `scope: 'season'` returns a single winner.

## What `compute` receives

The `SeasonModel`, defined in `src/domain/types.ts`. The parts you'll reach for:

| Field                       | What it holds                                                                  |
| --------------------------- | ------------------------------------------------------------------------------ |
| `regularSeasonWeeks`        | Settled weeks 1..`regularSeasonEndWeek`, each with every team's result         |
| `liveWeek`                  | The week being played right now, or `null`                                     |
| `usesMedianScoring`         | True when records come from Sleeper rather than from matchups                  |
| `weeks`                     | Every week including the playoffs, with a `phase` of `regular` or `postseason` |
| `standings`                 | Ranked rows with wins, losses, points for and against, form, streak            |
| `teams` / `teamsByRosterId` | Team names, manager handles, avatars                                           |
| `winnersBracket.placements` | Final finishing order, `place: 1` is the champion                              |
| `regularSeasonEndWeek`      | `playoff_week_start - 1` for this league                                       |

A `TeamWeek` carries `points`, `outcome`, `opponentPoints`, and `starters`. Each starter has
a `playerId`, its `points`, and the lineup `slot`.

The second argument is an `AwardContext`, which currently holds one thing: `playerName(id)`,
for turning a Sleeper player id into a name. Set `playerId` on your winner and the card
renders the headshot too.

## Test it

Add a case to `src/domain/awards/definitions/definitions.test.ts`. The fixtures are real
responses from a finished 12-team season, so you can assert against actual numbers:

```ts
it('finds the biggest score in a loss', () => {
  const winner = one(mostPointsInLoss.compute(season, context));

  const losingScores = season.regularSeasonWeeks.flatMap((week) =>
    week.teams.filter((team) => team.outcome === 'loss').map((team) => team.points),
  );
  expect(winner.value).toBe(Math.max(...losingScores));
});
```

Then `make test`. The `src/domain/**` coverage threshold is 90%, so an untested award will
fail CI.
