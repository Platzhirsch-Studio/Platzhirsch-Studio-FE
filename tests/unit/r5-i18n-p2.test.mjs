// node --test tests/unit/r5-i18n-p2.test.mjs
// Runde 4, Fix-Team „P2 Sprache, Cookie-Leiste, Umleitungen, Messages“
// (gesamtwerk P1-1/P1-3, recht P1-5, technik P1-3a/P2, ux P1-4b/P1-5).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { leaves } from "../../tools/i18n/lib.mjs";
import {
  NOTICE_LANGS,
  NOTICE_PAGES,
  OWN_NOTICE_PATH,
  globalNotice,
  globalNoticeLang,
  langNotice,
} from "../../src/lib/arbeitsweise/langNotice.js";
import { createRequire } from "node:module";
import { VOI, TU_BEFORE } from "./r5-i18n-voi.lib.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const msgs = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const flat = Object.fromEntries(LOCALES.map((l) => [l, new Map(leaves(msgs[l]))]));

// ------------------------------------------------------------ 4 IT in voi
// Pronomen und Possessive der tu-Form (Auftrag: tu/tuo/tua/ti/Tuo …).
const TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te)(?![\p{L}])/gu;
// Verbformen der 2. Person Singular, die nur in der tu-Anrede vorkommen.
const TU_VERB = /(?<![\p{L}])(?:puoi|vuoi|hai|devi|Puoi|Vuoi|Hai|Devi|Riprova|Contattaci|Scrivici|Chiamaci|Inviaci|Raccontaci|Scopri|Richiedi|Scegli|Inserisci|Accomodati|Siediti|Iscriviti)(?![\p{L}])/u;
// Begründete Ausnahmen (Schlüssel → Grund). Heute keine.
const TU_EXCEPTIONS = Object.freeze({});

test("4) it.json: 0 tu-Formen (Pronomen/Possessive und typische Verben), höchstens begründete Ausnahmen", () => {
  let count = 0;
  const hits = [];
  for (const [k, v] of flat.it) {
    if (typeof v !== "string" || TU_EXCEPTIONS[k]) continue;
    const n = (v.match(TU) || []).length;
    count += n;
    if (n || TU_VERB.test(v)) hits.push(`${k}: ${v.slice(0, 80)}`);
  }
  assert.equal(count, 0, hits.join("\n"));
  assert.deepEqual(hits, []);
  for (const [k, why] of Object.entries(TU_EXCEPTIONS)) assert.ok(why.length > 20, `${k}: Ausnahme begründen`);
  // voi ist da (nicht nur tu entfernt).
  assert.equal(flat.it.get("MultiStepForm.thankYou"), "Grazie per la vostra richiesta. Vi ricontatteremo personalmente.");
  assert.equal(flat.it.get("Shell.menu.termin"), "Richiedete un appuntamento");
  assert.equal(flat.it.get("ui.leitsatz"), "Accomodatevi.");
  assert.match(flat.it.get("Cookies.intro"), /il vostro consenso/);
  assert.doesNotMatch(flat.it.get("Cookies.intro"), /il suo consenso|Può modificare/, "Lei-Form im Cookie-Dialog");
});

test("4) Patch-Datei dokumentiert jede IT-Umstellung (Vorher/Nachher, gleiche Schlüssel)", () => {
  const keys = Object.keys(VOI);
  assert.ok(keys.length > 400, `${keys.length}`);
  assert.deepEqual(Object.keys(TU_BEFORE).sort(), [...keys].sort());
  for (const k of keys) {
    assert.equal(flat.it.get(k), VOI[k], `${k}: it.json = Patch`);
    assert.notEqual(TU_BEFORE[k], VOI[k], k);
  }
});

