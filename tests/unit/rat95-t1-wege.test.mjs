// tests/unit/rat95-t1-wege.test.mjs – Rat 9,5 Team T1 (Wege, Termin & Vertrauen).
// B1 ein Terminweg (terminLink.js), A12 Kontext-Reste (pathContext), B2
// Empfang von ?plan=/?ideenboard= (beratungContext), C3/A4 Entwurf und
// Planer-Übergabe (draft.js), B6/C6 Texte (t1Copy.js), A1 USP-Links, A3
// Bestätigung sichtbar (reveal.js), B5 Kontakt-Kopfbild.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TERMIN_WORDS, beratungPath, isCalendarHref, schreibenHref, terminHref, terminLabel } from "../../src/lib/forms/terminLink.js";
import { brandName, contextForPath, withContext } from "../../src/lib/forms/pathContext.js";
import { attachmentLines, attachmentsOf, beratungContext, herkunftContext, ideenboardUrl } from "../../src/lib/forms/beratungContext.js";
import { DRAFT_KEY, HANDOFF_KEY, contextKey, loadDraft, readHandoff, saveDraft, takeHandoff } from "../../src/lib/forms/draft.js";
import { HANDOFF_KEY as KP_HANDOFF_KEY } from "../../src/lib/kuechenplaner/handoff.js";
import { boardLabel, withoutLangNote } from "../../src/components/Beratung/t1Copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const LOCALES = ["de", "en", "fr", "it"];
const BOARD = "A".repeat(16) + "b_-9".repeat(4);

test("B1 terminHref/terminLabel: ein Wort, ein Ziel, Kontext immer dabei", () => {
  assert.equal(terminHref("de", { calendar: true, context: { thema: "yacht" } }), "/termin?thema=yacht");
  assert.equal(terminHref("en", { calendar: false, context: { ort: "lindau" } }), "/consultation?ort=lindau");
  assert.equal(schreibenHref("fr", { context: { produkt: "Minotti" } }), "/conseil?produkt=Minotti");
  assert.equal(beratungPath("xx"), "/beratung");
  assert.equal(terminLabel("de", { calendar: true }), "Termin wählen");
  assert.equal(terminLabel("de", { calendar: false }), "Termin anfragen");
  assert.equal(terminLabel("de", { kind: "write" }), "Lieber schreiben");
  // Kalender- und Formularwort sind in jeder Sprache verschieden.
  for (const l of LOCALES) {
    const w = TERMIN_WORDS[l];
    assert.equal(new Set([w.choose, w.request, w.write]).size, 3, l);
  }
  assert.ok(isCalendarHref("/de/termin?thema=hotel") && isCalendarHref("/termin") && !isCalendarHref("/de/beratung") && !isCalendarHref("/de/terminx"));
});

test("B1 Shell: Kalenderwort nur, wenn der Knopf auf /termin zeigt", () => {
  const labels = read("src/components/Navbar/shellLabels.js");
  assert.match(labels, /calendar = ownCalendarActive\(\)/);
  assert.match(labels, /termin: termin\(c\("menu\.termin"\)\)/);
  assert.match(labels, /termin: termin\(c\("ctaBar\.termin"\)\)/);
  assert.match(read("src/components/Reusable/Footer.js"), /calendar \? terminLabel\(locale, \{ calendar \}\) : c\("footer\.termin"\)/);
  // Footer-Links für T2 (/wunschliste) und T5 (/barrierefreiheit).
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /href: "\/wunschliste"/);
  assert.match(footer, /localizeHref\("\/barrierefreiheit", locale\)/);
  // /termin bietet den Nebenweg zum Formular mit Kontext.
  const page = read("src/app/[locale]/termin/page.js");
  assert.match(page, /schreibenHref\(locale, \{ context: writeContext \}\)/);
  assert.match(page, /terminLabel\(locale, \{ kind: "write" \}\)/);
  // terminLink bleibt klein und rein (Shell-Graph, node --test).
  assert.doesNotMatch(code("src/lib/forms/terminLink.js"), /from "@\/|from "node:/);
});

