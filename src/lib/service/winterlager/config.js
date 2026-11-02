// src/lib/service/winterlager/config.js – EINE Konfigurationsdatei für den
// Service „Outdoor-Winterlager & Pflege“ (/[locale]/outdoor-winterservice).
//
// Inhaber-Auftrag 29.10.2026 (Entscheidung Nr. 13): Winterlager und Pflege für
// Outdoor-Möbel, einmal oder als Abo. Alles, was nur der Inhaber festlegen
// kann, steht HIER. Regel: leerer Wert ("" / null) = die Zeile wird auf der
// Seite NICHT gezeigt. Nichts wird geschätzt oder erfunden. Offene Punkte:
// Marktresearch/digital/features/service-inhaber-fragen.md (Abschnitt Winterlager).
//
// Rein, ohne React und ohne Pakete (node --test).

export const WINTERLAGER_CONFIG = Object.freeze({
  // Inhaber-Antwort 29.10.2026: Ein großes eigenes Lager ist vorhanden.
  // → Seite sagt „trocken in unserem eigenen Lager“.
  eigenesLager: true,
  // Inhaber-Antwort 29.10.2026: Platzhirsch holt selbst ab und bringt zurück.
  abholungDurchUns: true,
  // Inhaber-Antwort 29.10.2026: KEIN konkreter Radius. Text steht in copy.js
  // („im Umkreis von Lochau / Bodenseeraum auf Anfrage“). Eine Kilometerzahl
  // nur eintragen, wenn der Inhaber sie freigibt (Zahl, z. B. 40).
  radiusKm: null,

  // Anmeldeschluss der Saison als ISO-Datum "JJJJ-MM-TT" (Ortszeit Lochau).
  // Leer = kein Stichtag auf der Seite und KEIN Countdown.
  anmeldeschluss: "",
  // Zeiträume als freier Text je Sprache, z. B. { de: "Oktober bis November", en: "October to November" }.
  // Leer = Zeile entfällt (Ablauf spricht dann nur von „im Herbst“ / „im Frühling“).
  abholzeitraum: { de: "", en: "" },
  rueckgabezeitraum: { de: "", en: "" },

  // Preise: leer = „auf Anfrage“. Format frei als Text, z. B. "ab 190 € je Saison".
  // Nur mit Inhaber-Freigabe und belegter Preisliste befüllen (check:facts).
  preise: {
    einmal: { de: "", en: "" },
    abo: { de: "", en: "" },
  },

  // Abo-Bedingungen: leer = Zeile entfällt. Erst nach Kanzlei-Freigabe der
  // Abo-Bedingungen (Vorschlag: features/service-recht-vorschlag.md) befüllen.
  abo: {
    laufzeit: { de: "", en: "" },
    kuendigung: { de: "", en: "" },
    // Link zu freigegebenen Abo-Bedingungen (Pfad ohne Sprache), sonst leer.
    bedingungenPfad: "",
  },

  // Leistungen, die der Inhaber noch bestätigt. true = wird gezeigt.
  // Kleinreparatur: im Auftrag als „auf Anfrage“ genannt → true.
  kleinreparaturAufAnfrage: true,
  // Aufbau im Frühling „auf Wunsch“ (Auftrag 29.10.) → true.
  aufbauAufWunsch: true,
  // Versicherung der eingelagerten Möbel: offen (leer = keine Aussage).
  versicherung: { de: "", en: "" },

  // Suchmaschinen: erst indexieren, wenn Service-AGB/Abo-Bedingungen
  // freigegeben sind (Vorschlag in service-recht-vorschlag.md). Bis dahin noindex.
  indexieren: false,

  // Formular: Grenzen der Möbelliste.
  maxPositionen: 20,
  maxAnzahl: 99,
});

/** Sprachtext aus { de, en } (EN fällt NICHT auf DE zurück: leer bleibt leer). */
export function configText(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  const v = value[locale];
  return typeof v === "string" ? v.trim() : "";
}

/** true, wenn ein Wert gesetzt ist (Zeilen-Regel: leer = nicht rendern). */
export function hasValue(value, locale = "de") {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (value === true) return true;
  return configText(value, locale) !== "";
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Gültiges ISO-Datum (JJJJ-MM-TT) oder null. */
export function parseDeadline(value) {
  const m = typeof value === "string" ? value.trim().match(ISO_DATE) : null;
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return { y, mo, d, iso: m[0] };
}
