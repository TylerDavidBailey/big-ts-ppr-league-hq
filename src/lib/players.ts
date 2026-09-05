/**
 * Player name lookup.
 *
 * Backed by `public/data/players.min.json`, a slim index committed to the repo
 * and refreshed weekly by CI (see `scripts/build-player-index.mjs`). Loading it
 * from our own origin keeps the 14 MB live endpoint out of the browser.
 *
 * The index is fetched once per session and memoised. A failure to load is not
 * fatal: ids fall back to a readable placeholder so a CDN hiccup degrades the
 * starter award's label rather than the whole page.
 */

/** `[displayName, position, team]`, the shape written by the build script. */
type PlayerTuple = [string, string | null, string | null];
type PlayerIndex = Record<string, PlayerTuple>;

export interface PlayerInfo {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  /** False when the id was not in the index and this is a placeholder. */
  known: boolean;
}

const INDEX_URL = `${import.meta.env.BASE_URL}data/players.min.json`;

let indexPromise: Promise<PlayerIndex> | null = null;

export function loadPlayerIndex(): Promise<PlayerIndex> {
  indexPromise ??= fetch(INDEX_URL, { headers: { Accept: 'application/json' } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Player index responded ${response.status}`);
      const parsed: unknown = await response.json();
      return parsed as PlayerIndex;
    })
    .catch((error: unknown) => {
      console.error('Could not load the player index; names will show as ids.', error);
      // Reset so a later navigation can retry rather than caching the failure.
      indexPromise = null;
      const empty: PlayerIndex = {};
      return empty;
    });

  return indexPromise;
}

/** Reset the memoised index. Test-only. */
export function resetPlayerIndex(): void {
  indexPromise = null;
}

export function lookupPlayer(index: PlayerIndex, playerId: string): PlayerInfo {
  const entry = index[playerId];
  if (!entry) {
    return { id: playerId, name: `Player ${playerId}`, position: null, team: null, known: false };
  }

  const [name, position, team] = entry;
  return { id: playerId, name, position, team, known: true };
}

/** Convenience for the award context, which only needs a name. */
export const playerNameResolver =
  (index: PlayerIndex) =>
  (playerId: string): string =>
    lookupPlayer(index, playerId).name;
