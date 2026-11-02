// src/lib/ideenboard/config.js — feste Werte des Ideenboards
// (Inhaber-Entscheidung Nr. 14, 29.10.2026).
// Keine "@/..."-Importe und kein "server-only": Client, Server und
// `node --test` nutzen dieselben Werte.
//
// Datenschutz (DSGVO): Das Board liegt im localStorage des Browsers
// (STORAGE_KEY), geschrieben erst mit einem Klick auf „Zum Ideenboard“.
// Auf den Server kommt es nur mit „Teilen-Link erstellen“ – dann als Kopie
// OHNE personenbezogene Felder (keine Namen, E-Mail, Telefon; Notizen sind
// Freitext und werden vor dem Teilen gezeigt). Teilen-Link geheim (192 Bit),
// widerrufbar, Seite noindex, Löschung RETENTION_MONTHS nach der letzten
// Änderung. Gleiches Schema wie die Wunschliste (src/lib/wunschliste/ids.js).

export const CARD_TYPES = Object.freeze(["moebel", "raumbild", "ezarri", "ezarriMix", "stil", "projekt", "notiz"]);

export const LIMITS = Object.freeze({
  cards: 60,
  title: 140,
  subtitle: 140,
  note: 500,
  quelle: 60,
  room: 60,
  href: 1600,
  image: 400,
  body: 96 * 1024, // JSON des ganzen Boards
});

// Technischer Standard bis zur Bestätigung durch Kanzlei/Inhaber (wie
// Wunschliste): 12 Monate nach der letzten Änderung, dann 404 und Löschung.
export const RETENTION_MONTHS = 12;

export const TOKEN_BYTES = 24;
export const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
export const ADMIN_TOKEN_RE = /^[A-Za-z0-9_-]{32}\.[A-Za-z0-9_-]{32}$/;

// Browser-Speicher (nur Komfort; die geteilte Fassung lebt auf dem Server).
export const STORAGE_KEY = "ph-ideenboard";
export const SHARE_STORAGE_KEY = "ph-ideenboard-teilen";
export const CHANGE_EVENT = "ph-ideenboard";

// Query-Parameter, mit dem der Termin (bzw. die Beratungsanfrage) das Board
// bekommt: /<locale>/termin?ideenboard=<shareId>. Übergabe-Notiz:
// Marktresearch/digital/features/ideenboard-anbindung.md
export const TERMIN_PARAM = "ideenboard";

/** Nur interne Bildpfade (wie wunschliste safeImage), sonst kein Bild. */
const IMAGE_RE = /^\/(?:cmx|cms|Images|ezarri|arbeitsweise|projekte|stil-palette|api\/portal\/tagebuch\/referenz)\/[A-Za-z0-9._~%\-/ ()]+$/;
const BARE_FILES_RE = /^\/files\/[A-Za-z0-9._~%\-/ ()]+$/;
export function safeImage(image) {
  if (typeof image !== "string" || image.length > LIMITS.image || image.includes("..")) return null;
  if (IMAGE_RE.test(image)) return image;
  if (BARE_FILES_RE.test(image)) return `/cms${image}`;
  return null;
}

/** Nur relative interne Links ("/de/ezarri/…?k=…"), keine fremden Ziele. */
export function safeHref(href) {
  if (typeof href !== "string" || href.length > LIMITS.href) return null;
  if (!/^\/[A-Za-z0-9._~%\-/?=&#,]*$/.test(href) || href.startsWith("//") || href.includes("..")) return null;
  return href;
}
