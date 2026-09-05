import { expect, test } from '@playwright/test';

/**
 * Smoke tests against the real Sleeper API.
 *
 * Tagged `@live` and skipped unless `E2E_LIVE=1`, so a Sleeper outage or a
 * league that changes shape never fails a build. Run them with `make e2e-live`
 * after touching the API client, to catch a change on Sleeper's side that the
 * captured fixtures would hide.
 */
test.describe('live Sleeper API @live', () => {
  test('loads the league and walks its season chain', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: "Big-T's PPR League" })).toBeVisible({
      timeout: 20_000,
    });
    // The chain reaches back through several seasons via previous_league_id.
    const trigger = page.getByRole('navigation', { name: 'Season' }).getByRole('button');
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();

    await expect(
      page.getByRole('list', { name: 'Seasons' }).getByRole('link', { name: '2023', exact: true }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('resolves awards for a finished season with a real player name', async ({ page }) => {
    await page.goto('/#/2025/awards');
    await expect(page.getByRole('heading', { name: 'Highest Starter Week' })).toBeVisible({
      timeout: 20_000,
    });

    // A player id that failed to resolve renders as "Player 1234".
    await expect(page.getByText(/^Player \d+$/)).toBeHidden();
  });

  test('tallies every season into the all-time standings', async ({ page }) => {
    await page.goto('/#/all-time');
    await expect(page.getByRole('table').getByRole('row').nth(1)).toBeVisible({
      timeout: 30_000,
    });
  });
});
