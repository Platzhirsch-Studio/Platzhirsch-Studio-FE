// tests/unit/labs-hub.test.mjs — Feature-Schalter, Menü „Planen & Erleben“ und
// Übersicht /de/leistungen (src/lib/features.js, shellNav.js).
// Run: node --test tests/unit/labs-hub.test.mjs
//
// Bewusst geänderte Erwartungen (Integration 28.10.2026, Inhaber-Entscheidung
// Nr. 9 „keine separate Labs-Welt“): Schalter standardmäßig AN auch in
// Produktion (vorher: Produktion aus), keine Labs-URLs mehr (/labs → 308 auf
// /leistungen), kein achter Menüpunkt – „Planen & Erleben“ ersetzt
// „Leistungen“ (sieben Punkte), keine Status-Plaketten und Schalternamen mehr
// vor Kunden (Usability B4).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { FEATURES, FEATURE_GROUPS, STATUS, desktopCols, desktopSpan, enabledFeatures, featuresFor, flagOn, groupFeatures, isFeatureOn } from "../../src/lib/features.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// "@/"-Alias wie Next auflösen (shellNav.js importiert über "@/").
registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});
const { buildRooms, navFeatures, germanOnlySegments } = await import("../../src/components/Navbar/shellNav.js");
const moves = (await import("../../src/lib/seo/labsMoves.cjs")).default;

const PROD = { raw: {}, nodeEnv: "production" };
const DEV = { raw: {}, nodeEnv: "development" };
const c = (k) => k;

test("flagOn: standardmäßig AN in jeder Umgebung, nur \"0\" schaltet aus", () => {
  for (const env of ["production", "development", "test"]) {
    assert.equal(flagOn(undefined, env), true, env);
    assert.equal(flagOn("1", env), true, env);
    assert.equal(flagOn("0", env), false, env);
    assert.equal(flagOn(" 0 ", env), false, env);
  }
});

test("Produktion ohne Schalter: alle Features an; einzeln abschaltbar", () => {
  assert.equal(enabledFeatures(PROD).length, FEATURES.length);
  assert.equal(enabledFeatures(DEV).length, FEATURES.length);
  for (const f of FEATURES) assert.equal(isFeatureOn(f.id, PROD), true, f.id);
  assert.ok(!enabledFeatures({ raw: { sofaplaner: "0" }, nodeEnv: "production" }).some((f) => f.id === "sofaplaner"));
  // Seiten mit eigener Regel: ohne Verfügbarkeit nicht verlinkt (Showroom ohne Aufnahme, Ezarri ohne EZARRI_PUBLIC).
  const off = enabledFeatures({ ...PROD, available: { showroom: false, ezarri: false } }).map((f) => f.id);
  assert.ok(!off.includes("showroom") && !off.includes("ezarri"));
});

test("Schalter stehen WÖRTLICH im Code (Next setzt nur so ein)", () => {
  const src = read("src/lib/features.js");
  const code = src.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /process\.env\[|=\s*process\.env\s*[;,)]/, "keine dynamischen Zugriffe");
  for (const f of FEATURES) {
    assert.match(f.env, /^NEXT_PUBLIC_FEATURE_[A-Z]+$/);
    assert.ok(src.includes(`${f.id}: process.env.${f.env},`), `${f.id} → ${f.env} wörtlich`);
  }
  assert.equal(new Set(FEATURES.map((f) => f.env)).size, FEATURES.length);
});

