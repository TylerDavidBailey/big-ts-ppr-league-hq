/**
 * Raw Sleeper responses in, one `SeasonModel` out.
 *
 * Pure: no network, no React, no globals. Every rendering decision and every
 * award is computed from the model this produces, which makes the whole league
 * layer testable from captured JSON fixtures.
 */
import { buildBracket } from './bracket';
import { computeStandings, round2 } from './standings';
import type { SeasonModel, StarterScore, Team, TeamWeek, Week } from './types';
import type {
  SleeperBracketMatch,
  SleeperLeague,
  SleeperMatchup,
  SleeperRoster,
  SleeperUser,
} from '@/lib/sleeper/types';

/** Sleeper's default when a league somehow reports no playoff start. */
const DEFAULT_PLAYOFF_WEEK_START = 15;
/** Regular season plus a generous postseason; weeks past this never exist. */
export const MAX_NFL_WEEK = 18;

export interface RawSeasonData {
  league: SleeperLeague;
  users: SleeperUser[];
  rosters: SleeperRoster[];
  /** Week number to that week's matchup rows. An empty array means "not played". */
  matchupsByWeek: ReadonlyMap<number, SleeperMatchup[]>;
  winnersBracket: SleeperBracketMatch[];
  losersBracket: SleeperBracketMatch[];
}

/** Sleeper splits points into whole and hundredths parts. */
const points = (whole: number | undefined, decimal: number | undefined): number =>
  round2((whole ?? 0) + (decimal ?? 0) / 100);

function buildTeams(rosters: SleeperRoster[], users: SleeperUser[]): Team[] {
  const usersById = new Map(users.map((user) => [user.user_id, user]));

  return rosters
    .map((roster): Team => {
      const user = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
      const managerName = user?.display_name ?? 'Unclaimed team';
      // `metadata.team_name` is often absent; the manager's handle is the fallback
      // Sleeper itself shows.
      const teamName = roster.metadata?.team_name?.trim() || managerName;

      return {
        rosterId: roster.roster_id,
        name: teamName,
        managerName,
        userId: roster.owner_id,
        avatarId: user?.avatar ?? null,
        reported: {
          wins: roster.settings.wins ?? 0,
          losses: roster.settings.losses ?? 0,
          ties: roster.settings.ties ?? 0,
          pointsFor: points(roster.settings.fpts, roster.settings.fpts_decimal),
          pointsAgainst: points(roster.settings.fpts_against, roster.settings.fpts_against_decimal),
        },
      };
    })
    .sort((a, b) => a.rosterId - b.rosterId);
}

function buildStarters(matchup: SleeperMatchup): StarterScore[] {
  const ids = matchup.starters ?? [];
  const scores = matchup.starters_points ?? [];

  return ids.flatMap((playerId, slot) => {
    // Sleeper pads empty lineup slots with "0"; they are not real players.
    if (!playerId || playerId === '0') return [];
    return [{ playerId, points: round2(scores[slot] ?? 0), slot }];
  });
}

function buildWeek(week: number, matchups: SleeperMatchup[], playoffWeekStart: number): Week {
  const phase = week >= playoffWeekStart ? 'postseason' : 'regular';

  if (matchups.length === 0) {
    return { week, phase, played: false, teams: [] };
  }

  // Rosters sharing a matchup_id played each other.
  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const matchup of matchups) {
    if (matchup.matchup_id === null) continue;
    const bucket = byMatchup.get(matchup.matchup_id);
    if (bucket) bucket.push(matchup);
    else byMatchup.set(matchup.matchup_id, [matchup]);
  }

  const opponentOf = new Map<number, SleeperMatchup>();
  for (const pair of byMatchup.values()) {
    const [first, second] = pair;
    if (first && second) {
      opponentOf.set(first.roster_id, second);
      opponentOf.set(second.roster_id, first);
    }
  }

  const teams = matchups.map((matchup): TeamWeek => {
    const opponent = opponentOf.get(matchup.roster_id) ?? null;
    const own = round2(matchup.points ?? 0);
    const against = opponent ? round2(opponent.points ?? 0) : null;

    let outcome: TeamWeek['outcome'] = 'none';
    if (against !== null) {
      if (own > against) outcome = 'win';
      else if (own < against) outcome = 'loss';
      else outcome = 'tie';
    }

    return {
      rosterId: matchup.roster_id,
      week,
      points: own,
      opponentRosterId: opponent?.roster_id ?? null,
      opponentPoints: against,
      outcome,
      starters: buildStarters(matchup),
    };
  });

  // Two kinds of week carry scores without being a week of this league.
  //
  // A week that has only just opened scores all zeros, so scoring at all is the
  // first requirement. Once a league's season ends, Sleeper keeps returning
  // roster scores for the remaining NFL weeks with `matchup_id` null on every
  // row, which would otherwise render as a full slate of byes.
  //
  // A real week pairs at least one set of opponents. Playoff weeks with byes
  // still pair the teams that played, so a league whose championship falls in
  // week 17 and a league that plays through week 18 both work without this code
  // knowing which is which.
  const played =
    teams.some((team) => team.points > 0) && teams.some((team) => team.opponentRosterId !== null);

  return { week, phase, played, teams: teams.sort((a, b) => a.rosterId - b.rosterId) };
}

export function buildSeason(raw: RawSeasonData): SeasonModel {
  const { league, users, rosters, matchupsByWeek, winnersBracket, losersBracket } = raw;

  const playoffWeekStart = league.settings.playoff_week_start ?? DEFAULT_PLAYOFF_WEEK_START;
  const regularSeasonEndWeek = Math.max(1, playoffWeekStart - 1);

  const teams = buildTeams(rosters, users);
  const weeks = [...matchupsByWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, matchups]) => buildWeek(week, matchups, playoffWeekStart));

  const regularSeasonWeeks = weeks.filter((week) => week.week <= regularSeasonEndWeek);
  const standings = computeStandings(teams, regularSeasonWeeks);
  const winners = buildBracket(winnersBracket);

  return {
    leagueId: league.league_id,
    leagueName: league.name.trim(),
    season: league.season,
    status: league.status,
    avatarId: league.avatar,
    previousLeagueId: league.previous_league_id,

    teams,
    teamsByRosterId: new Map(teams.map((team) => [team.rosterId, team])),

    regularSeasonEndWeek,
    playoffWeekStart,
    playoffTeams: league.settings.playoff_teams ?? 0,

    weeks,
    regularSeasonWeeks: regularSeasonWeeks.filter((week) => week.played),

    standings,
    winnersBracket: winners,
    losersBracket: buildBracket(losersBracket),

    hasScores: regularSeasonWeeks.some((week) => week.played),
    isComplete: winners.placements.some((placement) => placement.place === 1),
  };
}
