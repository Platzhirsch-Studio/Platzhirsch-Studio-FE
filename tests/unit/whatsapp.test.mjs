// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15, 29.10.2026).
// Reine Logik: Konfiguration (leer/ungültig = kein Einstieg), wa.me-Link,
// vorbelegter Text ohne personenbezogene Daten, Texte ohne Superlative und
// ohne erfundene Antwortzeit, Gleichstand copy.js ↔ whatsapp-messages.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEV_TEST_NUMBER, E164_RE, devPreviewAllowed, entryProps, parseNumber, privacySectionReady, replyNoteFor, whatsappConfig } from "../../src/lib/whatsapp/config.js";
import { MAX_TEXT, buildWhatsAppHref, hrefForLocation, kindForPath, pageUrlForMessage, prefillText } from "../../src/lib/whatsapp/link.js";
import { LOCALES, WHATSAPP_COPY, whatsappCopy } from "../../src/lib/whatsapp/copy.js";
import { whatsappQrSvg } from "../../src/lib/whatsapp/qr.js";

const SRC = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const DSE_OK = { whatsapp: { anchor: "whatsapp", status: "freigegeben" } };

test("Konfiguration: leer, ungültig oder ohne + = kein Einstieg", () => {
  for (const raw of [undefined, "", "   ", "43557446255", "+0123456789", "+43 abc", "+12345", "+1234567890123456", "tel:+43557446255"]) {
    assert.equal(parseNumber(raw), null, String(raw));
    assert.equal(whatsappConfig({ WHATSAPP_NUMBER: raw, WHATSAPP_PRIVACY_SECTION: "1" }), null, String(raw));
  }
  // Gültige Nummer, aber Datenschutz-Abschnitt nicht bestätigt → kein Einstieg
  for (const flag of [undefined, "", "0", "ja", "true"]) {
    assert.equal(whatsappConfig({ WHATSAPP_NUMBER: "+43557446255", WHATSAPP_PRIVACY_SECTION: flag }), null, String(flag));
  }
  // Erwartung bewusst ergänzt (Rat 9,5 B3): der Schalter allein reicht nicht, der
  // Abschnitt #whatsapp muss im DSE-Register freigegeben sein (heute: Entwurf).
  assert.equal(privacySectionReady({ WHATSAPP_PRIVACY_SECTION: " 1 " }), false);
  assert.equal(whatsappConfig({ WHATSAPP_NUMBER: "+43557446255", WHATSAPP_PRIVACY_SECTION: "1" }), null);
  assert.equal(privacySectionReady({ WHATSAPP_PRIVACY_SECTION: " 1 " }, DSE_OK), true);
  assert.equal(privacySectionReady({}, DSE_OK), false, "freigegeben, aber Deploy-Schalter fehlt");
  assert.deepEqual(whatsappConfig({ WHATSAPP_NUMBER: "+43557446255", WHATSAPP_PRIVACY_SECTION: "1" }, DSE_OK), { e164: "+43557446255", digits: "43557446255" });
  assert.deepEqual(parseNumber("+43557446255"), { e164: "+43557446255", digits: "43557446255" });
  // Eingabe mit Leerzeichen/Bindestrich/Klammern wird toleriert
  assert.deepEqual(parseNumber(" +43 (5574) 46-255 "), { e164: "+43557446255", digits: "43557446255" });
  assert.ok(E164_RE.test(DEV_TEST_NUMBER));
});

test("entryProps: Produktion ohne Nummer → null; Dev ohne Nummer → nur Vorschau; mit Nummer → Ziffern", () => {
  assert.equal(entryProps("de", {}, "production"), null);
  assert.equal(entryProps("de", { WHATSAPP_NUMBER: "kaputt" }, "production"), null);
  assert.deepEqual(entryProps("de", {}, "development"), { digits: null, devPreview: true, replyNote: null });
  // Nummer ohne bestätigten DSE-Abschnitt: Produktion zeigt nichts, Dev nur die Vorschau
  assert.equal(entryProps("de", { WHATSAPP_NUMBER: "+43557446255" }, "production"), null);
  assert.deepEqual(entryProps("de", { WHATSAPP_NUMBER: "+43557446255" }, "development"), { digits: null, devPreview: true, replyNote: null });
  // Rat 9,5 B3: ohne freigegebenen Abschnitt #whatsapp auch mit Schalter kein Einstieg in Produktion.
  assert.equal(entryProps("de", { WHATSAPP_NUMBER: "+43557446255", WHATSAPP_PRIVACY_SECTION: "1" }, "production"), null);
  assert.equal(devPreviewAllowed("production"), false);
  assert.equal(devPreviewAllowed("test"), false);
  assert.equal(devPreviewAllowed("development"), true);
});