test("Feature-Liste: feste URLs außerhalb von /labs, mit Bild/Text/Gruppe", () => {
  const hrefs = Object.fromEntries(FEATURES.map((f) => [f.id, f.href]));
  assert.deepEqual(
    { kuechenplaner: hrefs.kuechenplaner, sofaplaner: hrefs.sofaplaner, stilfinder: hrefs.stilfinder, arviewer: hrefs.arviewer, dreilaender: hrefs.dreilaender, concierge: hrefs.concierge, upload: hrefs.upload },
    { kuechenplaner: "/kuechenplaner", sofaplaner: "/sofaplaner", stilfinder: "/stil-finder", arviewer: "/3d-ansicht", dreilaender: "/dreilaender-rechner", concierge: "/concierge", upload: "/upload" }
  );
  assert.equal(hrefs.portal, "/portal");
  assert.equal(hrefs.ezarri, "/ezarri");
  assert.equal(hrefs.yacht, "/yacht-interior");
  assert.equal(hrefs.outdoor, "/outdoor-gartenplanung");
  assert.equal(hrefs.showroom, "/showroom");
  assert.equal(hrefs.licht, "/bodensee-licht");
  assert.equal(hrefs.agent, "/ki-assistenten");
  const groups = FEATURE_GROUPS.map((g) => g.id);
  for (const f of FEATURES) {
    assert.ok(f.title && f.summary && f.nav && f.href.startsWith("/"), f.id);
    assert.ok(!f.href.startsWith("/labs"), `${f.id}: keine Labs-URL`);
    assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]", f.href, "page.js")), `${f.id}: Seite ${f.href} fehlt`);
    assert.ok(STATUS[f.status], `${f.id}: Status`);
    assert.ok(groups.includes(f.group), `${f.id}: Gruppe`);
    if (f.image) {
      assert.ok(f.image.alt, `${f.id}: alt`);
      assert.ok(fs.existsSync(path.join(ROOT, "public", f.image.src)), `${f.id}: ${f.image.src} fehlt`);
    }
    const text = `${f.title} ${f.summary} ${f.note || ""}`;
    assert.doesNotMatch(text, /\b(beste[nrs]?|einzig\w*|exklusiv\w*|führend\w*|Nr\.\s?1|Vertragshändler|offizielle[rn]? Händler)\b/i, f.id);
    assert.doesNotMatch(text, /€|EUR|CHF\s?\d/, `${f.id}: keine Preise`);
    assert.doesNotMatch(text, /Labs|Prototyp|Freigabe|Testphase|entsteht gerade/i, `${f.id}: keine Entwicklersprache`);
  }
});

test("Redirects: jede alte /labs-URL → 308 auf die feste URL, nur mit Sprachpräfix", () => {
  const list = moves.labsRedirects();
  assert.ok(list.every((r) => r.permanent === true));
  assert.ok(list.every((r) => r.source.startsWith("/:locale(de|en|fr|it)/labs")), "public/labs/* bleibt unberührt");
  assert.equal(moves.newPathFor("/de/labs/kuechenplaner"), "/de/kuechenplaner");
  assert.equal(moves.newPathFor("/de/labs/ar-viewer/tables-freeman"), "/de/3d-ansicht/tables-freeman");
  assert.equal(moves.newPathFor("/de/labs/stilfinder/ergebnis/ruhe"), "/de/stil-finder/ergebnis/ruhe");
  assert.equal(moves.newPathFor("/de/labs/upload-demo"), "/de/upload");
  assert.equal(moves.newPathFor("/en/labs/dreilaender"), "/de/dreilaender-rechner");
  assert.equal(moves.newPathFor("/de/labs"), "/de/leistungen");
  assert.equal(moves.newPathFor("/de/labs/unbekannt"), "/de/leistungen");
  for (const m of moves.LABS_MOVES) assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]", m.to, "page.js")), m.to);
  assert.ok(!fs.existsSync(path.join(ROOT, "src/app/[locale]/labs")), "kein Labs-Ordner mehr");
  assert.match(read("next.config.js"), /\.\.\.labsRedirects\(\)/);
  // Sprach-Integration 01.11.2026 (bewusst geändert): Leistungen, Küchenplaner,
  // Sofaplaner, Stil-Finder und Dreiländer-Rechner sind viersprachig – nicht mehr
  // in der Liste; 3D-Ansicht und Concierge bleiben nur Deutsch.
  for (const seg of ["3d-ansicht", "concierge"]) {
    assert.ok(germanOnlySegments().some((e) => e.split("@")[0] === seg), `${seg} als „nur Deutsch“ eingetragen`);
  }
  for (const seg of ["leistungen", "kuechenplaner", "sofaplaner", "stil-finder", "dreilaender-rechner"]) {
    assert.ok(!germanOnlySegments().some((e) => e.split("@")[0] === seg), `${seg} ist viersprachig`);
  }
});

