// Rat 9,5 (T2) A4/A12/B2: „Termin mit diesem Plan“ – ein Vertrag für alle
// Werkzeuge (src/lib/kuechenplaner/planTermin.js), Küchenplaner-Übergabe mit
// Plan-Link und Leser mit 30-min-Grenze (handoff.js readHandoff).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLANER_THEMA, planLink, planTerminHref, terminBase } from "../../src/lib/kuechenplaner/planTermin.js";
import { HANDOFF_KEY, HANDOFF_MAX_AGE_MS, handoffHref, handoffProdukt, readHandoff, storeHandoff } from "../../src/lib/kuechenplaner/handoff.js";
import { handoffHref as sofaHref } from "../../src/lib/sofaplaner/handoff.js";
import { terminHref as sofaTerminHref } from "../../src/lib/sofaplaner/copy/source.js";
import { TERMIN_HREF as SOFA_TERMIN_DE } from "../../src/lib/sofaplaner/copy/index.js";
import { THEMEN } from "../../src/lib/booking/types.js";
import { beratungContext } from "../../src/lib/forms/beratungContext.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const KP = "https://platzhirsch.studio/de/kuechenplaner?k=" + "a".repeat(40);
const SP = "https://platzhirsch.studio/de/sofaplaner?p=" + "b".repeat(20) + "." + "c".repeat(43);

test("planLink: nur Werkzeugseiten dieser Website, keine fremden Ziele", () => {
  assert.equal(planLink(KP), KP);
  assert.equal(planLink(SP), SP);
  assert.equal(planLink("/de/stil-finder/ergebnis/italienische-ruhe?a=abc"), "https://platzhirsch.studio/de/stil-finder/ergebnis/italienische-ruhe?a=abc");
  assert.equal(planLink("http://localhost:3000/de/kuechenplaner?k=x"), "http://localhost:3000/de/kuechenplaner?k=x");
  assert.equal(planLink("https://evil.example/de/kuechenplaner?k=x"), null);
  assert.equal(planLink("https://user:pw@platzhirsch.studio/de/kuechenplaner?k=x"), null);
  assert.equal(planLink("javascript:alert(1)"), null);
  assert.equal(planLink("https://platzhirsch.studio/de/kontakt"), null);
  assert.equal(planLink("https://platzhirsch.studio/de/kuechenplaner?k=" + "x".repeat(3000)), null);
  assert.equal(planLink(""), null);
});

test("Termin-Ziel: /termin nur mit Kalender, sonst Beratung der Sprache", () => {
  assert.equal(terminBase("de", true), "/de/termin");
  assert.equal(terminBase("de", false), "/de/beratung");
  assert.equal(terminBase("en", false), "/en/consultation");
  assert.equal(terminBase("xx", false), "/de/beratung");
  for (const v of Object.values(PLANER_THEMA)) if (v.termin) assert.ok(THEMEN.includes(v.termin), v.termin);
});

test("planTerminHref: Kontext und Plan-Link landen in /termin bzw. /beratung", () => {
  const t = new URL(planTerminHref({ locale: "de", calendar: true, planer: "sofaplaner", produkt: "Sofa", plan: SP }), "https://x");
  assert.equal(t.pathname, "/de/termin");
  assert.equal(t.searchParams.get("thema"), "wohnen");
  assert.equal(t.searchParams.get("art"), "planung");
  assert.equal(t.searchParams.get("plan"), SP);
  const b = new URL(planTerminHref({ locale: "de", planer: "sofaplaner", produkt: "Sofa", plan: SP }), "https://x");
  assert.equal(b.pathname, "/de/beratung");
  assert.equal(b.searchParams.get("thema"), "sofa");
  assert.equal(b.searchParams.get("planer"), "sofaplaner");
  // Die Beratungsseite erkennt den Kontext (Schritt 1 Sofa, Zeile „Sofaplaner“)
  const ctx = beratungContext(b.searchParams);
  assert.equal(ctx.step1, "sofa");
  assert.ok(ctx.lines.some((l) => l.key === "sofaplaner"));
  // fremder Plan-Link fällt weg, Board-ID nur im richtigen Format
  const x = new URL(planTerminHref({ planer: "ideenboard", plan: "https://evil.example/x", ideenboard: "z".repeat(32) }), "https://x");
  assert.equal(x.searchParams.get("plan"), null);
  assert.equal(x.searchParams.get("ideenboard"), "z".repeat(32));
  assert.equal(new URL(planTerminHref({ ideenboard: "kurz" }), "https://x").searchParams.get("ideenboard"), null);
});

