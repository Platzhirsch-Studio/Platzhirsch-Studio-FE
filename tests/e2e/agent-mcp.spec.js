// tests/e2e/agent-mcp.spec.js – N3 „Platzhirsch für KI-Assistenten“ (MCP-Server + WebMCP).
// Läuft im Projekt `desktop` (PW_WORKERS=1 empfohlen). Prüft:
//   - MCP über HTTP: initialize, tools/list mit Schemas, search_products (Name/Marke/URL/Preis),
//     request_appointment ohne Consent → Fehler, mit Consent → Probelauf „Nichts ist gebucht“,
//     GET → 405, /.well-known/mcp.json
//   - Seite /de/ki-assistenten: 200, eine H1, canonical, FAQ = JSON-LD, eine Walnut-Fläche,
//     Vorführung ruft den echten Server, keine Konsolenfehler, 375 px ohne Überlauf, axe
//   - WebMCP: mit (simuliertem) document.modelContext nur Lese-Werkzeuge, ohne API nichts
//   - Bestätigungsseite: Probelauf-Token zeigt Angaben, Bestätigen bleibt Probelauf
// Formulare/Mails: Der Server sendet außerhalb von live+Produktion nie etwas
// (src/lib/agent/config.js appointmentMode); Bestätigungs-Token aus dem
// Probelauf tragen dry:true und gehen nie ans Backoffice.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, jsonLdNodes, measureOverflow, robotsDirectives, settle } from "./helpers.js";

const PATH = "/de/ki-assistenten";
const MCP = "/api/agent/mcp";
const APPT = {
  agent_consent: true,
  first_name: "Test",
  last_name: "Agent",
  email: "test-agent@example.com",
  phone: "+43 664 0000000",
  topic: "E2E-Test, bitte ignorieren",
  property_type: "Wohnung",
  place: "showroom",
};