test("A12 Markenseiten tragen die Marke, Kollektionen auch", () => {
  assert.deepEqual(contextForPath("/ueber-uns/marken/minotti"), { produkt: "Minotti" });
  assert.deepEqual(contextForPath("/about-us/brands/paola-lenti"), { produkt: "Paola Lenti" });
  assert.deepEqual(contextForPath("/ueber-uns/marken/treca/betten"), { produkt: "Tréca" });
  assert.deepEqual(contextForPath("/ueber-uns/marken"), {});
  assert.equal(brandName("<script>"), null);
  assert.equal(withContext("/beratung", contextForPath("/ueber-uns/marken/classicon")), "/beratung?produkt=ClassiCon");
  assert.match(read("src/components/Navbar/HeaderCta.js"), /data-termin-produkt/);
});

test("A12 Herkunft: Yacht- und Hotelseiten nennen ihren Ursprung", () => {
  assert.equal(herkunftContext(beratungContext({ thema: "yacht" })), "Seite: Yacht-Interieur");
  assert.equal(herkunftContext(beratungContext({ thema: "hotel", ort: "bregenz" })), "Stadtseite: Bregenz · Seite: Hotel & Objekt");
  assert.equal(herkunftContext(beratungContext({ ort: "bregenz" })), "Stadtseite: Bregenz");
});