test("4) langNotice.js: IT in voi, CTA wie die Termin-Knöpfe", () => {
  for (const page of NOTICE_PAGES) {
    const n = langNotice(page, "it");
    assert.doesNotMatch(`${n.note} ${n.core} ${n.cta}`, TU, page);
  }
  assert.equal(langNotice("arbeitsweise", "it").cta, msgs.it.Shell.menu.termin);
  assert.equal(langNotice("arbeitsweise", "en").cta, msgs.en.Shell.menu.termin);
  assert.equal(langNotice("arbeitsweise", "fr").cta, msgs.fr.Shell.menu.termin);
  const it = globalNotice("it");
  assert.doesNotMatch(`${it.note} ${it.core} ${it.cta}`, TU);
});

// ------------------------------------------------- 1 globaler DE-only-Hinweis
test("1) globaler Hinweis: nur /de-Seiten mit ?lang, nie doppelt auf Seiten mit eigenem Hinweis", () => {
  assert.equal(globalNoticeLang("/de/sofaplaner", "?lang=en"), "en");
  assert.equal(globalNoticeLang("/de/bodensee-licht", "?ort=lochau&lang=it"), "it");
  assert.equal(globalNoticeLang("/de/stil-finder/ergebnis", "?lang=fr"), "fr");
  for (const p of ["/de/arbeitsweise", "/de/ezarri", "/de/ezarri/mosaike", "/de/3d-ansicht", "/de/3d-ansicht/x"]) {
    assert.ok(OWN_NOTICE_PATH.test(p), p);
    assert.equal(globalNoticeLang(p, "?lang=en"), null, p);
  }
  assert.equal(globalNoticeLang("/de/arbeitsweise-extra", "?lang=en"), "en", "nur echte Pfadsegmente");
  assert.equal(globalNoticeLang("/en/contact", "?lang=en"), null);
  assert.equal(globalNoticeLang("/de/sofaplaner", "?lang=es"), null);
  assert.equal(globalNoticeLang("/de/sofaplaner", ""), null);
  for (const l of NOTICE_LANGS) {
    const n = globalNotice(l);
    assert.equal(n.lang, l);
    assert.match(n.core, /Harald Menghin/, "Kern-USP (Entscheidung Nr. 8)");
    assert.doesNotMatch(`${n.note} ${n.core} ${n.cta}`, /!|€|CHF|\b(best|unique|meilleur|migliore|unico)\b/i);
  }
  assert.equal(globalNotice("de"), null);
});

test("1) Komponente: statisch im Layout, role=status/aria-live, lang je Fassung, Inline-Skript nur im Server-Pass", () => {
  const layout = read("src/app/[locale]/client-layout.js");
  assert.match(layout, /import GermanOnlyNotice from '@\/components\/I18n\/GermanOnlyNotice';/);
  assert.match(layout, /<main id="main"[^>]*>\s*<GermanOnlyNotice \/>\s*\{children\}/);
  const c = read("src/components/I18n/GermanOnlyNotice.js");
  assert.match(c, /role="status"/);
  assert.match(c, /aria-live="polite"/);
  assert.match(c, /lang=\{l\}/);
  assert.match(c, /hidden=\{/);
  assert.match(c, /suppressHydrationWarning/);
  assert.match(c, /\{ssr && <script dangerouslySetInnerHTML=\{\{ __html: REVEAL \}\} \/>\}/);
  assert.match(c, /window\.__phLang=/, "Sprache für die Cookie-Leiste merken");
  // Die Seiten mit eigenem Hinweis haben ihn weiter (kein zweiter).
  // Erwartung bewusst geändert (R9, Fix-Team P2/R5-fix P2, gesamtwerk P1-2):
  // /arbeitsweise steht jetzt in allen vier Sprachen unter eigenem Pfad – ohne
  // Sprachhinweis. Es darf weiter keinen zweiten Hinweis geben.
  const arbeitsweise = read("src/app/[locale]/arbeitsweise/page.js");
  assert.ok(/<LangNotice page="arbeitsweise" \/>/.test(arbeitsweise) || !/<(?:LangNotice|GermanOnlyNotice)/.test(arbeitsweise), "Arbeitsweise: höchstens ein Hinweis");
  assert.match(read("src/app/[locale]/ezarri/layout.js"), /<LangNotice page="ezarri" \/>/);
});

// ------------------------------------------------------------ 2 Umleitungen
test("2) DE-only-Umleitungen (auch Bodensee-Licht) hängen ?lang an; Next behält vorhandene Parameter", () => {
  const require = createRequire(import.meta.url);
  const { deOnlyRedirects, DE_ONLY_EXACT } = require("../../src/lib/seo/deOnlyRedirects.cjs");
  assert.ok(DE_ONLY_EXACT.includes("bodensee-licht"));
  const rules = deOnlyRedirects();
  assert.ok(rules.every((r) => /[?&]lang=:lang$/.test(r.destination) && r.permanent), JSON.stringify(rules));
  const exact = new RegExp(rules[0].source.replace("/:lang(en|fr|it)/:page(", "^/(en|fr|it)/(").replace(/\)$/, ")$"));
  assert.ok(exact.test("/en/bodensee-licht"));
  assert.match(read("next.config.js"), /\.\.\.deOnlyRedirects\(\),/);
});

