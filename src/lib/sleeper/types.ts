/**
 * Types mirroring the Sleeper API wire format.
 *
 * These deliberately match what the API returns, warts and all: split
 * integer and decimal point fields, absent `metadata`, sparse bracket rows.
 * Massaging happens one layer up in `src/domain/buildSeason.ts`, never here.
 *
 * @see docs/sleeper-api.md
 */

export type LeagueStatus =
  'pre_draft' | 'drafting' | 'in_season' | 'complete' | (string & NonNullable<unknown>);

export interface SleeperLeagueSettings {
  /** First week of the playoffs. Regular season is weeks 1..playoff_week_start-1. */
  playoff_week_start?: number;
  playoff_teams?: number;
  num_teams?: number;
  /** 1 when every team also plays the league median each week. */
  league_average_match?: number;
  /** 2 when every playoff round runs over two weeks. */
  playoff_round_type?: number;
  leg?: number;
  start_week?: number;
  [key: string]: number | undefined;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  status: LeagueStatus;
  sport: string;
  avatar: string | null;
  total_rosters: number;
  roster_positions: string[];
  /** Prior season's league. `null` on the first season, which ends the chain. */
  previous_league_id: string | null;
  draft_id: string | null;
  settings: SleeperLeagueSettings;
  scoring_settings: Record<string, number>;
  metadata: Record<string, string> | null;
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
  /** Frequently absent. Team name lives at `metadata.team_name` when set. */
  metadata: Record<string, string> | null;
  is_owner?: boolean;
  is_bot?: boolean;
}

export interface SleeperRosterSettings {
  /** Absent on a roster that has not played a game yet. */
  wins?: number;
  losses?: number;
  ties?: number;
  /** Whole-number part of points for. Real value is `fpts + fpts_decimal / 100`. */
  fpts?: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  ppts?: number;
  ppts_decimal?: number;
  waiver_position?: number;
  total_moves?: number;
}

export interface SleeperRoster {
  roster_id: number;
  league_id: string;
  /** Null for an orphan team with no manager attached. */
  owner_id: string | null;
  co_owners: string[] | null;
  players: string[] | null;
  starters: string[] | null;
  reserve: string[] | null;
  settings: SleeperRosterSettings;
  metadata: Record<string, string> | null;
}

export interface SleeperMatchup {
  roster_id: number;
  /** Rosters sharing a matchup_id played each other. Null in some bye formats. */
  matchup_id: number | null;
  /** Null while a week is open and no stats have posted. */
  points: number | null;
  custom_points: number | null;
  starters: string[] | null;
  /** Index-aligned with `starters`. This is what the starter award reads. */
  starters_points: number[] | null;
  players: string[] | null;
  players_points: Record<string, number> | null;
}

/** Where a bracket slot's team comes from: the winner or loser of an earlier match. */
export interface SleeperBracketSource {
  w?: number;
  l?: number;
}

export interface SleeperBracketMatch {
  /** Round number, 1-indexed. */
  r: number;
  /** Match number within the whole bracket, 1-indexed. */
  m: number;
  /** Roster id, or null while the feeding match is undecided. */
  t1: number | null;
  t2: number | null;
  /** Winning / losing roster id. Null until the match is played. */
  w: number | null;
  l: number | null;
  t1_from?: SleeperBracketSource;
  t2_from?: SleeperBracketSource;
  /**
   * Placement game marker. `p: 1` decides 1st/2nd, `p: 3` decides 3rd/4th, and
   * so on. Absent on ordinary advancement matches.
   */
  p?: number;
}

export interface SleeperNflState {
  week: number;
  display_week: number;
  season: string;
  season_type: string;
  previous_season: string;
  league_season: string;
  season_start_date: string;
}

export interface SleeperUserSummary {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}
