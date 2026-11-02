// tests/unit/empfehlung.test.mjs — Welle 2, Empfehlungsprogramm (/empfehlen).
// Run: node --test tests/unit/empfehlung.test.mjs
// Kein Netz: postForm bekommt immer ein gemocktes fetch.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REFERRAL,
  isReferralCode,
  newReferralCode,
  normalizeReferralCode,
  referralContext,
  referralLead,
  referralPagePublic,
  referralPayload,
  referralShareUrl,
  voucherValueLabel,
} from "../../src/lib/kundenbetreuung/empfehlung.js";
import { EMPFEHLEN_COPY, EMPFEHLEN_LOCALES } from "../../src/lib/kundenbetreuung/empfehlenContent.js";
import { kontaktSchema } from "../../src/lib/forms/schemas.js";
import { postForm } from "../../src/lib/forms/client.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("Code: Format EMP-XXXXXX, tolerante Eingabe, kein Gutscheincode", () => {
  assert.equal(normalizeReferralCode("emp-7k3m9q"), "EMP-7K3M9Q");
  assert.equal(normalizeReferralCode(" EMP 7K3 M9Q "), "EMP-7K3M9Q");
  assert.equal(normalizeReferralCode("7k3m9q"), "EMP-7K3M9Q");
  assert.equal(normalizeReferralCode("EMP-7K3M9"), null); // zu kurz
  assert.equal(normalizeReferralCode("EMP-7K3M90"), null); // 0 nicht im Alphabet
  assert.equal(normalizeReferralCode("PH-ABCD-EFGH-JKLM-NPQR"), null); // Gutscheincode
  assert.equal(normalizeReferralCode("<script>"), null);
  const c = newReferralCode((n) => new Uint8Array(n).fill(5));
  assert.ok(isReferralCode(c), c);
});

test("Teilen-Link nur mit gültigem Code und bekannter Sprache", () => {
  assert.equal(referralShareUrl("emp-7k3m9q"), "https://platzhirsch.studio/de/empfehlen?code=EMP-7K3M9Q");
  assert.equal(referralShareUrl("EMP-7K3M9Q", { locale: "xx" }), "https://platzhirsch.studio/de/empfehlen?code=EMP-7K3M9Q");
  assert.equal(referralShareUrl("falsch-0"), null);
});

test("Empfohlene Person: Code geht NUR mit Einwilligung mit", () => {
  const base = { name: "Anna Muster", email: "anna@example.com", nachricht: "Wohnzimmer neu einrichten", code: "emp-7k3m9q" };
  const ohne = referralPayload("empfohlen", { ...base, consent: false });
  assert.doesNotMatch(ohne.ihre_nachricht, /EMP-7K3M9Q/);
  assert.match(ohne.ihre_nachricht, /nicht übermittelt/);
  assert.equal(referralContext("empfohlen", { code: base.code, consent: false }), "Empfehlungsprogramm · Empfohlen · ohne Zuordnung");
  const mit = referralPayload("empfohlen", { ...base, consent: true });
  assert.match(mit.ihre_nachricht, /Empfehlungscode: EMP-7K3M9Q/);
  assert.match(mit.ihre_nachricht, /eingewilligt/);
  assert.deepEqual(referralLead("empfohlen", { ...base, consent: true }), { pageContext: "Empfehlungsprogramm · Empfohlen · Code EMP-7K3M9Q", selfReport: "empfehlung" });
  // Route-Schema akzeptiert die Payloads (Mindestlänge über das Präfix gesichert)
  assert.ok(kontaktSchema.safeParse(ohne).success);
  assert.ok(kontaktSchema.safeParse(mit).success);
  assert.ok(kontaktSchema.safeParse(referralPayload("empfehler", { name: "Bernd Kunde", email: "b@example.com" })).success);
});

