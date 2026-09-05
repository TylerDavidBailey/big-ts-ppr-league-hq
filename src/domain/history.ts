/**
 * Cross-season tallies: all-time standings, the record book, and champions.
 *
 * Each season is its own Sleeper league with its own roster ids, so nothing
 * here keys on a roster. Managers are matched by Sleeper user id, which is
 * stable across seasons, and named from the newest season they appear in.
 *
 * A season still in progress contributes only what is settled: its games so
 * far, but no title, no 1 seed, and no season-total record.
 */
import type { SeasonAwards } from './awards';
import { superlatives } from './stats';
import type { SeasonModel, Team } from './types';

export interface SeasonSummary {
  season: SeasonModel;
  awards: SeasonAwards;
}

/**
 * A manager's identity across seasons.
 *
 * Sleeper user ids survive renames, so a manager who changes their handle
 * stays one row. An unclaimed roster has no user, and roster numbers repeat
 * every season, so it is keyed by league as well and never merges with an
 * unclaimed roster from another year.
 */
export const managerKey = (season: SeasonModel, team: Team): string =>
  team.userId ?? `${season.leagueId}:roster:${team.rosterId}`;

export interface Manager {
  key: string;
  /** Manager handle from the newest season they appear in. */
  name: string;
  /** Team name from that same season. */
  teamName: string;
  avatarId: string | null;
  /** Other handles this manager used in earlier seasons, newest first. */
  aliases: string[];
}

/** Newest first, so the first season a manager appears in is their latest. */
const newestFirst = (summaries: readonly SeasonSummary[]): SeasonSummary[] =>
  [...summaries].sort((a, b) => Number(b.season.season) - Number(a.season.season));

function collectManagers(summaries: readonly SeasonSummary[]): Map<string, Manager> {
  const managers = new Map<string, Manager>();
  for (const { season } of newestFirst(summaries)) {
    for (const team of season.teams) {
      const key = managerKey(season, team);
      const known = managers.get(key);
      if (known) {
        if (team.managerName !== known.name && !known.aliases.includes(team.managerName)) {
          known.aliases.push(team.managerName);
        }
        continue;
      }
      managers.set(key, {
        key,
        name: team.managerName,
        teamName: team.name,
        avatarId: team.avatarId,
        aliases: [],
      });
    }
  }
  return managers;
}

const teamFor = (season: SeasonModel, rosterId: number): Team | undefined =>
  season.teamsByRosterId.get(rosterId);

// --- All-time standings -----------------------------------------------------

export interface AllTimeRow extends Manager {
  rank: number;
  seasons: number;
  wins: number;
  losses: number;
  ties: number;
  /** 0..1, ties counting half. */
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsPerGame: number;
  playoffAppearances: number;
  playoffWins: number;
  playoffLosses: number;
  titles: number;
  runnerUps: number;
  thirds: number;
  topSeeds: number;
  beerDuties: number;
}

