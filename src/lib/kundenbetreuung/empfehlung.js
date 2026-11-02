// src/lib/kundenbetreuung/empfehlung.js
// Empfehlungsprogramm „Unter Freunden“ (Welle 2, Team Kundenbetreuung).
// Inhaber 29.10.2026: „Wer einen Kunden empfiehlt, bekommt einen Gutschein.
// Die Gutscheine sind schon gebaut.“ Grundlage: wachstumsrat/crm-wiederkauf.md
// Abschn. 2.3 (Recht) und 3.4 (Programm), Bedingungen als Vorschlag für die
// Kanzlei: Marktresearch/digital/features/empfehlung-bedingungen-vorschlag.md
//
// Rechtlicher Kern (BGH I ZR 208/12 „Empfehlungs-E-Mail“, § 174 TKG 2021):
//   - Platzhirsch schreibt NIEMANDEN an, den ein Kunde nennt. Es gibt kein
//     Feld „E-Mail Ihres Freundes“. Der Kunde gibt seinen persönlichen Code
//     oder Link SELBST weiter (Kopieren, Teilen-Menü des Geräts, eigenes
//     Postfach), die empfohlene Person meldet sich selbst.
//   - Die Zuordnung „empfohlen von“ passiert nur mit Einwilligung der
//     empfohlenen Person (eigenes, nicht vorangekreuztes Häkchen). Ohne
//     Häkchen geht der Code gar nicht erst mit.
//   - Der Gutschein hängt nie an einer Bewertung und nie an reinen Kontakten,
//     nur am ersten Auftrag der empfohlenen Person.
//
// Codes: „EMP-“ + 6 Zeichen aus dem Gutschein-Alphabet (ohne 0/O/1/I), damit
// sie nie mit Gutscheincodes (PH-XXXX-XXXX-XXXX-XXXX, payments/codes.js)
// verwechselt werden. Ein Code hat keinen Geldwert, er ordnet nur zu. Erzeugt
// werden Codes im Backoffice (Frappe-App platzhirsch_kundenbetreuung,
// Doctype „PH Empfehlung“), nie im Browser.
//
// Formularweg: bestehende Route /api/kontakt (Lead-Mechanismus mit
// Herkunftsblock, lib/forms/client.js postForm) mit Kontext-Zeile
// „Kontext: Empfehlungsprogramm · …“. Die Frappe-App erkennt daran die
// Empfehlung (hooks.py doc_events „Kontakt Form“ after_insert).
// Keine "@/..."-Importe: direkt mit `node --test` getestet.

export const CODE_PREFIX = "EMP";
export const CODE_CHARS = 6;
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_BODY_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_CHARS}}$`);

/**
 * Programm-Einstellungen. NUR echte Angaben des Inhabers eintragen.
 *   termsStatus   "entwurf" bis die Kanzlei die Teilnahmebedingungen
 *                 freigibt, dann "freigegeben" (Seite wird indexierbar,
 *                 öffentlich sichtbar und nennt die Bedingungen).
 *   voucherValue  Gutscheinwert in Euro (Zahl) – legt der Inhaber fest.
 *                 null = die Seite nennt keinen Betrag („einen Gutschein“).
 *   termsStand    Datum der freigegebenen Fassung (z. B. "2026-11-20").
 */
export const REFERRAL = Object.freeze({
  termsStatus: "entwurf",
  voucherValue: null,
  termsStand: null,
});

export const TERMS_RELEASED = "freigegeben";

/** Bedingungen von der Kanzlei freigegeben? */
export const referralTermsReleased = (config = REFERRAL) => config?.termsStatus === TERMS_RELEASED;

/**
 * Ist die Seite öffentlich? Produktion: erst mit freigegebenen Bedingungen
 * oder ausdrücklich EMPFEHLUNG_PUBLIC=1 (Deploy-Entscheidung des Inhabers).
 * Entwicklung: immer sichtbar, mit Hinweis „Bedingungen sind Entwurf“.
 */
export function referralPagePublic(env = process.env, config = REFERRAL) {
  if (referralTermsReleased(config)) return true;
  if (env?.EMPFEHLUNG_PUBLIC === "1") return true;
  return env?.NODE_ENV !== "production";
}

/** Betrag als „50 €“ (de) bzw. „€50“ (en) – nur, wenn der Inhaber ihn eingetragen hat. */
export function voucherValueLabel(locale = "de", config = REFERRAL) {
  const v = Number(config?.voucherValue);
  if (!Number.isFinite(v) || v <= 0) return null;
  try {
    return new Intl.NumberFormat(locale === "de" ? "de-AT" : locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${Math.round(v)} €`;
  }
}

/**
 * Eingabe → "EMP-ABC234" oder null. Toleriert Kleinbuchstaben, Leerzeichen,
 * Bindestriche und den fehlenden Präfix ("abc 234").
 */
