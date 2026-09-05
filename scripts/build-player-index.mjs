#!/usr/bin/env node
/**
 * Generate `public/data/players.min.json`.
 *
 * Sleeper's `/players/nfl` endpoint is ~14.6 MB of JSON covering ~12,200
 * players. It is far too heavy to fetch in a browser, and Sleeper explicitly
 * asks that it be called at most once a day. So CI fetches it on a schedule and
 * commits a slimmed index instead.
 *
 * Output shape, chosen to keep the file small:
 *   { "3294": ["Dak Prescott", "QB", "DAL"], "SF": ["San Francisco 49ers", "DEF", "SF"] }
 *
 * Every player is kept, including retired ones. Historical seasons reference
 * players who are long gone.
 *
 * Usage: node scripts/build-player-index.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://api.sleeper.app/v1/players/nfl';
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/players.min.json');

/**
 * Team defenses have `first_name`/`last_name` but no `full_name`, so the
 * fallback is not optional. Without it every DEF renders nameless.
 */
function displayName(player, id) {
  const full = player.full_name?.trim();
  if (full) return full;

  const joined = [player.first_name, player.last_name].filter(Boolean).join(' ').trim();
  return joined || id;
}

async function main() {
  process.stdout.write(`Fetching ${SOURCE} ...\n`);
  const response = await fetch(SOURCE, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Sleeper responded ${response.status} ${response.statusText}`);
  }

  const players = await response.json();
  const ids = Object.keys(players);
  if (ids.length < 1000) {
    // A truncated or error payload should fail the job, not overwrite a good index.
    throw new Error(`Refusing to write a suspiciously small index (${ids.length} players)`);
  }

  // Sorted keys keep the committed diff readable when only a few players change.
  const index = {};
  for (const id of ids.sort()) {
    const player = players[id];
    index[id] = [displayName(player, id), player.position ?? null, player.team ?? null];
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(index)}\n`, 'utf8');

  const bytes = Buffer.byteLength(JSON.stringify(index));
  process.stdout.write(
    `Wrote ${ids.length.toLocaleString()} players to ${OUTPUT} (${(bytes / 1024).toFixed(0)} KB)\n`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
