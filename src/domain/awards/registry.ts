/**
 * The award registry.
 *
 * To add an award: write a new file under `definitions/`, export an
 * `AwardDefinition`, and add it to this array. Nothing else in the app needs to
 * change. The Awards tab renders whatever is registered here.
 *
 * @see docs/adding-an-award.md
 */
import { highestPlayerWeek } from './definitions/highestPlayerWeek';
import { highestTeamWeek } from './definitions/highestTeamWeek';
import { regularSeasonChamp } from './definitions/regularSeasonChamp';
import { weeklyPunishment } from './definitions/weeklyPunishment';
import type { AwardContext, AwardDefinition, ResolvedAward } from './types';
import type { SeasonModel } from '../types';

export const AWARDS: readonly AwardDefinition[] = [
  regularSeasonChamp,
  highestTeamWeek,
  highestPlayerWeek,
  weeklyPunishment,
];

export const seasonAwards = AWARDS.filter((award) => award.scope === 'season');
export const weeklyAwards = AWARDS.filter((award) => award.scope === 'weekly');

export const getAward = (id: string): AwardDefinition | undefined =>
  AWARDS.find((award) => award.id === id);

/**
 * Resolve every registered award against a season.
 *
 * A definition that throws is reported as undecided rather than taking the page
 * down with it. One bad award never breaks the others.
 */
export function resolveAwards(
  season: SeasonModel,
  context: AwardContext,
  definitions: readonly AwardDefinition[] = AWARDS,
): ResolvedAward[] {
  return definitions.map((definition) => {
    try {
      return { definition, result: definition.compute(season, context) };
    } catch (error) {
      console.error(`Award "${definition.id}" failed to compute`, error);
      return { definition, result: null };
    }
  });
}
