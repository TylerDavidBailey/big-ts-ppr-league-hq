import { describe, expect, it } from 'vitest';

import { buildSeason } from './buildSeason';
import { fixtureLeague, matchupsThrough, seasonFixture } from '@/test/fixtures';
import type { SleeperMatchup } from '@/lib/sleeper/types';

describe('buildSeason', () => {
  const season = buildSeason(seasonFixture());

  it('reads league identity and playoff configuration', () => {
    expect(season.season).toBe('2025');
    // Read from the fixture rather than hardcoded: the ids are anonymised, so
    // pinning a literal here only records the anonymiser's output.
    expect(season.leagueId).toBe(fixtureLeague.league_id);
    expect(season.playoffWeekStart).toBe(15);
    // Regular season is weeks 1-14 for this league; the rule is derived, not hardcoded.
    expect(season.regularSeasonEndWeek).toBe(14);
    expect(season.teams).toHaveLength(12);
    // Six teams from week 15 play three rounds, so the bracket ends in week 17.
    expect(season.playoffTeams).toBe(6);
    expect(season.playoffEndWeek).toBe(17);
  });

  it('names teams, falling back to the manager handle when team_name is absent', () => {
    for (const team of season.teams) {
      expect(team.name.length).toBeGreaterThan(0);
      expect(team.managerName.length).toBeGreaterThan(0);
    }
  });

  it('reassembles points from Sleeper split integer/decimal fields', () => {
    const roster = seasonFixture().rosters[0]!;
    const team = season.teamsByRosterId.get(roster.roster_id)!;
    const expected = (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100;
    expect(team.reported.pointsFor).toBeCloseTo(expected, 2);
  });

  it('pairs opponents by matchup_id and derives outcomes', () => {
    const week1 = season.weeks.find((week) => week.week === 1)!;
    expect(week1.played).toBe(true);

    for (const team of week1.teams) {
      expect(team.opponentRosterId).not.toBeNull();
      const opponent = week1.teams.find((other) => other.rosterId === team.opponentRosterId)!;
      // Each side must agree on who beat whom.
      expect(opponent.opponentRosterId).toBe(team.rosterId);
      if (team.outcome === 'win') expect(opponent.outcome).toBe('loss');
      if (team.outcome === 'loss') expect(opponent.outcome).toBe('win');
    }
  });

  it('aligns starter scores with the starters array and drops empty slots', () => {
    const week1 = season.weeks.find((week) => week.week === 1)!;
    const raw = seasonFixture().matchupsByWeek.get(1)!;

    for (const team of week1.teams) {
      const source = raw.find((matchup) => matchup.roster_id === team.rosterId)!;
      for (const starter of team.starters) {
        expect(source.starters?.[starter.slot]).toBe(starter.playerId);
        expect(starter.points).toBeCloseTo(source.starters_points?.[starter.slot] ?? 0, 2);
      }
      expect(team.starters.every((starter) => starter.playerId !== '0')).toBe(true);
    }
  });

  it('reads the perfect-lineup total from ppts', () => {
    const roster = seasonFixture().rosters[0]!;
    const team = season.teamsByRosterId.get(roster.roster_id)!;
    const expected = (roster.settings.ppts ?? 0) + (roster.settings.ppts_decimal ?? 0) / 100;
    expect(team.reported.maxPointsFor).toBeCloseTo(expected, 2);
  });

  it('puts every rostered player who did not start on the bench', () => {
    const week1 = season.weeks.find((week) => week.week === 1)!;
    const raw = seasonFixture().matchupsByWeek.get(1)!;

    for (const team of week1.teams) {
      const source = raw.find((matchup) => matchup.roster_id === team.rosterId)!;
      const started = new Set(source.starters ?? []);
      expect(team.bench).toHaveLength(
        (source.players ?? []).filter((id) => !started.has(id)).length,
      );
      for (const benched of team.bench) {
        expect(started.has(benched.playerId)).toBe(false);
        expect(benched.points).toBeCloseTo(source.players_points?.[benched.playerId] ?? 0, 2);
      }
    }
  });

  it('marks weeks with no matchup rows as unplayed', () => {
    const midSeason = buildSeason(seasonFixture({ matchupsByWeek: matchupsThrough(6) }));

    expect(midSeason.regularSeasonWeeks).toHaveLength(6);
    expect(midSeason.weeks.find((week) => week.week === 7)?.played).toBe(false);
    expect(midSeason.hasScores).toBe(true);
  });

  it('separates regular season from postseason by playoff_week_start', () => {
    expect(season.weeks.find((week) => week.week === 14)?.phase).toBe('regular');
    expect(season.weeks.find((week) => week.week === 15)?.phase).toBe('postseason');
    // Regular-season weeks never include playoff weeks.
    expect(season.regularSeasonWeeks.every((week) => week.week <= 14)).toBe(true);
  });

  it('survives a league with no games played at all', () => {
    const preDraft = buildSeason(
      seasonFixture({
        matchupsByWeek: matchupsThrough(0),
        winnersBracket: [],
        losersBracket: [],
      }),
    );

    expect(preDraft.hasScores).toBe(false);
    expect(preDraft.isComplete).toBe(false);
    expect(preDraft.regularSeasonWeeks).toHaveLength(0);
    // Every team still appears, so the standings table renders rather than vanishing.
    expect(preDraft.standings).toHaveLength(12);
    expect(preDraft.standings.every((row) => row.wins === 0 && row.pointsFor === 0)).toBe(true);
  });

  it('recognises a finished season from the bracket', () => {
    expect(season.isComplete).toBe(true);
  });
});

describe('buildSeason resilience', () => {
  const week1 = seasonFixture().matchupsByWeek.get(1)!;

  const withWeek1 = (matchups: SleeperMatchup[]) =>
    buildSeason(seasonFixture({ matchupsByWeek: new Map([[1, matchups]]) }));

  // The fixture is ordered by roster id, so pick a genuine pair by matchup_id.
  const home = week1[0]!;
  const away = week1.find(
    (matchup) => matchup.matchup_id === home.matchup_id && matchup.roster_id !== home.roster_id,
  )!;

  it('treats a roster with no opponent as a bye rather than a loss', () => {
    // Removing one side of a pair leaves its opponent unmatched.
    const orphaned = withWeek1(week1.filter((matchup) => matchup.roster_id !== home.roster_id));
    const survivor = orphaned.weeks[0]!.teams.find((team) => team.rosterId === away.roster_id);

    expect(survivor?.opponentRosterId).toBeNull();
    expect(survivor?.opponentPoints).toBeNull();
    expect(survivor?.outcome).toBe('none');
    // A bye scores points but decides no result.
    expect(orphaned.standings.find((row) => row.rosterId === away.roster_id)?.wins).toBe(0);
  });

  it('records a tie when both sides score the same', () => {
    const tied = withWeek1([
      { ...home, points: 100 },
      { ...away, points: 100 },
    ]);

    expect(tied.weeks[0]!.teams.every((team) => team.outcome === 'tie')).toBe(true);
    expect(tied.standings.find((row) => row.rosterId === home.roster_id)?.ties).toBe(1);
  });

  it('scores a starter as zero when its points are missing', () => {
    const truncated = withWeek1([{ ...home, starters_points: null }, away]);

    const team = truncated.weeks[0]!.teams.find((row) => row.rosterId === home.roster_id);
    expect(team!.starters.length).toBeGreaterThan(0);
    expect(team!.starters.every((starter) => starter.points === 0)).toBe(true);
  });

  it('ignores a matchup row with no matchup_id', () => {
    const unpaired = withWeek1([{ ...home, matchup_id: null }]);

    expect(unpaired.weeks[0]!.teams[0]!.opponentRosterId).toBeNull();
  });

  it('treats an all-zero week as unplayed', () => {
    const zeroed = withWeek1(week1.map((matchup) => ({ ...matchup, points: 0 })));

    expect(zeroed.weeks[0]!.played).toBe(false);
    expect(zeroed.hasScores).toBe(false);
  });

  it('falls back to a default playoff week when the league reports none', () => {
    const fixture = seasonFixture();
    const noPlayoffWeek = buildSeason({
      ...fixture,
      league: { ...fixture.league, settings: {} },
    });

    expect(noPlayoffWeek.playoffWeekStart).toBe(15);
    expect(noPlayoffWeek.regularSeasonEndWeek).toBe(14);
    // With no bracket size there is nothing to span, so the end week stays put
    // rather than inventing rounds.
    expect(noPlayoffWeek.playoffEndWeek).toBe(15);
  });

  it('reports the playoff span for a season with no games played', () => {
    const fixture = seasonFixture();
    const preDraft = buildSeason({
      ...fixture,
      league: { ...fixture.league, status: 'pre_draft' },
      matchupsByWeek: new Map(),
      winnersBracket: [],
      losersBracket: [],
    });

    expect(preDraft.weeks).toHaveLength(0);
    expect(preDraft.playoffWeekStart).toBe(15);
    expect(preDraft.playoffEndWeek).toBe(17);
  });

  it('names an unclaimed roster rather than rendering a blank', () => {
    const fixture = seasonFixture();
    const orphanRoster = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster) => ({ ...roster, owner_id: null })),
    });

    expect(orphanRoster.teams.every((team) => team.name === 'Unclaimed team')).toBe(true);
  });

  it('prefers metadata.team_name over the manager handle', () => {
    const fixture = seasonFixture();
    const named = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster) => ({
        ...roster,
        metadata: { ...roster.metadata, team_name: 'The Real Name' },
      })),
    });

    expect(named.teams.every((team) => team.name === 'The Real Name')).toBe(true);
  });
});