test("Hauptnavigation: sieben Punkte, „Planen & Erleben“ statt Leistungen, kein Labs-Punkt", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    const rooms = buildRooms({ locale, groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production" }) });
    assert.ok(!rooms.some((r) => r.id === "labs"), locale);
    assert.ok(rooms.length <= 7, `${locale}: ${rooms.length} Punkte`);
    const plan = rooms.find((r) => r.id === "services");
    assert.equal(plan.label, "nav.plan");
    assert.equal(plan.navShort, "nav.planShort");
  }
  const de = buildRooms({ locale: "de", groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri: true, showroom: false }) });
  const plan = de.find((r) => r.id === "services");
  assert.equal(plan.all.href, "/leistungen");
  const links = plan.columns.flatMap((col) => col.links);
  // r7-p1 (seo P2-9): the portal entry links the login directly (/portal 307s there).
  for (const href of ["/arbeitsweise", "/kuechenplaner", "/sofaplaner", "/stil-finder", "/3d-ansicht", "/bodensee-licht", "/concierge", "/portal/login", "/yacht-interior"]) {
    assert.ok(links.some((l) => l.href === href), href);
  }
  // R4 ux P1-3 (bewusst geändert, Inhaber-Entscheidung Nr. 9: alle Features
  // fest im Menü): Outdoor-Gartenplanung („Outdoor & Pool“) und der
  // Handy-Upload („Service für Kunden“) stehen wieder im Menü. Der Showroom-
  // Rundgang bleibt draußen, solange keine echte Aufnahme da ist.
  const allDe = de.flatMap((r) => r.columns.flatMap((col) => col.links));
  assert.ok(!allDe.some((l) => l.href === "/showroom"), "/showroom");
  const outdoorLinks = de.find((r) => r.id === "outdoor").columns.flatMap((col) => col.links);
  assert.ok(outdoorLinks.some((l) => l.href === "/outdoor-gartenplanung"), "Outdoor-Gartenplanung unter Outdoor");
  assert.ok(links.some((l) => l.href === "/upload"), "Handy-Upload unter Planen & Erleben");
  assert.ok(!links.some((l) => l.href === "/showroom"), "Showroom ohne Aufnahme nicht verlinkt");
  // Werkzeuge stehen dort, wo die Aufgabe ist (Usability 3.1); im Planen-Menü nur `shared`.
  for (const href of ["/kuechenplaner", "/sofaplaner", "/stil-finder"]) assert.ok(links.find((l) => l.href === href).shared, href);
  const kitchen = de.find((r) => r.id === "kitchen").columns.flatMap((col) => col.links);
  assert.ok(kitchen.some((l) => l.href === "/kuechenplaner" && !l.shared));
  const living = de.find((r) => r.id === "living");
  // Ohne Produktgruppen gibt es kein „Wohnen“; mit Gruppe stehen Sofaplaner und Stil-Finder dort.
  assert.equal(living, undefined);
  const withLiving = buildRooms({ locale: "de", groups: [{ title: "Sofas", items: [{ key: "sofas-couches", label: "Sofas" }] }], c, features: navFeatures({ raw: {}, nodeEnv: "production" }) });
  const livingLinks = withLiving.find((r) => r.id === "living").columns.flatMap((col) => col.links);
  assert.ok(livingLinks.some((l) => l.href === "/sofaplaner" && !l.shared));
  // Outdoor & Pool mit Ezarri, nur wenn Ezarri öffentlich ist.
  const outdoor = de.find((r) => r.id === "outdoor");
  assert.equal(outdoor.label, "nav.outdoorPool");
  assert.ok(outdoor.columns.flatMap((col) => col.links).some((l) => l.href === "/ezarri"));
  const noEzarri = buildRooms({ locale: "de", groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri: false }) });
  assert.equal(noEzarri.find((r) => r.id === "outdoor").label, "nav.outdoor");
  // EN/FR/IT: keine Links auf deutsche Werkzeugseiten (sie liefern dort 404), Showroom mehrsprachig.
  const en = buildRooms({ locale: "en", groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", showroom: true }) });
  const enLinks = en.flatMap((r) => r.columns.flatMap((col) => col.links));
  // r8-leads (seo P1-3): the showroom tour is noindex/nofollow → not in the menu, in no language.
  assert.ok(!enLinks.some((l) => l.href === "/showroom"));
  // Sprach-Integration 01.11.2026 (bewusst geändert): Küchenplaner, Leistungen & Co. sind viersprachig.
  assert.ok(!enLinks.some((l) => ["/ratgeber", "/3d-ansicht"].includes(l.href)));
  assert.equal(en.find((r) => r.id === "services").all.href, "/leistungen");
  // (Küchen-Seite steht im Raum „Küche“, den es ohne Katalog-Gruppen außerhalb DE nicht gibt.)
  for (const href of ["/kuechenplaner", "/stil-finder", "/interior-design-vorarlberg", "/dreilaender-rechner"]) {
    assert.ok(enLinks.some((l) => l.href === href), `en: ${href}`);
  }
  // Welle 2 (bewusst geändert, Inhaber Nr. 13): Sofaplaner, Yacht und Ezarri haben englische Seiten.
  for (const href of ["/sofaplaner", "/yacht-interior", "/hotel-objekt", "/architekten"]) assert.ok(enLinks.some((l) => l.href === href), `en: ${href}`);
  // Integration Service 29.10.2026 (bewusst geändert): der Pflege-Service hat eine englische Seite.
  // Sprach-Integration 01.11.2026: dazu Küchenplaner, Stil-Finder, Outdoor und Dreiländer-Rechner.
  assert.deepEqual(featuresFor("en", FEATURES).map((f) => f.id), ["kuechenplaner", "sofaplaner", "stilfinder", "showroom", "yacht", "outdoor", "ezarri", "dreilaender", "pflege"]);
  // FR/IT: nur Seiten, die es dort gibt. Sprach-Integration 01.11.2026 (bewusst geändert):
  // Sofaplaner, Yacht, Ezarri und Architekten gibt es jetzt auch FR/IT; der Ratgeber nicht.
  const frLinks = buildRooms({ locale: "fr", groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri: true }) }).flatMap((r) => r.columns.flatMap((col) => col.links));
  assert.ok(!frLinks.some((l) => ["/ratgeber", "/3d-ansicht"].includes(l.href)));
  // (/ezarri steht im Raum „Outdoor & Pool“, den es ohne Katalog-Gruppen außerhalb DE nicht gibt.)
  for (const href of ["/sofaplaner", "/yacht-interior", "/architekten", "/kuechenplaner"]) assert.ok(frLinks.some((l) => l.href === href), `fr: ${href}`);
});

