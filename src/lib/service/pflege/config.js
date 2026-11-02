// src/lib/service/pflege/config.js – Pflege-Service Leder, Stoff, Holz (Service Nr. 4).
//
// DIE EINE KONFIGURATIONSDATEI für alle Werte, die nur der Inhaber festlegen
// kann (Inhaber-Entscheidung Nr. 13, 29.10.2026: Preise, Einsatzgebiet,
// Leistungsumfang im Detail sind offen).
//
// Regel: Ein leerer Wert ("" / null / []) heißt „noch nicht festgelegt“. Die
// zugehörige Zeile wird dann NICHT gerendert (kein Platzhalter auf der Seite).
// Preise stehen bis zur Festlegung als „auf Anfrage“ da – nie geschätzt.
// Gesammelte Fragen: Marktresearch/digital/features/service-inhaber-fragen.md
//
// Keine "@/..."-Importe: node --test lädt die Datei direkt.

export const PFLEGE_CONFIG = Object.freeze({
  // ── Preise (leer = „auf Anfrage“) ────────────────────────────────────────
  /** Preis je Pflegetermin, z. B. "ab 190 € je Termin". Leer = „auf Anfrage“. */
  preisTermin: "",
  /** Preis des Jahres-Abos, z. B. "ab 240 € im Jahr". Leer = „auf Anfrage“. */
  preisAbo: "",
  /** Anfahrt, z. B. "Anfahrt im Rheintal inklusive". Leer = Zeile entfällt. */
  anfahrt: "",

  // ── Einsatzgebiet (leer = Zeile entfällt) ────────────────────────────────
  /** z. B. "Vorarlberg, Bodensee-Ufer bis Lindau und Rheintal". */
  einsatzgebiet: "",

  // ── Ausführung (leer = Zeile entfällt) ───────────────────────────────────
  /** Wer pflegt? z. B. "unser Polsterer-Team" oder Partnerbetrieb mit Befugnis. */
  ausfuehrung: "",
  /**
   * Ausbesserungen und Farbauffrischung als Leistung zeigen? Erst true, wenn
   * Kanzlei/WKO die Gewerbefrage (Frage E, service-recht-vorschlag.md)
   * beantwortet haben und feststeht, wer ausführt (eigene Befugnis oder
   * befugter Partnerbetrieb, dann auch `ausfuehrung` setzen). QA Recht P1-3.
   */
  ausbesserungenFreigegeben: false,

  // ── Abo-Bedingungen (leer = Zeile entfällt) ──────────────────────────────
  /** Mindestlaufzeit, z. B. "12 Monate". */
  mindestlaufzeit: "",
  /** Kündigung, z. B. "jederzeit zum Ende des Abo-Jahres, per E-Mail". */
  kuendigung: "",
  /** Intervall in Monaten (Grundstruktur laut Auftrag: jährlich). */
  intervallMonate: 12,
  /** Erinnerung so viele Tage vor dem fälligen Termin (Frappe-Scheduler). */
  erinnerungTageVorher: 42,

  // ── Pflegeprodukte zum Nachkaufen (leer = allgemeiner Satz, keine Liste) ──
  /** z. B. [{ name: "Lederpflege für Anilinleder", material: "leder" }]. Nie mit Preis. */
  pflegeprodukte: [],

  // ── Verknüpfungen ────────────────────────────────────────────────────────
  /**
   * Pfad des Online-Termins (Team Termin, /[locale]/termin). Leer = kein Link.
   * Der Link erscheint zusätzlich nur, wenn der Kalender nicht „off“ ist
   * (src/lib/booking/config.js terminMode()).
   */
  // Heute leer: /[locale]/termin ist noch nicht integriert (Team Termin). Bei der
  // Integration auf "/termin" setzen, dann erscheint der Link automatisch.
  // Integration 29.10.2026: /[locale]/termin ist ausgeliefert (Team Termin);
  // der Link erscheint nur, wenn terminMode() nicht „off“ ist.
  terminPfad: "/termin",
  /** Query für den Termin (Termin vor Ort). */
  terminQuery: "art=vor_ort&anlass=pflege",
  /** Pflege-Ratgeber (DE). Wird nur verlinkt, nicht kopiert. */
  ratgeberPfad: "/ratgeber/designmoebel-pflegen-leder-stoff-holz",

  // ── Indexierung ──────────────────────────────────────────────────────────
  /** Bis Preise/Einsatzgebiet/Recht geklärt sind: noindex (Seite ist erreichbar). */
  indexieren: false,
});

/** Ist ein Konfigurationswert gesetzt? (leer = nicht rendern) */
export function gesetzt(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/**
 * Zeilen der Konditionen-Liste: nur gesetzte Werte, Preise mit Fallback.
 * @param {"de"|"en"} locale
 * @param {Record<string,string>} labels  Beschriftungen aus copy.js (KONDITIONEN)
 * @param {object} [config]
 * @returns {Array<{key:string, label:string, value:string}>}
 */
export function konditionenZeilen(labels, config = PFLEGE_CONFIG) {
  const rows = [
    { key: "preisTermin", value: gesetzt(config.preisTermin) ? config.preisTermin : labels.aufAnfrage },
    { key: "preisAbo", value: gesetzt(config.preisAbo) ? config.preisAbo : labels.aufAnfrage },
    { key: "anfahrt", value: config.anfahrt },
    { key: "einsatzgebiet", value: config.einsatzgebiet },
    { key: "ausfuehrung", value: config.ausfuehrung },
    { key: "mindestlaufzeit", value: config.mindestlaufzeit },
    { key: "kuendigung", value: config.kuendigung },
  ];
  return rows.filter((r) => gesetzt(r.value)).map((r) => ({ ...r, label: labels[r.key] }));
}
