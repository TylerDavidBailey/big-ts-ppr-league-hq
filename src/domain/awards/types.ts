/**
 * The award contract.
 *
 * An award is a pure function from a `SeasonModel` to a winner (or one winner
 * per week). Adding a new award means adding one file under `definitions/` and
 * one entry in `registry.ts`. No view code changes.
 *
 * @see docs/adding-an-award.md
 */
import type { SeasonModel } from '../types';

export interface AwardWinner {
  rosterId: number;
  /** Set for week-scoped awards and for season awards earned in one week. */
  week?: number;
  /** The number that won it: points, a count, a margin. */
  value: number;
  /** Extra context, e.g. the player who posted the score. */
  detail?: string;
  /** Player id when the award is about a specific player, for the headshot. */
  playerId?: string;
}

export type AwardScope =
  /** One winner for the whole season. */
  | 'season'
  /** One winner per played week. */
  | 'weekly';

export interface AwardContext {
  /** Resolves a Sleeper player id to a display name. */
  playerName: (playerId: string) => string;
}

export interface AwardDefinition {
  /** Stable id, used in URLs and storage. Never rename a shipped one. */
  id: string;
  name: string;
  /** One line explaining the rule, shown under the award. */
  description: string;
  /** Emoji, matching Sleeper's tone. */
  icon: string;
  scope: AwardScope;
  /** How to phrase the winning value, e.g. `(v) => `${v} pts``. */
  formatValue: (value: number) => string;
  /**
   * Compute the winner(s). Must never throw: return `null` when the season has
   * no data to decide it yet.
   */
  compute: (season: SeasonModel, context: AwardContext) => AwardWinner | AwardWinner[] | null;
}

/** An award paired with its resolved result for one season. */
export interface ResolvedAward {
  definition: AwardDefinition;
  /** Null when the season cannot decide this award yet. */
  result: AwardWinner | AwardWinner[] | null;
}
