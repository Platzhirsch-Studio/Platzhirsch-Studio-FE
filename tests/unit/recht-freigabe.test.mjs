// tests/unit/recht-freigabe.test.mjs — Kanzlei-Freigabe der Rechtstexte
// (Inhaber-Entscheidung Nr. 11, 29.10.2026).
//   1 Status-Flags: Impressum, Datenschutz und zentrale Liste auf „freigegeben“
//   2 Impressum: CHAMBER und BLATTLINIE leer → Zeilen fehlen, nichts erfunden
//   3 Gutscheinbedingungen: TERMS_STATUS bleibt Entwurf, solange 7 Felder leer
//   4 Widerruf, AGB, Barrierefreiheit: nicht öffentlich, solange Angaben fehlen
//   5 Öffentlicher Teil ohne Entwurfs-/Prüfmarker
// Run: node --test tests/unit/recht-freigabe.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LEGAL_APPROVAL, LEGAL_TEXTS, legalLiveRows } from "../../src/components/LegalDrafts/liveStatus.js";
import { TERMS_OWNER_FIELDS, TERMS_SECTIONS, TERMS_STATUS, termsFieldsOpen } from "../../src/lib/commerce/voucherTerms.js";
import * as FIELDS from "../../src/lib/commerce/voucherTermsFields.js";
import { WITHDRAWAL_STATUS } from "../../src/lib/commerce/withdrawalText.js";
import { TERMS_RELEASED, voucherMode } from "../../src/lib/commerce/mode.js";
import { commerceStatus, legalLiveStatus } from "../../src/components/Freigaben/model.js";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

// ------------------------------------------------------------ 1 Flags
test("Kanzlei-Freigabe: zentrale Liste, Impressum und Datenschutz freigegeben", () => {
  assert.equal(LEGAL_APPROVAL.lawyerApproved, true);
  assert.equal(LEGAL_APPROVAL.approvedAt, "2026-10-29");
  assert.match(LEGAL_APPROVAL.source, /Nr\. 11/);
  const ids = LEGAL_TEXTS.map((t) => t.id);
  for (const id of ["impressum", "datenschutz", "cookies", "widerruf", "gutscheinbedingungen", "agb", "barrierefreiheit"]) assert.ok(ids.includes(id), id);
  assert.deepEqual(
    LEGAL_TEXTS.filter((t) => t.state === "live").map((t) => t.id),
    // Portal-Datenschutz ist öffentlich und verlinkt (Prüfung recht P1-3) und gehört daher in die Liste.
    // Rat 9,5 B13 (bewusst): Barrierefreiheit hat eine eigene Seite.
    // Inhaber 02.11.2026: AGB je Geschäftsbereich haben eine eigene Seite /agb.
    // Inhaber 03.11.2026 (Nr. 39/40): AGB von der Kanzlei freigegeben; Widerrufsbelehrung außerhalb des Shops unter /widerruf.
    // Inhaber 03.11.2026 (Nr. 46): Gutscheinverkauf online erlaubt → Gutscheinbedingungen und Gutschein-Widerruf live (hinter VOUCHER_MODE).
    ["impressum", "datenschutz", "portal-datenschutz", "cookies", "widerruf", "gutscheinbedingungen", "agb", "widerrufsbelehrung", "barrierefreiheit"]
  );
  assert.match(LEGAL_TEXTS.find((t) => t.id === "portal-datenschutz").ownerFills, /OWNER_CONFIRMED = true/);
  // Rat 9,5 B13 (bewusst): Barrierefreiheit ist live, aber nicht Teil der Freigabe Nr. 11.
  for (const r of legalLiveRows()) assert.match(r.label, r.wording === "kanzlei-offen" ? /^live, Wortlaut zur Prüfung bei der Kanzlei$/ : /^freigegeben/, r.id);
  assert.deepEqual(LEGAL_TEXTS.filter((t) => t.wording === "kanzlei-offen").map((t) => t.id), ["barrierefreiheit"]);
  assert.match(read("src/components/Impressum/impressum.js"), /lawyerApproved: true/);
  assert.match(read("src/components/Datenschutz/datenschutz.js"), /lawyerApproved: true/);
  assert.equal(legalLiveStatus().rows.length, LEGAL_TEXTS.length);
});