let rpcId = 0;
// Eigene Test-IP je Lauf (TEST-NET-3): das Terminwunsch-Limit (5/h je IP) zählt
// sonst alle Läufe gegen denselben Schlüssel "local" des laufenden Servers.
const TEST_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}, 198.51.100.${Math.floor(Math.random() * 250) + 1}`;
async function rpc(request, method, params) {
  const res = await request.post(MCP, {
    data: { jsonrpc: "2.0", id: ++rpcId, method, ...(params ? { params } : {}) },
    headers: { Accept: "application/json, text/event-stream", "X-Forwarded-For": TEST_IP },
    timeout: 120_000,
  });
  return { status: res.status(), headers: res.headers(), body: await res.json() };
}

test.describe("MCP-Server über HTTP", () => {
  test("initialize, tools/list mit Schemas, GET 405, CORS", async ({ request }) => {
    const init = await rpc(request, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } });
    expect(init.status).toBe(200);
    expect(init.body.result.protocolVersion).toBe("2025-06-18");
    expect(init.headers["mcp-protocol-version"]).toBe("2025-06-18");
    expect(init.body.result.capabilities.tools).toBeTruthy();

    const list = await rpc(request, "tools/list");
    const tools = list.body.result.tools;
    // P6 Runde 2 (bewusst geänderte Erwartung, F4): in Produktion ist der
    // Terminwunsch über Assistenten aus (mode "off") – request_appointment
    // steht dann nicht in tools/list (8 Werkzeuge), im Probelauf (dev) schon (9).
    const names = tools.map((t) => t.name);
    // Rat 9,5 C10 (bewusst geändert): + ezarri_quantities, idea_board_appointment_link (nur lesend).
    const base = ["search_products", "list_categories", "products_in_category", "list_brands", "brand_overview", "showroom_info", "arbeitsweise", "ezarri_collections", "ezarri_quantities", "idea_board_appointment_link"];
    // Online-Kalender (Inhaber Nr. 12): free_appointment_slots (nur lesend) kommt dazu, solange /termin aktiv ist.
    const extra = ["request_appointment", "free_appointment_slots"].filter((n) => names.includes(n));
    expect(names).toEqual([...base, ...extra]);
    for (const t of tools) expect(t.inputSchema.type).toBe("object");

    const get = await request.get(MCP);
    expect(get.status()).toBe(405);
    const options = await request.fetch(MCP, { method: "OPTIONS" });
    expect(options.status()).toBe(204);
    expect(options.headers()["access-control-allow-origin"]).toBe("*");
  });

  test("search_products: Name, Marke, Maße-Feld, kanonische URL, Preis auf Anfrage", async ({ request }) => {
    const r = await rpc(request, "tools/call", { name: "search_products", arguments: { query: "Flos", limit: 3 } });
    expect(r.status).toBe(200);
    const d = r.body.result.structuredContent;
    // Backoffice nicht erreichbar → sauberer Fehler statt Absturz, sonst echte Daten.
    if (r.body.result.isError) {
      expect(d.error).toBe("catalog_unavailable");
      return;
    }
    expect(d.price).toBe("auf Anfrage");
    expect(d.products.length).toBeGreaterThan(0);
    for (const p of d.products) {
      expect(p.name).toBeTruthy();
      expect(p.brand).toBe("Flos");
      expect("dimensions" in p).toBe(true);
      expect(p.url).toMatch(/^https:\/\/platzhirsch\.studio\/de\/produkte\/[^/]+\/[^/]+$/);
      expect(p.price).toBe("auf Anfrage");
      expect(p.image).toBeUndefined();
    }
    // Die URL zeigt auf eine echte Seite
    const local = new URL(d.products[0].url).pathname;
    expect((await request.get(local, { timeout: 120_000 })).status()).toBe(200);
  });

  test("Fakten-Werkzeuge: showroom_info, arbeitsweise (7 Schritte), ezarri_collections", async ({ request }) => {
    const s = (await rpc(request, "tools/call", { name: "showroom_info", arguments: {} })).body.result.structuredContent;
    expect(s.address.line).toBe("Landstraße 11, 6911 Lochau, Österreich");
    const a = (await rpc(request, "tools/call", { name: "arbeitsweise", arguments: {} })).body.result.structuredContent;
    expect(a.steps).toHaveLength(7);
    expect(a.steps[2].name).toBe("Handzeichnung");
    const e = (await rpc(request, "tools/call", { name: "ezarri_collections", arguments: { collection: "gea" } })).body.result.structuredContent;
    expect(e.collections[0].url).toBe("https://platzhirsch.studio/de/ezarri/kollektionen/gea");
  });

  test("request_appointment: ohne Consent Fehler, mit Consent Probelauf ohne Buchung", async ({ request }) => {
    const { agent_consent: _c, ...noConsent } = APPT;
    const bad = await rpc(request, "tools/call", { name: "request_appointment", arguments: noConsent });
    expect(bad.body.result.isError).toBe(true);
    expect(bad.body.result.structuredContent.error).toBe("consent_required");

    const ok = await rpc(request, "tools/call", { name: "request_appointment", arguments: APPT });
    const d = ok.body.result.structuredContent;
    expect(ok.body.result.isError).toBe(false);
    // P6 Runde 2 (F4): mode "off" (Produktion) antwortet "handoff" – Link und
    // Telefon, nichts gespeichert, nichts gesendet (src/lib/agent/appointment.js).
    if (d.status === "handoff") {
      expect(d.message).toContain("Es wurden keine Angaben gespeichert.");
      expect(d.appointment_url).toContain("/beratung");
      expect(d.reference).toBeUndefined();
      expect(JSON.stringify(d)).not.toContain("test-agent@example.com");
      return;
    }
    expect(d.status).toBe("dryrun");
    expect(d.message).toContain("Nichts ist gebucht, bitte bestätigen Sie die E-Mail.");
    expect(d.reference).toMatch(/^AG-[0-9A-Z]{6}$/);
    expect(JSON.stringify(d)).not.toContain("test-agent@example.com");
  });

  test("/.well-known/mcp.json beschreibt den Endpunkt", async ({ request }) => {
    const res = await request.get("/.well-known/mcp.json");
    expect(res.status()).toBe(200);
    const card = await res.json();
    expect(card.endpoint).toBe("https://platzhirsch.studio/api/agent/mcp");
    expect(card.transport.type).toBe("streamable-http");
    // P6 Runde 2 (F4): gleiche Anzahl wie tools/list (8 in Produktion, 9 im Probelauf).
    const list = await rpc(request, "tools/list");
    expect(card.tools).toHaveLength(list.body.result.tools.length);
  });
});

test.describe("Seite /de/ki-assistenten", () => {
  test("Server-HTML: 200, Titel, eine H1, canonical, index, FAQ = JSON-LD, nur Deutsch", async ({ request }) => {
    const res = await request.get(PATH, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Platzhirsch für KI-Assistenten · MCP-Server und WebMCP</title>");
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/platzhirsch\.studio\/de\/ki-assistenten"/);
    expect(robotsDirectives({ text: html, headers: res.headers() })).not.toContain("noindex");
    const faq = jsonLdNodes(html).find((n) => n["@type"] === "FAQPage");
    const visible = [...html.matchAll(/<details[^>]*id="frage-\d+"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(visible).toEqual(faq.mainEntity.map((q) => q.name));
    // Vorführung zeigt schon im HTML eine echte Antwort (showroom_info)
    expect(html).toContain("Landstraße 11, 6911 Lochau");
    // Runde 2 (Inhaber-offen E.21, deOnlyRedirects in next.config.js): EN/FR/IT
    // addresses of German-only pages now 308 to the German page instead of 404.
    // Either way there is no own EN/FR/IT page.
    for (const l of ["en", "fr", "it"]) {
      const r = await request.get(`/${l}/ki-assistenten`, { timeout: 120_000, maxRedirects: 0 });
      expect([404, 308], l).toContain(r.status());
      if (r.status() === 308) expect(r.headers().location, l).toMatch(/\/de\/ki-assistenten(\?|$)/);
    }
    const confirm = await request.get(`${PATH}/bestaetigen`, { timeout: 120_000 });
    expect(robotsDirectives({ text: await confirm.text(), headers: confirm.headers() })).toContain("noindex");
  });

  test("Vorführung: Frage stellen, Antwort lesbar und als JSON, keine Konsolenfehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    await expect(page.locator('[data-surface="inverse"]')).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);

    const demo = page.locator("section", { has: page.locator("#ki-demo") });
    await demo.getByRole("button", { name: "Wie plant Platzhirsch?" }).click();
    const result = demo.locator("[data-demo-result]");
    await expect(result).toHaveAttribute("data-demo-result", "done", { timeout: 60_000 });
    await expect(result).toContainText("Handzeichnung");
    await expect(demo.getByRole("button", { name: "Wie plant Platzhirsch?" })).toHaveAttribute("aria-pressed", "true");
    await demo.getByRole("button", { name: "JSON" }).click();
    await expect(result).toContainText('"jsonrpc": "2.0"');
    await expect(demo.locator("pre").first()).toContainText('"name": "arbeitsweise"');
    expect(errors).toEqual([]);
  });

  test("375 px ohne Überlauf, axe ohne serious/critical", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(PATH);
    await settle(page);
    await dismissCookieBanner(page);
    const o = await measureOverflow(page);
    expect(o.sw, o.wide.join("; ")).toBeLessThanOrEqual(o.vw);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
    await ctx.close();
  });
});

test.describe("WebMCP", () => {
  test("mit document.modelContext: nur Lese-Werkzeuge, Ausführung über den MCP-Server", async ({ page }) => {
    await page.addInitScript(() => {
      window.__registered = [];
      Object.defineProperty(document, "modelContext", {
        value: { registerTool: (tool, opts) => window.__registered.push({ tool, signal: Boolean(opts?.signal) }) },
        configurable: true,
      });
    });
    const errors = collectConsoleErrors(page);
    await page.goto(PATH);
    await page.waitForFunction(() => window.__registered.length >= 10, null, { timeout: 30_000 });
    const names = await page.evaluate(() => window.__registered.map((r) => r.tool.name));
    // Rat 9,5 C10 (bewusst geändert): 8 + ezarri_quantities + idea_board_appointment_link (nur lesend).
    expect(names).toHaveLength(10);
    expect(names.every((n) => n.startsWith("platzhirsch_"))).toBe(true);
    expect(names).not.toContain("platzhirsch_request_appointment");
    expect(await page.evaluate(() => window.__registered.every((r) => r.signal && r.tool.annotations.readOnlyHint && r.tool.inputSchema.type === "object"))).toBe(true);
    const text = await page.evaluate(() => window.__registered.find((r) => r.tool.name === "platzhirsch_showroom_info").tool.execute({}, {}));
    expect(JSON.parse(text).address.street).toBe("Landstraße 11");
    expect(errors).toEqual([]);
  });

  test("ohne WebMCP-API: nichts registriert, keine Fehler", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const calls = [];
    page.on("request", (r) => r.url().includes(MCP) && calls.push(r.url()));
    await page.goto(PATH);
    await settle(page);
    expect(await page.evaluate(() => Boolean(document.modelContext || navigator.modelContext))).toBe(false);
    expect(calls).toEqual([]); // kein Werkzeug-Aufruf beim Laden
    expect(errors).toEqual([]);
  });
});

test.describe("Bestätigungsseite (Double-Opt-in)", () => {
  test("Probelauf-Link: Angaben sichtbar, Bestätigen bleibt Probelauf; ungültig/fehlend sauber", async ({ page, request }) => {
    const r = await rpc(request, "tools/call", { name: "request_appointment", arguments: APPT });
    const url = r.body.result.structuredContent.confirm_preview_url;
    test.skip(!url, "Kein Geheimnis gesetzt (Produktion ohne AGENT_SECRET): kein Vorschau-Link");
    const errors = collectConsoleErrors(page);
    const local = new URL(url);
    await page.goto(`${local.pathname}${local.hash}`);
    const box = page.locator("[data-confirm-step]");
    await expect(box).toHaveAttribute("data-confirm-step", "review", { timeout: 60_000 });
    await expect(box).toContainText("E2E-Test, bitte ignorieren");
    await expect(box).toContainText("Probelauf");
    expect(new URL(page.url()).hash).toBe(""); // Token aus der Adresszeile entfernt
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: "Terminwunsch bestätigen" }).click();
    await expect(box).toHaveAttribute("data-confirm-step", "done");
    await expect(box).toContainText("Probelauf abgeschlossen");

    await page.goto("about:blank"); // reine Hash-Änderung würde nicht neu laden
    await page.goto(`${local.pathname}#ungueltig${"x".repeat(60)}`);
    await expect(box).toHaveAttribute("data-confirm-step", "invalid", { timeout: 60_000 });
    await page.goto("about:blank");
    await page.goto(local.pathname);
    await expect(box).toHaveAttribute("data-confirm-step", "missing", { timeout: 60_000 });
    expect(errors.filter((e) => !/status of 400/.test(e))).toEqual([]);
  });
});
