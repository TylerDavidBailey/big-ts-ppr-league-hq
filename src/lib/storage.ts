/**
 * Recently-viewed leagues, persisted to localStorage.
 *
 * Everything read back is validated, so a corrupted blob or a schema change
 * between releases degrades to an empty list instead of taking down the landing
 * page. Storage access is wrapped too: private browsing and blocked site data
 * both throw on access in some browsers.
 */
import { z } from 'zod';

const STORAGE_KEY = 'slhq:v1:recent-leagues';
const CHAIN_HEADS_KEY = 'slhq:v1:chain-heads';
const MAX_RECENT = 8;
/** Enough for many leagues' worth of seasons without unbounded growth. */
const MAX_CHAIN_HEADS = 200;

const recentLeagueSchema = z.object({
  leagueId: z.string().min(1),
  name: z.string(),
  season: z.string(),
  avatarId: z.string().nullable(),
  totalRosters: z.number().int().nonnegative(),
  lastOpenedAt: z.number().int().nonnegative(),
});

const recentLeaguesSchema = z.array(recentLeagueSchema);

export type RecentLeague = z.infer<typeof recentLeagueSchema>;

function storage(): Storage | null {
  try {
    // Access itself throws in private mode and when site data is blocked, and
    // the global is genuinely absent in some runtimes, neither of which the DOM
    // lib types express.
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function readStorage(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    storage()?.setItem(key, value);
  } catch {
    // Quota exceeded or storage disabled. Both of these caches are a
    // convenience, so losing them is not worth surfacing to the user.
  }
}

export function getRecentLeagues(): RecentLeague[] {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = recentLeaguesSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return [...parsed.data].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** Record a visit, moving the league to the front of the list. */
export function rememberLeague(league: Omit<RecentLeague, 'lastOpenedAt'>): RecentLeague[] {
  const next = [
    { ...league, lastOpenedAt: Date.now() },
    ...getRecentLeagues().filter((entry) => entry.leagueId !== league.leagueId),
  ].slice(0, MAX_RECENT);

  writeStorage(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function forgetLeague(leagueId: string): RecentLeague[] {
  const next = getRecentLeagues().filter((entry) => entry.leagueId !== leagueId);
  writeStorage(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentLeagues(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // See writeStorage.
  }
}

/*
 * Season chain heads.
 *
 * Sleeper links each season to the one before it through `previous_league_id`,
 * and there is no link forward. Someone who opens a 2025 link directly can
 * therefore never discover the 2026 season from the API alone.
 *
 * Walking a chain teaches us the newest season for every league in it, so we
 * record that here. A later visit to any season in the chain then starts from
 * the newest one and shows every season in the switcher.
 */
const chainHeadsSchema = z.record(z.string(), z.string());

function getChainHeads(): Record<string, string> {
  const raw = readStorage(CHAIN_HEADS_KEY);
  if (!raw) return {};

  try {
    const parsed = chainHeadsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Record that every league in `chain` belongs to the chain headed by its first entry. */
export function rememberChain(chain: readonly { league_id: string }[]): void {
  const head = chain[0]?.league_id;
  if (!head) return;

  const heads = getChainHeads();
  for (const league of chain) heads[league.league_id] = head;

  // Oldest insertions fall off first; Object key order is insertion order.
  const entries = Object.entries(heads).slice(-MAX_CHAIN_HEADS);
  writeStorage(CHAIN_HEADS_KEY, JSON.stringify(Object.fromEntries(entries)));
}

/** The newest known season for this league, or the league itself if none is known. */
export function resolveChainHead(leagueId: string): string {
  return getChainHeads()[leagueId] ?? leagueId;
}

export function clearChainHeads(): void {
  try {
    storage()?.removeItem(CHAIN_HEADS_KEY);
  } catch {
    // See writeStorage.
  }
}
