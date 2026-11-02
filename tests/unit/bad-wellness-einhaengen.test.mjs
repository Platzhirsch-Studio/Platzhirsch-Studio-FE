// tests/unit/bad-wellness-einhaengen.test.mjs — Einhängen /bad-wellness
// (Inhaber-Entscheidungen Nr. 19–21, 31.10.2026): Messages, Einblicke, Sitemap/llms,
// Menü (ohne neuen Top-Level-Punkt), Footer, Formular-Kontext, Querverweise.
// Run: node --test tests/unit/bad-wellness-einhaengen.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

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
const { beratungContext, contextForPath } = await import("../../src/lib/forms/beratungContext.js");
const { MULTILINGUAL_PAGES } = await import("../../src/lib/seo/sitemap/extraPages.js");
const { STATIC } = await import("../../src/lib/einblicke/routes.js");
const { SERVER_ONLY_NAMESPACES } = await import("../../src/components/Reusable/clientMessages.js");
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const c = (k) => k;

test("Messages: badWellness + Menü-, Footer- und Formular-Texte in allen vier Sprachen", () => {
  const proposal = JSON.parse(read("Marktresearch/digital/features/bad-wellness-messages.json"));
  for (const l of LOCALES) {
    const m = messages[l];
    assert.deepEqual(m.badWellness, proposal[l].badWellness, `${l}: badWellness = Vorschlag`);
    assert.equal(m.Shell.nav.badWellness, m.badWellness.crumb, `${l}: Menü-Label = crumb`);
    assert.equal(m.Footer.badWellness, m.badWellness.crumb, `${l}: Footer-Label = crumb`);
    for (const k of ["themaWellness", "themaBad"]) assert.ok(m.MultiStepForm.context[k], `${l}: context.${k}`);
    for (const v of [m.Shell.nav.badWellness, m.MultiStepForm.context.themaWellness, m.MultiStepForm.context.themaBad]) {
      assert.doesNotMatch(v, /Händler|dealer|revendeur|rivenditore/i);
    }
  }
  assert.ok(SERVER_ONLY_NAMESPACES.includes("badWellness"), "nur Server-Komponenten lesen badWellness");
});

test("Einblicke STATIC und Sitemap/llms: vier Sprachen, nicht deutsch-only", () => {
  assert.ok(STATIC.includes("/bad-wellness"));
  const page = MULTILINGUAL_PAGES.find((p) => p.path === "/bad-wellness");
  assert.ok(page, "MULTILINGUAL_PAGES");
  assert.deepEqual(page.locales, LOCALES);
  for (const line of [page.llms, page.en.llms]) {
    assert.doesNotMatch(line, /Händler|dealer|Showroom|€|\bbeste|führend/i);
    for (const name of ["Agape", "Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura"]) assert.ok(line.includes(name), name);
  }
  assert.ok(!germanOnlySegments().some((s) => s.startsWith("bad-wellness")));
  assert.doesNotMatch(read("src/lib/seo/deOnlyRedirects.cjs"), /bad-wellness/);
});

// Inhaber 31.10.2026 (bewusst geänderte Erwartung): „Bad gehört in die Navbar
// als eigener Punkt“ – neuer Raum "bath" nach „Küche“; „Bad & Wellness“ bleibt
// zusätzlich als geteilter Link in der Planungsspalte von Outdoor & Pool.
test("Menü: eigener Punkt „Bad“ nach Küche, „Bad & Wellness“ auch unter Outdoor & Pool", () => {
  for (const ezarri of [true, false]) {
    for (const locale of LOCALES) {
      const rooms = buildRooms({ locale, groups: [], c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri, showroom: false }) });
      assert.deepEqual(rooms.map((r) => r.id), ["kitchen", "bath", "outdoor", "shop", "brands", "services", "house"].filter((id) => locale === "de" || !["kitchen", "outdoor"].includes(id)), `${locale}: Räume`);
      const bath = rooms.find((r) => r.id === "bath");
      assert.equal(bath.label, "nav.bath");
      assert.ok(bath.columns.flatMap((col) => col.links).some((l) => l.href === "/bad-wellness" && !l.shared), `${locale}: /bad-wellness gehört zu „Bad“`);
      const withOutdoor = buildRooms({ locale, groups: [], activeCategoryKeys: null, c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri, showroom: false }) });
      const outdoor = withOutdoor.find((r) => r.id === "outdoor");
      if (!outdoor) continue;
      const hits = outdoor.columns.flatMap((col) => col.links).filter((l) => l.href === "/bad-wellness");
      assert.equal(hits.length, 1, `${locale}/ezarri=${ezarri}`);
      assert.equal(hits[0].label, "nav.badWellness");
      assert.equal(outdoor.label, ezarri ? "nav.outdoorPool" : "nav.outdoor", "Top-Level-Label unverändert");
    }
  }
  // Mit Outdoor-Produktgruppe auch in EN/FR/IT.
  const groups = [{ title: "Garden", items: [{ key: "garden-tables", label: "Garden tables" }] }];
  for (const locale of ["en", "fr", "it"]) {
    const outdoor = buildRooms({ locale, groups, c, features: navFeatures({ raw: {}, nodeEnv: "production", ezarri: false }) }).find((r) => r.id === "outdoor");
    assert.ok(outdoor.columns.flatMap((col) => col.links).some((l) => l.href === "/bad-wellness"), locale);
  }
});

