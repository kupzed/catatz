import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: "node tests/e2e/mock-supabase.mjs",
          url: "http://127.0.0.1:55431/health",
          reuseExistingServer: false,
          timeout: 30_000,
        },
        {
          command: "npm run dev -- --hostname 127.0.0.1",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            NEXT_PUBLIC_APP_URL: baseURL,
            NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55431",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "catatz-e2e-anon-key",
            AI_API_KEY: "catatz-e2e-ai-key",
          },
        },
      ],
});
