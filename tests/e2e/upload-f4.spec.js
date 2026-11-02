// tests/e2e/upload-f4.spec.js — Fix-Runde 1, Team F4 (qa-screenshots/fertig/
// r1-recht-inhalt.md P0-1, P0-2, P0-4, P1-1, P1-7; r1-technik.md P0-1, Abschn. 3)
// against the running server: Handy-Upload as a finished service page and
// paused while the Löschfrist is unconfirmed, Datenschutz and Impressum without
// wrong facts or placeholders, KI-Assistenten without "Testbetrieb", MCP origin
// check. Reads server output only; no form is sent, nothing reaches the backoffice
// (the only POSTs go to /api/upload/session with a dummy ticket and to the MCP ping).
// Desktop project.
import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { collectConsoleErrors, htmlToText, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const SECRET = process.env.UPLOAD_TOKEN_SECRET || "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";
const RT = { timeout: 120_000 };
const PLACEHOLDER = /\[[^\]]*(festzulegen|pruefen|prüfen|Inhaber)/i;

/** HTML ohne die DSE-Entwurfsabschnitte (<div data-dse-status="entwurf"> … bis zum passenden </div>). */
function withoutDseDrafts(html) {
  let out = html;
  for (;;) {
    const start = out.search(/<div [^>]*data-dse-status="entwurf"/);
    if (start < 0) return out;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = start;
    let depth = 0;
    let end = out.length;
    for (let m; (m = re.exec(out)); ) {
      depth += m[0] === "</div>" ? -1 : 1;
      if (depth === 0) {
        end = re.lastIndex;
        break;
      }
    }
    out = out.slice(0, start) + out.slice(end);
  }
}

/** A valid upload token (signed like src/lib/upload/token.js), 1 h left. */
function validToken() {
  const id = crypto.randomBytes(16).toString("base64url");
  const exp = Math.floor(Date.now() / 1000 + 3600).toString(36);
  const payload = Buffer.from(`1|K|PH-K261028-F4F4F4|${exp}|${id}`).toString("base64url");
  return payload + crypto.createHmac("sha256", SECRET).update(`upload:${payload}`).digest("base64url").slice(0, 22);
}

async function pausedState(request) {
  const res = await request.post("/api/upload/session", { data: { ticket: "x".repeat(40) }, ...RT });
  const body = await res.json().catch(() => ({}));
  return res.status() === 503 && body.error === "upload_paused";
}

test.describe("F4 · Handy-Upload", () => {
  test("/de/upload: fertige Service-Seite ohne Demo, Test-Link oder Platzhalter, Weg zu Beratung und Kontakt", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto("/de/upload");
    expect(res.status()).toBe(200);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fotos per Handy senden");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/Demo|Test-Link|Test-Hinweise|PH-DEMO|Probelauf|Testbetrieb/);
    expect(text).not.toMatch(PLACEHOLDER);
    await expect(page.getByRole("link", { name: "Beratung anfragen" })).toHaveAttribute("href", /\/de\/beratung$/);
    await expect(page.locator("main").getByRole("link", { name: "Kontakt", exact: true })).toHaveAttribute("href", /\/de\/kontakt$/);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // no consent box, no file input on the service page
    await expect(page.locator('input[type="file"], input[type="checkbox"]')).toHaveCount(0);
    expect(errors.filter((e) => !/hydrat|Fast Refresh|HMR/i.test(e))).toEqual([]);
  });

  test("/de/upload bei 320 px: kein waagrechter Überlauf", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/de/upload");
    await settle(page);
    const o = await measureOverflow(page);
    expect(o.sw, JSON.stringify(o)).toBeLessThanOrEqual(o.vw);
  });

  test("Annahme pausiert: Session-Route 503, Token-Seite zeigt Hinweis statt Formular", async ({ page, request }) => {
    test.skip(!(await pausedState(request)), "Löschfrist bestätigt: Annahme läuft, die Flow-Tests in upload.spec.js prüfen sie");
    const res = await page.goto(`/de/upload/${validToken()}`);
    test.skip(res.status() === 404, "server uses another UPLOAD_TOKEN_SECRET");
    expect(res.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Upload im Moment nicht möglich");
    await expect(page.getByRole("link", { name: /Anrufen/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /E-Mail an/ })).toBeVisible();
    await expect(page.locator('input[type="file"], input[type="checkbox"]')).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(PLACEHOLDER);
    // invalid tokens stay a 404
    expect((await page.goto("/de/upload/" + "x".repeat(60))).status()).toBe(404);
  });
});