test("Kein Feld für Adressen Dritter (BGH I ZR 208/12)", () => {
  const p = referralPayload("empfehler", { name: "B K", email: "b@example.com", freund_email: "x@example.com" });
  assert.doesNotMatch(JSON.stringify(p), /x@example\.com/);
  const form = fs.readFileSync(path.join(root, "src/components/Empfehlen/EmpfehlungForm.js"), "utf8");
  assert.doesNotMatch(form, /freund|empfaenger_email|friend/i);
  // Checkbox nie vorangekreuzt
  assert.match(form, /consent: false/);
});

test("postForm schickt Kontext-Zeile und lead_ref an /api/kontakt", async () => {
  let sent;
  const fetchImpl = async (url, init) => {
    sent = { url, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const form = { name: "Anna Muster", email: "anna@example.com", nachricht: "Küche planen am See", code: "EMP-7K3M9Q", consent: true };
  const res = await postForm("/api/kontakt", referralPayload("empfohlen", form), {
    fetchImpl,
    lead: { ...referralLead("empfohlen", form), attribution: {}, locale: "de", device: "mobil" },
  });
  assert.ok(res.ok);
  assert.equal(sent.url, "/api/kontakt");
  assert.match(sent.body.ihre_nachricht, /Kontext: Empfehlungsprogramm · Empfohlen · Code EMP-7K3M9Q/);
  assert.match(sent.body.ihre_nachricht, /Selbstauskunft: Empfehlung Freund\/Kunde/);
  assert.ok(sent.body.lead_ref);
});

test("Sichtbarkeit: Produktion erst mit Freigabe oder EMPFEHLUNG_PUBLIC=1", () => {
  assert.equal(REFERRAL.termsStatus, "entwurf");
  assert.equal(referralPagePublic({ NODE_ENV: "production" }), false);
  assert.equal(referralPagePublic({ NODE_ENV: "production", EMPFEHLUNG_PUBLIC: "1" }), true);
  assert.equal(referralPagePublic({ NODE_ENV: "development" }), true);
  assert.equal(referralPagePublic({ NODE_ENV: "production" }, { termsStatus: "freigegeben" }), true);
});

test("Kein erfundener Betrag: ohne Inhaberwert keine Zahl", () => {
  assert.equal(REFERRAL.voucherValue, null);
  assert.equal(voucherValueLabel("de"), null);
  assert.match(voucherValueLabel("de", { voucherValue: 50 }), /50/);
});

test("Texte: alle vier Sprachen mit denselben Schlüsseln, ohne Superlative/Ausrufezeichen", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const de = keys(EMPFEHLEN_COPY.de).sort();
  for (const l of EMPFEHLEN_LOCALES) {
    assert.deepEqual(keys(EMPFEHLEN_COPY[l]).sort(), de, l);
    const text = JSON.stringify(EMPFEHLEN_COPY[l]);
    assert.doesNotMatch(text, /!/, `${l}: Ausrufezeichen`);
    assert.doesNotMatch(text, /exklusiv|Luxus|beste[nr]? |größte|offizielle?r? Händler/i, `${l}: Superlativ/Händleraussage`);
    assert.doesNotMatch(text, /\d+\s?€|€\s?\d+/, `${l}: Betrag ohne Freigabe`);
    assert.equal(EMPFEHLEN_COPY[l].steps.length, 4);
  }
});

// QA Welle 2 P1-3: Teilen-Text ohne vorformuliertes Urteil, Belohnung offen genannt.
test("Teilen-Text: kein Testimonial, Gutschein-Hinweis in jeder Sprache", () => {
  const reward = { de: /Gutschein/, en: /voucher/, fr: /bon d’achat/, it: /buono/ };
  for (const locale of EMPFEHLEN_LOCALES) {
    const t = EMPFEHLEN_COPY[locale].share?.shareText ?? Object.values(EMPFEHLEN_COPY[locale]).find((v) => v?.shareText)?.shareText;
    assert.ok(t && t.includes("{link}"), locale);
    assert.match(t, reward[locale], locale);
    assert.doesNotMatch(t, /zufrieden|happy|content|bene\b/i, locale);
  }
});
