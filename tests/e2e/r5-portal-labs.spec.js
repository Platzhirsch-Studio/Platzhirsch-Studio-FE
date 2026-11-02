// tests/e2e/r5-portal-labs.spec.js — R5-portal-labs against the running server.
// Run: npx playwright test tests/e2e/r5-portal-labs.spec.js --project=desktop --reporter=list
//
// 1. CSP: every Labs page runs without an `eval` violation under a
//    Content-Security-Policy(-Report-Only) WITHOUT 'unsafe-eval'. Against
//    `next start` the server's own Report-Only header is used; the dev server
//    sends none, so the spec injects the same script-src (dev-only eval from
//    Turbopack/React Refresh would show up here too, so dev is the stricter run).
// 2. LazyMotion: Dreiländer and Stil-Finder content is visible (opacity 1)
//    right after load, also when the motion feature chunk never arrives, and
//    the quiz still advances (AnimatePresence without features drops at once).
// 3. Lupe Lochau/Bregenz is decorative (aria-hidden) and never swallows a tap.
// Nothing is sent: no share, no inquiry, no upload.
import { test, expect } from "@playwright/test";

const SCRIPT_SRC = "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com";
// Integration 28.10.2026: fixed URLs instead of /de/labs/<slug> (Inhaber-Entscheidung Nr. 9).
const LABS = ["dreilaender-rechner", "stil-finder", "sofaplaner", "kuechenplaner", "concierge", "3d-ansicht", "upload"];

async function collectCsp(page) {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__csp.push({ directive: e.effectiveDirective, blocked: e.blockedURI, sample: e.sample, source: e.sourceFile }),
    );
  });
  const console = [];
  page.on("console", (m) => {
    if (/Content Security Policy|unsafe-eval|Evaluating a string/i.test(m.text())) console.push(m.text().slice(0, 300));
  });
  // Dev has no CSP header: add the production script-src as Report-Only.
  const state = { injected: false };
  await page.route(/\/de\/(dreilaender-rechner|stil-finder|sofaplaner|kuechenplaner|concierge|3d-ansicht|upload)(\?.*)?$/, async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const res = await route.fetch();
    const headers = res.headers();
    if (!headers["content-security-policy-report-only"] && !headers["content-security-policy"]) {
      headers["content-security-policy-report-only"] = `default-src 'self'; ${SCRIPT_SRC}`;
      state.injected = true;
    }
    await route.fulfill({ response: res, headers });
  });
  return { console, state };
}

// Dev only: React/Next dev builds replay server stacks with eval (react-server-dom,
// React Refresh). Those chunks never ship to production; the prod run (next start,
// own Report-Only header) checks without this filter.
const DEV_FRAMEWORK = /node_modules_next_dist_compiled|react-refresh|turbopack-hmr|hmr-client/;
function evalViolations(list, state) {
  return list.filter((x) => (x.blocked === "eval" || /eval/i.test(x.sample || "")) && !(state.injected && DEV_FRAMEWORK.test(x.source || "")));
}
const consoleEval = (lines, state) => (state.injected ? [] : lines.filter((t) => /eval|Evaluating a string/i.test(t)));

for (const slug of LABS) {
  test(`CSP ohne unsafe-eval: /de/${slug} meldet kein eval`, async ({ page }) => {
    test.setTimeout(120_000);
    const { console: consoleCsp, state } = await collectCsp(page);
    const res = await page.goto(`/de/${slug}`, { waitUntil: "networkidle", timeout: 90_000 });
    expect(res.status()).toBe(200);
    await page.waitForTimeout(1500);
    // Exercise the code paths that parse with zod / animate.
    if (slug === "sofaplaner" || slug === "kuechenplaner") await page.mouse.wheel(0, 1200);
    if (slug === "dreilaender") {
      const field = page.getByLabel(/Bruttopreis|Preis/i).first();
      if (await field.count()) await field.fill("12.500");
    }
    await page.waitForTimeout(800);
    const v = await page.evaluate(() => window.__csp);
    const evalHits = evalViolations(v, state);
    const evalConsole = consoleEval(consoleCsp, state);
    test.info().annotations.push({ type: "csp", description: JSON.stringify({ slug, dev: state.injected, violations: v, console: consoleCsp }) });
    expect(evalHits, JSON.stringify(v)).toEqual([]);
    expect(evalConsole).toEqual([]);
  });
}

