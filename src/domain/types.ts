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
  /** The human behind the roster. */
  managerName: string;
  userId: string | null;
  avatarId: string | null;
  /** Sleeper's own season totals, kept for cross-checking computed standings. */
  reported: {
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  };
}

/** One starting-lineup slot in one week. */
export interface StarterScore {
  playerId: string;
  points: number;
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
}

/** Every team's result for one week, plus what kind of week it was. */
export interface Week {
  week: number;
  phase: 'regular' | 'postseason';
  /** False when Sleeper returned no matchup rows: the week has not been played. */
  played: boolean;
  teams: TeamWeek[];
}

export interface StandingsRow {
  rosterId: number;
  rank: number;
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
  playoffTeams: number;

  weeks: Week[];
  /** Weeks 1..regularSeasonEndWeek that have actually been played. */
  regularSeasonWeeks: Week[];

  standings: StandingsRow[];
  winnersBracket: Bracket;
  losersBracket: Bracket;

  /** True once at least one regular-season week has scores. */
  hasScores: boolean;
  /** True when the league finished its playoffs. */
  isComplete: boolean;
}