// ------------------------------------------------------------ 2 Impressum
test("Impressum: CHAMBER und BLATTLINIE vorbereitet, leer → keine Zeile, kein Platzhalter", () => {
  const src = read("src/components/Impressum/impressum.js");
  const block = (name) => src.slice(src.indexOf(`export const ${name}`), src.indexOf("});", src.indexOf(`export const ${name}`)));
  // 30.10.2026: Kammer aus WKO Firmen A–Z belegt; Blattlinie bleibt leer.
  assert.match(block("CHAMBER"), /source: "WKO Firmen A–Z/);
  assert.match(block("BLATTLINIE"), /text: null/);
  assert.match(block("BLATTLINIE"), /source: null/);
  assert.match(block("BLATTLINIE"), /checkedAt: null/);
  assert.match(src, /if \(!text \|\| !b\.source \|\| !b\.checkedAt\) return null;/);
  const jsx = code("src/components/Impressum/impressum.js");
  const body = jsx.slice(jsx.indexOf("const Impressum = () =>"));
  assert.match(body, /\{chamber && \(/);
  assert.match(body, /\{blattlinie && \(/);
  assert.doesNotMatch(body, /\[|TODO|Entwurf|WKO|Wirtschaftskammer/);
});

// ------------------------------------------------------------ 3 Gutscheinbedingungen
test("Gutscheinbedingungen: 7 Felder eingetragen (03.11.2026, Nr. 46) → TERMS_STATUS freigegeben, Schalter wirkt", () => {
  assert.equal(TERMS_OWNER_FIELDS.length, 7);
  assert.equal(FIELDS.TERMS_OWNER_FIELDS, TERMS_OWNER_FIELDS, "voucherTerms.js reicht die Felder aus voucherTermsFields.js durch");
  assert.deepEqual(termsFieldsOpen(), [], "alle Felder eingetragen");
  // Jedes Feld mit Beleg (Entscheidungsnummer) – nichts geschätzt.
  for (const f of TERMS_OWNER_FIELDS) assert.match(f.beleg || "", /Nr\. \d+|Standardformulierung/, f.id);
  assert.match(TERMS_OWNER_FIELDS.find((f) => f.id === "aussteller").value, /^MW Immobilienverwaltungs GmbH, FN 443753 d, Landesgericht Feldkirch, UID ATU70035339$/);
  assert.match(TERMS_OWNER_FIELDS.find((f) => f.id === "steuerart").value, /^Mehrzweckgutschein/);
  assert.match(TERMS_OWNER_FIELDS.find((f) => f.id === "gueltigkeit").value, /^unbefristet/);
  assert.match(TERMS_OWNER_FIELDS.find((f) => f.id === "cafe").value, /gilt nicht im Platzhirsch Café/);
  assert.match(TERMS_OWNER_FIELDS.find((f) => f.id === "schlichtung").value, /^nein/);
  // Gate: keine eckigen Klammern mehr im Text, Status freigegeben, Stand 03.11.2026.
  const hasBrackets = TERMS_SECTIONS.some((s) => s.paragraphs.some((p) => /\[[^\]]+\]/.test(p)));
  assert.equal(hasBrackets, false);
  assert.equal(TERMS_STATUS, TERMS_RELEASED);
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }), "anfrage");
  assert.equal(voucherMode({}), "off", "ohne VOUCHER_MODE weiter 404");
  const c = commerceStatus({});
  assert.equal(c.termsFieldsOpen, 0);
  assert.equal(c.termsReleased, true);
  assert.equal(c.termsStand, "2026-11-03");
  assert.equal(termsFieldsOpen([{ id: "x", value: "  " }]).length, 1, "Leerzeichen zählt als leer");
  assert.equal(termsFieldsOpen([{ id: "x", value: "eingetragen" }]).length, 0);
});

// ------------------------------------------------------------ 4 nicht öffentlich
test("Widerruf, AGB, Barrierefreiheit: Wortlaut freigegeben, Gutschein-Texte seit 03.11.2026 live", () => {
  // Inhaber 03.11.2026 (Nr. 46): Firmenwortlaut (Nr. 38) eingetragen, Gutscheinverkauf erlaubt.
  assert.equal(WITHDRAWAL_STATUS, "freigegeben");
  for (const id of ["widerruf", "gutscheinbedingungen"]) assert.equal(LEGAL_TEXTS.find((t) => t.id === id).state, "live", id);
  assert.equal(LEGAL_TEXTS.find((t) => t.id === "gutscheinbedingungen").livePath, "/gutscheinbedingungen");
  // Erwartung bewusst geändert (Rat 9,5 B13, QA Recht −0,2): Barrierefreiheit hat jetzt
  // eine eigene Seite mit nur geprüften Aussagen (src/lib/legal/barrierefreiheit.js);
  // geprüft in rat95-recht-barrierefreiheit.test.mjs. Die AGB haben seit 02.11.2026 die
  // Seite /agb (Inhaber-Auftrag AGB je Geschäftsbereich; geprüft in agb-bereiche.test.mjs).
  {
    const t = LEGAL_TEXTS.find((x) => x.id === "agb");
    assert.equal(t.state, "live");
    assert.equal(t.livePath, "/agb");
    assert.equal(fs.existsSync(path.join(ROOT, "src/app/[locale]/agb/page.js")), true, "agb: Route");
  }
  {
    const t = LEGAL_TEXTS.find((x) => x.id === "widerrufsbelehrung");
    assert.equal(t.state, "live");
    assert.equal(t.livePath, "/widerruf");
    assert.equal(fs.existsSync(path.join(ROOT, "src/app/[locale]/widerruf/page.js")), true, "widerruf: Route");
  }
  const bf = LEGAL_TEXTS.find((x) => x.id === "barrierefreiheit");
  assert.equal(bf.state, "live");
  assert.equal(bf.livePath, "/barrierefreiheit");
  assert.equal(fs.existsSync(path.join(ROOT, "src/app/[locale]/barrierefreiheit/page.js")), true);
});

// ------------------------------------------------------------ 5 öffentlicher Teil
test("Öffentlicher Teil: keine Entwurfs- oder Prüfhinweise auf Impressum und Datenschutz", () => {
  for (const f of ["src/components/Impressum/impressum.js", "src/components/Datenschutz/datenschutz.js"]) {
    const jsx = code(f);
    const body = jsx.slice(jsx.search(/const (Impressum|Datenschutz) = \(\) =>/));
    assert.ok(body.length > 500, f);
    assert.doesNotMatch(body, /anwaltlich|Kanzlei|\[prüfen|vom Unternehmen auszufüllen|nicht freigegeben/i, f);
  }
  for (const f of ["src/components/Impressum/impressumbanner.js", "src/components/Datenschutz/datenbanner.js"]) {
    assert.doesNotMatch(read(f), /Entwurfsstand|not approved/i, f);
  }
  assert.doesNotMatch(read("src/app/[locale]/gutscheinbedingungen/page.js"), /vor Verwendung anwaltlich prüfen/);
});
