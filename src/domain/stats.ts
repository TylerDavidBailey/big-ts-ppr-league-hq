/**
 * Derived season stats: power rankings, lineup efficiency, and superlatives.
 *
 * Everything here reads `season.regularSeasonWeeks`, which holds settled weeks
 * only, so a live Sunday changes nothing until it is over. Every function
 * returns empty results before week 1 rather than throwing.
 */
import { round2 } from './standings';
import type { SeasonModel, TeamWeek, Week } from './types';

/** Every entry whose `value` matches the best one, by `pick`. */
function extremes<T>(items: readonly T[], value: (item: T) => number, pick: 'max' | 'min'): T[] {
  if (items.length === 0) return [];
  const best = items.reduce(
    (acc, item) => (pick === 'max' ? Math.max(acc, value(item)) : Math.min(acc, value(item))),
    pick === 'max' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  );
  return items.filter((item) => value(item) === best);
}

// --- Power rankings ---------------------------------------------------------

export interface PowerRow {
  rank: number;
  rosterId: number;
  /** Record against every other team every week, not just the scheduled one. */
  allPlayWins: number;
  allPlayLosses: number;
  allPlayTies: number;
  /** 0..1. */
  allPlayPct: number;
  /** All-play wins scaled to one game a week. */
  expectedWins: number;
  actualWins: number;
  /** Actual minus expected. Positive is a soft schedule. */
  luck: number;
  pointsFor: number;
  pointsAgainst: number;
}

/**
 * All-play standings.
 *
 * Each week a team is scored against every other team in the league. A team
 * that outscores nine of eleven rivals gets nine all-play wins for the week,
 * whatever its scheduled opponent did. Luck is the gap between the record it
 * has and the record its scoring deserved.
 */
