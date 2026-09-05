/**
 * Strip real people out of captured Sleeper responses.
 *
 * The fixtures come from a real league, so they arrive carrying real Sleeper
 * handles, user ids, avatar hashes, and the league's own name. None of that is
 * needed to test league logic, and none of it belongs in a public repo.
 *
 * Every number survives untouched: scores, records, roster ids, matchup ids,
 * player ids, and the per-week `record` strings. That is what the tests assert
 * on, so anonymising costs no test value.
 *
 * The mapping is positional and therefore stable: the same input always
 * produces the same output, so re-capturing does not churn the diff.
 */

/** Invented handles, in the style of real ones, so screenshots still look real. */
const HANDLES = [
  'gridironghost',
  'punt_god',
  'WaiverWizard',
  'ChalkAndAwe',
  'thebyeweek',
  'FourthDownFrank',
  'PlayActionPam',
  'redzone_rita',
  'HailMaryHank',
  'CoverTwoCarl',
  'flexappeal',
  'ScreenPassSam',
  'BootlegBetty',
  'AudibleAndy',
  'NickelDefense',
  'zonebusters',
];

const SYNTHETIC_LEAGUE_NAME = 'The Sunday Scaries';

/**
 * League-chat fields Sleeper attaches to the league object.
 *
 * They carry the last chat author's handle, id, and avatar. The app never reads
 * any of them, so they are dropped rather than replaced.
 */
const CHAT_FIELDS = [
  'last_author_avatar',
  'last_author_display_name',
  'last_author_id',
  'last_author_is_bot',
  'last_message_attachment',
  'last_message_id',
  'last_message_text_map',
  'last_message_time',
  'last_pinned_message_id',
  'last_read_id',
];

function withoutChat(league) {
  return Object.fromEntries(
    Object.entries(league).filter(([field]) => !CHAT_FIELDS.includes(field)),
  );
}

/** Sleeper ids are 18 to 19 digit strings. Keep the shape, drop the identity. */
const syntheticId = (prefix, index) => `${prefix}${String(index).padStart(6, '0')}`;

const handleFor = (index) => HANDLES[index % HANDLES.length] ?? `manager${index}`;

/**
 * Build the lookup tables.
 *
 * Users are keyed in the order the API returned them, and leagues in the order
 * the chain walks, so both mappings are deterministic.
 */
function buildMaps(users, league) {
  const userIds = new Map();
  users.forEach((user, index) => {
    userIds.set(user.user_id, {
      user_id: syntheticId('9000000000000', index + 1),
      display_name: handleFor(index),
    });
  });

  const leagueIds = new Map();
  let seasonIndex = 0;
  for (const id of [league.league_id, league.previous_league_id]) {
    if (id && !leagueIds.has(id)) {
      leagueIds.set(id, syntheticId('8000000000000', ++seasonIndex));
    }
  }

  return { userIds, leagueIds };
}

const mapLeagueId = (leagueIds, id) => (id == null ? id : (leagueIds.get(id) ?? id));

export function anonymize({ league, users, rosters, matchups, winnersBracket, losersBracket }) {
  const { userIds, leagueIds } = buildMaps(users, league);

  const anonLeague = {
    ...withoutChat(league),
    name: SYNTHETIC_LEAGUE_NAME,
    avatar: null,
    league_id: mapLeagueId(leagueIds, league.league_id),
    previous_league_id: mapLeagueId(leagueIds, league.previous_league_id),
  };

  const anonUsers = users.map((user) => {
    const replacement = userIds.get(user.user_id);
    return {
      ...user,
      user_id: replacement?.user_id ?? user.user_id,
      display_name: replacement?.display_name ?? user.display_name,
      avatar: null,
      league_id: mapLeagueId(leagueIds, user.league_id),
      // Push notification preferences say nothing about league logic.
      metadata: null,
    };
  });

  const anonRosters = rosters.map((roster) => ({
    ...roster,
    league_id: mapLeagueId(leagueIds, roster.league_id),
    owner_id: roster.owner_id ? (userIds.get(roster.owner_id)?.user_id ?? null) : roster.owner_id,
    co_owners: roster.co_owners
      ? roster.co_owners.map((id) => userIds.get(id)?.user_id ?? id)
      : roster.co_owners,
    // `record` and `streak` are pure results, so they stay. A team name would
    // not, but this league has none set.
    metadata: roster.metadata ? { ...roster.metadata, team_name: undefined } : roster.metadata,
  }));

  // Matchups and brackets reference rosters by number only, so they need no
  // changes. They are passed through so callers can treat this as the one
  // place fixtures are transformed.
  return {
    league: anonLeague,
    users: anonUsers,
    rosters: anonRosters,
    matchups,
    winnersBracket,
    losersBracket,
  };
}
