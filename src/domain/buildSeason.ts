/**
 * Raw Sleeper responses in, one `SeasonModel` out.
 *
 * Pure: no network, no React, no globals. Every rendering decision and every
 * award is computed from the model this produces, which makes the whole league
 * layer testable from captured JSON fixtures.
 */
import { buildBracket } from './bracket';
import { computeStandings, round2, standingsFromReported } from './standings';
import type { PlayerScore, SeasonModel, StarterScore, Team, TeamWeek, Week } from './types';
import type {
  SleeperBracketMatch,
  SleeperLeague,
  SleeperMatchup,
  SleeperRoster,
  SleeperUser,
} from '@/lib/sleeper/types';

/** Sleeper's default when a league somehow reports no playoff start. */
const DEFAULT_PLAYOFF_WEEK_START = 15;

/**
 * Hard ceiling on how many weeks the app will ever ask for.
 *
 * This is a loop guard, not the NFL's schedule. The real end of a season comes
 * from the league's own `playoff_week_start` plus its playoff rounds, so the
 * app already follows a league that runs long. The ceiling only stops a corrupt
 * `playoff_week_start` from generating unbounded requests, and it has room for
 * a longer regular season than the NFL currently plays.
 */
export const MAX_SEASON_WEEK = 25;

/** A 16-team bracket, which is the largest Sleeper offers. */
export const MAX_PLAYOFF_ROUNDS = 4;

/**
 * Weeks each playoff round occupies.
 *
 * Sleeper's `playoff_round_type` is 2 when every round runs over two weeks.
 * Missing the doubling would cut a two-week championship off the scoreboard.
 */
export const weeksPerPlayoffRound = (playoffRoundType: number | undefined): number =>
  playoffRoundType === 2 ? 2 : 1;

/**
 * Playoff rounds for a bracket of `playoffTeams`.
 *
 * Six teams need three rounds, four need two. Without a team count the widest
 * bracket Sleeper offers is assumed, which costs a couple of empty requests.
 */
export function playoffRounds(playoffTeams: number | undefined): number {
  if (!playoffTeams || playoffTeams < 2) return MAX_PLAYOFF_ROUNDS;
  return Math.min(MAX_PLAYOFF_ROUNDS, Math.ceil(Math.log2(playoffTeams)));
}

/**
 * Last week worth requesting for a league.
 *
 * With a known bracket size this is exact: the championship week. Without one
 * it leaves room for the widest bracket, and the unplayed weeks answer `[]`
 * cheaply.
 */
export function lastWeekOfSeason(
  playoffWeekStart: number,
  playoffRoundType: number | undefined,
  playoffTeams?: number,
): number {
  const rounds = playoffRounds(playoffTeams);
  const weeksPerRound = weeksPerPlayoffRound(playoffRoundType);
  const lastWeek =
    playoffTeams && playoffTeams >= 2
      ? playoffWeekStart + rounds * weeksPerRound - 1
      : playoffWeekStart + rounds * weeksPerRound;
  return Math.min(MAX_SEASON_WEEK, lastWeek);
}

export interface RawSeasonData {
  league: SleeperLeague;
  users: SleeperUser[];
  rosters: SleeperRoster[];
  /** Week number to that week's matchup rows. An empty array means "not played". */
  matchupsByWeek: ReadonlyMap<number, SleeperMatchup[]>;
  winnersBracket: SleeperBracketMatch[];
  losersBracket: SleeperBracketMatch[];
  /**
   * The NFL's current season and week, from `/state/nfl`.
   *
   * Without it a week that is halfway through Sunday looks identical to a
   * finished one, so a team that has not kicked off yet sits on 0.00 and gets
   * handed a loss and the weekly punishment. Omit it only when the clock is
   * genuinely unknown; the week is then treated as final, which is the old
   * behaviour.
   */
  nflState?: { season: string; week: number } | null;
}

/** Sleeper splits points into whole and hundredths parts. */
const points = (whole: number | undefined, decimal: number | undefined): number =>
  round2((whole ?? 0) + (decimal ?? 0) / 100);

