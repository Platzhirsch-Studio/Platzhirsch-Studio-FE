// src/lib/pinterest/config.js — Schalter rund um Pinterest (Server).
//
// PINTEREST_DOMAIN_VERIFY: Code aus „Pinterest → Einstellungen → Konto
// beanspruchen → Website → HTML-Tag“ (nur der content-Wert). Leer = kein
// <meta name="p:domain_verify">. Der Inhaber trägt ihn im Deploy ein, sobald
// das Unternehmenskonto steht; die Domain-Bestätigung schaltet die Rich Pins
// frei (Pinterest liest dann Open Graph und schema.org der Seiten).
//
// NEXT_PUBLIC_PINTEREST_SAVE=off schaltet alle Merken-Links ab (Notbremse,
// wirkt auch in Inseln, darum NEXT_PUBLIC_). Standard: an.
// Rein, ohne Importe (node --test).

const CODE_RE = /^[A-Za-z0-9_-]{8,128}$/;

/** content-Wert des Verifizierungs-Tags oder null (dann kein Tag). */
export function pinterestDomainVerify(env = process.env) {
  const v = String(env?.PINTEREST_DOMAIN_VERIFY || "").trim();
  return CODE_RE.test(v) ? v : null;
}

/** Metadata-Ergänzung für das Layout: { verification: { other: … } } oder {}. */
export function pinterestVerificationMetadata(env = process.env) {
  const code = pinterestDomainVerify(env);
  return code ? { verification: { other: { "p:domain_verify": code } } } : {};
}

export function pinterestSaveEnabled(env = process.env) {
  return String(env?.NEXT_PUBLIC_PINTEREST_SAVE ?? "").trim().toLowerCase() !== "off";
}
