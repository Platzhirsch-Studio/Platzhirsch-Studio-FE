// src/lib/service/reklamation/schema.js – Felder und Prüfung des
// Reklamationsformulars /<locale>/service/reklamation (Browser UND Server).
// Fehlercodes je Feld: required | email | phone | short | long | choice.
// Rein, ohne Node- und "@/"-Importe (node --test, Client-Bundle).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

/** Art des Falls → ph_service ARTEN_PORTAL (Backend-Import/ph_service/ph_service/api/__init__.py). */
export const ARTEN = Object.freeze(["mangel", "transportschaden", "montagefehler", "garantie", "pflegefrage"]);

export const LIMITS = Object.freeze({
  vorname: 100,
  nachname: 100,
  email: 254,
  telefon: 40,
  bestellnummer: 40,
  produkt: 140,
  beschreibungMin: 20,
  beschreibung: 5000,
  idem: 80,
});

/** Reihenfolge der Felder (Fehlerliste, Fokus). */
export const FIELD_ORDER = Object.freeze(["bestellnummer", "produkt", "art", "beschreibung", "vorname", "nachname", "email", "telefon", "einwilligung"]);

const str = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * @param {object} input Rohwerte aus dem Formular / JSON-Body
 * @returns {{ ok: true, data: object } | { ok: false, errors: Record<string,string> }}
 */
export function validateReklamation(input = {}) {
  const v = {
    vorname: str(input.vorname),
    nachname: str(input.nachname),
    email: str(input.email).toLowerCase(),
    telefon: str(input.telefon),
    bestellnummer: str(input.bestellnummer),
    produkt: str(input.produkt),
    art: str(input.art) || "mangel",
    beschreibung: str(input.beschreibung),
    einwilligung: input.einwilligung === true || input.einwilligung === "1" || input.einwilligung === "on",
    sprache: ["de", "en", "fr", "it"].includes(input.sprache) ? input.sprache : "de",
    idem: str(input.idem).slice(0, LIMITS.idem),
  };
  const e = {};
  const need = (k) => {
    if (!v[k]) e[k] = "required";
    else if (v[k].length > LIMITS[k]) e[k] = "long";
  };
  need("vorname");
  need("nachname");
  if (!v.email) e.email = "required";
  else if (v.email.length > LIMITS.email || !EMAIL_RE.test(v.email)) e.email = "email";
  if (v.telefon && (v.telefon.length > LIMITS.telefon || !PHONE_RE.test(v.telefon))) e.telefon = "phone";
  if (v.bestellnummer.length > LIMITS.bestellnummer) e.bestellnummer = "long";
  need("produkt");
  if (!ARTEN.includes(v.art)) e.art = "choice";
  if (!v.beschreibung) e.beschreibung = "required";
  else if (v.beschreibung.length < LIMITS.beschreibungMin) e.beschreibung = "short";
  else if (v.beschreibung.length > LIMITS.beschreibung) e.beschreibung = "long";
  if (!v.einwilligung) e.einwilligung = "required";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, data: v };
}

/** validateReklamation als { safeParse } für guardForm (src/lib/forms/guard.js). */
export const reklamationSchema = Object.freeze({
  safeParse(input) {
    const r = validateReklamation(input);
    if (r.ok) return { success: true, data: r.data };
    const field = FIELD_ORDER.find((k) => r.errors[k]);
    return { success: false, error: { issues: [{ path: [field], message: `invalid ${field}` }] } };
  },
});
