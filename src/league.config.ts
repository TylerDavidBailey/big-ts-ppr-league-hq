/**
 * Everything about this league that Sleeper does not know.
 *
 * The name we use, the money, and the wording of each rule live here and
 * nowhere else. Standings, scores, and every winner still come from Sleeper.
 * One config covers every season; if an older season paid out differently,
 * this is the file to grow.
 */

export interface AwardConfig {
  name: string;
  /** Emoji, matching Sleeper's tone. */
  icon: string;
  /** Dollars. */
  payout: number;
  /** One sentence explaining the rule, shown under the award. */
  rule: string;
}

export interface LeagueConfig {
  name: string;
  /**
   * The Sleeper league id of any season of this league.
   *
   * Earlier seasons are found by walking `previous_league_id` back from here.
   * Later seasons are found by asking the managers for their leagues the
   * following year, so this never needs a yearly edit. Bumping it to the
   * newest season saves a couple of requests, nothing more.
   */
  leagueId: string;
  /** Dollars per team. The pot is this times the number of teams. */
  buyIn: number;
  /** Playoff finish (1 = champion) to dollars. */
  playoffPayouts: Record<number, number>;
  awards: {
    regularSeasonChamp: AwardConfig;
    highestTeamWeek: AwardConfig;
    highestStarterWeek: AwardConfig;
  };
  punishment: Omit<AwardConfig, 'payout'>;
  /** How many places each award card shows, the winner included. */
  places: number;
  repoUrl: string;
  sleeperUrl: string;
}

export const LEAGUE: LeagueConfig = {
  name: "Big-T's PPR League",
  leagueId: '1373305494734651392',
  buyIn: 125,
  playoffPayouts: { 1: 700, 2: 300, 3: 125 },
  awards: {
    regularSeasonChamp: {
      name: '1 Seed',
      icon: '🥇',
      payout: 125,
      rule: 'Best regular-season record. Ties broken by total points scored.',
    },
    highestTeamWeek: {
      name: 'Highest Team Week',
      icon: '💥',
      payout: 125,
      rule: 'Most points scored by one team in a single regular-season week.',
    },
    highestStarterWeek: {
      name: 'Highest Starter Week',
      icon: '🚀',
      payout: 125,
      rule: 'Most points by a single started player in a regular-season week. Bench excluded.',
    },
  },
  punishment: {
    name: 'Beer Duty',
    icon: '🍺',
    rule: 'Lowest team points in a week shotguns a beer before Sunday 1:00 PM kickoff. Video to the group chat.',
  },
  places: 5,
  repoUrl: 'https://github.com/TylerDavidBailey/big-ts-ppr-league-hq',
  sleeperUrl: 'https://sleeper.com/leagues/1373305494734651392',
};
