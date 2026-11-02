// tests/unit/r9-p3-conversion.test.mjs — Runde 5, Fix-Team P3 (Conversion,
// CTA-Leiste, Concierge, Leistungen-Hub, Landingpages).
// Run: node --test tests/unit/r9-p3-conversion.test.mjs
//   1 Bestätigung: Anruf-Variante nur mit Telefon, sonst E-Mail (ux P1-1), 4 Sprachen, ohne Frist
//   2 KI-Knopf nur mit conciergeLive() (ux P1-2, technik P1-6), Status-Route gleiches Kriterium
//   3 Architektin → „Architektur / Planungsbüro“, Interior ohne „Neubau“, Stadt als eigener Kontext
//   4 /de/leistungen wie das Menü, „Für Fachleute“, Bildpfad ohne /labs/hub/v/
//   5 Launcher verdeckt „Privatsphäre-Einstellungen“ nicht; Concierge IT in voi
//   6 IT-Meta-Texte in voi; 7 Footer auf /beratung, Merkliste ohne Kopfbild
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { CONFIRMATION_STEP1, CITY_CONTEXT, cityContext, confirmationStep1 } from "../../src/components/Beratung/confirmationCopy.js";
import { beratungContext, contextCity, contextForPath, headerTopic, herkunftContext, withContext } from "../../src/lib/forms/beratungContext.js";
import { herkunftBlock, withLead } from "../../src/lib/forms/leadPayload.js";
import { FEATURES, enabledFeatures, groupFeatures, hubFeatures } from "../../src/lib/features.js";
import { HUB_DIR, hubImageId, hubSrcSet } from "../../src/components/Labs/Hub/hubImage.js";
import { PLANER, beratungHref } from "../../src/components/Landing/copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
// Quelltext ohne Zeilenkommentare (Kommentare dürfen alte Pfade erklären).
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "");
const LOCALES = ["de", "en", "fr", "it"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});
const { buildRooms, navFeatures } = await import("../../src/components/Navbar/shellNav.js");

// ------------------------------------------------------------ 1 Bestätigung
test("1) Bestätigung: mit Telefon Anruf, ohne Telefon E-Mail – Beratung und Kontakt, 4 Sprachen", () => {
  const CALL = { de: /rufen/, en: /call/, fr: /appel|rappel/, it: /chiam/ };
  const MAIL = { de: /E-Mail/, en: /e-mail/, fr: /e-mail/, it: /e-mail/ };
  for (const l of LOCALES) {
    for (const kind of ["beratung", "kontakt"]) {
      const withPhone = confirmationStep1(l, { kind, phone: "+43 664 1234567" });
      const without = confirmationStep1(l, { kind, phone: "" });
      assert.match(withPhone, CALL[l], `${l} ${kind} Telefon`);
      assert.match(without, MAIL[l], `${l} ${kind} ohne Telefon`);
      assert.doesNotMatch(without, CALL[l], `${l} ${kind}: ohne Telefon kein Anrufversprechen`);
      assert.equal(confirmationStep1(l, { kind, phone: "   " }), without, `${l} ${kind}: Leerzeichen = kein Telefon`);
    }
  }
  // Unbekannte Sprache → Deutsch.
  assert.equal(confirmationStep1("es", { phone: "" }), CONFIRMATION_STEP1.de.beratung.email);
});

test("1) Bestätigung: keine Frist (Inhaber-offen Nr. 23), IT in voi, Confirmation nutzt die Variante", () => {
  const all = JSON.stringify(CONFIRMATION_STEP1);
  assert.doesNotMatch(all, /innerhalb|Stunden|Werktag|so bald wie möglich|within|hours|as soon as|dans les \d|ore\b|entro/i);
  for (const t of Object.values(CONFIRMATION_STEP1.it).flatMap((g) => Object.values(g))) {
    assert.doesNotMatch(t, /\b(ti|tuo|tua|tuoi|tue)\b/, `IT voi: ${t}`);
    assert.match(t, /\b(vi|vostro|vostra)\b/i, `IT voi: ${t}`);
  }
  const conf = read("src/components/Beratung/Confirmation.js");
  assert.match(conf, /confirmationStep1\(locale, \{ kind, phone \}\)/);
  assert.match(conf, /data-contact-way=/);
  assert.match(read("src/components/BeratungClient/BeratungClient.js"), /phone=\{summary\?\.phone\}/);
  assert.match(read("src/components/Kontakt/KontaktForm.js"), /phone=\{summary\?\.phone\}/);
});