test("Antwortzeit nur aus der Konfiguration, je Sprache, nie erfunden", () => {
  assert.equal(replyNoteFor("de", {}), null);
  assert.equal(replyNoteFor("de", { WHATSAPP_REPLY_NOTE: "  Antwort meist am selben Tag.  " }), "Antwort meist am selben Tag.");
  // Englische Seite zeigt den deutschen Satz nicht
  assert.equal(replyNoteFor("en", { WHATSAPP_REPLY_NOTE: "Antwort meist am selben Tag." }), null);
  assert.equal(replyNoteFor("en", { WHATSAPP_REPLY_NOTE_EN: "Usually the same day." }), "Usually the same day.");
  assert.equal(replyNoteFor("de", { WHATSAPP_REPLY_NOTE: "x".repeat(161) }), null);
  // Kein Text der Komponenten nennt eine Antwortzeit
  const all = JSON.stringify(WHATSAPP_COPY);
  assert.doesNotMatch(all, /\d+\s*(min|minuten|minutes|stunden|hours|heures|ore)\b/i);
  assert.doesNotMatch(all, /innerhalb|within|sofort|immediately|24\s*h/i);
});

test("buildWhatsAppHref: wa.me ohne +, Text sauber kodiert", () => {
  assert.equal(buildWhatsAppHref("43557446255"), "https://wa.me/43557446255");
  const href = buildWhatsAppHref("43557446255", "Grüße & Fragen #1 zu Möbel/Küche? ja");
  assert.equal(href, `https://wa.me/43557446255?text=${encodeURIComponent("Grüße & Fragen #1 zu Möbel/Küche? ja")}`);
  assert.ok(!href.includes("+"));
  assert.match(href, /%C3%BC/); // ü
  assert.match(href, /%26/); // &
  assert.match(href, /%23/); // #
  assert.equal(new URL(href).searchParams.get("text"), "Grüße & Fragen #1 zu Möbel/Küche? ja");
  for (const bad of [null, "", "+43557446255", "0435574", "abc", "4355744625512345"]) assert.equal(buildWhatsAppHref(bad, "x"), null);
  // Länge begrenzt
  const long = new URL(buildWhatsAppHref("43557446255", "a".repeat(5000))).searchParams.get("text");
  assert.equal(long.length, MAX_TEXT);
});

test("Seiten-URL: Produktionsdomain, ohne Tracking, nie persönliche Bereiche", () => {
  assert.equal(pageUrlForMessage("/de/produkte/lamps/lamps-2097-18", "?utm_source=x&gclid=1"), "https://platzhirsch.studio/de/produkte/lamps/lamps-2097-18");
  assert.equal(
    pageUrlForMessage("/de/ezarri/custom-mix", "?mix=a.40,b.60&fuge=weiss&utm_campaign=x&whatsapp=test"),
    "https://platzhirsch.studio/de/ezarri/custom-mix?mix=a.40%2Cb.60&fuge=weiss"
  );
  // Sehr lange Mischung → nur der Pfad
  assert.equal(pageUrlForMessage("/de/ezarri/custom-mix", `?mix=${"x".repeat(600)}`), "https://platzhirsch.studio/de/ezarri/custom-mix");
  const token = "A".repeat(32);
  assert.equal(pageUrlForMessage(`/de/ideenboard/${token}`), `https://platzhirsch.studio/de/ideenboard/${token}`);
  for (const p of [
    "/de/portal",
    "/de/portal/pass/123",
    "/de/upload/abc",
    "/de/zahlung/erfolg",
    `/de/wunschliste/${token}/verwalten`,
    `/de/ideenboard/${token}.${token}`,
    "/de/termin/abc123",
    "//evil.example/x",
    "https://evil.example/x",
  ]) {
    assert.equal(pageUrlForMessage(p), null, p);
  }
});