test("A12: Sofaplaner überall thema=sofa&planer=sofaplaner", () => {
  for (const href of [SOFA_TERMIN_DE, sofaTerminHref("de"), sofaTerminHref("en"), sofaHref({ locale: "de", name: "Lounge", count: 2, shareUrl: SP })]) {
    const u = new URL(href, "https://x");
    assert.equal(u.searchParams.get("thema"), "sofa", href);
    assert.equal(u.searchParams.get("planer"), "sofaplaner", href);
  }
  assert.equal(new URL(sofaHref({ locale: "de", shareUrl: SP }), "https://x").searchParams.get("plan"), SP);
});

test("A4: Küchenplaner-Übergabe mit Plan-Link und thema=kueche", () => {
  const u = new URL(handoffHref({ locale: "de", lines: ["Grundform: L-Küche · Raster 60 cm"], shareUrl: KP }), "https://x");
  assert.equal(u.pathname, "/de/beratung");
  assert.equal(u.searchParams.get("thema"), "kueche");
  assert.equal(u.searchParams.get("plan"), KP);
  // kurzer Link zusätzlich im Vorhaben-Text (≤ 190), langer nur als ?plan=
  assert.equal(handoffProdukt(["Grundform: L-Küche"], KP), `3D-Küchenplaner: L-Küche · Plan: ${KP}`);
  const long = "https://platzhirsch.studio/de/kuechenplaner?k=" + "a".repeat(400);
  assert.equal(handoffProdukt(["Grundform: L-Küche"], long), "3D-Küchenplaner: L-Küche");
  assert.equal(new URL(handoffHref({ lines: [], shareUrl: long, calendar: true }), "https://x").pathname, "/de/termin");
});

test("A4: readHandoff liest ≤ 30 min, passender Planer, löscht den Schlüssel immer", () => {
  const mem = new Map();
  const st = { setItem: (k, v) => mem.set(k, v), getItem: (k) => mem.get(k) ?? null, removeItem: (k) => mem.delete(k) };
  storeHandoff(st, { lines: ["Grundform: L-Küche"], shareUrl: KP });
  const got = readHandoff(st, { planer: "kuechenplaner" });
  assert.equal(got.planer, "kuechenplaner");
  assert.match(got.text, /Planung öffnen: https:\/\/platzhirsch\.studio\/de\/kuechenplaner/);
  assert.equal(got.url, KP);
  assert.equal(mem.has(HANDOFF_KEY), false, "Schlüssel gelöscht");
  assert.equal(readHandoff(st), null, "zweites Lesen leer");
  // abgelaufen
  mem.set(HANDOFF_KEY, JSON.stringify({ planer: "kuechenplaner", text: "x", url: KP, at: Date.now() - HANDOFF_MAX_AGE_MS - 1 }));
  assert.equal(readHandoff(st), null);
  assert.equal(mem.has(HANDOFF_KEY), false);
  // falscher Planer, kaputtes JSON, fremde URL
  mem.set(HANDOFF_KEY, JSON.stringify({ planer: "sofaplaner", text: "x", at: Date.now() }));
  assert.equal(readHandoff(st, { planer: "kuechenplaner" }), null);
  mem.set(HANDOFF_KEY, "{kaputt");
  assert.equal(readHandoff(st), null);
  mem.set(HANDOFF_KEY, JSON.stringify({ planer: "sofaplaner", text: "Plan", url: "https://evil.example/", at: Date.now() }));
  assert.deepEqual(readHandoff(st), { planer: "sofaplaner", text: "Plan", url: "" });
  assert.equal(readHandoff({ getItem: () => { throw new Error("blocked"); } }), null);
});