export function allTimeStandings(summaries: readonly SeasonSummary[]): AllTimeRow[] {
  const managers = collectManagers(summaries);
  const rows = new Map<string, AllTimeRow>(
    [...managers.values()].map((manager) => [
      manager.key,
      {
        ...manager,
        rank: 0,
        seasons: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winPct: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsPerGame: 0,
        playoffAppearances: 0,
        playoffWins: 0,
        playoffLosses: 0,
        titles: 0,
        runnerUps: 0,
        thirds: 0,
        topSeeds: 0,
        beerDuties: 0,
      },
    ]),
  );

  const rowFor = (season: SeasonModel, rosterId: number): AllTimeRow | undefined => {
    const team = teamFor(season, rosterId);
    return team ? rows.get(managerKey(season, team)) : undefined;
  };

  for (const { season, awards } of summaries) {
    if (!season.hasScores) continue;

    for (const team of season.teams) {
      const row = rows.get(managerKey(season, team));
      if (row) row.seasons += 1;
    }

    for (const standing of season.standings) {
      const row = rowFor(season, standing.rosterId);
      if (!row) continue;
      row.wins += standing.wins;
      row.losses += standing.losses;
      row.ties += standing.ties;
      row.pointsFor += standing.pointsFor;
      row.pointsAgainst += standing.pointsAgainst;
    }

    // Appearing in the winners bracket is what "made the playoffs" means.
    const playoffRosters = new Set<number>();
    for (const match of season.winnersBracket.matches) {
      if (match.t1 !== null) playoffRosters.add(match.t1);
      if (match.t2 !== null) playoffRosters.add(match.t2);
      if (match.w !== null) {
        const winner = rowFor(season, match.w);
        if (winner) winner.playoffWins += 1;
      }
      if (match.l !== null) {
        const loser = rowFor(season, match.l);
        if (loser) loser.playoffLosses += 1;
      }
    }
    for (const rosterId of playoffRosters) {
      const row = rowFor(season, rosterId);
      if (row) row.playoffAppearances += 1;
    }

    for (const placement of awards.podium) {
      const row = rowFor(season, placement.rosterId);
      if (!row) continue;
      if (placement.place === 1) row.titles += 1;
      else if (placement.place === 2) row.runnerUps += 1;
      else if (placement.place === 3) row.thirds += 1;
    }

    // A mid-season leader is not a 1 seed yet.
    if (season.isRegularSeasonComplete) {
      for (const entry of awards.regularSeasonChamp) {
        if (entry.place !== 1) continue;
        const row = rowFor(season, entry.rosterId);
        if (row) row.topSeeds += 1;
      }
    }

    for (const entry of awards.beerDuty) {
      const row = rowFor(season, entry.rosterId);
      if (row) row.beerDuties += 1;
    }
  }

  // A manager who joined for a season that has not started has no career yet.
  const ranked = [...rows.values()]
    .filter((row) => row.seasons > 0)
    .map((row) => {
      const games = row.wins + row.losses + row.ties;
      return {
        ...row,
        pointsFor: Math.round(row.pointsFor * 100) / 100,
        pointsAgainst: Math.round(row.pointsAgainst * 100) / 100,
        winPct: games === 0 ? 0 : (row.wins + row.ties / 2) / games,
        pointsPerGame: games === 0 ? 0 : Math.round((row.pointsFor / games) * 100) / 100,
      };
    })
    .sort((a, b) => b.winPct - a.winPct || b.pointsPerGame - a.pointsPerGame);

  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}

// --- Record book ------------------------------------------------------------

export interface RecordHolder extends Manager {
  season: string;
  /** Roster id within that season, for the season's own team name. */
  rosterId: number;
  /** The handle the manager used that season. Sleeper accounts get renamed. */
  nameThen: string;
  value: number;
  week?: number;
  playerId?: string;
  playerName?: string;
  detail?: string;
}

export type RecordFormat = 'points' | 'record' | 'count' | 'streak' | 'margin';

export interface AllTimeRecord {
  id: string;
  label: string;
  format: RecordFormat;
  /** Every holder of the record, so an exact tie names everyone. */
  holders: RecordHolder[];
}

type Holder = Omit<RecordHolder, keyof Manager | 'nameThen'>;

/** Keep every holder whose value matches the best one. */
function bestOf(candidates: readonly Holder[], pick: 'max' | 'min'): Holder[] {
  if (candidates.length === 0) return [];
  const values = candidates.map((candidate) => candidate.value);
  const best = pick === 'max' ? Math.max(...values) : Math.min(...values);
  return candidates.filter((candidate) => candidate.value === best);
}