export function powerRankings(season: SeasonModel): PowerRow[] {
  if (!season.hasScores) return [];

  const rows = new Map<number, PowerRow>(
    season.teams.map((team) => [
      team.rosterId,
      {
        rank: 0,
        rosterId: team.rosterId,
        allPlayWins: 0,
        allPlayLosses: 0,
        allPlayTies: 0,
        allPlayPct: 0,
        expectedWins: 0,
        actualWins: 0,
        luck: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
    ]),
  );

  for (const week of season.regularSeasonWeeks) {
    const rivals = week.teams.length - 1;
    if (rivals < 1) continue;

    for (const team of week.teams) {
      const row = rows.get(team.rosterId);
      if (!row) continue;

      let wins = 0;
      let ties = 0;
      for (const other of week.teams) {
        if (other.rosterId === team.rosterId) continue;
        if (team.points > other.points) wins += 1;
        else if (team.points === other.points) ties += 1;
      }

      row.allPlayWins += wins;
      row.allPlayTies += ties;
      row.allPlayLosses += rivals - wins - ties;
      row.expectedWins += (wins + ties / 2) / rivals;
    }
  }

  for (const standing of season.standings) {
    const row = rows.get(standing.rosterId);
    if (!row) continue;
    row.actualWins = standing.wins + standing.ties / 2;
    row.pointsFor = standing.pointsFor;
    row.pointsAgainst = standing.pointsAgainst;
  }

  const ranked = [...rows.values()]
    .map((row) => {
      const games = row.allPlayWins + row.allPlayLosses + row.allPlayTies;
      return {
        ...row,
        allPlayPct: games === 0 ? 0 : (row.allPlayWins + row.allPlayTies / 2) / games,
        expectedWins: round2(row.expectedWins),
        luck: round2(row.actualWins - row.expectedWins),
      };
    })
    .sort((a, b) => b.allPlayPct - a.allPlayPct || b.pointsFor - a.pointsFor);

  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}

// --- Lineup efficiency ------------------------------------------------------

export interface BenchedScore {
  playerId: string;
  points: number;
  week: number;
}

export interface EfficiencyRow {
  rank: number;
  rosterId: number;
  pointsFor: number;
  /** What a perfect lineup would have scored, from Sleeper's `ppts`. */
  maxPointsFor: number;
  /** `pointsFor / maxPointsFor`, or null before any points are possible. */
  efficiency: number | null;
  /** Everything scored by players left on the bench, all season. */
  benchPoints: number;
  /** The single best score a manager left on the bench. */
  biggestBench: BenchedScore | null;
}

/**
 * How well each manager set their lineup.
 *
 * Sleeper's `ppts` is the optimal-lineup total for the regular season, so the
 * ratio needs no lineup solver. Bench points come from the settled weeks.
 */
export function lineupEfficiency(season: SeasonModel): EfficiencyRow[] {
  if (!season.hasScores) return [];

  const rows = season.teams.map((team): EfficiencyRow => {
    let benchPoints = 0;
    let biggestBench: BenchedScore | null = null;

    for (const week of season.regularSeasonWeeks) {
      const teamWeek = week.teams.find((candidate) => candidate.rosterId === team.rosterId);
      if (!teamWeek) continue;

      for (const benched of teamWeek.bench) {
        benchPoints += benched.points;
        if (!biggestBench || benched.points > biggestBench.points) {
          biggestBench = { playerId: benched.playerId, points: benched.points, week: week.week };
        }
      }
    }

    const { pointsFor, maxPointsFor } = team.reported;
    return {
      rank: 0,
      rosterId: team.rosterId,
      pointsFor,
      maxPointsFor,
      efficiency: maxPointsFor > 0 ? pointsFor / maxPointsFor : null,
      benchPoints: round2(benchPoints),
      biggestBench,
    };
  });

  const ranked = rows.sort(
    (a, b) => (b.efficiency ?? -1) - (a.efficiency ?? -1) || b.pointsFor - a.pointsFor,
  );
  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}

// --- Superlatives -----------------------------------------------------------

/** One decided game, seen from `rosterId`'s side. */
export interface GameRecord {
  week: number;
  rosterId: number;
  points: number;
  opponentRosterId: number;
  opponentPoints: number;
  /** Always positive: `points - opponentPoints` for a win, the reverse for a loss. */
  margin: number;
}

export interface StreakRecord {
  rosterId: number;
  length: number;
  fromWeek: number;
  toWeek: number;
}

export interface TallyRow {
  rosterId: number;
  count: number;
}

export interface ConsistencyRow {
  rosterId: number;
  mean: number;
  /** Population standard deviation of weekly points. Lower is steadier. */
  stdDev: number;
}

export interface Superlatives {
  /** Every list holds every holder of the record, so a tie shows everyone. */
  biggestBlowout: GameRecord[];
  closestGame: GameRecord[];
  highestScoringLoss: GameRecord[];
  lowestScoringWin: GameRecord[];
  longestWinStreak: StreakRecord[];
  longestLossStreak: StreakRecord[];
  /** Weeks each team posted the league's top score, most first, zeros omitted. */
  weeklyHighs: TallyRow[];
  mostConsistent: ConsistencyRow[];
  leastConsistent: ConsistencyRow[];
}

const decidedGames = (weeks: readonly Week[]): GameRecord[] =>
  weeks.flatMap((week) =>
    week.teams.flatMap((team): GameRecord[] => {
      if (team.opponentRosterId === null || team.opponentPoints === null) return [];
      if (team.outcome === 'none') return [];
      return [
        {
          week: week.week,
          rosterId: team.rosterId,
          points: team.points,
          opponentRosterId: team.opponentRosterId,
          opponentPoints: team.opponentPoints,
          margin: round2(Math.abs(team.points - team.opponentPoints)),
        },
      ];
    }),
  );

const outcomeOf = (week: Week, rosterId: number): TeamWeek['outcome'] | undefined =>
  week.teams.find((team) => team.rosterId === rosterId)?.outcome;

function longestStreaks(season: SeasonModel, kind: 'win' | 'loss'): StreakRecord[] {
  const streaks: StreakRecord[] = [];

  for (const team of season.teams) {
    let current: StreakRecord | null = null;
    let best: StreakRecord | null = null;

    for (const week of season.regularSeasonWeeks) {
      const outcome = outcomeOf(week, team.rosterId);
      // A bye neither extends nor breaks a run.
      if (outcome === undefined || outcome === 'none') continue;

      if (outcome !== kind) {
        current = null;
        continue;
      }

      const extended: StreakRecord = current
        ? { ...current, length: current.length + 1, toWeek: week.week }
        : { rosterId: team.rosterId, length: 1, fromWeek: week.week, toWeek: week.week };
      current = extended;
      if (!best || extended.length > best.length) best = extended;
    }

    if (best) streaks.push(best);
  }

  return extremes(streaks, (streak) => streak.length, 'max');
}

function consistency(season: SeasonModel): ConsistencyRow[] {
  return season.teams.flatMap((team): ConsistencyRow[] => {
    const scores = season.regularSeasonWeeks.flatMap((week) => {
      const teamWeek = week.teams.find((candidate) => candidate.rosterId === team.rosterId);
      return teamWeek ? [teamWeek.points] : [];
    });
    // One score has no spread to measure.
    if (scores.length < 2) return [];

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
    return [{ rosterId: team.rosterId, mean: round2(mean), stdDev: round2(Math.sqrt(variance)) }];
  });
}

export function superlatives(season: SeasonModel): Superlatives {
  const weeks = season.regularSeasonWeeks;
  const games = decidedGames(weeks);
  const wins = games.filter((game) => game.points > game.opponentPoints);
  const losses = games.filter((game) => game.points < game.opponentPoints);
  const rows = consistency(season);

  const tally = new Map<number, number>();
  for (const week of weeks) {
    for (const top of extremes(week.teams, (team) => team.points, 'max')) {
      tally.set(top.rosterId, (tally.get(top.rosterId) ?? 0) + 1);
    }
  }

  return {
    // Seen from the winner's side, so a blowout names who did the blowing out.
    biggestBlowout: extremes(wins, (game) => game.margin, 'max'),
    // A tie has no closest side to name, so only decided games count.
    closestGame: extremes(wins, (game) => game.margin, 'min'),
    highestScoringLoss: extremes(losses, (game) => game.points, 'max'),
    lowestScoringWin: extremes(wins, (game) => game.points, 'min'),
    longestWinStreak: longestStreaks(season, 'win'),
    longestLossStreak: longestStreaks(season, 'loss'),
    weeklyHighs: [...tally.entries()]
      .map(([rosterId, count]) => ({ rosterId, count }))
      .sort((a, b) => b.count - a.count || a.rosterId - b.rosterId),
    mostConsistent: extremes(rows, (row) => row.stdDev, 'min'),
    leastConsistent: extremes(rows, (row) => row.stdDev, 'max'),
  };
}
