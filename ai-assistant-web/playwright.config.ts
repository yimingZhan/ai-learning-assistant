import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "cross-env PORT=4174 corepack pnpm dev",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