// ------------------------------------------------------------ 2 KI-Knopf
test("2) KI-Knopf und Status-Route nur mit conciergeLive() (kein Mock, kein Not-Aus)", () => {
  const bar = read("src/components/Reusable/MobileCtaBar.js");
  // WhatsApp-/Kalender-Umbau (Inhaber Nr. 12): weitere Props dazu, `ai` bleibt standardmäßig aus.
  assert.match(bar, /export default function MobileCtaBar\(\{ labels = \{\}, ai = false[,} ]/);
  assert.match(bar, /const showAi = ai === true && /);
  assert.match(read("src/components/Reusable/Footer.js"), /<MobileCtaBar labels=\{labels\.ctaBar\} ai=\{conciergeLive\(\)\}[ />]/);
  const status = read("src/app/api/labs/status/route.js");
  assert.match(status, /concierge: conciergeLive\(\)/);
  assert.doesNotMatch(status, /isAvailable/);
});

test("2) conciergeLive(): Mock oder fehlender Schlüssel → aus", async () => {
  const { conciergeLive } = await import("../../src/lib/concierge/config.js");
  const keep = { k: process.env.ANTHROPIC_API_KEY, m: process.env.CONCIERGE_MOCK, d: process.env.CONCIERGE_DISABLED };
  try {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CONCIERGE_DISABLED;
    process.env.CONCIERGE_MOCK = "1";
    assert.equal(conciergeLive(), false, "Mock ist kein Kundenmodus");
    delete process.env.CONCIERGE_MOCK;
    assert.equal(conciergeLive(), false, "ohne Schlüssel");
    process.env.ANTHROPIC_API_KEY = "test";
    assert.equal(conciergeLive(), true);
    process.env.CONCIERGE_DISABLED = "1";
    assert.equal(conciergeLive(), false, "Not-Aus");
  } finally {
    for (const [name, v] of [["ANTHROPIC_API_KEY", keep.k], ["CONCIERGE_MOCK", keep.m], ["CONCIERGE_DISABLED", keep.d]]) {
      if (v === undefined) delete process.env[name];
      else process.env[name] = v;
    }
  }
});

// ------------------------------------------------------------ 3 Kontext
test("3) Architektin: Rolle gewinnt, Schritt 2 offen, CTAs ohne thema=objekt", () => {
  for (const q of ["rolle=architekt", "thema=objekt&rolle=architekt", "thema=hotel&rolle=planer&ort=st-gallen"]) {
    const ctx = beratungContext(new URLSearchParams(q));
    assert.equal(ctx.step1, "architektur", q);
    assert.equal(ctx.step2, null, q);
    assert.equal(headerTopic(ctx), "architekt", q);
  }
  assert.deepEqual(PLANER.cta, { rolle: "architekt", label: "Zusammenarbeit anfragen" });
  assert.equal(beratungHref({ thema: PLANER.cta.thema, rolle: PLANER.cta.rolle, ort: "st-gallen" }), "/beratung?rolle=architekt&ort=st-gallen");
  // Ohne Rolle bleibt Objekt Objekt (Hotelier, Startseite).
  assert.equal(beratungContext({ thema: "objekt" }).step1, "objekt");
});

test("3) Interior Design wählt nicht „Neubau“ vor", () => {
  assert.deepEqual(contextForPath("/interior-design-vorarlberg"), { thema: "interior" });
  const ctx = beratungContext({ thema: "interior" });
  assert.equal(ctx.step1, null);
  assert.equal(ctx.step2, null);
  assert.deepEqual(ctx.lines, []);
  assert.equal(headerTopic(ctx), null);
  assert.match(read("src/app/[locale]/interior-design-vorarlberg/page.js"), /thema: "interior"/);
});

test("3) Stadt (?ort=) als eigener Kontext: Zeile über Schritt 1, Bestätigungszeile, Herkunft-Block", () => {
  const ctx = beratungContext({ ort: "bregenz" });
  assert.equal(contextCity(ctx), "Bregenz");
  assert.equal(herkunftContext(ctx), "Stadtseite: Bregenz");
  assert.equal(herkunftContext(beratungContext({ rolle: "architekt", ort: "st-gallen" })), "Stadtseite: St. Gallen · Fachweg: Architektur/Planung");
  assert.equal(herkunftContext(beratungContext({ ort: "%3Cscript%3E" })), "");
  const block = herkunftBlock({}, { leadRef: "0b6c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d", pageContext: "Stadtseite: Bregenz" });
  assert.match(block, /^── Herkunft \(automatisch\) ──\nKontext: Stadtseite: Bregenz\n/);
  assert.doesNotMatch(herkunftBlock({}, { pageContext: "a<b>\u0000" }), /[<>\u0000]/);
  assert.doesNotMatch(herkunftBlock({}, {}), /Kontext:/, "ohne Kontext keine Zeile");
  const lead = withLead({ bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten." }, "beratung", { pageContext: "Stadtseite: Bregenz" });
  assert.match(lead.bitte_beschreiben_sie_ihr_vorhaben, /Kontext: Stadtseite: Bregenz/);
  for (const l of LOCALES) {
    assert.match(cityContext(l, "note", "Bregenz"), /Bregenz/, l);
    assert.ok(CITY_CONTEXT[l].label, l);
  }
  const client = read("src/components/BeratungClient/BeratungClient.js");
  assert.match(client, /filter\(\(l\) => l\.key !== "ort"\)/, "Stadt nicht mehr im Freitext des Kunden");
  assert.match(client, /role="status" data-beratung-city=""/);
  assert.match(client, /pageContext \? \{ pageContext \}/);
});

// ------------------------------------------------------------ 4 Leistungen
test("4) /de/leistungen: Garten, Upload und Portal wie im Menü; MCP unter „Für Fachleute“", () => {
  const list = hubFeatures(enabledFeatures({ raw: {}, nodeEnv: "production" }), { recording: false, concierge: false });
  const ids = list.map((f) => f.id);
  for (const id of ["outdoor", "upload", "portal", "agent", "dreilaender"]) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes("concierge"), "Concierge nur mit echter KI");
  assert.ok(!ids.includes("showroom"), "Showroom nur mit Aufnahme");
  assert.equal(list.find((f) => f.id === "portal").href, "/portal/login", "wie im Menü, ohne 307");
  const groups = groupFeatures(list);
  assert.deepEqual(groups.find((g) => g.id === "service").features.map((f) => f.id), ["dreilaender", "upload", "portal", "pflege"]); // + Pflege-Service (Integration 29.10.2026)
  assert.deepEqual(groups.find((g) => g.id === "fachleute").features.map((f) => f.id), ["agent"]);
  // Upload und Portal: Piktogramm statt Demo-Screenshot.
  const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f]));
  assert.equal(byId.upload.image, null);
  assert.equal(byId.upload.visual, "phone");
  assert.equal(byId.portal.image, null);
  assert.equal(byId.portal.visual, "folder");
  const visual = read("src/components/Labs/Hub/FeatureVisual.js");
  assert.ok(visual.includes("phone: Phone") && visual.includes("folder: Folder"));
  // Jeder Menü-Link aus „Planen & Erleben“ (und „Garten & Terrasse planen“) hat einen Platz im Hub.
  const c = (k) => k;
  const rooms = buildRooms({ locale: "de", groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", showroom: false }), concierge: false });
  const services = rooms.find((r) => r.id === "services").columns.flatMap((col) => col.links).map((l) => l.href.split(/[?#]/)[0]);
  const outdoorPlan = rooms.find((r) => r.id === "outdoor").columns.flatMap((col) => col.links).filter((l) => l.href === "/outdoor-gartenplanung");
  assert.equal(outdoorPlan.length, 1, "Menü führt die Gartenplanung");
  const hub = read("src/components/Labs/Hub/LabsHub.js");
  const hubHrefs = new Set([...list.map((f) => f.href), ...[...hub.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]), "/outdoor-gartenplanung", "/beratung"]);
  for (const href of services) assert.ok(hubHrefs.has(href), `Menü-Link ohne Hub-Eintrag: ${href}`);
  assert.match(hub, /OUTDOOR_ADVICE/);
  assert.match(hub, /data-leistungen-fachleute=""/);
  assert.match(hub, /data-leistungen-termin=""/, "Termin-Weg im ersten Bildschirm");
});

test("4) Kartenbilder unter /bilder/leistungen/ (kein /labs/hub/v/), alle Größen vorhanden", () => {
  assert.equal(HUB_DIR, "/bilder/leistungen");
  assert.equal(hubImageId("/bilder/leistungen/kuechenplaner.webp"), "kuechenplaner");
  assert.equal(hubImageId("/labs/hub/kuechenplaner.webp"), null);
  assert.doesNotMatch(hubSrcSet("kuechenplaner", "avif"), /labs/);
  for (const f of ["src/components/Labs/Hub/HubPicture.js", "src/components/Labs/Hub/LabsHub.js", "src/components/Labs/Hub/FeatureVisual.js", "src/lib/features.js"]) {
    assert.doesNotMatch(code(f), /\/labs\/hub/, f);
  }
  assert.ok(!fs.existsSync(path.join(ROOT, "public/labs/hub")), "alter Ordner entfernt");
  // Küchenplaner-Kachel (erstes Bild, fetchPriority high): Quelle 1200 × 800, alle Größen da und nicht leer.
  for (const w of [384, 640, 960, 1200]) {
    for (const ext of ["avif", "webp"]) {
      const file = path.join(ROOT, "public/bilder/leistungen", `kuechenplaner-${w}.${ext}`);
      assert.ok(fs.statSync(file).size > 1000, file);
    }
  }
});

// ------------------------------------------------------------ 5 Launcher, IT
test("5) Launcher: Footer reserviert --ph-concierge-h unter den Rechtslinks", () => {
  const footer = read("src/components/Reusable/Footer.js");
  const legal = footer.indexOf("<PrivacySettingsButton");
  const gap = footer.indexOf('data-concierge-gap=""');
  assert.ok(legal > 0 && gap > legal, "Abstand nach der Rechtszeile");
  assert.match(footer, /h-\[var\(--ph-concierge-h,0px\)\]/);
  assert.match(read("src/components/Concierge/Launcher.js"), /root\.setProperty\("--ph-concierge-h", "64px"\)/);
});

test("5) Concierge IT in voi (recht P1-1): keine tu-Formen im Panel und im Launcher", async () => {
  const { texts } = await import("../../src/components/Concierge/core/texts.js");
  const it = texts("it");
  const strings = JSON.stringify(it);
  for (const re of [/\b(tuo|tua|tuoi|tue|puoi|vuoi)\b/i, /\bScrivi\b/, /\bConferma\b/, /\bRiprova\b/, /\bAttendi\b/, /\bRicomincia\b/]) {
    assert.doesNotMatch(strings, re, String(re));
  }
  assert.match(it.consentRest, /vostro consenso/);
  const launcher = read("src/components/Concierge/Launcher.js");
  assert.match(launcher, /"Aprite il concierge IA\. State scrivendo con un’IA\."/);
  assert.doesNotMatch(launcher, /Stai scrivendo|Riprendi la conversazione/);
});

// ------------------------------------------------------------ 6 IT-Meta
test("6) IT-Meta auf Beratung, Kontakt und Merkliste in voi", () => {
  for (const f of ["src/app/[locale]/beratung/page.js", "src/app/[locale]/kontakt/page.js", "src/app/[locale]/merkliste/page.js"]) {
    assert.doesNotMatch(read(f), /\b(tuo|tua|tuoi|tue|Contattaci|Richiedi|Gestisci|Raccogli)\b/, f);
  }
  assert.match(read("src/app/[locale]/kontakt/page.js"), /Contattateci/);
});

// ------------------------------------------------------------ 7 Footer, Merkliste
test("7) Footer auf /beratung: Sprung zum Formular statt Link auf sich selbst (behält ?ort=)", async () => {
  const src = read("src/components/Forms/TerminContextLink.js");
  assert.match(src, /export const FORM_ANCHOR = "#anfrage"/);
  assert.match(src, /routePath\(pathname\) === routePath\(href\) \? FORM_ANCHOR : contextual/);
  const routePath = (href) => String(href || "").split(/[?#]/)[0].replace(/^\/(de|en|fr|it)(?=\/|$)/, "") || "/";
  assert.equal(routePath("/de/beratung"), "/beratung");
  assert.equal(routePath("/beratung?ort=bregenz"), "/beratung");
  assert.equal(routePath("/en/consultation"), "/consultation");
  assert.match(read("src/app/[locale]/beratung/page.js"), /<div id="anfrage"/);
  // ?thema= nur an /beratung-Links (withContext hängt an die übergebene Beratungs-URL).
  assert.equal(withContext("/beratung", contextForPath("/yacht-interior")), "/beratung?thema=yacht");
});

test("7) Merkliste: kein Kopfbild unbekannter Herkunft, Leerzustand im Server-HTML", () => {
  const page = code("src/app/[locale]/merkliste/page.js");
  assert.doesNotMatch(page, /room-1600|image: "/);
  const cart = read("src/components/CartPage/CartPage.js");
  assert.match(cart, /selection\.emptyTitle/);
  assert.match(read("src/context/CartContext.js"), /getServerSnapshot/);
});