test("Seitenart und vorbelegter Text", () => {
  assert.equal(kindForPath("/de"), "general");
  assert.equal(kindForPath("/en/contact"), "general");
  assert.equal(kindForPath("/fr/produits/lamps/lamps-2097-18"), "product");
  assert.equal(kindForPath("/de/merkliste"), "merkliste");
  assert.equal(kindForPath("/it/consulenza"), "beratung");
  assert.equal(kindForPath("/de/ezarri/custom-mix"), "ezarriMix");
  assert.equal(kindForPath(`/de/ideenboard/${"b".repeat(32)}`), "ideenboard");
  assert.equal(kindForPath("/de/kuechen-vorarlberg"), "page");

  assert.equal(prefillText("de", { kind: "product", product: "2097/18", brand: "Flos", url: "https://platzhirsch.studio/de/produkte/lamps/lamps-2097-18" }),
    "Guten Tag, ich interessiere mich für 2097/18 (Flos). https://platzhirsch.studio/de/produkte/lamps/lamps-2097-18");
  assert.equal(prefillText("de", { kind: "product", product: "Tisch" }), "Guten Tag, ich interessiere mich für Tisch.");
  assert.equal(prefillText("en", { kind: "page" }), WHATSAPP_COPY.en.prefill.general); // ohne URL kein „diese Seite“
  assert.equal(prefillText("xx", {}), WHATSAPP_COPY.de.prefill.general);

  // Merkliste: nie der Inhalt, nur der Hinweis
  const m = hrefForLocation("43557446255", "de", { pathname: "/de/merkliste", search: "?items=a,b" });
  assert.equal(m.text, WHATSAPP_COPY.de.prefill.merkliste);
  // Kontext vom Server (Produkt) + URL aus der Adresse
  const p = hrefForLocation("43557446255", "it", { pathname: "/it/prodotti/lamps/lamps-2097-18", search: "?utm_source=x" }, { kind: "product", product: "2097/18", brand: "Flos" });
  assert.equal(new URL(p.href).searchParams.get("text"), "Buongiorno, sono interessato/a a 2097/18 (Flos). https://platzhirsch.studio/it/prodotti/lamps/lamps-2097-18");
  // Portalseite: kein Link im Text
  const portal = hrefForLocation("43557446255", "de", { pathname: "/de/portal/projekt" });
  assert.equal(portal.text, WHATSAPP_COPY.de.prefill.general);
});

