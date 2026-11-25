import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a real Supabase stack (local CLI stack in development).
 * Required environment variables:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  — baked into the build under test
 *   MAILPIT_URL                                — local email catcher (confirmation links)
 * See docs/TESTING.md for the one-line command that sets these from `supabase status`.
 */
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'MAILPIT_URL']) {
  if (!process.env[name]) {
    throw new Error(`${name} must be set to run integration e2e tests (see docs/TESTING.md)`);
  }
}

const port = 4173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.integration.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Local auth requests that send email can take several seconds.
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    // Must match an allowed redirect URL in supabase/config.jsonc.
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
  },
});