test("Gruppen: leere fallen weg, Reihenfolge Online planen · Erleben · Service", () => {
  // Runde 5 (P3, ux P1-4, bewusst geänderte Erwartung): „Für KI-Assistenten“
  // ist kein Kundenservice mehr, sondern eigener Bereich „Für Fachleute“.
  assert.deepEqual(groupFeatures(enabledFeatures(DEV)).map((g) => g.id), ["planen", "erleben", "service", "fachleute"]);
  assert.deepEqual(groupFeatures(FEATURES.filter((f) => f.id === "portal")).map((g) => g.id), ["service"]);
});

test("Übersicht /de/leistungen: indexierbar, nur Deutsch; Startseite und Navbar ohne Labs-Schalter", () => {
  const page = read("src/app/[locale]/leistungen/page.js");
  assert.match(page, /landingMetadata\(\{/);
  assert.doesNotMatch(page, /index:\s*false/);
  // landing-kern (01.11.2026, bewusst geändert): /leistungen auch EN/FR/IT (KERN_LOCALES), sonst 404.
  assert.match(page, /if \(!KERN_LOCALES\.includes\(locale\)\) notFound\(\)/);
  const showcase = read("src/components/Labs/Hub/HomeShowcase.js");
  // Rat 9,5 B11 (T2, bewusst geändert): der Showcase kann DE und EN (englische Texte); FR/IT nichts.
  assert.match(showcase, /if \(locale !== "de" && locale !== "en"\) return null;/);
  assert.match(showcase, /if \(!list\.length\) return null;/);
  // Überblick: DE auf /leistungen, EN auf /arbeitsweise (die Übersicht ist nur deutsch).
  assert.match(showcase, /overviewHref: "\/leistungen"/);
  assert.match(showcase, /href=\{c\.overviewHref\}/);
  assert.doesNotMatch(showcase, /href="\/labs"/);
  assert.match(read("src/components/Home/Services.js"), /<HomeShowcase locale=\{locale\}/);
  assert.doesNotMatch(read("src/components/Navbar/navbar.js"), /labsRoom/);
  for (const f of fs.readdirSync(path.join(ROOT, "src/components/Labs/Hub")).filter((n) => n.endsWith(".js"))) {
    const src = read(`src/components/Labs/Hub/${f}`);
    assert.doesNotMatch(src, /^\s*["']use client["']/m, f);
    assert.doesNotMatch(src.replace(/^\s*\/\/.*$/gm, ""), /NEXT_PUBLIC_FEATURE|Labs-Prototyp|Platzhirsch Labs/, `${f}: keine Entwicklersprache`);
  }
  assert.ok(!fs.existsSync(path.join(ROOT, "src/components/Labs/Hub/StatusBadge.js")), "keine Status-Plaketten mehr");
});

test("Bilder: AR-Viewer mit eigener Grafik, Ezarri mit freigegebenem Bild und Credit", () => {
  const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f]));
  assert.equal(byId.arviewer.image, null);
  assert.equal(byId.arviewer.visual, "measure");
  const visual = read("src/components/Labs/Hub/FeatureVisual.js");
  for (const v of ["measure: Measure", "sun: Sun", "plan: Plan", "nodes: Nodes"]) assert.ok(visual.includes(v), v);
  assert.ok(!FEATURES.some((f) => f.image?.src?.includes("ar-viewer")), "kein Beispielsofa");
  assert.match(byId.ezarri.image.src, /^\/ezarri\//);
  assert.equal(byId.ezarri.image.credit, "Bild: Ezarri, ezarri.com");
  for (const f of FEATURES) if (f.image?.src && !f.image.src.startsWith("/bilder/leistungen/")) assert.ok(f.image.credit, `${f.id}: Credit`); // Runde 5: Pfad ohne /labs/hub
  assert.match(read("src/components/Labs/Hub/FeatureCard.js"), /feature\.image\?\.credit/);
});

test("Spalten je Gruppe – keine einzelne Karte in der letzten Desktop-Zeile", () => {
  assert.equal(desktopCols(4), "lg:grid-cols-2");
  assert.equal(desktopCols(10), "lg:grid-cols-2");
  for (const n of [1, 2, 3, 6, 7, 9]) assert.equal(desktopCols(n), "lg:grid-cols-3", String(n));
  // R8 (ux P2, bewusst geänderte Erwartung): 5 Karten im 3er-Raster ließen
  // rechts unten eine Lücke → 6er-Raster, 2 halbe + 3 Drittel-Karten.
  assert.equal(desktopCols(5), "lg:grid-cols-6");
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => desktopSpan(5, i)), ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2"]);
  assert.equal(desktopSpan(4, 0), "");
  assert.match(read("src/components/Labs/Hub/LabsHub.js"), /desktopSpan\(g\.features\.length, i\)/);
  for (const g of groupFeatures(enabledFeatures(DEV))) {
    if (g.features.length === 5) continue; // 2 + 3, siehe oben
    const cols = desktopCols(g.features.length) === "lg:grid-cols-2" ? 2 : 3;
    const rest = g.features.length % cols;
    assert.ok(g.features.length <= cols || rest !== 1, `${g.id}: ${g.features.length} Karten in ${cols} Spalten`);
  }
  assert.match(read("src/components/Labs/Hub/LabsHub.js"), /desktopCols\(g\.features\.length\)/);
});
