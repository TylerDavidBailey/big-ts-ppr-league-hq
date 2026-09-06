import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { mockSleeper, type MockOptions } from './fixtures';

/**
 * Full-page screenshots of every state the site can be in, on a phone and a
 * desktop, for reviewing the UI by eye.
 *
 * Tagged `@shots` so the mocked suite skips it. `make shots` runs it against
 * the fixtures; `make shots-live` (`SHOTS_LIVE=1`) leaves Sleeper unmocked so
 * the same set comes from the real league. Output lands in `screenshots/`,
 * which is ignored by git.
 */
const OUT_DIR = process.env.SHOTS_DIR ?? 'screenshots';
const LIVE = Boolean(process.env.SHOTS_LIVE);

interface Scenario {
  label: string;
  path: string;
  mock?: MockOptions;
  /** Text that must be on the page before the shot, so nothing is half-loaded. */
  ready: string | RegExp;
  /** Skip under `SHOTS_LIVE`, because the state cannot be produced from real data. */
  mockOnly?: boolean;
}

/** The finished season the fixtures capture; the live league has the same year. */
const finishedSeason = '2025';

const SCENARIOS: Scenario[] = [
  { label: '01-current-overview', path: '/', ready: /Overview|season/ },
  {
    label: '02-live-overview',
    path: '/',
    mock: { liveWeek: 9 },
    ready: 'Week 9 in progress',
    mockOnly: true,
  },
  {
    label: '03-live-beer-duty',
    path: '/#/2026/beer-duty',
    mock: { liveWeek: 9 },
    ready: 'In progress',
    mockOnly: true,
  },
  {
    label: '04-live-standings',
    path: '/#/2026/standings',
    mock: { liveWeek: 9 },
    ready: 'Through week 8',
    mockOnly: true,
  },
  { label: '05-final-overview', path: `/#/${finishedSeason}`, ready: 'Final' },
  { label: '06-final-awards', path: `/#/${finishedSeason}/awards`, ready: 'Highest Starter Week' },
  { label: '07-final-beer-duty', path: `/#/${finishedSeason}/beer-duty`, ready: 'Season tally' },
  { label: '08-final-standings', path: `/#/${finishedSeason}/standings`, ready: 'Power rankings' },
  { label: '09-final-stats', path: `/#/${finishedSeason}/stats`, ready: 'Lineup efficiency' },
  { label: '10-final-rules', path: `/#/${finishedSeason}/rules`, ready: 'Season format' },
  { label: '11-all-time-managers', path: '/#/all-time', ready: /seasons? played/ },
  { label: '12-all-time-champions', path: '/#/all-time/champions', ready: 'Champions by season' },
  { label: '13-all-time-records', path: '/#/all-time/records', ready: 'Record book' },
  {
    label: '14-fetch-error',
    path: '/',
    mock: { failCurrentLeague: true },
    ready: 'Could not reach Sleeper',
    mockOnly: true,
  },
  { label: '15-unknown-route', path: '/#/nonsense/path', ready: /season|page/i },
];

test.describe('screenshots @shots', () => {
  for (const scenario of SCENARIOS) {
    test(scenario.label, async ({ page }, testInfo) => {
      test.skip(LIVE && Boolean(scenario.mockOnly), 'needs mocked data');
      if (!LIVE) await mockSleeper(page, scenario.mock);

      await page.goto(scenario.path);
      await expect(page.getByText(scenario.ready).first()).toBeVisible({ timeout: 30_000 });
      // Let avatars, fonts and the player index settle.
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const dir = join(OUT_DIR, testInfo.project.name);
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: join(dir, `${scenario.label}.png`), fullPage: true });
    });
  }
});
