// Shared helpers of the concierge specs (concierge-sitewide.spec.js,
// concierge-sitewide-iphone.spec.js, labs-concierge.spec.js). One place for the
// hardening against the slow dev server (QA round 2, P1-1): every wait that
// follows a server step (GET mode, consent, first answer, reload) has an
// explicit 60 s limit instead of the 15 s default of the config.
import { expect } from "@playwright/test";

export const API = "/api/labs/concierge";
export const LAUNCHER = "button[data-concierge-launcher]";
/** Limit for every step that waits on the server (dev compiles on first hit). */
export const SERVER = { timeout: 60_000 };
/** The launcher mounts after hydration + idle; on a loaded dev server that can take longer. */
export const LAUNCH = { timeout: 120_000 };

/** Own test IP (198.51.100.0/24): the consent limit (10 per 10 min and IP) must not bite repeated runs. */
export const testIp = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
export const freshIp = (page) => page.setExtraHTTPHeaders({ "x-forwarded-for": testIp() });

/** Server allows the mock (dev or CONCIERGE_MOCK=1). */
export async function mockAvailable(request) {
  const r = await request.get(API, { timeout: 120_000 });
  const { mode, devMock, enabled } = await r.json();
  return enabled !== false && (mode === "mock" || (mode === "unavailable" && devMock));
}

/** A click before hydration is a no-op in dev, so click until the banner is gone. */
export async function dismissCookies(page, name = "Weiter ohne Einwilligung") {
  const btn = page.getByRole("button", { name });
  await btn.first().waitFor({ timeout: 15_000 }).catch(() => {});
  await expect(async () => {
    if (await btn.count()) await btn.first().click({ timeout: 2_000 });
    await expect(btn).toHaveCount(0, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
}

/** Mock button (dev without key) or the consent directly (mock server); afterwards the start button is there. */
export async function enterMock(scope, { mock = /Mock-Modus testen/, start = /Concierge starten/ } = {}) {
  const mockBtn = scope.getByRole("button", { name: mock });
  const startBtn = scope.getByRole("button", { name: start });
  await expect(mockBtn.or(startBtn).first()).toBeVisible(SERVER);
  if (await mockBtn.count()) await mockBtn.click();
  await expect(startBtn).toBeVisible(SERVER);
  return startBtn;
}

/** Launcher → panel → consent; returns the panel with an enabled composer. */
/**
 * QM-Endabnahme 02.11.2026 (bewusst geänderte Erwartung): Seit QM shell-home r2 bleibt der Reiter verborgen,
 * solange eine vollflächige Bühne ([data-wow-stage], [data-concierge-avoid]) in seiner Spalte liegt (Startseite
 * ab 1280 px). Erst wegscrollen, dann erscheint er (Launcher.js overAvoid).
 */
export async function revealLauncher(page) {
  if (await page.locator("[data-wow-stage],[data-concierge-avoid]").count()) await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 1.5)));
}

export async function openAndConsent(page, { input = /Ihre Nachricht/, mock, start } = {}) {
  await freshIp(page);
  await revealLauncher(page);
  const launcher = page.locator(LAUNCHER);
  await expect(launcher).toBeVisible(LAUNCH);
  await launcher.click();
  const panel = page.locator("#concierge-panel");
  await expect(panel).toBeVisible(SERVER); // lazy chunk compiles on first use (dev)
  const startBtn = await enterMock(panel, { ...(mock ? { mock } : {}), ...(start ? { start } : {}) });
  await startBtn.click();
  await expect(panel.getByRole("textbox", { name: input })).toBeEnabled(SERVER);
  return panel;
}

/** Ask one question; waits until the composer is ready (after GET/consent/reload). */
export async function ask(panel, text, { input = /Ihre Nachricht/, send = "Nachricht senden" } = {}) {
  const box = panel.getByRole("textbox", { name: input });
  await expect(box).toBeEnabled(SERVER);
  await box.fill(text, SERVER);
  await panel.getByRole("button", { name: send }).click(SERVER);
}

/** Element lies completely inside the visible part of the log (not under the composer). */
export async function visibleInLog(panel, locator) {
  const log = await panel.locator("[role=log]").boundingBox();
  const composer = await panel.locator("form").last().boundingBox();
  const box = await locator.boundingBox();
  if (!log || !composer || !box) return false;
  return box.y >= log.y - 1 && box.y + box.height <= Math.min(log.y + log.height, composer.y) + 1;
}
