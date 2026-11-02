// Playwright config for the smoke, SEO, legal and accessibility tests in tests/e2e.
// Runs against an already running server (default: the dev server on :3000);
// it never starts one itself. Override with BASE_URL=https://… npm run test:e2e
// See tests/README.md.
import { defineConfig, devices } from "@playwright/test";

// Report and artefact folders can be redirected per run (tools/qa/prod-check.mjs
// writes each run into its own folder): PW_REPORT_DIR, PW_OUTPUT_DIR,
// PW_JSON_REPORT (adds a JSON reporter), PW_WORKERS.
const REPORT_DIR = process.env.PW_REPORT_DIR || "qa-screenshots/teamleiter/tests-report";
const OUTPUT_DIR = process.env.PW_OUTPUT_DIR || "qa-screenshots/teamleiter/tests-results";
const WORKERS = Number(process.env.PW_WORKERS) || 2;
const MOBILE_SPECS = /(smoke|a11y)\.spec\.js$/;
// PW_GPU=1: Chromium rendert WebGL über die echte Grafikkarte (Direct3D 11)
// statt über SwiftShader (CPU) – für 3D-Messungen und Poster-Renderings.
// Geprüft 31.10.2026: RTX 4060 wird so erkannt. Ohne Variable alles wie bisher.
const GPU_ARGS = process.env.PW_GPU ? ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] : [];
const gpuLaunch = GPU_ARGS.length ? { launchOptions: { args: GPU_ARGS } } : {};
// Production runs (tools/qa/prod-check.mjs) set COMMERCE_PREVIEW_EXPECT=off
// unless started with --commerce-preview: /de/preview/commerce is then a 404
// by design (src/lib/commerce/mode.js), so the preview block of
// r5-commerce.spec.js is left out (prod-check probes the 404 instead).
// Dev runs (no variable) keep these tests, the dev server shows the preview.
const SKIP_COMMERCE_PREVIEW = process.env.COMMERCE_PREVIEW_EXPECT === "off";
// F5 (Runde 1, P0 Preview): the design prototypes /de/preview/{buehne,galerie,
// dreilaendereck} and /de/projekte/vorlage are a 404 in production unless the
// server runs with DESIGN_PREVIEW=1 (src/components/Preview/gate.js).
// prod-check sets DESIGN_PREVIEW_EXPECT=off, then the tests that need the
// pages (seo.spec.js "noindex /de/preview/…", r5-content.spec.js vorlage
// demo) are left out and f5-preview-prod.spec.js checks the 404 instead.
const SKIP_DESIGN_PREVIEW = process.env.DESIGN_PREVIEW_EXPECT === "off";
const GREP_INVERT = [
  ...(SKIP_COMMERCE_PREVIEW ? ["Vorschau \/de\/preview\/commerce"] : []),
  ...(SKIP_DESIGN_PREVIEW
    ? ["noindex \/de\/preview\/(buehne|dreilaendereck|galerie)", "\/de\/projekte\/vorlage: InlineVideo", "demo clips support byte ranges"]
    : []),
];

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.js",
  // Dev pages compile on first hit, so allow generous time per test.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: WORKERS,
  retries: 1,
  forbidOnly: !!process.env.CI,
  ...(GREP_INVERT.length ? { grepInvert: new RegExp(GREP_INVERT.join("|")) } : {}),
  outputDir: OUTPUT_DIR,
  reporter: [
    ["list"],
    ["html", { outputFolder: REPORT_DIR, open: "never" }],
    ...(process.env.PW_JSON_REPORT ? [["json", { outputFile: process.env.PW_JSON_REPORT }]] : []),
  ],
  use: {
    // `npm run test:e2e:prod` targets a production server (`next start -p 3100`
    // after the integrator's build); BASE_URL always wins.
    baseURL:
      process.env.BASE_URL ||
      (process.env.npm_lifecycle_event === "test:e2e:prod" ? "http://localhost:3100" : "http://localhost:3000"),
    navigationTimeout: 120_000,
    actionTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "de-AT",
  },
  projects: [
    // Phones run the device-dependent specs; SEO, sitemap and claim checks
    // read server output and run once, in the desktop project.
    { name: "iphone", use: { ...devices["iPhone 15 Pro"] }, testMatch: MOBILE_SPECS },
    { name: "pixel", use: { ...devices["Pixel 7"], ...gpuLaunch }, testMatch: MOBILE_SPECS },
    // Tablet (WebKit, 834 × 1194): the md breakpoint layout that neither phone nor
    // desktop hits. Smoke only, so console errors on iPad show up.
    { name: "ipad", use: { ...devices["iPad Pro 11"] }, testMatch: /smoke\.spec\.js$/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, ...gpuLaunch },
    },
  ],
});