test("Footer: Link nach den Küchengeräten (Schlüssel Footer.badWellness)", () => {
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /t\("badWellness"\), href: "\/bad-wellness"/);
});

test("Formular-Kontext: ?thema=bad|wellness und Kopf-Link von /bad-wellness", () => {
  const p = (q) => beratungContext(new URLSearchParams(q));
  assert.deepEqual(p("thema=bad"), { step1: "renovierung", step2: null, lines: [{ key: "themaBad" }], produkt: null });
  assert.deepEqual(p("thema=wellness"), { step1: "anderes", step2: null, lines: [{ key: "themaWellness" }], produkt: null });
  // „Anderes“ ist nur der Rückfall: ein zweites Thema entscheidet.
  assert.equal(p("thema=wellness,outdoor").step1, "outdoor");
  assert.equal(p("thema=wellness,hotel").step1, "objekt");
  assert.equal(p("thema=wellness,hotel").step2, "hotel");
  assert.equal(p("thema=wellness,objekt").step1, "objekt");
  assert.equal(p("thema=wellness&rolle=architekt").step1, "architektur");
  assert.equal(p("thema=wellness&produkt=Starpool").produkt, "Starpool");
  assert.deepEqual(contextForPath("/bad-wellness"), { thema: "wellness" });
});

test("Querverweise: Ezarri, Outdoor, Hotel, Yacht, Agape, Küchengeräte, Küche", () => {
  assert.match(read("src/components/Ezarri/Welt/EinsatzWelt.js"), /pool: "\/bad-wellness#marke-aquavia-spa", wellness: "\/bad-wellness"/);
  assert.match(read("src/components/Landing/Outdoor/OutdoorLanding.js"), /"\/bad-wellness#marke-aquavia-spa"/); // seit landing-kern als Liste der Brücken-Links
  const hotel = read("src/lib/hotel/content.js");
  assert.equal((hotel.match(/more: \{ href: "\/bad-wellness"/g) || []).length, 2, "Hotel DE + EN");
  assert.match(read("src/components/Hotel/HotelPage.js"), /link=\{item\.more\}/);
  // mindestens DE + EN (seit hotel-fr-it auch FR/IT)
  assert.ok((read("src/components/Yacht/YachtPage.js").match(/"\/bad-wellness#marke-fabio-alemanno"/g) || []).length >= 2, "Yacht DE + EN");
  assert.match(read("src/lib/crossSell.js"), /b === "agape"\) out\.push\(\{ id: "bad-wellness", href: "\/bad-wellness"/);
  assert.match(read("src/components/Kuechengeraete/KuechengeraetePage.js"), /href="\/bad-wellness#marke-dornbracht"/);
  assert.match(read("src/app/[locale]/kuechen-vorarlberg/page.js"), /href: "\/bad-wellness#marke-dornbracht"/);
  for (const l of LOCALES) {
    const a = messages[l].kuechengeraete.ablauf;
    assert.ok(a.armaturen.includes("Dornbracht") && a.armaturenLink.includes("Dornbracht"), l);
  }
});
