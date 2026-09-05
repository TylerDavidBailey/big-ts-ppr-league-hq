import { expect, test } from '@playwright/test';

import {
  FINISHED_LEAGUE_ID,
  PRE_DRAFT_LEAGUE_ID,
  UNKNOWN_LEAGUE_ID,
  mockSleeper,
} from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockSleeper(page);
});

test.describe('landing page', () => {
  test('loads a league from a pasted id', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Sleeper league ID').fill(FINISHED_LEAGUE_ID);
    await page.getByRole('button', { name: 'Load league' }).click();

    await expect(page).toHaveURL(new RegExp(`#/l/${FINISHED_LEAGUE_ID}`));
    await expect(page.getByRole('heading', { name: "Big-T's PPR League" })).toBeVisible();
  });

  test('loads a league from a pasted Sleeper URL', async ({ page }) => {
    await page.goto('/');
    await page
      .getByLabel('Sleeper league ID')
      .fill(`https://sleeper.com/leagues/${FINISHED_LEAGUE_ID}/team`);
    await page.getByRole('button', { name: 'Load league' }).click();

    await expect(page).toHaveURL(new RegExp(`#/l/${FINISHED_LEAGUE_ID}`));
  });

  test('rejects an id that is not a league id', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Sleeper league ID').fill('not-a-league');
    await page.getByRole('button', { name: 'Load league' }).click();

    await expect(page.getByRole('alert')).toContainText('does not look like a Sleeper league ID');
    await expect(page).not.toHaveURL(/#\/l\//);
  });

  test('remembers a league across a browser restart', async ({ page, context }) => {
    await page.goto(`/#/l/${FINISHED_LEAGUE_ID}/awards`);
    await expect(page.getByRole('heading', { name: "Big-T's PPR League" })).toBeVisible();

    // A new page in the same context is the same browser profile, so this
    // exercises the localStorage round-trip rather than in-memory state.
    const revisit = await context.newPage();
    await mockSleeper(revisit);
    await revisit.goto('/');

    const recent = revisit.getByRole('heading', { name: 'Recent leagues' });
    await expect(recent).toBeVisible();
    await expect(revisit.getByRole('link', { name: /Big-T's PPR League/ }).first()).toBeVisible();

    // The remove button empties the list again.
    await revisit
      .getByRole('button', { name: /Remove .* from recent leagues/ })
      .first()
      .click();
    await expect(recent).toBeHidden();
  });
});

test.describe('a finished season', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/#/l/${FINISHED_LEAGUE_ID}/awards`);
    await expect(page.getByRole('heading', { name: "Big-T's PPR League" })).toBeVisible();
  });

  test('names the podium from the bracket placement games', async ({ page }) => {
    const podium = page.getByRole('listitem').filter({ hasText: 'Champion' });
    await expect(podium).toContainText('Bigdogbetz');

    await expect(page.getByText('Runner-up')).toBeVisible();
    await expect(page.getByText('Third place')).toBeVisible();
  });

  test('resolves every season award', async ({ page }) => {
    await expect(page.getByText('1 Seed')).toBeVisible();
    await expect(page.getByText('2237.72 PF')).toBeVisible();

    await expect(page.getByText('Highest Team Week')).toBeVisible();
    await expect(page.getByText('200.52 pts')).toBeVisible();

    // The starter award must name a player, not a raw Sleeper id.
    await expect(page.getByText('Highest Starter Week')).toBeVisible();
    await expect(page.getByText('Jahmyr Gibbs')).toBeVisible();
    await expect(page.getByText('55.40 pts')).toBeVisible();
  });

  test('lists a beer duty loser for all 14 regular-season weeks', async ({ page }) => {
    await expect(page.getByText('Beer Duty')).toBeVisible();
    await expect(page.getByText('14 weeks')).toBeVisible();

    for (const week of [1, 7, 14]) {
      await expect(page.getByText(`Wk ${week}`, { exact: true })).toBeVisible();
    }
    // Week 15 is the playoffs, so it carries no punishment.
    await expect(page.getByText('Wk 15', { exact: true })).toBeHidden();
  });

  test('ranks the standings and matches the reported records', async ({ page }) => {
    await page.getByRole('link', { name: 'Standings' }).click();

    const leader = page.getByRole('row').nth(1);
    await expect(leader).toContainText('jaredn46');
    await expect(leader).toContainText('14-0');
    await expect(leader).toContainText('2,237.72');

    await expect(page.getByRole('row')).toHaveCount(13); // header plus 12 teams
    await expect(page.getByText('Top 6 make the playoffs, which start in week 15.')).toBeVisible();
  });

  test('shows matchups week by week and stops at the championship week', async ({ page }) => {
    await page.getByRole('link', { name: 'Scoreboard' }).click();

    const weeks = page.getByRole('navigation', { name: 'Week' }).getByRole('button');
    // Weeks 1 to 17. Week 18 has scores but pairs nobody, so it is not a week
    // of this league.
    await expect(weeks).toHaveCount(17);
    await expect(weeks.last()).toHaveText('17');

    await weeks.nth(0).click();
    await expect(page.getByText('Week 1', { exact: false })).toBeVisible();
    await expect(page.getByText('Beer Duty')).toBeVisible();
    await expect(page.getByText('Top starter')).toBeVisible();
  });

  test('renders both brackets with bracket-relative placement labels', async ({ page }) => {
    await page.getByRole('link', { name: 'Playoffs' }).click();

    await expect(page.getByText('Championship bracket')).toBeVisible();
    await expect(page.getByText('Championship', { exact: true })).toBeVisible();
    await expect(page.getByText('3rd place game', { exact: true })).toBeVisible();

    // The consolation bracket decides no league-wide championship.
    await expect(page.getByText('Consolation bracket')).toBeVisible();
    await expect(page.getByText('Consolation final')).toBeVisible();
  });

  test('lists every prior season', async ({ page }) => {
    await page.getByRole('link', { name: 'History' }).click();

    await expect(page.getByText('Season history')).toBeVisible();

    // Scoped by the list's accessible name, because the season switcher in the
    // header also links to a season by year.
    const rows = page.getByRole('list', { name: 'Season history' }).getByRole('listitem');

    // The chain walks back from 2025 to 2024 and stops, because
    // previous_league_id is null on the oldest season.
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('2025');
    await expect(rows.last()).toContainText('2024');
  });
});

