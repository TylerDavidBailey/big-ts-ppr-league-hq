/** URL builders for Sleeper's public CDN assets. */

const CDN = 'https://sleepercdn.com';

export const avatarUrl = (avatarId: string | null | undefined, size: 'full' | 'thumb' = 'thumb') =>
  avatarId ? `${CDN}/avatars/${size === 'thumb' ? 'thumbs/' : ''}${avatarId}` : null;

/**
 * Player headshot. Team defenses use a team abbreviation as their player id and
 * have no headshot, so they get the team logo instead.
 */
export function playerImageUrl(playerId: string, position?: string | null): string {
  if (position === 'DEF' || /^[A-Z]{2,3}$/.test(playerId)) {
    return `${CDN}/images/team_logos/nfl/${playerId.toLowerCase()}.png`;
  }
  return `${CDN}/content/nfl/players/thumb/${playerId}.jpg`;
}

export const teamLogoUrl = (team: string | null | undefined) =>
  team ? `${CDN}/images/team_logos/nfl/${team.toLowerCase()}.png` : null;