test.describe("F4 · Datenschutz und Impressum", () => {
  for (const locale of ["de", "en"]) {
    test(`/${locale}/datenschutz: keine falschen Tatsachen, neue Abschnitte, keine Platzhalter`, async ({ request }) => {
      const res = await request.get(`/${locale}/datenschutz`, RT);
      expect(res.status()).toBe(200);
      const html = await res.text();
      const text = htmlToText(html);
      expect(text).not.toMatch(/Privacy Shield|TKG 2003|§ 96 Abs|Komission|26 Monate/);
      expect(text).toMatch(/EU-US Data Privacy Framework/);
      expect(text).toMatch(/§ 165 Abs\. 3 TKG 2021/);
      for (const s of ["KI-Concierge", "Anthropic PBC", "KI-Assistenten", "Kundenportal", "Ezarri", "Online-Planer"]) expect(text).toContain(s);
      // Rat 9,5 B4 (T5, bewusst geändert): die DSE-Ergänzungen erscheinen im Dev als
      // markierter Entwurf (data-dse-status="entwurf", [Klammern] = offen für die
      // Kanzlei), im Produktions-Build nie. Geprüft wird der veröffentlichte Teil.
      const published = htmlToText(withoutDseDrafts(html));
      expect(published).not.toMatch(PLACEHOLDER);
      expect(published).not.toMatch(/Testbetrieb|vom Inhaber/);
      expect(html).not.toMatch(/DSGVO-konform|GDPR Compliant/);
    });
  }

  test("/de/impressum: Pflichtangaben, kein Werbetext, keine Platzhalter", async ({ request }) => {
    const res = await request.get("/de/impressum", RT);
    expect(res.status()).toBe(200);
    const html = await res.text();
    const text = htmlToText(html);
    expect(html).not.toMatch(/Livings|Transparenz &amp; Vertrauen|Transparenz & Vertrauen/);
    expect(text).not.toMatch(/Herzlich willkommen|Vielen Dank für Ihr Interesse/);
    expect(text).toMatch(/wird betrieben von der\s+MW Immobilienverwaltungs GmbH/);
    expect(text).toContain("Landesgericht Feldkirch");
    expect(text).toMatch(/Sitz: Lochau/);
    expect(text).toContain("Gewerbeordnung 1994");
    expect(html).toContain('href="https://www.ris.bka.gv.at"');
    expect(text).toContain("Offenlegung nach § 25 MedienG");
    expect(text).not.toMatch(/\[[^\]]*\]/);
    expect(robotsDirectives({ text: html, headers: res.headers() })).toContain("noindex");
  });
});

test.describe("F4 · KI-Assistenten und MCP", () => {
  test("/de/ki-assistenten: kein „Testbetrieb“, keine Platzhalter", async ({ request }) => {
    const res = await request.get("/de/ki-assistenten", RT);
    expect(res.status()).toBe(200);
    const text = htmlToText(await res.text());
    expect(text).not.toMatch(/Testbetrieb|vom Inhaber/);
    expect(text).not.toMatch(PLACEHOLDER);
  });

  test("MCP: fremde Browser-Origin 403, ohne Origin und eigene Origin 200", async ({ request, baseURL }) => {
    const data = { jsonrpc: "2.0", id: 1, method: "ping" };
    const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
    const foreign = await request.post("/api/agent/mcp", { data, headers: { ...headers, Origin: "https://evil.example" }, ...RT });
    expect(foreign.status()).toBe(403);
    expect((await request.post("/api/agent/mcp", { data, headers, ...RT })).status()).toBe(200);
    const own = await request.post("/api/agent/mcp", { data, headers: { ...headers, Origin: new URL(baseURL).origin }, ...RT });
    expect(own.status()).toBe(200);
  });
});

test.describe("F4 · Ratgeber", () => {
  test("Minotti-Preisartikel ohne Wettbewerberpreise, Meta-Zeile ohne verirrtes Komma", async ({ request }) => {
    const art = await request.get("/de/ratgeber/was-kostet-ein-minotti-sofa", RT);
    test.skip(art.status() === 404, "Artikel nicht veröffentlicht");
    const html = await art.text();
    const text = htmlToText(html);
    expect(text).not.toMatch(/Wetscher|Whoppah|DDC|\d\.\d{3} €/);
    // Inhaber Nr. 13 (bewusst geändert): der Artikel ist nach Faktenprüfung freigegeben und indexierbar.
    expect(robotsDirectives({ text: html, headers: art.headers() })).not.toContain("noindex");
    const hub = htmlToText(await (await request.get("/de/ratgeber", RT)).text());
    expect(hub).not.toMatch(/·\s*,/);
  });
});
