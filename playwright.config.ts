import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for the built app.
 *
 * `e2e/app.spec.ts` intercepts every Sleeper request and answers from the
 * captured fixtures, so the suite is deterministic and runs in CI.
 * `e2e/live.spec.ts` calls the real API and is tagged `@live`; it runs only
 * through `make e2e-live`, because a third-party outage must not fail a build.
 */
const PORT = Number(process.env.E2E_PORT ?? 5273);

export default defineConfig({
  testDir: './e2e',
  // Tests share one dev server, so state that leaks between them shows up.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // The live suite is opt-in.
  grepInvert: process.env.E2E_LIVE ? undefined : /@live/,

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