test("B2 Empfang: ?plan= nur Werkzeugseiten dieser Website, ?ideenboard= nur Teilen-IDs", () => {
  const ok = attachmentsOf({ plan: "https://platzhirsch.studio/de/sofaplaner?s=abc", ideenboard: BOARD });
  assert.equal(ok.plan, "https://platzhirsch.studio/de/sofaplaner?s=abc");
  assert.equal(ok.ideenboard, BOARD);
  assert.deepEqual(attachmentsOf({ plan: "https://evil.example/de/sofaplaner", ideenboard: "x" }), { plan: null, ideenboard: null });
  assert.deepEqual(attachmentsOf({ plan: "javascript:alert(1)" }), { plan: null, ideenboard: null });
  assert.deepEqual(attachmentsOf({ plan: "https://platzhirsch.studio/de/kontakt" }), { plan: null, ideenboard: null });
  // Ohne Anhänge bleibt das Ergebnis wie bisher (keine neuen Schlüssel).
  assert.deepEqual(beratungContext({}), { step1: null, step2: null, lines: [], produkt: null });
  const ctx = beratungContext(new URLSearchParams({ thema: "kueche", plan: "/de/kuechenplaner?p=1", ideenboard: BOARD }));
  assert.equal(ctx.plan, "https://platzhirsch.studio/de/kuechenplaner?p=1");
  assert.deepEqual(attachmentLines(ctx, { locale: "de" }), ["Plan: https://platzhirsch.studio/de/kuechenplaner?p=1", `Ideenboard: https://platzhirsch.studio/de/ideenboard/${BOARD}`]);
  assert.equal(ideenboardUrl("kurz"), null);
  assert.match(herkunftContext(ctx), /Plan angehängt · Ideenboard angehängt/);
  // Beide Empfänger lesen den Vertrag und zeigen ihn an.
  for (const f of ["src/app/[locale]/termin/page.js", "src/app/[locale]/beratung/page.js"]) assert.match(read(f), /boardCardCount\(/, f);
  assert.match(read("src/components/BeratungClient/BeratungClient.js"), /data-beratung-attachments/);
  assert.match(read("src/app/[locale]/termin/page.js"), /data-termin-attachments/);
});

test("A4 Planer-Übergabe: passender Planer, ≤ 30 min, danach gelöscht", () => {
  assert.equal(HANDOFF_KEY, KP_HANDOFF_KEY);
  const now = 1_800_000_000_000;
  const raw = JSON.stringify({ planer: "kuechenplaner", text: "Küchenplanung\nPlan öffnen: https://x", url: "https://x", at: now - 60_000 });
  assert.deepEqual(readHandoff(raw, { lineKeys: ["kuechenplaner"], now }), { text: "Küchenplanung\nPlan öffnen: https://x", url: "https://x" });
  assert.equal(readHandoff(raw, { lineKeys: ["sofaplaner"], now }), null, "anderer Planer");
  assert.equal(readHandoff(raw, { lineKeys: ["kuechenplaner"], now: now + 31 * 60_000 }), null, "zu alt");
  assert.equal(readHandoff("{kaputt", { lineKeys: ["kuechenplaner"], now }), null);
  const store = new Map();
  const s = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  s.setItem(HANDOFF_KEY, JSON.stringify({ planer: "sofaplaner", text: "Sofa", at: Date.now() }));
  assert.equal(takeHandoff(s, ["sofaplaner"]).text, "Sofa");
  assert.equal(s.getItem(HANDOFF_KEY), null, "einmal gelesen, dann weg");
});

test("C3 Entwurf: nur gleicher Kontext, nur bekannte Felder, ≤ 2 h", () => {
  const store = new Map();
  const s = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
  const ctxA = contextKey(beratungContext({ thema: "kueche" }));
  const base = { step1: null, message: "", email: "" };
  saveDraft(s, ctxA, { step: 3, values: { step1: "eine Küche", message: "Hallo", email: "a@b.at", evil: "<x>" } });
  const d = loadDraft(s, ctxA, base);
  assert.deepEqual(d, { step: 3, values: { step1: "eine Küche", message: "Hallo", email: "a@b.at" } });
  assert.equal(loadDraft(s, contextKey(beratungContext({ thema: "sofa" })), base), null, "anderer Kontext");
  assert.equal(loadDraft(s, ctxA, base, { now: Date.now() + 3 * 3600_000 }), null, "zu alt");
  assert.ok(store.has(DRAFT_KEY));
  // Formular selbst ohne Uhr (forms-leads), sessionStorage statt localStorage.
  const form = read("src/components/BeratungClient/BeratungClient.js");
  assert.doesNotMatch(form, /Date\.now\(\)|localStorage/);
  assert.match(read("src/lib/forms/draft.js"), /window\.sessionStorage/);
  // Schritt 1: sechs Karten, Rest hinter „Andere Anliegen“.
  assert.match(form, /const STEP1_VISIBLE = 6;/);
  assert.match(form, /aria-expanded=\{step1Open\}/);
});

test("A3 Bestätigung sichtbar: focus ohne Sprung + scrollIntoView, Ruhige Ansicht ohne smooth", () => {
  const reveal = read("src/lib/forms/reveal.js");
  assert.match(reveal, /focus\(\{ preventScroll: true \}\)/);
  assert.match(reveal, /scrollIntoView\(\{ block: "start", behavior: prefersReducedMotion\(\) \? "auto" : "smooth" \}\)/);
  assert.match(reveal, /data(?:set)?\.motion === "reduced"/);
  for (const f of ["src/components/BeratungClient/BeratungClient.js", "src/components/Kontakt/KontaktForm.js", "src/components/Termin/BookingWizard.js"]) {
    assert.match(read(f), /revealConfirmation\(/, f);
  }
});

test("A1 USP-Links in der Sprache der Seite, ohne „(in German)“", () => {
  for (const f of ["src/components/Beratung/advice.js", "src/app/[locale]/kontakt/page.js", "src/components/Beratung/Confirmation.js"]) {
    const src = code(f);
    assert.doesNotMatch(src, /href="\/arbeitsweise"\s+locale="de"/, f);
    assert.doesNotMatch(src, /hrefLang=\{[^}]*"de"\}/, f);
    assert.doesNotMatch(src, /processLang/, f);
  }
  assert.equal(withoutLangNote("How we work (in German)"), "How we work");
  assert.equal(withoutLangNote("Notre méthode (en allemand)"), "Notre méthode");
  assert.equal(withoutLangNote("Il nostro metodo (in tedesco)"), "Il nostro metodo");
});

test("B5 Kontakt-Kopfbild nur mit geklärten Rechten", () => {
  const src = read("src/app/[locale]/kontakt/page.js");
  assert.match(src, /CONTACT_IMAGE = "\/Images\/Home\/aboutHome\.jpg"/);
  assert.doesNotMatch(src, /getContactOGImage|Newsletter\/room/);
  const csv = read("Marktresearch/recht/bildrechte.csv");
  const row = csv.split(/\r?\n/).find((l) => l.includes(";/Images/Home/aboutHome.jpg;"));
  assert.ok(row && /;erteilt/.test(row), "aboutHome.jpg freigegeben");
});

test("B6/C6 Texte: vier Sprachen, gleiche Schlüssel, keine Zusagen zu Antwortzeit, Kosten, Preis", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  // Übernahme 30.10.2026: die Texte stehen jetzt in src/messages (vorher
  // Rückfall-Tabelle T1_COPY in t1Copy.js) – dieselben Prüfungen auf den Messages.
  const msg = (l) => JSON.parse(read(`src/messages/${l}.json`));
  const T1_TEXTS = (m) => ({ attach: m.forms.attach, trust: m.forms.trust, draft: m.forms.draft, more: m.forms.moreTopics, write: m.termin.write, tisch: m.termin.tisch, faq: m.inhalt.beratung.faq, imageAlt: m.contact.imageAlt });
  const de = keys(T1_TEXTS(msg("de"))).sort();
  for (const l of LOCALES) {
    assert.deepEqual(keys(T1_TEXTS(msg(l))).sort(), de, l);
    const all = JSON.stringify(T1_TEXTS(msg(l)));
    assert.doesNotMatch(all, /kostenlos|gratis|free of charge|gratuit|gratuito|innerhalb von|within \d|sous \d|entro \d|€|\bCHF\b|exklusiv|Luxus|beste|größte|!/i, l);
    // SEO-Team A (bewusst geändert, 31.10.2026, GEO W5): drei Fragen kommen hinzu
    // (Einrichtungsberatung vs. Interior Design, Abrechnung „auf Anfrage“, Dauer ohne Wochenangabe).
    assert.equal(msg(l).inhalt.beratung.faq.items.length, 7, l);
  }
  // boardLabel mit einem einfachen Übersetzer über forms.* ({count} wie next-intl).
  const tr = (l) => (key, vars = {}) => key.split(".").reduce((o, k) => o[k], msg(l).forms).replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));
  assert.equal(boardLabel(tr("de"), 3), "Ihr Ideenboard (3 Karten)");
  assert.equal(boardLabel(tr("de"), 1), "Ihr Ideenboard (1 Karte)");
  assert.equal(boardLabel(tr("it"), null), "La vostra bacheca di idee");
  assert.doesNotMatch(read("src/components/Beratung/t1Copy.js"), /T1_COPY/, "keine Rückfall-Tabelle mehr");
  // Vertrauensblock: nur Personen mit Rolle/Notiz, kein Platzhalterporträt, Datenschutzsatz.
  const trust = read("src/components/Beratung/TrustBlock.js");
  assert.match(trust, /<FormPrivacyNote/);
  assert.match(trust, /withPortraits\(team\)/);
  assert.match(read("src/app/[locale]/beratung/page.js"), /aside=\{<TrustBlock locale=\{locale\} \/>\}/);
  assert.match(read("src/app/[locale]/termin/page.js"), /<TrustBlock locale=\{locale\}/);
  assert.match(read("src/app/[locale]/beratung/page.js"), /faqSchema\(locale, PAGE_URL\)/);
});

test("Messages-Vorschlag T1: vier Sprachen, gleiche Schlüssel", () => {
  const p = JSON.parse(read("Marktresearch/digital/features/rat95-t1-messages.json"));
  const keys = (o, pre = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${pre}${k}.`) : [`${pre}${k}`]));
  const de = keys(p.de).sort();
  for (const l of LOCALES) assert.deepEqual(keys(p[l]).sort(), de, l);
  assert.equal(p.en.inhalt.beratung.uspLink, "How we work");
  assert.equal(p.en.forms.confirmation.processLang, null);
});

// Übernahme 30.10.2026: Shell.terminWords.* steht in src/messages. terminLabel()
// bleibt synchron (Server und Client, ohne Übersetzer) und liest TERMIN_WORDS –
// deshalb müssen beide wörtlich gleich sein.
test("Übernahme: TERMIN_WORDS = Shell.terminWords in allen vier Sprachen", () => {
  for (const l of LOCALES) {
    const m = JSON.parse(read(`src/messages/${l}.json`)).Shell.terminWords;
    assert.equal(TERMIN_WORDS[l].choose, m.choose, `${l} choose`);
    assert.equal(TERMIN_WORDS[l].write, m.write, `${l} write`);
  }
});