// ------------------------------------------------------------ 3 Cookie-Leiste
test("3) Cookie-Leiste folgt ?lang, nennt die USA in der ersten Ebene, lang-Attribut", () => {
  const src = read("src/components/Cookies/cookiecomponent.js");
  assert.match(src, /export function consentLang\(pathname, search\)/);
  assert.match(src, /<NextIntlClientProvider locale=\{lang\} messages=\{loaded\.messages\}/);
  assert.match(src, /en: \(\) => import\("@\/messages\/en\.json"\)/);
  assert.match(src, /lang=\{lang \|\| undefined\}\s*\n\s*data-consent-bar=""/);
  assert.match(src, /aria-labelledby="cookie-settings-title"\s*\n\s*lang=\{lang \|\| undefined\}/);
  assert.match(src, /\{t\("bannerUsa"\)\}/);
  // QM shell-home r3: der Kurzsatz gilt auch im Querformat (≥ 768 px breit, aber < 560 px hoch).
  // QM shell-home r5: container query in rem + ≥ 54rem screen height (laptops get the short sentence).
  assert.match(src, /<span className="@min-\[64rem\]:\[@media\(min-height:54rem\)\]:hidden">\{t\("bannerTextShort"\)\}<\/span>/);
  // nichts schließt die Leiste von selbst
  assert.doesNotMatch(src, /setTimeout\([^)]*(saveConsent|handleRejectAll|setDialogOpen\(false\))/);
  const USA = { de: /USA/, en: /USA/, fr: /États-Unis/, it: /Stati Uniti/ };
  for (const l of LOCALES) {
    assert.match(msgs[l].Cookies.bannerTextShort, USA[l], `${l}: Handy-Satz`);
    assert.match(msgs[l].Cookies.bannerUsa, USA[l], `${l}: Desktop-Satz`);
    assert.match(msgs[l].Cookies.bannerUsa, /Google/, l);
    assert.ok(msgs[l].Cookies.bannerTextShort.length <= 175, `${l}: Handy-Satz kurz (Leiste ≤ 30 % der Höhe)`);
  }
});

// ------------------------------------------------------------ 5 Faktencheck
test("5) Warenwert-Bereiche sind Auswahlwerte, kein Preis; check:facts besteht", async () => {
  const { messageUnits, runCheck, gateFailures, SELECTION_KEYS } = await import("../../tools/content/check-facts.mjs");
  const factsDoc = JSON.parse(read("tools/content/facts.json"));
  const units = LOCALES.flatMap((l) => messageUnits(`src/messages/${l}.json`, read(`src/messages/${l}.json`)));
  const result = runCheck(units, factsDoc);
  assert.deepEqual(gateFailures(result, true), []);
  const sel = result.findings.filter((f) => f.status === "auswahl");
  assert.ok(sel.length >= 16, `${sel.length} Auswahlwerte`);
  assert.ok(sel.every((f) => SELECTION_KEYS.some((re) => re.test(f.key))), "nur die Auswahlschlüssel");
  for (const l of LOCALES) assert.deepEqual(Object.keys(msgs[l].MultiStepForm.context.values), ["bis-5000", "5000-15000", "15000-50000", "ab-50000"], l);
});