function buildTeams(rosters: SleeperRoster[], users: SleeperUser[]): Team[] {
  const usersById = new Map(users.map((user) => [user.user_id, user]));

  return rosters
    .map((roster): Team => {
      const user = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
      const ownerName = user?.display_name ?? 'Unclaimed team';

      // A co-managed roster names everyone, so a team is not credited to one
      // half of a partnership. Sleeper lists the primary owner in `co_owners`
      // on some leagues, so it is filtered out rather than repeated.
      const coManagerNames = (roster.co_owners ?? [])
        .filter((id) => id !== roster.owner_id)
        .map((id) => usersById.get(id)?.display_name)
        .filter((name): name is string => Boolean(name));

      const managerName = [ownerName, ...coManagerNames].join(' & ');
      // `metadata.team_name` is often absent; the manager's handle is the fallback
      // Sleeper itself shows.
      const teamName = roster.metadata?.team_name?.trim() || managerName;

      return {
        rosterId: roster.roster_id,
        name: teamName,
        managerName,
        coManagerNames,
        userId: roster.owner_id,
        avatarId: user?.avatar ?? null,
        reported: {
          wins: roster.settings.wins ?? 0,
          losses: roster.settings.losses ?? 0,
          ties: roster.settings.ties ?? 0,
          pointsFor: points(roster.settings.fpts, roster.settings.fpts_decimal),
          pointsAgainst: points(roster.settings.fpts_against, roster.settings.fpts_against_decimal),
          maxPointsFor: points(roster.settings.ppts, roster.settings.ppts_decimal),
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

/** Rostered players who did not start. `players_points` covers the whole roster. */
function buildBench(matchup: SleeperMatchup): PlayerScore[] {
  const started = new Set(matchup.starters ?? []);
  const scores = matchup.players_points ?? {};

  return (matchup.players ?? []).flatMap((playerId) => {
    if (!playerId || playerId === '0' || started.has(playerId)) return [];
    return [{ playerId, points: round2(scores[playerId] ?? 0) }];
  });
}

function buildWeek(
  week: number,
  matchups: SleeperMatchup[],
  playoffWeekStart: number,
  inProgress: boolean,
): Week {
  const phase = week >= playoffWeekStart ? 'postseason' : 'regular';

  if (matchups.length === 0) {
    return { week, phase, played: false, provisional: false, teams: [] };
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
      bench: buildBench(matchup),
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

  return {
    week,
    phase,
    played,
    // Scores are still moving, so this week decides nothing yet.
    provisional: played && inProgress,
    teams: teams.sort((a, b) => a.rosterId - b.rosterId),
  };
}

/**
 * The week currently being played, if this league's season is the live one.
 *
 * A past season has no week in progress, however long ago it ended.
 */
function inProgressWeek(league: SleeperLeague, nflState: RawSeasonData['nflState']): number | null {
  if (!nflState) return null;
  if (league.season !== nflState.season) return null;
  return nflState.week;
}

export function buildSeason(raw: RawSeasonData): SeasonModel {
  const { league, users, rosters, matchupsByWeek, winnersBracket, losersBracket } = raw;

  const playoffWeekStart = league.settings.playoff_week_start ?? DEFAULT_PLAYOFF_WEEK_START;
  const regularSeasonEndWeek = Math.max(1, playoffWeekStart - 1);
  const liveWeek = inProgressWeek(league, raw.nflState);

  const teams = buildTeams(rosters, users);
  const weeks = [...matchupsByWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, matchups]) => buildWeek(week, matchups, playoffWeekStart, week === liveWeek));

  const regularSeasonWeeks = weeks.filter((week) => week.week <= regularSeasonEndWeek);
  // Standings and awards read settled weeks only. A week still being played
  // would otherwise hand out a record and a punishment on partial scores.
  const settledRegularSeasonWeeks = regularSeasonWeeks.filter(
    (week) => week.played && !week.provisional,
  );
  // A median league scores two results a week, one head-to-head and one against
  // the league median, and the median result is absent from the matchup data.
  const usesMedianScoring = league.settings.league_average_match === 1;
  const standings = usesMedianScoring
    ? standingsFromReported(teams, settledRegularSeasonWeeks)
    : computeStandings(teams, settledRegularSeasonWeeks);
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
    regularSeasonWeeks: settledRegularSeasonWeeks,
    liveWeek,

    standings,
    winnersBracket: winners,
    losersBracket: buildBracket(losersBracket),

    usesMedianScoring,
    hasScores: settledRegularSeasonWeeks.length > 0,
    isRegularSeasonComplete: settledRegularSeasonWeeks.length >= regularSeasonEndWeek,
    isComplete: winners.placements.some((placement) => placement.place === 1),
  };
}
