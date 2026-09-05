/**
 * The league's four awards, computed from one `SeasonModel`.
 *
 * Every award is a ranked list rather than a single winner, so a card can show
 * runner-ups, and so a tie is never broken by whichever roster id a loop
 * reached first. Money and wording live in `src/league.config.ts`; this file
 * only knows who finished where.
 *
 * Everything reads `season.regularSeasonWeeks`, which already excludes the
 * week being played, so a live Sunday never decides anything.
 */
import { isLevel } from './standings';
import type { Placement, SeasonModel } from './types';

export interface RankedEntry {
  /** Competition ranking: two teams level for first are both 1, the next is 3. */
  place: number;
  rosterId: number;
  /** The number that earned the place: points, a total, a count. */
  value: number;
  /** Set when the place was earned in a single week. */
  week?: number;
  /** Set when the place belongs to a specific started player. */
  playerId?: string;
  playerName?: string;
  /** Extra context, such as a record. */
  detail?: string;
  /** True when another entry shares this place. */
  tied: boolean;
}

export type Candidate = Omit<RankedEntry, 'place' | 'tied'>;

export interface AwardContext {
  /** Resolves a Sleeper player id to a display name. */
  playerName: (playerId: string) => string;
}

export interface SeasonAwards {
  /** Places 1 to 3 from the playoff bracket, in order. Empty until decided. */
  podium: Placement[];
  regularSeasonChamp: RankedEntry[];
  highestTeamWeek: RankedEntry[];
  highestStarterWeek: RankedEntry[];
  /** One entry per settled regular-season week, plus one more per tie. */
  beerDuty: RankedEntry[];
}

/**
 * Sort candidates and assign competition places, keeping every entry within
 * the first `places` places.
 *
 * Equal values share a place and each is marked `tied`, so a card can say so
 * instead of presenting a coin flip as a result.
 */
export function rankPlaces(
  candidates: readonly Candidate[],
  places: number,
  direction: 'desc' | 'asc' = 'desc',
): RankedEntry[] {
  const sorted = [...candidates].sort((a, b) =>
    direction === 'desc' ? b.value - a.value : a.value - b.value,
  );

  const ranked: RankedEntry[] = [];
  let place = 0;
  for (const [index, candidate] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous?.value !== candidate.value) place = index + 1;
    if (place > places) break;
    ranked.push({ ...candidate, place, tied: false });
  }

  return ranked.map((entry) => ({
    ...entry,
    tied: ranked.some((other) => other !== entry && other.place === entry.place),
  }));
}

/**
 * The regular-season standings as places.
 *
 * Standings are already ordered by record then points, so this reads the rank
 * rather than re-sorting by one number. A row marked `tied` is level with
 * another on both, and they share the earlier place.
 */
export function rankStandings(season: SeasonModel, places: number): RankedEntry[] {
  if (!season.hasScores) return [];

  const rows = season.standings;
  const ranked: RankedEntry[] = [];

  for (const row of rows) {
    const first = row.tied ? rows.find((other) => isLevel(other, row)) : undefined;
    const place = first?.rank ?? row.rank;
    if (place > places) break;

    ranked.push({
      place,
      rosterId: row.rosterId,
      value: row.pointsFor,
      detail: `${row.wins}-${row.losses}${row.ties > 0 ? `-${row.ties}` : ''}`,
      tied: row.tied,
    });
  }

  return ranked;
}

/** Every team-week of the settled regular season, best first. */
export function rankTeamWeeks(season: SeasonModel, places: number): RankedEntry[] {
  const candidates = season.regularSeasonWeeks.flatMap((week) =>
    week.teams.map((team): Candidate => ({
      rosterId: team.rosterId,
      week: week.week,
      value: team.points,
    })),
  );
  return rankPlaces(candidates, places);
}

/**
 * Every started player-week of the settled regular season, best first.
 *
 * Reads `starters` only, so a monster week on someone's bench does not count.
 * Two managers can start the same player, in which case both are listed.
 */
export function rankStarterWeeks(
  season: SeasonModel,
  places: number,
  playerName: AwardContext['playerName'],
): RankedEntry[] {
  const candidates = season.regularSeasonWeeks.flatMap((week) =>
    week.teams.flatMap((team) =>
      team.starters.map((starter): Candidate => ({
        rosterId: team.rosterId,
        week: week.week,
        value: starter.points,
        playerId: starter.playerId,
        playerName: playerName(starter.playerId),
      })),
    ),
  );
  return rankPlaces(candidates, places);
}

/**
 * The lowest scorer of each settled regular-season week.
 *
 * A tie for lowest names everyone who tied; the alternative is letting the
 * roster with the higher id off on a technicality.
 */
export function weeklyLowScorers(season: SeasonModel): RankedEntry[] {
  return season.regularSeasonWeeks.flatMap((week) => {
    const candidates = week.teams.map((team): Candidate => ({
      rosterId: team.rosterId,
      week: week.week,
      value: team.points,
    }));
    return rankPlaces(candidates, 1, 'asc');
  });
}

/** Places 1 to 3, read from the bracket's placement games. */
export const podium = (season: SeasonModel): Placement[] =>
  season.winnersBracket.placements.filter((placement) => placement.place <= 3);

/**
 * Resolve every award for a season.
 *
 * Never throws. A season with no scores yields empty lists, and a failure in
 * one award is logged and reported as undecided rather than taking the others
 * down with it.
 */
export function computeSeasonAwards(
  season: SeasonModel,
  context: AwardContext,
  places: number,
): SeasonAwards {
  const safely = <T>(name: string, compute: () => T[]): T[] => {
    try {
      return compute();
    } catch (error) {
      console.error(`Award "${name}" failed to compute`, error);
      return [];
    }
  };

  return {
    podium: safely('podium', () => podium(season)),
    regularSeasonChamp: safely('regularSeasonChamp', () => rankStandings(season, places)),
    highestTeamWeek: safely('highestTeamWeek', () => rankTeamWeeks(season, places)),
    highestStarterWeek: safely('highestStarterWeek', () =>
      rankStarterWeeks(season, places, context.playerName),
    ),
    beerDuty: safely('beerDuty', () => weeklyLowScorers(season)),
  };
}
