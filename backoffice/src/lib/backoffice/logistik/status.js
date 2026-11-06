// Status-Anzeige und Töne je DocType des Bereichs Logistik (10-konzept-logistik § 3.1).
// Gespeichert wird immer der App-Wert („Uebergeben“), angezeigt der Text mit Umlaut („Übergeben“).
// Töne = StatusBadge-Töne (grau → blau → tuerkis → orange → gruen; rot = Abbruch/Problem). Reines Modul.

export const TOENE = Object.freeze({
  "PH Lieferschein": { Entwurf: "grau", Gepackt: "blau", Uebergeben: "tuerkis", Zugestellt: "gruen", Storniert: "rot" },
  "PH Sendung": { Angelegt: "grau", Etikett: "blau", Unterwegs: "tuerkis", Zugestellt: "gruen", Problem: "rot", Storniert: "rot" },
  "PH Tour": { Geplant: "grau", Freigegeben: "blau", Unterwegs: "tuerkis", Abgeschlossen: "gruen", Abgebrochen: "rot" },
  "PH Tour Stopp": { offen: "grau", unterwegs: "tuerkis", erledigt: "gruen", "nicht angetroffen": "rot", verschoben: "orange" },
  "PH Speditionsauftrag": { Entwurf: "grau", Gesendet: "blau", Bestaetigt: "blau", Abgeholt: "tuerkis", Zugestellt: "gruen", Storniert: "rot" },
  "PH Warenruecknahme": { Angemeldet: "grau", Angenommen: "blau", Geprueft: "tuerkis", Abgeschlossen: "gruen", Storniert: "rot" },
  "PH Lagerbestand": { Verfuegbar: "gruen", Reserviert: "orange", Kommission: "blau", Gesperrt: "rot", Verkauft: "grau", Ausgeschieden: "grau" },
  "PH Inventur": { Geplant: "grau", Laufend: "orange", Abgeschlossen: "gruen", Verworfen: "grau" },
  "PH Lagerbewegung": { Gebucht: "grau", Storniert: "grau" },
  "PH Inventurbewertung": { Entwurf: "grau", Festgeschrieben: "gruen", Verworfen: "grau" },
  "PH Bestellvorschlag": { Offen: "orange", Bestellt: "blau", Erledigt: "gruen", Verworfen: "grau" },
  "PH Meldebestand": { Aktiv: "gruen", Inaktiv: "grau" },
});

/** Anzeige-Texte, wo sie vom App-Wert abweichen (Umlaut oder Arbeitsschritt statt Datensatz). */
const TEXTE = Object.freeze({
  "PH Sendung": { Angelegt: "Ohne Etikett", Etikett: "Etikett bereit" },
  "PH Tour Stopp": { offen: "Offen", unterwegs: "Unterwegs", erledigt: "Erledigt", "nicht angetroffen": "Nicht angetroffen", verschoben: "Verschoben" },
});

const UMLAUTE = Object.freeze({ Uebergeben: "Übergeben", Verfuegbar: "Verfügbar", Bestaetigt: "Bestätigt", Geprueft: "Geprüft" });

/** Ton für StatusBadge. */
export function statusTon(doctype, status) {
  return TOENE[doctype]?.[status] || "grau";
}

/**
 * Anzeigetext eines Status. Lieferschein „Zugestellt“ bei Abholung heißt „Abgeholt“ (§ 1.1).
 * @param {string} doctype
 * @param {string} status
 * @param {{lieferart?:string}} [doc]
 */
export function statusText(doctype, status, doc) {
  if (!status) return "";
  if (doctype === "PH Lieferschein" && status === "Zugestellt" && doc?.lieferart === "Abholung") return "Abgeholt";
  return TEXTE[doctype]?.[status] || UMLAUTE[status] || status;
}

/** Ton-Tabelle für DataTable/Kanban (`statusTon`-Prop). */
export function toeneFuer(doctype) {
  return { ...(TOENE[doctype] || {}) };
}

/** Reihenfolge für Phasenleiste und Sortierung (ohne Abbruch-Status). */
export const PHASEN = Object.freeze({
  "PH Lieferschein": ["Entwurf", "Gepackt", "Uebergeben", "Zugestellt"],
  "PH Sendung": ["Angelegt", "Etikett", "Unterwegs", "Zugestellt"],
  "PH Tour": ["Geplant", "Freigegeben", "Unterwegs", "Abgeschlossen"],
  "PH Speditionsauftrag": ["Entwurf", "Gesendet", "Bestaetigt", "Abgeholt", "Zugestellt"],
  "PH Warenruecknahme": ["Angemeldet", "Angenommen", "Geprueft", "Abgeschlossen"],
  "PH Inventur": ["Geplant", "Laufend", "Abgeschlossen"],
  "PH Inventurbewertung": ["Entwurf", "Festgeschrieben"],
});

const ABBRUCH = new Set(["Storniert", "Abgebrochen", "Verworfen"]);

/**
 * Schritte für die Vorgangsleiste (kompakt): erledigt · aktuell · offen.
 * @returns {Array<{id:string, titel:string, zustand:"erledigt"|"aktuell"|"offen"}>}
 */
export function phasenSchritte(doctype, status, doc) {
  const phasen = PHASEN[doctype] || [];
  const i = phasen.indexOf(status);
  return phasen.map((p, k) => ({
    id: p,
    titel: statusText(doctype, p, doc),
    zustand: ABBRUCH.has(status) ? "offen" : k < i ? "erledigt" : k === i ? (k === phasen.length - 1 ? "erledigt" : "aktuell") : "offen",
  }));
}

/** Rang für Sortierung nach Status (Entwurf zuerst). */
export function statusRang(doctype, status) {
  const i = (PHASEN[doctype] || []).indexOf(status);
  return i < 0 ? 99 : i;
}

export function istAbbruch(status) {
  return ABBRUCH.has(status);
}

/** Lieferart: Icon (lucide-Name) + Wort – Icons immer mit Text (§ 3.5). */
export const LIEFERART = Object.freeze({
  Versand: { icon: "Package", text: "Versand" },
  Abholung: { icon: "Store", text: "Abholung" },
  Eigenlieferung: { icon: "Truck", text: "Eigenlieferung" },
  Spedition: { icon: "Container", text: "Spedition" },
});

export function lieferartText(lieferart) {
  return LIEFERART[lieferart]?.text || lieferart || "–";
}

/** Bewegungsart mit Richtungszeichen (Journal § 4.12). */
export const BEWEGUNGSART = Object.freeze({
  Wareneingang: { zeichen: "+", text: "Wareneingang" },
  Verkauf: { zeichen: "−", text: "Verkauf" },
  Umlagerung: { zeichen: "↔", text: "Umlagerung" },
  Inventur: { zeichen: "±", text: "Inventur" },
  Retoure: { zeichen: "+", text: "Retoure" },
  Ausbuchung: { zeichen: "−", text: "Ausbuchung" },
  Reservierung: { zeichen: "·", text: "Reservierung" },
  Freigabe: { zeichen: "·", text: "Freigabe" },
});

/** Anzeige von App-Werten in Auswahlfeldern (Gründe, Zustände). */
const WERTE = Object.freeze({
  Beschaedigt: "Beschädigt",
  "Kunde Rueckfrage": "Kunde Rückfrage",
  Zaehlfehler: "Zählfehler",
  Ausstellungsstueck: "Ausstellungsstück",
  Kundenrueckgabe: "Kundenrückgabe",
  Anhaenger: "Anhänger",
});

export function wertText(wert) {
  if (wert === null || wert === undefined) return "";
  return WERTE[wert] || UMLAUTE[wert] || String(wert);
}
