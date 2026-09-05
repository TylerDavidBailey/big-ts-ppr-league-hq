/**
 * The season model: one normalised, view-ready shape derived from raw Sleeper
 * responses. Standings, brackets, awards, and every tab read this model and
 * nothing else.
 */
import type { LeagueStatus, SleeperBracketMatch } from '@/lib/sleeper/types';

/** A manager and their roster, independent of any particular week. */
export interface Team {
  rosterId: number;
  /** Display name for the team: `metadata.team_name` when set, else the manager's handle. */
  name: string;
  /** The human behind the roster. Co-managers are joined with an ampersand. */
  managerName: string;
  userId: string | null;
  /** Display names of any co-managers, excluding the primary owner. */
  coManagerNames: string[];
  avatarId: string | null;
  /**
   * Sleeper's own regular-season totals.
   *
   * Verified against the live API: `fpts` and `ppts` cover weeks 1 through
   * `playoff_week_start - 1` only, so they line up with computed standings.
   */
  reported: {
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
    /** The most a perfect lineup could have scored, from Sleeper's `ppts`. */
    maxPointsFor: number;
  };
}

/** One rostered player's score in one week. */
export interface PlayerScore {
  playerId: string;
  points: number;
}

/** One starting-lineup slot in one week. */
export interface StarterScore extends PlayerScore {
  /** Lineup slot index, so `roster_positions` can label it. */
  slot: number;
}

/** A single team's result in a single week. */
export interface TeamWeek {
  rosterId: number;
  week: number;
  points: number;
  /** Null when the week has no opponent (bye, or an odd-sized consolation round). */
  opponentRosterId: number | null;
  opponentPoints: number | null;
  outcome: 'win' | 'loss' | 'tie' | 'none';
  starters: StarterScore[];
  /** Every rostered player who did not start, from `players_points`. */
  bench: PlayerScore[];
}

/** Every team's result for one week, plus what kind of week it was. */
export interface Week {
  week: number;
  phase: 'regular' | 'postseason';
  /** False when Sleeper returned no matchup rows: the week has not been played. */
  played: boolean;
  /**
   * True while the week is still being played.
   *
   * Scores are real but incomplete, so the week decides no record and no award.
   * Show it, label it, but do not settle anything on it.
   */
  provisional: boolean;
  teams: TeamWeek[];
}

export interface StandingsRow {
  rosterId: number;
  rank: number;
  /**
   * True when this team is level with another on both record and points scored.
   *
   * The order between tied teams is then arbitrary, and the UI says so rather
   * than presenting a coin flip as a ranking.
   */
  tied: boolean;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Per-week outcomes in order, for the form strip. */
  form: ('win' | 'loss' | 'tie')[];
  /** Current run, e.g. `{ kind: 'win', length: 3 }`. Null before any game. */
  streak: { kind: 'win' | 'loss' | 'tie'; length: number } | null;
}

export interface Placement {
  /** 1 = champion, 2 = runner-up, and so on. */
  place: number;
  rosterId: number;
}

export interface Bracket {
  matches: SleeperBracketMatch[];
  /** Resolved finishing order, derived from the bracket's placement games. */
  placements: Placement[];
}

export interface SeasonModel {
  leagueId: string;
  leagueName: string;
  season: string;
  status: LeagueStatus;
  avatarId: string | null;
  previousLeagueId: string | null;

  teams: Team[];
  teamsByRosterId: ReadonlyMap<number, Team>;

  /** Last week of the regular season, i.e. `playoff_week_start - 1`. */
  regularSeasonEndWeek: number;
  playoffWeekStart: number;
  /**
   * Championship week, derived from the bracket size and the round length.
   *
   * Read from the league's settings, so a season with no games played yet still
   * reports the span its playoffs will run. Equals `playoffWeekStart` when the
   * bracket size is unknown.
   */
  playoffEndWeek: number;
  playoffTeams: number;

  weeks: Week[];
  /**
   * Weeks 1..regularSeasonEndWeek that are finished.
   *
   * Excludes the week currently being played, so standings and awards are only
   * ever decided on final scores. Read this in an award, never `weeks`.
   */
  regularSeasonWeeks: Week[];
  /** The week being played right now, or null outside this league's live season. */
  liveWeek: number | null;

  standings: StandingsRow[];
  winnersBracket: Bracket;
  losersBracket: Bracket;

  /**
   * True when this league also plays the weekly median.
   *
   * Sleeper awards a second win or loss each week against the league median.
   * Head-to-head results alone therefore produce roughly half the record
   * Sleeper reports, so computed standings fall back to Sleeper's own totals
   * and the UI says which it is showing.
   */
  usesMedianScoring: boolean;

  /** True once at least one regular-season week has scores. */
  hasScores: boolean;
  /**
   * True once every regular-season week is settled.
   *
   * The 1 seed and the season's records are only final from this point; an
   * all-time tally must not credit a mid-season leader with a title.
   */
  isRegularSeasonComplete: boolean;
  /** True when the league finished its playoffs. */
  isComplete: boolean;
}
