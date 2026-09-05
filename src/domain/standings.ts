/**
 * Regular-season standings, computed from matchup results rather than read off
 * Sleeper's roster settings.
 *
 * Computing them keeps the definition of "regular season" tied to the league's
 * own `playoff_week_start`, and stays correct for a league mid-season or one
 * whose roster totals include consolation games.
 */
import type { StandingsRow, Team, Week } from './types';

/** Wins, then total points scored, which is how Sleeper seeds a league. */
function compareRows(a: StandingsRow, b: StandingsRow): number {
  const aWinPct = a.wins + a.ties * 0.5;
  const bWinPct = b.wins + b.ties * 0.5;
  if (aWinPct !== bWinPct) return bWinPct - aWinPct;
  if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor;
  // Nothing left to separate them. Roster id only keeps the sort stable; the
  // `tied` flag is what tells the rest of the app the order is arbitrary.
  return a.rosterId - b.rosterId;
}

/** Level on both record and points, so their relative order means nothing. */
const isLevel = (a: StandingsRow, b: StandingsRow): boolean =>
  a.wins + a.ties * 0.5 === b.wins + b.ties * 0.5 && a.pointsFor === b.pointsFor;

function trailingStreak(form: StandingsRow['form']): StandingsRow['streak'] {
  const last = form.at(-1);
  if (!last) return null;

  let length = 0;
  for (let i = form.length - 1; i >= 0 && form[i] === last; i -= 1) {
    length += 1;
  }
  return { kind: last, length };
}

/**
 * Standings taken from Sleeper's own roster totals.
 *
 * Used when the league plays the weekly median, where a week produces two
 * results per team and head-to-head matchups alone cannot reconstruct the
 * record. Sleeper has already done that arithmetic, so trust it rather than
 * publish a record that is quietly half right.
 */
export function standingsFromReported(teams: Team[], regularSeasonWeeks: Week[]): StandingsRow[] {
  const form = new Map<number, StandingsRow['form']>();
  for (const week of regularSeasonWeeks) {
    if (!week.played) continue;
    for (const teamWeek of week.teams) {
      if (teamWeek.outcome === 'none') continue;
      const existing = form.get(teamWeek.rosterId) ?? [];
      existing.push(teamWeek.outcome);
      form.set(teamWeek.rosterId, existing);
    }
  }

  const rows = teams.map((team): StandingsRow => {
    const teamForm = form.get(team.rosterId) ?? [];
    return {
      rosterId: team.rosterId,
      rank: 0,
      tied: false,
      wins: team.reported.wins,
      losses: team.reported.losses,
      ties: team.reported.ties,
      pointsFor: round2(team.reported.pointsFor),
      pointsAgainst: round2(team.reported.pointsAgainst),
      // Head-to-head form only. The median result is not in the matchup data.
      form: teamForm,
      streak: trailingStreak(teamForm),
    };
  });

  const ranked = [...rows].sort(compareRows);
  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
    tied: ranked.some((other) => other.rosterId !== row.rosterId && isLevel(other, row)),
  }));
}

/**
 * Build ranked standings from the played regular-season weeks.
 *
 * Teams with no games played still appear at the bottom with a zeroed record,
 * so a pre-draft league renders a full table rather than an empty one.
 */
export function computeStandings(teams: Team[], regularSeasonWeeks: Week[]): StandingsRow[] {
  const rows = new Map<number, StandingsRow>(
    teams.map((team) => [
      team.rosterId,
      {
        rosterId: team.rosterId,
        rank: 0,
        tied: false,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        form: [],
        streak: null,
      },
    ]),
  );

  for (const week of regularSeasonWeeks) {
    if (!week.played) continue;

    for (const teamWeek of week.teams) {
      const row = rows.get(teamWeek.rosterId);
      if (!row) continue;

      row.pointsFor += teamWeek.points;
      row.pointsAgainst += teamWeek.opponentPoints ?? 0;

      if (teamWeek.outcome === 'none') continue;
      row.form.push(teamWeek.outcome);
      if (teamWeek.outcome === 'win') row.wins += 1;
      else if (teamWeek.outcome === 'loss') row.losses += 1;
      else row.ties += 1;
    }
  }

  const ranked = [...rows.values()]
    .map((row) => ({
      ...row,
      pointsFor: round2(row.pointsFor),
      pointsAgainst: round2(row.pointsAgainst),
    }))
    .sort(compareRows);

  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
    tied: ranked.some((other) => other.rosterId !== row.rosterId && isLevel(other, row)),
    streak: trailingStreak(row.form),
  }));
}

/** Fantasy points carry two decimals; float addition does not. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
