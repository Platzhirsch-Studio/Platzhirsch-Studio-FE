// tests/e2e/labs-concierge.spec.js — R2-labs-service: KI-Concierge im Mock-Modus.
// Run: npx playwright test tests/e2e/labs-concierge.spec.js --project=desktop
// Nie mit echtem Claude oder API-Key: alle Anfragen senden mock: true und laufen
// nur, wenn der Server den Mock zulässt (Entwicklung). Eigene Test-IP
// (198.51.100.0/24), damit das Consent-Limit (10 je 10 min) andere Läufe nicht sperrt.
import { test, expect } from "@playwright/test";
import { settle } from "./helpers.js";
// Shared with the sitewide specs: mock check, mock button/consent, 60 s limits (QA2 P1-1).
import { API, SERVER, enterMock, mockAvailable, testIp } from "./concierge-helpers.js";

// Runde 4 (Concierge-Gating, bewusst geänderte Erwartung): ohne echten
// ANTHROPIC_API_KEY zeigt /de/concierge den Hinweis mit „Termin anfragen“ –
// auch im Mock-Dev-Server. Den Chat im Mock öffnet nur ?mock=1 (Dev/Mock-Server).
const PATH = "/de/concierge?mock=1";

test.use({ extraHTTPHeaders: { "x-forwarded-for": testIp() } });
// Shared dev server under load (parallel workflows): 300 s per test (QA2 P1-1).
test.describe.configure({ timeout: 300_000 });

test("API: fremder Origin 403; Mock-Kette Einwilligung → Antwort → Widerruf", async ({ request, baseURL }) => {
  const evil = await request.post(`${API}/consent`, {
    headers: { Origin: "https://evil.example" },
    data: { accepted: true },
    timeout: 120_000, // first hit compiles the route on the dev server
  });
  expect(evil.status()).toBe(403);
  test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben (Produktion)");
  const origin = new URL(baseURL).origin;
  const c = await request.post(`${API}/consent`, {
    headers: { Origin: origin },
    data: { accepted: true, store: false, mock: true },
    timeout: 120_000,
  });
  expect(c.status()).toBe(200);
  const { token, mode } = await c.json();
  expect(mode).toBe("mock");
  const chat = await request.post(API, {
    headers: { Origin: origin },
    data: { token, mock: true, messages: [{ role: "user", content: "Öffnungszeiten" }] },
    timeout: 120_000,
  });
  expect(chat.status()).toBe(200);
  const events = (await chat.text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  expect(events[0]).toMatchObject({ type: "start", mode: "mock" });
  expect(events.at(-1).type).toBe("done");
  const del = await request.delete(`${API}/consent`, { headers: { Origin: origin }, data: { token }, timeout: 120_000 });
  expect(del.status()).toBe(200);
});

test("ohne KI-Schlüssel: Hinweis, „Termin anfragen“, kein zweites <main>, kein Mock", async ({ page, request }) => {
  const { mode } = await (await request.get(API, { timeout: 120_000 })).json();
  test.skip(mode === "live", "Server mit echtem KI-Schlüssel");
  await page.goto("/de/concierge", { timeout: 300_000 });
  const ersatz = page.locator("[data-concierge-ersatz]");
  await expect(ersatz).toBeVisible({ timeout: 60_000 });
  await expect(ersatz.locator("[data-concierge-hinweis]")).toBeVisible();
  await expect(ersatz.getByRole("link", { name: "Termin anfragen" })).toHaveAttribute("href", "/de/beratung");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("#concierge-panel")).toHaveCount(0);
  await expect(page.getByText(/Mock/)).toHaveCount(0);
});

test("Desktop: offenes Cookie-Banner verdeckt die Panel-Fußzeile nicht (N4)", async ({ page, request }) => {
  test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
  await page.goto(PATH);
  await settle(page);
  await enterMock(page);
  const banner = page.locator('section[role="region"][aria-label="Cookie-Einstellungen"]');
  test.skip(!(await banner.count()), "kein Cookie-Banner");
  await expect
    .poll(async () => {
      const b = await banner.boundingBox();
      const p = await page.locator("#concierge-panel").boundingBox();
      return p.y + p.height <= b.y;
    })
    .toBe(true);
});

test("Widerruf: Rückmeldung sofort, Chat sofort weg (N2)", async ({ page, request }) => {
  test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
  await page.goto(PATH);
  await settle(page);
  await page.getByRole("button", { name: "Alle akzeptieren" }).click().catch(() => {});
  await enterMock(page);
  await page.getByRole("button", { name: /Concierge starten/ }).click();
  await expect(page.getByText("Guten Tag.")).toBeVisible(SERVER);
  await page.getByRole("button", { name: "Einwilligung widerrufen" }).click();
  await expect(page.getByText(/Ihre Einwilligung ist widerrufen/)).toBeVisible({ timeout: 1000 });
  await expect(page.getByText("Guten Tag.")).toHaveCount(0);
  await expect(page.getByText(/Verlauf dieser Sitzung wurde gelöscht/)).toBeVisible({ timeout: 60_000 });
});

test.describe("mobil 375 px", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("schwebender Button weicht einer festen Leiste unten aus (A3/N1)", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto(PATH);
    await settle(page);
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.getByRole("button", { name: "Alle akzeptieren" }).click().catch(() => {});
    const launcher = page.getByRole("button", { name: "Concierge fragen" });
    const mockBtn = page.getByRole("button", { name: /Mock-Modus testen/ });
    // Mock server: the sheet stays closed until the launcher is used.
    await expect(mockBtn.or(launcher).first()).toBeVisible({ timeout: 30_000 });
    if (await mockBtn.isVisible()) {
      await mockBtn.click();
      await page.getByRole("button", { name: "Concierge schließen" }).click();
    }
    await expect(launcher).toBeVisible();
    await page.evaluate(() => {
      const bar = document.createElement("nav");
      bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:64px;background:#30373e;z-index:45";
      document.body.appendChild(bar);
      scrollTo(0, document.body.scrollHeight);
    });
    await expect
      .poll(() =>
        launcher.evaluate((l) => {
          const r = l.getBoundingClientRect();
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return l.contains(top) && innerHeight - r.bottom >= 64;
        })
      )
      .toBe(true);
  });
});
