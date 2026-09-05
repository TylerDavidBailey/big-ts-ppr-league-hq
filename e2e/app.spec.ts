import { expect, test } from '@playwright/test';

import { mockSleeper } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockSleeper(page);
});

test.describe('the landing page', () => {
  test('shows the newest season with the rules and payouts before any game', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: "Big-T's PPR League" })).toBeVisible();
    // `exact` matches the status badge, not the sentence next to it.
    await expect(page.getByText('Pre-draft', { exact: true })).toBeVisible();
    await expect(page.getByText('No games played yet')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Rules and payouts' })).toBeVisible();
    await expect(page.getByText('$1,500 pot')).toBeVisible();

    // Three podium slots waiting on the season, each with its payout.
    const podium = page.getByRole('list', { name: 'Playoff finishes' });
    await expect(podium.getByText('TBD')).toHaveCount(3);
    await expect(podium.getByText('$700')).toBeVisible();
    await expect(podium.getByText('$300')).toBeVisible();
    await expect(podium.getByText('$125')).toBeVisible();
  });

  test('lists every season in the nav, newest first', async ({ page }) => {
    await page.goto('/');

    const years = page.getByRole('navigation', { name: 'Season', exact: true }).getByRole('link');
    await expect(years).toHaveText(['2026', '2025', '2024', 'All-time']);
    await expect(years.first()).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('a new season the config does not know about', () => {
  test('is found through a manager and becomes the landing page', async ({ page }) => {
    await mockSleeper(page, { newerSeasonExists: true });
    await page.goto('/');

    await expect(page.getByText('Pre-draft', { exact: true })).toBeVisible();
    const years = page.getByRole('navigation', { name: 'Season', exact: true }).getByRole('link');
    await expect(years).toHaveText(['2026', '2025', '2024', 'All-time']);
    await expect(years.first()).toHaveAttribute('aria-current', 'page');

    // The configured season is still reachable by year.
    await page.goto('/#/2025');
    await expect(page.getByText('Final', { exact: true })).toBeVisible();
  });
});

test.describe('a finished season', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/2025');
    await expect(page.getByText('Final', { exact: true })).toBeVisible();
  });

  test('names the podium from the bracket, with the money', async ({ page }) => {
    const podium = page.getByRole('list', { name: 'Playoff finishes' });
    const champion = podium.getByRole('listitem').filter({ hasText: 'Champion' });
    await expect(champion).toContainText('redzone_rita');
    await expect(champion).toContainText('$700');

    await expect(podium.getByText('Runner-up')).toBeVisible();
    await expect(podium.getByText('Third place')).toBeVisible();
  });

  test('resolves every paid award with five places', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '1 Seed' })).toBeVisible();
    await expect(page.getByText('2,237.72 PF')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Highest Team Week' })).toBeVisible();
    await expect(page.getByText('200.52 pts')).toBeVisible();

    // The starter award must name a player, not a raw Sleeper id.
    await expect(page.getByRole('heading', { name: 'Highest Starter Week' })).toBeVisible();
    await expect(page.getByText('Jahmyr Gibbs')).toBeVisible();
    await expect(page.getByText('55.40 pts')).toBeVisible();

    // Places 2 to 5 sit under each winner.
    await expect(page.getByText('5', { exact: true })).toHaveCount(3);
  });

  test('lists a beer duty loser for all 14 regular-season weeks', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Beer Duty' })).toBeVisible();
    await expect(page.getByText('14 weeks')).toBeVisible();

    const weeks = page.getByRole('list', { name: 'Beer duty by week' });
    for (const week of [1, 7, 14]) {
      await expect(weeks.getByText(`Wk ${week}`, { exact: true })).toBeVisible();
    }
    // Week 15 is the playoffs, so it carries no punishment.
    await expect(weeks.getByText('Wk 15', { exact: true })).toBeHidden();
  });

  test('ranks the standings and derives the stats behind them', async ({ page }) => {
    await page.getByRole('link', { name: 'Standings' }).click();
    await expect(page).toHaveURL(/#\/2025\/standings$/);

    const leader = page.getByRole('row').filter({ hasText: 'HailMaryHank' }).first();
    await expect(leader).toContainText('14-0');
    await expect(leader).toContainText('2,237.72');
    await expect(page.getByText('Top 6 make the playoffs, which start in week 15.')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Power rankings and luck' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lineup efficiency' })).toBeVisible();
    await expect(page.getByText('Biggest blowout')).toBeVisible();
    await expect(page.getByText('Longest win streak')).toBeVisible();
    await expect(page.getByText('14 games')).toBeVisible();
  });
});

test.describe('all-time', () => {
  test('tallies every manager across seasons', async ({ page }) => {
    await page.goto('/#/all-time');

    await expect(page.getByText('All-time standings', { exact: true }).first()).toBeVisible();
    // The 2024 mock is the 2025 season again, so every manager has two years.
    const rows = page.getByRole('table').getByRole('row');
    await expect(rows).toHaveCount(13); // header plus 12 managers
    await expect(rows.nth(1)).toContainText('28-0');
  });

  test('keeps a record book and a champions list', async ({ page }) => {
    await page.goto('/#/all-time/records');

    await expect(page.getByText('Champions', { exact: true })).toBeVisible();
    const champions = page.getByRole('table').getByRole('row');
    await expect(champions).toHaveCount(3); // header plus 2025 and 2024
    await expect(champions.nth(1)).toContainText('2025');
    await expect(champions.nth(1)).toContainText('redzone_rita');

    await expect(page.getByText('Highest team week', { exact: true })).toBeVisible();
    await expect(page.getByText('200.52 pts').first()).toBeVisible();
  });
});

test.describe('error handling', () => {
  test('explains when Sleeper cannot be reached', async ({ page }) => {
    await mockSleeper(page, { failCurrentLeague: true });
    await page.goto('/');

    await expect(page.getByText('Could not reach Sleeper')).toBeVisible({ timeout: 20_000 });
  });

  test('explains a year the league never played', async ({ page }) => {
    await page.goto('/#/2019');
    await expect(page.getByText('No 2019 season')).toBeVisible();
  });

  test('sends an unknown route back to the newest season', async ({ page }) => {
    await page.goto('/#/nonsense/path');
    await expect(page).toHaveURL(/#\/$/);
  });
});
