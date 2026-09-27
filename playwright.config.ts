import { defineConfig, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Playwright forces color in workers. Remove the inherited opposite policy
// before it spawns workers or its owned server, including empty NO_COLOR values.
delete process.env.NO_COLOR;
process.env.FORCE_COLOR = "1";

const shutdownToken = randomUUID();
process.env.STEPWISE_E2E_SHUTDOWN_TOKEN = shutdownToken;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  globalTimeout: 8 * 60_000,
  globalTeardown: "./tests/e2e/teardown.ts",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/e2e/server.mjs",
    // Synthetic inherited live settings exercise server isolation on every run.
    // The endpoint is local and has no service; never use actual credentials.
    env: { FORCE_COLOR: "1", STEPWISE_E2E_SHUTDOWN_TOKEN: shutdownToken, AI_API_KEY: "synthetic-e2e-key", AI_MODEL: "synthetic-e2e-model", AI_BASE_URL: "http://127.0.0.1:1/v1" },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
