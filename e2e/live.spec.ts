import { expect, test } from '@playwright/test';

/**
 * Smoke tests against the real Sleeper API.
 *
 * Tagged `@live` and skipped unless `E2E_LIVE=1`, so a Sleeper outage or a
 * league that changes shape never fails a build. Run them with `make e2e-live`
 * after touching the API client, to catch a change on Sleeper's side that the
 * captured fixtures would hide.
 */
const LEAGUE_ID = '1373305494734651392';

test.describe('live Sleeper API @live', () => {
  test('loads a real league and walks its season chain', async ({ page }) => {
    await page.goto(`/#/l/${LEAGUE_ID}/history`);

    await expect(page.getByText('Season history')).toBeVisible({ timeout: 20_000 });
    // The chain reaches back through several seasons via previous_league_id.
    await expect(page.getByRole('link', { name: /2023/ })).toBeVisible();
  });

  test('resolves awards for a finished season with a real player name', async ({ page }) => {
    await page.goto(`/#/l/${LEAGUE_ID}/awards`);
    await expect(page.getByRole('navigation', { name: 'Season' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('link', { name: '2025', exact: true }).click();
    await expect(page.getByText('Highest Starter Week')).toBeVisible({ timeout: 20_000 });

    // A player id that failed to resolve renders as "Player 1234".
    await expect(page.getByText(/^Player \d+$/)).toBeHidden();
  });

  test('reports an unknown league id', async ({ page }) => {
    await page.goto('/#/l/12345/awards');
    await expect(page.getByText('League not found')).toBeVisible({ timeout: 20_000 });
  });
});