test("Texte: alle Sprachen vollständig, keine Superlative, kein Ausrufezeichen, kein E2E-Versprechen", () => {
  const keys = (o, pre = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${pre}${k}.`) : [`${pre}${k}`]));
  const de = keys(WHATSAPP_COPY.de).sort();
  assert.deepEqual(LOCALES, ["de", "en", "fr", "it"]);
  for (const l of LOCALES) {
    assert.deepEqual(keys(WHATSAPP_COPY[l]).sort(), de, l);
    const all = JSON.stringify(whatsappCopy(l));
    assert.doesNotMatch(all, /!/, l);
    assert.doesNotMatch(all, /luxus|exklusiv|traum|beste|größte|luxury|exclusive|best |ende-zu-ende|end-to-end|bout en bout|end-to-end|crittograf/i, l);
    // Pflichtinhalte des Hinweises: Meta + USA
    assert.match(whatsappCopy(l).hintTitle, /Meta/);
    assert.match(whatsappCopy(l).hintBody, /Meta/);
    assert.match(whatsappCopy(l).hintBody, /USA|États-Unis|Stati Uniti/);
    // Zweck nicht verengen (QA Recht P1-3): Ablage im Kundensystem wird genannt, kein „nur … beantworten“
    assert.match(whatsappCopy(l).hintBody, /Kundensystem|customer system|système clients|sistema clienti/, l);
    assert.doesNotMatch(whatsappCopy(l).hintBody, /\bnur, um|only to answer|uniquement pour répondre|solo per rispondere/, l);
  }
});

test("src/messages/*.json (Namespace whatsapp) = whatsapp-messages.json = copy.js", () => {
  const json = JSON.parse(SRC("Marktresearch/digital/features/whatsapp-messages.json"));
  for (const l of LOCALES) {
    const messages = JSON.parse(SRC(`src/messages/${l}.json`));
    assert.deepEqual(messages.whatsapp, WHATSAPP_COPY[l], `src/messages/${l}.json`);
    assert.deepEqual(json[l].whatsapp, WHATSAPP_COPY[l], l);
  }
  // Client liest copy.js (gleiche Texte); der Namespace geht nicht in den Client-Payload
  assert.match(SRC("src/components/Reusable/clientMessages.js"), /"whatsapp",/);
});

test("Datenschutz-Link im Hinweis: nur mit bestätigtem Abschnitt live (QA P0)", () => {
  assert.match(SRC("src/components/WhatsApp/WhatsAppHint.js"), /\/datenschutz#whatsapp/);
  const dse = SRC("src/components/Datenschutz/datenschutz.js");
  // Solange der Abschnitt fehlt, darf der Schalter nirgends im Repo gesetzt sein
  if (!/id="whatsapp"/.test(dse)) {
    for (const f of [".env", ".env.production", ".env.local", ".env.production.local"]) {
      let env = "";
      try {
        env = SRC(f);
      } catch {
        continue;
      }
      assert.doesNotMatch(env, /^\s*WHATSAPP_PRIVACY_SECTION\s*=\s*1\b/m, f);
    }
  }
  assert.ok(fs.existsSync(new URL("../../Marktresearch/digital/features/whatsapp-dse-vorschlag.md", import.meta.url)), "DSE-Vorschlag fehlt");
});

test("Dev-Vorschau: Schnappschuss liest nur, Merken im Effekt", () => {
  const src = SRC("src/lib/whatsapp/preview.js");
  const snap = src.slice(src.indexOf("export function devPreviewActive"), src.indexOf("export function persistDevPreview"));
  assert.doesNotMatch(snap, /setItem|removeItem/);
  assert.match(SRC("src/components/WhatsApp/useWhatsAppDigits.js"), /useEffect\([\s\S]*persistDevPreview\(\)/);
});

test("Produktseite: Nachricht nennt den Titel, wie er auf der Seite steht", () => {
  const page = SRC("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /context=\{\{ kind: "product", product: productHeading, brand: "" \}\}/);
  assert.equal(prefillText("de", { kind: "product", product: "Flos 2097-18", brand: "", url: "https://platzhirsch.studio/de/produkte/lamps/lamps-2097-18" }),
    "Guten Tag, ich interessiere mich für Flos 2097-18. https://platzhirsch.studio/de/produkte/lamps/lamps-2097-18");
});

test("QR-Code lokal als SVG (Ink auf Paper), kein Fremddienst", () => {
  const svg = whatsappQrSvg("https://wa.me/43557446255?text=Guten%20Tag");
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /#1f252b/);
  assert.match(svg, /#faf8f4/);
  assert.doesNotMatch(SRC("src/lib/whatsapp/qr.js"), /https?:\/\/(?!www\.w3\.org)/);
});

test("Kein Meta-/WhatsApp-Skript, kein NEXT_PUBLIC_, kein Tracking vor dem Klick", () => {
  const files = [
    "src/lib/whatsapp/config.js",
    "src/lib/whatsapp/link.js",
    "src/lib/whatsapp/preview.js",
    "src/components/WhatsApp/WhatsAppEntry.js",
    "src/components/WhatsApp/WhatsAppHint.js",
    "src/components/WhatsApp/index.js",
    "src/components/WhatsApp/useWhatsAppDigits.js",
  ];
  for (const f of files) {
    const src = SRC(f);
    assert.doesNotMatch(src, /<script|next\/script|connect\.facebook|graph\.facebook|static\.whatsapp|fbq\(|gtag\(|trackEvent/i, f);
    assert.doesNotMatch(src, /NEXT_PUBLIC_WHATSAPP/, f);
  }
  // Der eigentliche Link steht nur im Hinweis, nicht im Auslöser
  assert.doesNotMatch(SRC("src/components/WhatsApp/WhatsAppEntry.js"), /https:\/\/wa\.me|buildWhatsAppHref|hrefForLocation/);
  assert.match(SRC("src/components/WhatsApp/WhatsAppHint.js"), /rel="noopener noreferrer"/);
  // Client bekommt nie whatsappConfig() (process.env wäre dort leer)
  for (const f of ["src/components/WhatsApp/WhatsAppEntry.js", "src/components/WhatsApp/WhatsAppHint.js", "src/components/Reusable/MobileCtaBar.js"]) {
    assert.doesNotMatch(SRC(f), /import[^;]*\b(whatsappConfig|entryProps)\b|whatsappConfig\(|entryProps\(/, f);
  }
});
