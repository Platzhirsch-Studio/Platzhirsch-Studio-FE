// src/lib/wunschliste/config.js — feste Werte der teilbaren Wunschliste
// (Service 10, Inhaber-Entscheidung Nr. 13 vom 29.10.2026).
// Keine "@/..."-Importe und kein "server-only": Client, Server und
// `node --test` nutzen dieselben Werte.
//
// WUNSCHLISTE_INHABER: alle Werte, die nur der Inhaber festlegen kann.
// Regel aller Service-Teams: leer ("" oder null) = die Zeile wird NICHT
// gerendert, es steht nie ein Platzhalter auf der Seite. Die Fragen dazu
// stehen in Marktresearch/digital/features/service-inhaber-fragen.md
// (Abschnitt „Wunschliste“).

export const WUNSCHLISTE_INHABER = Object.freeze({
  // Angebot für Schenkende im Café, z. B. „Der Kaffee geht auf uns.“
  // Leer = nur die neutrale Einladung („gemeinsam aussuchen“) erscheint.
  cafeOffer: { de: "", en: "", fr: "", it: "" },
  // Mindestbetrag eines Beitrags zum Gemeinschafts-Gutschein in Euro.
  // null = keine Zahl auf der Seite; technisch gilt die Untergrenze des
  // Gutscheins (AMOUNT_MIN in src/lib/commerce/voucherConfig.js) erst im
  // Kauf. Im Anfrage-Weg ist der Betrag nur ein Vorschlag.
  contributionMin: null,
  // Persönliche Ansprechperson für Wunschlisten (Name, wie auf der Team-Seite).
  // Leer = Zeile entfällt, es bleibt Telefon/E-Mail des Studios.
  contactPerson: "",
  // Speicherdauer nach dem Anlass bzw. nach dem Erstellen in Monaten.
  // null = technischer Standard RETENTION_DEFAULT_MONTHS (siehe unten).
  // Kanzlei/Inhaber bestätigen die Frist (service-recht-vorschlag.md).
  retentionMonths: null,
});

// Gemeinschafts-Gutschein (QA Recht P1-4, QA Technik P1-3, 29.10.2026):
// Der Online-Kauf („stripe“) für Wunschlisten öffnet sich NICHT allein über
// VOUCHER_MODE. Zusätzlich müssen
//   - die Ergänzung B der Gutscheinbedingungen (Gemeinschafts-Gutschein:
//     Inhaberschaft, Widerruf nach dem Zusammenfassen, Barablöse) von der
//     Kanzlei freigegeben sein (service-recht-vorschlag.md, Wunschliste B) und
//   - die Kaufstrecke die Beiträge zuordnen (checkoutMetadata() in
//     src/lib/payments/voucherOrder.js + applyPaidEvent() im Stripe-Webhook).
// Bis beides erledigt ist, bleibt der Anfrage-Weg (mode.js contributionChannel).
export const GEMEINSCHAFTS_GUTSCHEIN = Object.freeze({
  bedingungenStatus: "entwurf", // "freigegeben" erst nach Kanzlei-Freigabe von Ergänzung B
  stripeAngebunden: false, // true erst, wenn voucherOrder.js + Webhook die Beiträge zuordnen
});

// Datenschutzerklärung (QA Recht P1-6): Die Abschnitte „Wunschliste“ für
// /datenschutz liegen nur als Vorschlag vor (service-recht-vorschlag.md,
// Wunschliste A). Solange sie nicht freigegeben und eingefügt sind, ist die
// Wunschliste in PRODUKTION aus (mode.js wunschlisteAvailable). In der
// Entwicklung bleibt sie an. Nach Einfügen in die DSE: "freigegeben".
export const DATENSCHUTZ_WUNSCHLISTE = "entwurf";

// Meldeadresse für Missbrauch auf einer geteilten Liste (QA Technik P2-3):
// Schenkende melden per E-Mail, das Studio sperrt die Liste (Widerruf über
// den Datensatz, siehe wunschliste-bau.md „Sperre durch das Studio“).
export const REPORT_EMAIL = "info@platzhirsch.studio";

// Technischer Standard, bis die Frist bestätigt ist: 12 Monate nach dem
// Anlass, ohne Datum 12 Monate nach dem Erstellen. Danach antwortet der Link
// mit 404 und der Datensatz wird beim nächsten Zugriff gelöscht.
export const RETENTION_DEFAULT_MONTHS = 12;
export const retentionMonths = () => WUNSCHLISTE_INHABER.retentionMonths || RETENTION_DEFAULT_MONTHS;

export const OCCASIONS = Object.freeze(["einzug", "hochzeit", "geburtstag", "frei"]);

export const LIMITS = Object.freeze({
  items: 60,
  title: 90,
  message: 600,
  name: 80,
  note: 300,
  email: 254,
  contributionMax: 5000, // gleich AMOUNT_MAX der Gutscheine, Schutz vor Tippfehlern
  // Lebensdauer eines Reservierungs-Schlüssels im Browser: unbegrenzt bis
  // die Liste abläuft (liegt nur im localStorage der Schenkenden).
});

// Länge der geheimen Kennungen: 24 Byte Zufall = 192 Bit, base64url 32 Zeichen.
// Erraten ist praktisch ausgeschlossen; Rate-Limits bremsen zusätzlich.
export const TOKEN_BYTES = 24;
export const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
// Verwaltungsschlüssel: "<listId>.<secret>", beide 32 Zeichen.
export const ADMIN_TOKEN_RE = /^[A-Za-z0-9_-]{32}\.[A-Za-z0-9_-]{32}$/;

// Lokaler Speicher im Browser (nur Komfort, nie die einzige Kopie):
//  - ADMIN_STORAGE_KEY: Verwaltungslinks der Listen, die dieser Browser
//    erstellt hat (die Merkliste zeigt „Ihre geteilten Wunschlisten“).
//  - RESERVATION_STORAGE_KEY: Storno-Schlüssel eigener Reservierungen.
export const ADMIN_STORAGE_KEY = "ph-wunschliste-admin";
export const RESERVATION_STORAGE_KEY = "ph-wunschliste-reserviert";

/** Nur interne Bildpfade (wie wishlistImageSrc in CartContext), sonst kein Bild. */
const IMAGE_RE = /^\/(?:cmx|cms|Images|ezarri)\/[A-Za-z0-9._~%\-/ ()]+$/;
const BARE_FILES_RE = /^\/files\/[A-Za-z0-9._~%\-/ ()]+$/;
export function safeImage(image) {
  if (typeof image !== "string" || image.length > 400 || image.includes("..")) return null;
  if (IMAGE_RE.test(image)) return image;
  if (BARE_FILES_RE.test(image)) return `/cms${image}`;
  return null;
}

/** Nur relative interne Links ("/produkte/…"), keine fremden Ziele. */
export function safeHref(href) {
  if (typeof href !== "string" || href.length > 300) return null;
  if (!/^\/[A-Za-z0-9._~%\-/?=&]*$/.test(href) || href.startsWith("//") || href.includes("..")) return null;
  return href;
}
