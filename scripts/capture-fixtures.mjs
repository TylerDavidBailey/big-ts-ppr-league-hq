#!/usr/bin/env node
/**
 * Capture real Sleeper responses into `src/test/fixtures/`.
 *
 * Tests run against real API shapes rather than hand-written approximations,
 * but offline and deterministically. Re-run this only when a test needs a case
 * the current fixtures do not cover.
 *
 * Usage: node scripts/capture-fixtures.mjs [leagueId]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://api.sleeper.app/v1';
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../src/test/fixtures');

/** A completed 12-team season: the richest case for the domain tests. */
const DEFAULT_LEAGUE = '1252998165817208832';

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${path} -> ${response.status}`);
  return response.json();
}

async function write(name, data) {
  const file = join(OUT_DIR, `${name}.json`);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  process.stdout.write(`  ${name}.json\n`);
}

async function main() {
  const leagueId = process.argv[2] ?? DEFAULT_LEAGUE;
  await mkdir(OUT_DIR, { recursive: true });

  process.stdout.write(`Capturing league ${leagueId} ...\n`);
  const league = await get(`/league/${leagueId}`);

  await write('league', league);
  await write('users', await get(`/league/${leagueId}/users`));
  await write('rosters', await get(`/league/${leagueId}/rosters`));
  await write('winnersBracket', await get(`/league/${leagueId}/winners_bracket`));
  await write('losersBracket', await get(`/league/${leagueId}/losers_bracket`));

  const lastWeek = Math.min(18, (league.settings.playoff_week_start ?? 15) + 3);
  const matchups = {};
  for (let week = 1; week <= lastWeek; week += 1) {
    matchups[week] = await get(`/league/${leagueId}/matchups/${week}`);
  }
  await write('matchups', matchups);

  process.stdout.write('Done.\n');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