export function normalizeReferralCode(input) {
  let s = String(input ?? "")
    .toUpperCase()
    .replace(/[\s\-_.]/g, "");
  if (s.startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length);
  return CODE_BODY_RE.test(s) ? `${CODE_PREFIX}-${s}` : null;
}

export const isReferralCode = (input) => normalizeReferralCode(input) !== null;

/**
 * Neuer Code (für Tests und als Vorbild der Python-Fassung in der
 * Frappe-App). `rng(n)` liefert n Zufallsbytes; 256 / 32 = 8, ohne Verzerrung.
 */
export function newReferralCode(rng) {
  const bytes = rng ? rng(CODE_CHARS) : globalThis.crypto.getRandomValues(new Uint8Array(CODE_CHARS));
  let out = "";
  for (let i = 0; i < CODE_CHARS; i++) out += CODE_ALPHABET[bytes[i] & 31];
  return `${CODE_PREFIX}-${out}`;
}

/** Persönlicher Teilen-Link: https://platzhirsch.studio/de/empfehlen?code=EMP-ABC234 */
export function referralShareUrl(code, { locale = "de", base = "https://platzhirsch.studio" } = {}) {
  const c = normalizeReferralCode(code);
  if (!c) return null;
  const loc = ["de", "en", "fr", "it"].includes(locale) ? locale : "de";
  return `${String(base).replace(/\/+$/, "")}/${loc}/empfehlen?code=${encodeURIComponent(c)}`;
}

// ── Formular → Payload für /api/kontakt ─────────────────────────────────────
// Schema der Route (lib/forms/schemas.js kontaktSchema):
// { name, company, email_address, telefon, ihre_nachricht (≥ 10 Zeichen) }
// Texte für das Backoffice auf Deutsch (wie Adventsabend und Gutschein).

export const ROLES = Object.freeze(["empfehler", "empfohlen"]);
export const MESSAGE_MAX = 2000;

const clean = (v, max = 200) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

/** Kontext-Zeile des Herkunftsblocks („Kontext: …“, leadPayload.js). */
export function referralContext(role, { code, consent } = {}) {
  if (role === "empfehler") return "Empfehlungsprogramm · Empfehler fordert Code an";
  const c = consent ? normalizeReferralCode(code) : null;
  return c ? `Empfehlungsprogramm · Empfohlen · Code ${c}` : "Empfehlungsprogramm · Empfohlen · ohne Zuordnung";
}

/**
 * Payload für die Route /api/kontakt.
 * role "empfehler": { name, email, telefon?, kundennummer?, nachricht? }
 * role "empfohlen": { name, email, telefon?, code?, consent, nachricht }
 * Der Code geht NUR mit consent === true mit (Einwilligung der empfohlenen
 * Person in die Zuordnung und die Information der empfehlenden Person).
 */
export function referralPayload(role, form = {}) {
  if (!ROLES.includes(role)) throw new Error(`unknown role ${role}`);
  const nachricht = clean(form.nachricht, MESSAGE_MAX);
  const lines = [];
  if (role === "empfehler") {
    lines.push("[Empfehlungsprogramm] Bitte um meinen persönlichen Empfehlungscode.");
    const nr = clean(form.kundennummer, 60);
    if (nr) lines.push(`Kunden- oder Auftragsnummer (Angabe der Person): ${nr}`);
    lines.push("Hinweis für das Team: Code nur an Kundinnen und Kunden mit Auftrag ausgeben (PH Empfehlung anlegen).");
  } else {
    lines.push("[Empfehlungsprogramm] Anfrage auf Empfehlung.");
    const code = normalizeReferralCode(form.code);
    if (code && form.consent === true) {
      lines.push(`Empfehlungscode: ${code}`);
      lines.push("Zuordnung zur empfehlenden Person: eingewilligt (Häkchen auf /empfehlen).");
    } else if (code) {
      lines.push("Empfehlungscode: nicht übermittelt (keine Einwilligung in die Zuordnung).");
    }
  }
  if (nachricht) lines.push("", `Nachricht: ${nachricht}`);
  return {
    name: clean(form.name, 200),
    company: "",
    email_address: clean(form.email, 254),
    telefon: clean(form.telefon, 40),
    ihre_nachricht: lines.join("\n"),
  };
}

/**
 * Lead-Optionen für postForm (lib/forms/client.js): Kontext-Zeile und
 * Selbstauskunft „Empfehlung Freund/Kunde“ (nur bei der empfohlenen Person).
 */
export function referralLead(role, form = {}) {
  return {
    pageContext: referralContext(role, { code: form.code, consent: form.consent === true }),
    ...(role === "empfohlen" ? { selfReport: "empfehlung" } : {}),
  };
}

/** Text zum Weitergeben (Teilen-Menü, eigenes Postfach). `copy.shareText` mit {link}. */
export function shareMessage(template, link) {
  return String(template || "").replace("{link}", link || "");
}