test("B2: Sofa-, Küchenplaner und Stil-Finder bieten „Termin mit diesem …“ mit Kalender-Ziel vom Server", () => {
  assert.match(read("src/components/Labs/Sofaplaner/ResultPanel.js"), /"Termin mit diesem Plan"/);
  assert.match(read("src/components/Labs/Kuechenplaner/ResultPanel.js"), /Termin mit diesem Plan/);
  assert.match(read("src/components/Labs/Stilfinder/StilResult.js"), /planTerminHref\(/);
  for (const p of ["src/app/[locale]/sofaplaner/page.js", "src/app/[locale]/kuechenplaner/page.js", "src/app/[locale]/stil-finder/ergebnis/[profil]/page.js"]) {
    assert.match(read(p), /calendar=\{ownCalendarActive\(\)\}/, p);
  }
});

test("A11: Harald-Zeile unter dem Lead beider Planer und im Stil-Finder-Ergebnis", () => {
  const line = /Harald Menghin zeichnet Ihr Konzept danach von Hand/;
  assert.match(read("src/app/[locale]/sofaplaner/page.js"), line);
  // Küchenplaner (viersprachig seit 01.11.2026): Text in content.js, page.js setzt copy.header.hand
  assert.match(read("src/lib/kuechenplaner/content.js"), line);
  assert.match(read("src/app/[locale]/kuechenplaner/page.js"), /data-hand-line="">\s*\{copy\.header\.hand\}/);
  // Stil-Finder (viersprachig): Text in intl/de.js, StilResult setzt t.handLine
  assert.match(read("src/lib/stilfinder/intl/de.js"), line);
  assert.match(read("src/components/Labs/Stilfinder/StilResult.js"), /data-hand-line="">\s*\{t\.handLine\}/);
  assert.match(read("src/app/[locale]/sofaplaner/page.js"), /href="#planer-start"/);
});

test("C10: MCP-Werkzeuge Ezarri-Mengen und Board-Link – nur lesend, ohne Preise", async () => {
  const { createAdapter } = await import("../../src/lib/agent/adapter.js");
  const { toolDef } = await import("../../src/lib/agent/tools.js");
  const adapter = createAdapter({ catalog: {}, slots: () => null });
  for (const n of ["ezarri_quantities", "idea_board_appointment_link"]) assert.equal(toolDef(n).annotations.readOnlyHint, true, n);
  const q = await adapter.callTool("ezarri_quantities", { flaeche_m2: 48, format: "25" });
  const data = q.structuredContent || JSON.parse(q.content[0].text);
  assert.equal(data.flaeche_mit_verschnitt_m2, 52.8);
  assert.equal(data.kartons, 27);
  assert.match(data.hinweis, /kein Angebot/);
  assert.doesNotMatch(JSON.stringify(data), /€|EUR/);
  const bad = await adapter.callTool("ezarri_quantities", { flaeche_m2: -1 });
  assert.equal(bad.isError, true);
  const id = "A".repeat(32);
  const l = await adapter.callTool("idea_board_appointment_link", { share_id: id, locale: "en" });
  const link = (l.structuredContent || JSON.parse(l.content[0].text)).url;
  const u = new URL(link);
  assert.equal(u.pathname, "/en/consultation");
  assert.equal(u.searchParams.get("ideenboard"), id);
  assert.equal(u.searchParams.get("quelle"), "agent");
  assert.equal((await adapter.callTool("idea_board_appointment_link", { share_id: "kurz" })).isError, true);
});
