/**
 * Regular-season standings, computed from matchup results rather than read off
 * Sleeper's roster settings.
 *
 * Computing them keeps the definition of "regular season" tied to the league's
 * own `playoff_week_start`, and stays correct for a league mid-season or one
 * whose roster totals include consolation games.
 */
import type { StandingsRow, Team, Week } from './types';

/** Sleeper breaks ties on wins with total points scored. */
function compareRows(a: StandingsRow, b: StandingsRow): number {
  const aWinPct = a.wins + a.ties * 0.5;
  const bWinPct = b.wins + b.ties * 0.5;
  if (aWinPct !== bWinPct) return bWinPct - aWinPct;
  if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor;
  return a.rosterId - b.rosterId;
}

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

  const ranked = [...rows.values()].sort(compareRows);
  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
    pointsFor: round2(row.pointsFor),
    pointsAgainst: round2(row.pointsAgainst),
    streak: trailingStreak(row.form),
  }));
}

/** Fantasy points carry two decimals; float addition does not. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
