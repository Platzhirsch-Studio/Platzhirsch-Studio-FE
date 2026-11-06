// Playwright-Konfiguration des Backoffice (eigene App auf :3100). Startet keinen
// Server: `npm run dev` (bzw. der laufende Dev-Server) muss erreichbar sein.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js --project=desktop --project=ipad
//
// Projekte (MASTER Q-M2, Q-H6; Team P0-9):
//   desktop        Chrome 1440×900 – alle Specs
//   ipad           iPad Pro 11 hoch (WebKit, 834×1194, Touch) – alle Specs
//   reducedMotion  Chrome 1440×900 mit prefers-reduced-motion: reduce – nur Tests mit
//                  Tag @bewegung oder @screenshot bzw. „bewegung“/„screenshot“ im
//                  Datei- oder Testnamen (Q-H6: nur Opazität ≤ 120 ms, kein Shake/Kollaps)
//   ipad-quer      WebKit-iPad 1180×820 (Touch) – nur Tests mit Tag @kiosk/@tablet bzw.
//   ipad-hoch      WebKit-iPad 820×1180 (Touch)   „kiosk“ im Datei-/Testnamen (Kiosk-Raster);
//                  ipad-hoch nimmt zusätzlich @kundendisplay (Display hochkant, Lounge §10)
//   kundendisplay  Chrome 1920×1080, DPR 1, ohne Touch (zweiter Bildschirm der Kassa,
//                  Lounge §10, Maßeinheit --u = 1920/100) – nur Tag @kundendisplay bzw.
//                  „kassa-display“/„kunden-display“ im Datei-/Testnamen
// Tag setzen: test.describe("…", { tag: "@kiosk" }, () => { … }) oder
//             test("…", { tag: ["@bewegung", "@screenshot"] }, async …).
// PW_ALLE=1 hebt die Filter auf (alle Specs in allen Projekten).
// Ohne passenden Test meldet Playwright „No tests found“ – das ist kein Fehler der Konfiguration.
import { defineConfig, devices } from "@playwright/test";

const WORKERS = Number(process.env.PW_WORKERS) || 1;
const ALLE = !!process.env.PW_ALLE;
/** Filter je Projekt; Muster bewusst ohne Projektnamen-Teile (Playwright prüft den Projektnamen mit). */
const nur = (muster) => (ALLE ? {} : { grep: muster });

const DESKTOP = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
// Gleiche Gerätemerkmale wie das bestehende ipad-Projekt (WebKit, Touch, isMobile, DPR 2),
// nur mit iPad-Air-/iPad-11-Maßen.
const IPAD = devices["iPad Pro 11"];
const tablet = (width, height) => ({ ...IPAD, viewport: { width, height }, screen: { width, height } });
// Kundendisplay: Full-HD-Monitor am Kassenplatz, keine Bedienung (kein Touch, keine Maus nötig).
const DISPLAY = {
  ...devices["Desktop Chrome"],
  viewport: { width: 1920, height: 1080 },
  screen: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
};
// Muster ohne das Wort „kundendisplay“ ohne @ – sonst träfe es über den Projektnamen jeden Test.
const KIOSK = /@kiosk|@tablet|kiosk/i;
const KUNDENDISPLAY = /@kundendisplay|kassa[-_/ ]display|kunden-display/i;
const oder = (...muster) => new RegExp(muster.map((m) => m.source).join("|"), "i");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: WORKERS,
  retries: 1,
  forbidOnly: !!process.env.CI,
  outputDir: "./test-results",
  reporter: [["list"], ["html", { outputFolder: "./playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3100",
    navigationTimeout: 120_000,
    actionTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "de-AT",
  },
  projects: [
    { name: "desktop", use: DESKTOP },
    { name: "ipad", use: { ...devices["iPad Pro 11"] } },
    { name: "reducedMotion", use: { ...DESKTOP, reducedMotion: "reduce" }, ...nur(/@bewegung|@screenshot|bewegung|screenshot/i) },
    { name: "ipad-quer", use: tablet(1180, 820), ...nur(KIOSK) },
    { name: "ipad-hoch", use: tablet(820, 1180), ...nur(oder(KIOSK, KUNDENDISPLAY)) },
    { name: "kundendisplay", use: DISPLAY, ...nur(KUNDENDISPLAY) },
  ],
});
