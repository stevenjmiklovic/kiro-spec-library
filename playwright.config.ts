import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config — drives the built preview harness (ui/dist/preview.html), which
 * mounts the real <App/> with a mock Crew API. Specs are named `*.e2e.ts` so
 * Bun's test runner ignores them; only Playwright picks them up.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4318',
    viewport: { width: 1440, height: 1024 },
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 1024 },
      },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 4318 --bind 127.0.0.1 --directory ui/dist',
    url: 'http://127.0.0.1:4318/preview.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
