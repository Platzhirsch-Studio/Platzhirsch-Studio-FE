// tests/e2e/r7-p6-release.spec.js — P6 Runde 2: Technik & Release-Gate.
// Server-Antworten, Desktop-Projekt genügt. Sendet nichts.
//   BASE_URL=http://localhost:3100 PW_WORKERS=1 npx playwright test tests/e2e/r7-p6-release.spec.js --project=desktop
// Prüft:
//   - /cms/files/<fehlt>.jpg → 404 OHNE "immutable" (r2-technik P1-4)
//   - reine DE-Seiten in EN/FR/IT: genau EIN 308 auf /de/<seite>?lang=…, Ziel 200 (P1-8)
//   - Pfade ohne Sprache und /ueber-uns: ein 308 statt 307 bzw. 404 (P2-2)
//   - übrige echte 404 (Schalter-Seiten in EN/FR/IT): Status 404 mit lang und h1 (P1-8)
//   - /.well-known/security.txt (P2-4)
//   - /de/leistungen: Kartenbilder fest vorab erzeugt, nicht über /_next/image (P1-2)
import { test, expect } from "@playwright/test";
import { PROD } from "./prod-mode.js";

const REQ = { maxRedirects: 0, timeout: 120_000 };
test.skip(({ browserName }) => browserName !== "chromium", "Server-Antworten: einmal in Chromium");
test.setTimeout(300_000);

test("/cms/files/<fehlt> → 404 ohne immutable", async ({ request }) => {
  const res = await request.get("/cms/files/gibtsnicht.jpg", REQ);
  expect(res.status()).toBe(404);
  expect(res.headers()["cache-control"] || "").not.toContain("immutable");
});

for (const [from, to] of [
  // Sprach-Integration 01.11.2026 (bewusst geändert): Ezarri-Welt, Yacht, Sofaplaner,
  // Küchenplaner u. a. sind viersprachig (Test unten: → 200). Weiter umgeleitet: rein
  // deutsche Seiten und die Ezarri-Werkzeuge Custom Mix/Anfrage (FR/IT → /en).
  ["/it/designermoebel-bregenz", "/de/designermoebel-bregenz?lang=it"],
  ["/en/bodensee-licht", "/de/bodensee-licht?lang=en"],
  ["/fr/ezarri/custom-mix", "/en/ezarri/custom-mix?lang=fr"],
]) {
  test(`${from} → ein 308 → 200`, async ({ request }) => {
    const res = await request.get(from, REQ);
    expect(res.status()).toBe(308);
    const loc = new URL(res.headers().location, "http://x");
    expect(`${loc.pathname}${loc.search}`).toBe(to);
    const end = await request.get(to, REQ);
    expect(end.status(), to).toBe(200);
  });
}

for (const p of ["/en/ezarri", "/en/yacht-interior", "/en/sofaplaner", "/fr/ezarri", "/it/ezarri/pool", "/it/yacht-interior", "/fr/sofaplaner", "/en/kuechenplaner", "/fr/stil-finder", "/it/leistungen"]) {
  test(`${p} → 200 ohne Umleitung (eigene Sprachfassung)`, async ({ request }) => {
    const res = await request.get(p, REQ);
    expect(res.status(), "nach Änderung an deOnlyRedirects.cjs Dev-Server neu starten").toBe(200);
  });
}

for (const [from, to] of [
  ["/produkte", "/de/produkte"],
  ["/ueber-uns", "/de/ueber-uns/platzhirsch"],
  ["/de/ueber-uns", "/de/ueber-uns/platzhirsch"],
  ["/en/about-us", "/en/about-us/platzhirsch"],
]) {
  test(`${from} → 308 ${to} → 200`, async ({ request }) => {
    const res = await request.get(from, REQ);
    expect(res.status()).toBe(308);
    expect(new URL(res.headers().location, "http://x").pathname).toBe(to);
    expect((await request.get(to, REQ)).status(), to).toBe(200);
  });
}

for (const p of ["/en/upload", "/fr/portal", "/it/gutscheine", "/en/projekte/vorlage", "/en/ratgeber", "/en/gibtsnicht"]) {
  test(`${p} → 404 mit lang und h1 (keine leere Hülle)`, async ({ request }) => {
    // Endtest 29.10.2026: Der Dev-Server (Next 16.4.1) liefert für notFound() die Hülle <html id="__next_error__"> ohne lang/h1 und rendert die 404 erst im Client; die vorgerenderte 404 gibt es nur im Produktions-Build (dort grün, PW_PROD=1 BASE_URL=…).
    test.skip(!PROD, "vorgerenderte 404 nur im Produktions-Build");
    const res = await request.get(p, REQ);
    expect(res.status()).toBe(404);
    const html = await res.text();
    expect(html).not.toContain('id="__next_error__"');
    expect(html).toMatch(/<html[^>]+lang="[a-z]{2}"/);
    expect(html).toMatch(/<h1[\s>]/);
    expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
  });
}

test("/.well-known/security.txt (RFC 9116)", async ({ request }) => {
  const res = await request.get("/.well-known/security.txt", REQ);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const txt = await res.text();
  expect(txt).toMatch(/^Contact: mailto:/m);
  expect(new Date(txt.match(/^Expires: (.+)$/m)[1]).getTime()).toBeGreaterThan(Date.now());
});

test("/de/leistungen: Kartenbilder fest (AVIF/WebP), ohne /_next/image, load feuert", async ({ page }) => {
  const optimizer = [];
  // Runde 5 (P3, gesamtwerk P2, bewusst geänderte Erwartung): Kartenbilder
  // unter /bilder/leistungen/ statt /labs/hub/v/ (keine Labs-Welt, Entscheidung Nr. 9).
  page.on("request", (r) => r.url().includes("/_next/image") && /labs%2Fhub|bilder%2Fleistungen/.test(r.url()) && optimizer.push(r.url()));
  await page.goto("/de/leistungen", { waitUntil: "load", timeout: 120_000 });
  const srcs = await page.locator("[data-leistungen-bilder] img").evaluateAll((els) => els.map((e) => e.currentSrc || e.src));
  expect(srcs.length).toBe(3);
  for (const s of srcs) expect(s).toMatch(/\/bilder\/leistungen\/[a-z0-9-]+-\d+\.(avif|webp)$/);
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(1500);
  expect(optimizer).toEqual([]);
  const v = await page.request.get("/bilder/leistungen/kuechenplaner-384.avif", REQ);
  expect(v.status()).toBe(200);
  expect(v.headers()["cache-control"]).toContain("immutable");
});