test.describe('a league with no games played', () => {
  test('shows an empty state on every tab instead of an error', async ({ page }) => {
    await page.goto(`/#/l/${PRE_DRAFT_LEAGUE_ID}/awards`);

    await expect(page.getByText('Pre-draft')).toBeVisible();
    await expect(page.getByText('No games played yet')).toBeVisible();

    await page.getByRole('link', { name: 'Standings' }).click();
    await expect(page.getByText('Standings open in week 1')).toBeVisible();

    await page.getByRole('link', { name: 'Scoreboard' }).click();
    await expect(page.getByText('No weeks played yet')).toBeVisible();

    await page.getByRole('link', { name: 'Playoffs' }).click();
    await expect(page.getByText('No playoff bracket yet')).toBeVisible();
  });
});

test.describe('error handling', () => {
  test('explains an unknown league id', async ({ page }) => {
    await page.goto(`/#/l/${UNKNOWN_LEAGUE_ID}/awards`);

    await expect(page.getByText('League not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to search' })).toBeVisible();
  });

  test('sends an unknown route back to the landing page', async ({ page }) => {
    await page.goto('/#/nonsense');
    await expect(page.getByLabel('Sleeper league ID')).toBeVisible();
  });
});

test.describe('deep links', () => {
  test('opens a tab directly from a pasted hash URL', async ({ page }) => {
    await page.goto(`/#/l/${FINISHED_LEAGUE_ID}/playoffs`);

    await expect(page.getByText('Final placings')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Playoffs' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
