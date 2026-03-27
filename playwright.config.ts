import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  fullyParallel: false, // flows share state, keep sequential
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['line']],

  use: {
    baseURL: 'http://localhost:3000',
    // Mobile viewport — this is a mobile-first app
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 1. Login once and save session to file
    { name: 'setup', testMatch: '**/auth.setup.ts' },

    // 2. All flow tests reuse the saved session
    {
      name: 'flows',
      testMatch: '**/*.spec.ts',
      dependencies: ['setup'],
      use: { storageState: 'tests/e2e/.auth/user.json' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