test("Sofaplaner: Plan aus ?p= wird ohne eval geprüft (zod jitless)", async ({ page }) => {
  const { console: consoleCsp, state } = await collectCsp(page);
  await page.goto("/de/sofaplaner?p=garbage!!", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const v = await page.evaluate(() => window.__csp);
  expect(evalViolations(v, state)).toEqual([]);
  expect(consoleEval(consoleCsp, state)).toEqual([]);
});

async function opacityOf(locator) {
  return locator.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
}

test("LazyMotion: Inhalte sichtbar, auch wenn die Motion-Features nie laden", async ({ page }) => {
  test.setTimeout(120_000);
  // Block the async chunk(s) that carry motion's feature bundles: a chunk that is
  // NOT referenced by the initial HTML (= loaded later via import()) and contains
  // the animation feature (`animateChanges`, a property name that survives
  // minifying). Static chunks are never touched, so hydration stays intact.
  // Dev (Turbopack) bundles node_modules differently; the run that counts is prod.
  const blocked = [];
  const errors = [];
  const initial = new Set();
  await page.route(/\/de\/(stil-finder|dreilaender-rechner)(\?.*)?$/, async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const res = await route.fetch();
    const html = await res.text();
    for (const m of html.matchAll(/chunks\/([^"'\\?]+?\.js)/g)) initial.add(m[1].split("/").pop());
    return route.fulfill({ response: res, body: html });
  });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.route(/\/_next\/static\/chunks\/.*\.js(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    const name = route.request().url().split("?")[0].split("/").pop();
    if (!initial.has(name) && body.includes("animateChanges")) {
      blocked.push(route.request().url().split("/").pop());
      return route.abort();
    }
    return route.fulfill({ response: res, body });
  });
  await page.goto("/de/stil-finder", { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(1200);
  test.info().annotations.push({ type: "blocked-chunks", description: blocked.join(", ") });
  // Dev chunks are named after their modules (node_modules_…, turbopack-…) and
  // ship the features with the page; only the production split is testable here.
  const devChunks = [...initial].some((n) => /node_modules_|turbopack|hmr/.test(n));
  test.skip(devChunks && blocked.length === 0, "Dev-Server: Features liegen im statischen Dev-Chunk, Prüfung nur gegen next start");
  expect(blocked.length, "Feature-Chunk wurde nicht abgefangen").toBeGreaterThan(0);
  const intro = page.locator("#stilfinder .grid > .relative.overflow-hidden");
  const ops = await opacityOf(intro);
  expect(ops.length).toBeGreaterThan(0);
  for (const o of ops) expect(o).toBe(1);
  // Quiz advances without features: first question visible.
  const hydrated = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("#stilfinder button")].find((x) => /starten/i.test(x.textContent));
    return !!btn && Object.keys(btn).some((k) => k.startsWith("__react"));
  });
  test.info().annotations.push({ type: "hydrated", description: String(hydrated) + " " + errors.join(" | ") });
  expect(hydrated, "Seite ohne Feature-Chunk nicht hydriert (Chunk enthält statischen Code?)").toBe(true);
  await page.getByRole("button", { name: /Starten|Los geht|Stil finden|Beginnen/i }).first().click();
  const q = page.locator("#stilfinder ul li");
  await expect(q.first()).toBeVisible({ timeout: 10_000 });
  for (const o of await opacityOf(q)) expect(o).toBe(1);

  await page.goto("/de/dreilaender-rechner", { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(800);
  const card = page.locator("article[aria-labelledby='dl-ort-titel']");
  await expect(card).toBeVisible();
  expect((await opacityOf(card))[0]).toBe(1);
  // Ort wechseln: neue Karte erscheint sofort (kein hängendes AnimatePresence).
  await page.locator("[data-place-button='lindau']").first().click({ force: true });
  await expect(page.locator("#dl-ort-titel")).toHaveText(/Lindau/);
  expect((await opacityOf(card))[0]).toBe(1);
});

test("LazyMotion: mit Features animiert der Stil-Finder weiter (Frage erscheint, endet bei opacity 1)", async ({ page }) => {
  await page.goto("/de/stil-finder", { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Starten|Los geht|Stil finden|Beginnen/i }).first().click();
  const q = page.locator("#stilfinder ul li");
  await expect(q.first()).toBeVisible({ timeout: 10_000 });
  // Entrance animation (delays ≤ 0.2 s + 0.45 s) ends at opacity 1.
  await expect.poll(async () => Math.min(...(await opacityOf(q))), { timeout: 5000 }).toBe(1);
});

test("Lupe Lochau/Bregenz: aria-hidden, Bregenz bleibt per Punkt bzw. Callout wählbar", async ({ page }) => {
  await page.goto("/de/dreilaender-rechner", { waitUntil: "networkidle", timeout: 90_000 });
  const inset = page.locator('[data-inset="lochau-bregenz"]');
  await expect(inset).toHaveAttribute("aria-hidden", "true");
  expect(await inset.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  await page.locator('[data-place-button="bregenz"]').click({ force: true });
  await expect(page.locator("#dl-ort-titel")).toHaveText(/Bregenz/);
  await expect(page.locator('[data-place-button="bregenz"]')).toHaveAttribute("aria-pressed", "true");
});