describe('buildSeason week validity', () => {
  const season = buildSeason(seasonFixture());

  it('keeps a playoff week that has byes but still pairs opponents', () => {
    // Weeks 15 and 17 of the fixture give four rosters a bye and pair the
    // other eight.
    for (const weekNumber of [15, 17]) {
      const week = season.weeks.find((candidate) => candidate.week === weekNumber)!;
      expect(week.played).toBe(true);
      expect(week.teams.some((team) => team.opponentRosterId === null)).toBe(true);
      expect(week.teams.some((team) => team.opponentRosterId !== null)).toBe(true);
    }
  });

  it('drops a week that scores but pairs nobody', () => {
    // After this league ended, Sleeper still returned week 18 roster scores
    // with a null matchup_id on every row. That is not a week of the league.
    const week18 = season.weeks.find((week) => week.week === 18)!;

    expect(week18.teams.some((team) => team.points > 0)).toBe(true);
    expect(week18.teams.every((team) => team.opponentRosterId === null)).toBe(true);
    expect(week18.played).toBe(false);
  });

  it('ends the season on the championship week', () => {
    expect(season.weeks.filter((week) => week.played).at(-1)?.week).toBe(17);
  });

  it('still accepts a week 18 that has real matchups', () => {
    // A league that plays through week 18 must not be truncated by the rule
    // above.
    const fixture = seasonFixture();
    const week17 = fixture.matchupsByWeek.get(17)!;
    const playsWeek18 = buildSeason({
      ...fixture,
      matchupsByWeek: new Map([...fixture.matchupsByWeek, [18, week17]]),
    });

    expect(playsWeek18.weeks.find((week) => week.week === 18)?.played).toBe(true);
  });
});
