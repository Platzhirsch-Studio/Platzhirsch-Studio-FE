// Zentrale Einstellungen des eigenen Backoffice (Inhaber-Entscheidung Nr. 48:
// Next.js-Oberfläche, Frappe nur als Datenschicht im Hintergrund).
// Alles, was von der Umgebung abhängt, wird hier gelesen und nirgends sonst.
// Reines Modul (kein "server-only", keine "@/"-Importe), damit node --test es lädt.

// Eigene App auf Port 3100: Pfade ohne Präfix (/login, /d/<doctype>, /<bereich>).
export const BACKOFFICE_BASE_PATH = "";
export const BACKOFFICE_LOGIN_PATH = "/login";

export const SESSION_COOKIE = "ph_bo_session";
/** Absolute Lebensdauer einer Sitzung: 10 Stunden. */
export const SESSION_TTL_SECONDS = 60 * 60 * 10;
/** Ohne Aktivität endet die Sitzung nach 60 Minuten. */
export const SESSION_IDLE_SECONDS = 60 * 60;

// Nur FEHLVERSUCHE zählen (je IP + E-Mail); erfolgreiche Anmeldungen und Testläufe von derselben
// localhost-IP sperren so niemanden aus. In Produktion 5 Fehlversuche je 10 Minuten, in der Entwicklung 50.
export const LOGIN_RATE_LIMIT = { limit: process.env.NODE_ENV === "production" ? 5 : 50, windowMs: 10 * 60 * 1000 };

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Env-Namen – nur Namen, nie Werte, auch in Logs und Doku. */
export const ENV = {
  MODE: "BACKOFFICE_MODE",
  FRAPPE_URL: "BACKOFFICE_FRAPPE_URL",
  FRAPPE_TOKEN: "BACKOFFICE_FRAPPE_TOKEN",
  SESSION_SECRET: "BACKOFFICE_SESSION_SECRET",
  MOCK_PASSWORD: "BACKOFFICE_MOCK_PASSWORD",
  META_DIR: "BACKOFFICE_META_DIR",
  /** Mock: Fähigkeiten-Schalter „alle“ | „keine“ | „-kassa.retoure,+shop.x“ (G-04). */
  MOCK_FAEHIGKEITEN: "BACKOFFICE_MOCK_FAEHIGKEITEN",
  /** Frappe: vom Betrieb bestätigte Fähigkeiten, deren Probe nicht gefahrlos möglich ist (Methoden). Gleiche Syntax. */
  FAEHIGKEITEN: "BACKOFFICE_FAEHIGKEITEN",
};

/**
 * "mock" oder "frappe". Standard: mock, solange keine BACKOFFICE_FRAPPE_URL
 * gesetzt ist. BACKOFFICE_MODE überstimmt die Automatik.
 */
export function backofficeMode(env = process.env) {
  const explicit = (env[ENV.MODE] || "").trim().toLowerCase();
  if (explicit === "mock" || explicit === "frappe") return explicit;
  return env[ENV.FRAPPE_URL] ? "frappe" : "mock";
}

export function frappeUrl(env = process.env) {
  return (env[ENV.FRAPPE_URL] || "").replace(/\/+$/, "");
}

export function frappeServiceToken(env = process.env) {
  return env[ENV.FRAPPE_TOKEN] || "";
}

/**
 * Verzeichnis mit den ph_*-Apps (DocType-JSONs, Fixtures) für den Mock-/Dev-
 * Meta-Leser. Standard ../Backend-Import (relativ zu backoffice/). Im Frappe-
 * Modus wird der Ordner nicht gebraucht; fehlt er, bricht nichts.
 */
export function metaDir(env = process.env) {
  return env[ENV.META_DIR] || "../Backend-Import";
}

/**
 * Mock-Passwort: BACKOFFICE_MOCK_PASSWORD, in Entwicklung Rückfall "demo".
 * In Produktion gibt es keinen Rückfall – der Mock lehnt dann jede Anmeldung ab.
 */