export function allTimeRecords(summaries: readonly SeasonSummary[]): AllTimeRecord[] {
  const managers = collectManagers(summaries);
  const played = newestFirst(summaries).filter(({ season }) => season.hasScores);
  const finishedRegularSeasons = played.filter(({ season }) => season.isRegularSeasonComplete);

  const withManager = (season: SeasonModel, holder: Holder): RecordHolder | null => {
    const team = teamFor(season, holder.rosterId);
    const manager = team ? managers.get(managerKey(season, team)) : undefined;
    return manager && team ? { ...manager, ...holder, nameThen: team.managerName } : null;
  };

  const record = (
    id: string,
    label: string,
    format: RecordFormat,
    pick: 'max' | 'min',
    candidates: { season: SeasonModel; holder: Holder }[],
  ): AllTimeRecord => {
    const best = bestOf(
      candidates.map(({ holder }) => holder),
      pick,
    );
    const holders = candidates
      .filter(({ holder }) => best.includes(holder))
      .flatMap(({ season, holder }) => {
        const resolved = withManager(season, holder);
        return resolved ? [resolved] : [];
      });
    return { id, label, format, holders };
  };

  const seasonRow = (season: SeasonModel, rosterId: number, value: number, detail?: string) => ({
    season,
    holder: { season: season.season, rosterId, value, detail },
  });

  return [
    record(
      'best-record',
      'Best regular season',
      'record',
      'max',
      finishedRegularSeasons.flatMap(({ season }) =>
        season.standings.map((row) =>
          seasonRow(
            season,
            row.rosterId,
            row.wins + row.ties / 2,
            `${row.wins}-${row.losses}${row.ties > 0 ? `-${row.ties}` : ''}`,
          ),
        ),
      ),
    ),
    record(
      'most-points-season',
      'Most points in a season',
      'points',
      'max',
      finishedRegularSeasons.flatMap(({ season }) =>
        season.standings.map((row) => seasonRow(season, row.rosterId, row.pointsFor)),
      ),
    ),
    record(
      'highest-team-week',
      'Highest team week',
      'points',
      'max',
      played.flatMap(({ season, awards }) =>
        awards.highestTeamWeek
          .filter((entry) => entry.place === 1)
          .map((entry) => ({
            season,
            holder: {
              season: season.season,
              rosterId: entry.rosterId,
              value: entry.value,
              week: entry.week,
            },
          })),
      ),
    ),
    record(
      'lowest-team-week',
      'Lowest team week',
      'points',
      'min',
      played.flatMap(({ season, awards }) =>
        awards.beerDuty.map((entry) => ({
          season,
          holder: {
            season: season.season,
            rosterId: entry.rosterId,
            value: entry.value,
            week: entry.week,
          },
        })),
      ),
    ),
    record(
      'highest-starter-week',
      'Highest starter week',
      'points',
      'max',
      played.flatMap(({ season, awards }) =>
        awards.highestStarterWeek
          .filter((entry) => entry.place === 1)
          .map((entry) => ({
            season,
            holder: {
              season: season.season,
              rosterId: entry.rosterId,
              value: entry.value,
              week: entry.week,
              playerId: entry.playerId,
              playerName: entry.playerName,
            },
          })),
      ),
    ),
    record(
      'longest-win-streak',
      'Longest win streak',
      'streak',
      'max',
      played.flatMap(({ season }) =>
        superlatives(season).longestWinStreak.map((streak) => ({
          season,
          holder: {
            season: season.season,
            rosterId: streak.rosterId,
            value: streak.length,
            detail: `Weeks ${streak.fromWeek} to ${streak.toWeek}`,
          },
        })),
      ),
    ),
    record(
      'biggest-blowout',
      'Biggest blowout',
      'margin',
      'max',
      played.flatMap(({ season }) =>
        superlatives(season).biggestBlowout.map((game) => ({
          season,
          holder: {
            season: season.season,
            rosterId: game.rosterId,
            value: game.margin,
            week: game.week,
            detail: `${game.points.toFixed(2)} to ${game.opponentPoints.toFixed(2)} over ${
              teamFor(season, game.opponentRosterId)?.name ?? 'an unknown team'
            }`,
          },
        })),
      ),
    ),
    record(
      'most-weekly-highs',
      'Most weekly top scores in a season',
      'count',
      'max',
      finishedRegularSeasons.flatMap(({ season }) =>
        superlatives(season).weeklyHighs.map((row) => seasonRow(season, row.rosterId, row.count)),
      ),
    ),
    record(
      'most-beer-duties',
      'Most beer duties in a season',
      'count',
      'max',
      finishedRegularSeasons.flatMap(({ season, awards }) => {
        const tally = new Map<number, number>();
        for (const entry of awards.beerDuty) {
          tally.set(entry.rosterId, (tally.get(entry.rosterId) ?? 0) + 1);
        }
        return [...tally.entries()].map(([rosterId, count]) => seasonRow(season, rosterId, count));
      }),
    ),
  ];
}

// --- Champions --------------------------------------------------------------

export interface ChampionsRow {
  season: SeasonModel;
  champion: Team | null;
  runnerUp: Team | null;
  third: Team | null;
  /** Every team level for the 1 seed. Empty until the regular season ends. */
  topSeeds: Team[];
}

/** One row per season with scores, newest first. Undecided places are null. */
export function champions(summaries: readonly SeasonSummary[]): ChampionsRow[] {
  return newestFirst(summaries)
    .filter(({ season }) => season.hasScores)
    .map(({ season, awards }) => {
      const at = (place: number): Team | null => {
        const placement = awards.podium.find((candidate) => candidate.place === place);
        return placement ? (teamFor(season, placement.rosterId) ?? null) : null;
      };

      const topSeeds = season.isRegularSeasonComplete
        ? awards.regularSeasonChamp
            .filter((entry) => entry.place === 1)
            .flatMap((entry) => {
              const team = teamFor(season, entry.rosterId);
              return team ? [team] : [];
            })
        : [];

      return { season, champion: at(1), runnerUp: at(2), third: at(3), topSeeds };
    });
}
