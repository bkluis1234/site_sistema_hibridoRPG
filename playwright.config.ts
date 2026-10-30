import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.test", quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error("Playwright exige banco de teste dedicado.");
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  outputDir: "test-results/" + (process.env.PW_OUTPUT_SUBDIR ?? "all"),
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npm run dev -w @hibrido/api",
      url: "http://127.0.0.1:3000/api/ready",
      reuseExistingServer: false,
      env: { ...process.env, APP_ORIGIN: "http://localhost:5173" },
    },
    {
      command: "npm run dev -w @hibrido/web",
      url: "http://localhost:5173",
      reuseExistingServer: false,
    },
  ],
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder:
          "playwright-report/" + (process.env.PW_OUTPUT_SUBDIR ?? "all"),
      },
    ],
  ],
});
