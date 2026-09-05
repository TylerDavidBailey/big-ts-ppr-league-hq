import { describe, expect, it } from 'vitest';

import { buildSeason } from './buildSeason';
import { buildBracket } from './bracket';
import { fixtureUsers, seasonFixture } from '@/test/fixtures';

describe('median scoring', () => {
  const fixture = seasonFixture();

  const medianLeague = () =>
    buildSeason({
      ...fixture,
      league: {
        ...fixture.league,
        settings: { ...fixture.league.settings, league_average_match: 1 },
      },
    });

  it('is detected from league_average_match', () => {
    expect(medianLeague().usesMedianScoring).toBe(true);
    expect(buildSeason(fixture).usesMedianScoring).toBe(false);
  });

  it('takes records from Sleeper rather than from head-to-head alone', () => {
    // A median league scores a second result each week against the league
    // median, which is absent from the matchup data. Computing from matchups
    // alone would report roughly half of every record.
    const season = medianLeague();

    for (const row of season.standings) {
      const team = season.teamsByRosterId.get(row.rosterId)!;
      expect(row.wins).toBe(team.reported.wins);
      expect(row.losses).toBe(team.reported.losses);
      expect(row.pointsFor).toBeCloseTo(team.reported.pointsFor, 2);
    }
  });

  it('still ranks and flags ties', () => {
    const season = medianLeague();
    expect(season.standings.map((row) => row.rank)).toEqual(
      Array.from({ length: season.teams.length }, (_, index) => index + 1),
    );
    expect(season.standings.every((row) => typeof row.tied === 'boolean')).toBe(true);
  });
});

describe('co-managed rosters', () => {
  const fixture = seasonFixture();

  it('names every manager on the roster', () => {
    const [first, second] = fixtureUsers;
    const season = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster, index) =>
        index === 0
          ? { ...roster, owner_id: first!.user_id, co_owners: [second!.user_id] }
          : roster,
      ),
    });

    const team = season.teams.find((candidate) => candidate.coManagerNames.length > 0)!;
    expect(team.managerName).toBe(`${first!.display_name} & ${second!.display_name}`);
    expect(team.coManagerNames).toEqual([second!.display_name]);
  });

  it('does not repeat the owner when Sleeper lists them in co_owners', () => {
    const [first] = fixtureUsers;
    const season = buildSeason({
      ...fixture,
      rosters: fixture.rosters.map((roster, index) =>
        index === 0 ? { ...roster, owner_id: first!.user_id, co_owners: [first!.user_id] } : roster,
      ),
    });

    const team = season.teamsByRosterId.get(fixture.rosters[0]!.roster_id)!;
    expect(team.managerName).toBe(first!.display_name);
    expect(team.coManagerNames).toEqual([]);
  });

  it('leaves a solo roster unchanged', () => {
    const season = buildSeason(fixture);
    expect(season.teams.every((team) => team.coManagerNames.length === 0)).toBe(true);
    expect(season.teams.every((team) => !team.managerName.includes(' & '))).toBe(true);
  });
});

describe('a bracket mid-playoffs', () => {
  it('emits no placement for a game that has not been decided', () => {
    // An undecided game can omit `w` and `l` entirely rather than sending null.
    // Reading them loosely is what stops a placement with an undefined roster
    // rendering as "Unknown team".
    const bracket = buildBracket([{ r: 3, m: 6, t1: 7, t2: 1, w: null, l: null, p: 1 }]);
    expect(bracket.placements).toEqual([]);
  });

  it('records only the half of a placement game that is known', () => {
    const bracket = buildBracket([{ r: 3, m: 6, t1: 7, t2: 1, w: 7, l: null, p: 1 }]);
    expect(bracket.placements).toEqual([{ place: 1, rosterId: 7 }]);
  });

  it('never emits a placement without a roster', () => {
    const bracket = buildBracket([
      { r: 2, m: 4, t1: 3, t2: 4, w: 3, l: 4 },
      { r: 3, m: 6, t1: null, t2: null, w: null, l: null, p: 1 },
      { r: 3, m: 7, t1: 5, t2: 6, w: 5, l: 6, p: 3 },
    ]);

    expect(bracket.placements.every((placement) => typeof placement.rosterId === 'number')).toBe(
      true,
    );
    expect(bracket.placements).toEqual([
      { place: 3, rosterId: 5 },
      { place: 4, rosterId: 6 },
    ]);
  });
});