// ------------------------------------------------------------ 6 Wortwahl
test("6) Wortwahl: kein Rundgang-Werbetext für Street View/Menü, Yacht-Interieur, ein Termin-Wort", () => {
  for (const k of ["Cookies.bannerText", "Cookies.categories.functional.description", "Cookies.services.googleMaps.description", "Shell.nav.showroom"]) {
    assert.doesNotMatch(flat.de.get(k), /Rundgang/, `de ${k}`);
    assert.doesNotMatch(flat.en.get(k), /\btour\b/i, `en ${k}`);
    assert.doesNotMatch(flat.it.get(k), /\btour\b/i, `it ${k}`);
    assert.doesNotMatch(flat.fr.get(k), /\bvisite\b/i, `fr ${k}`);
  }
  assert.match(flat.de.get("Cookies.categories.functional.description"), /Street-View-Ansicht/);
  for (const [k, v] of flat.de) if (typeof v === "string" && !k.endsWith(".href")) assert.doesNotMatch(v, /Yacht[- ]Interior/, `de ${k}`);
  assert.equal(flat.de.get("Shell.nav.yacht"), "Yacht-Interieur");
  assert.equal(flat.de.get("Arbeitsweise.faq.q8.links.0.href"), "/yacht-interior", "URL bleibt");
  for (const l of ["fr", "it"]) assert.doesNotMatch(flat[l].get("MultiStepForm.context.yacht"), /Yacht Interior/, l);
  // Termin-Knöpfe: ein Hauptwort je Sprache (Kontakt: „Beratung anfragen“)
  const MAIN = { de: "Termin anfragen", en: "Request a visit", fr: "Demander un rendez-vous", it: "Richiedete un appuntamento" };
  for (const l of LOCALES) {
    for (const k of ["Shell.menu.termin", "Shell.ctaBar.termin", "HomePage.hero.cta", "landing.appointment", "Arbeitsweise.hero.cta", "brandCategory.ctaAppointment"]) assert.equal(flat[l].get(k), MAIN[l], `${l} ${k}`);
  }
  assert.equal(flat.de.get("contact.consultCta"), "Beratung anfragen");
  // Concierge: gleiche Beschriftung wie der Launcher (DE/EN/FR), IT in voi.
  const launcher = read("src/components/Concierge/Launcher.js");
  for (const l of ["de", "en", "fr"]) assert.ok(launcher.includes(`"${flat[l].get("Shell.ctaBar.aiLabel")}"`), `${l}: aiLabel = Launcher`);
  assert.equal(flat.it.get("Shell.ctaBar.aiLabel"), "Aprite il concierge IA. State scrivendo con un’IA.");
});

// ------------------------------------------------------------ 7 NEXT_LOCALE
// Erwartung bewusst geändert (R5-Fix P1, recht P1-4): der Server setzt gar keinen
// Sprach-Cookie mehr (auch nicht beim ersten Besuch), nur der Sprachumschalter beim
// aktiven Wechsel. Vertrag und Prüfung: tests/unit/r9-p1-locale-cookie.test.mjs.
test("7) NEXT_LOCALE nie vom Server (nur beim aktiven Sprachwechsel im Client)", () => {
  const proxy = read("src/proxy.js");
  assert.doesNotMatch(proxy, /cookies\.set\("NEXT_LOCALE"/);
  assert.match(read("src/i18n/config.js"), /localeCookie: false/);
});