export function mockPassword(env = process.env, production = IS_PRODUCTION) {
  const configured = env[ENV.MOCK_PASSWORD];
  if (configured) return configured;
  return production ? null : "demo";
}

const DEV_FALLBACK_SECRET = "dev-only-backoffice-secret-do-not-use-in-production-0000";
let warned = false;

/** false nur in Produktion ohne brauchbares Secret – dann gilt jede Sitzung als ungültig (fail-closed). */
export function hasSessionSecret(env = process.env, production = IS_PRODUCTION) {
  const secret = env[ENV.SESSION_SECRET];
  return !production || Boolean(secret && secret.length >= 32);
}

export function sessionSecret(env = process.env, production = IS_PRODUCTION) {
  const secret = env[ENV.SESSION_SECRET];
  if (secret && secret.length >= 32) return secret;
  if (production) {
    throw new Error("BACKOFFICE_SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen – Backoffice-Anmeldung deaktiviert.");
  }
  if (!warned) {
    warned = true;
    console.warn("[backoffice] BACKOFFICE_SESSION_SECRET nicht gesetzt – unsicherer Entwicklungs-Rückfall. In Produktion zwingend setzen.");
  }
  return DEV_FALLBACK_SECRET;
}

// ------------------------------------------------------------- Betrieb --
// Geschäftsentscheidungen des Inhabers (Q-A8) sind Einstellungen, keine Fähigkeiten. Jeder Wert ist der
// Standard aus MASTER § 8 bzw. dem Bereichskonzept, bis der Inhaber entscheidet (Spalte „Standard“ in
// 90-inhaber-fragen.md). Eine Entscheidung ändert genau einen Wert hier, nichts wird neu gebaut.

export const BETRIEB = Object.freeze({
  /** M-06: Standard-Dichte – kompakt bei feinem Zeiger, komfortabel bei Touch. */
  dichte: "automatisch",
  /** M-07: eine große Kopfzahl in Bodoni auf der GF-Zentrale. */
  bodoniKopfzahl: false,
  /** M-08: Tagesübersicht 07:00 per E-Mail. */
  tagesuebersichtMail: false,
  /** M-09 / K-34: Vier-Augen-Grenze in Cent (0 = immer zwei Personen). */
  vierAugenGrenzeCent: 0,
  /** M-10: Kundenmodus beenden – Langdruck plus PIN. */
  kundenmodusPin: true,
  /** M-11 / Q-A12: Auswertungen je Person, Zeitstempel je Stopp (Arbeitsrecht). */
  mitarbeiterauswertung: false,
  zeitstempelJeStopp: false,
  /** M-12: Kassa-Notbetrieb bei Netzausfall (aus = Kassa steht). */
  kassaNotbetrieb: false,
  /** M-13: Event-Check-in als eigene Arbeitsplatz-Kachel. */
  eventCheckinKachel: false,
  /** M-14: Kiosk-Rollen dürfen Aufgaben anlegen (sobald ph_core A1 liefert). */
  kioskAufgaben: true,
  /** M-16: Inkasso bei Montage/Technikereinsatz. */
  inkassoVorOrt: false,
  /** M-17: Firmen-Umschalter (zweite Firma). */
  firmenUmschalter: false,
  /** Kassa: Blind zählen beim Tagesabschluss. */
  blindzaehlung: true,
});

/**
 * Einstellung lesen: betrieb("vierAugenGrenzeCent"). Unbekannter Schlüssel → Fehler (Tippfehler sollen auffallen).
 * @param {keyof typeof BETRIEB} schluessel
 */
export function betrieb(schluessel) {
  if (!Object.prototype.hasOwnProperty.call(BETRIEB, schluessel)) throw new Error(`Unbekannte Betriebs-Einstellung: ${schluessel}`);
  return BETRIEB[schluessel];
}
