// Feld-Allowlist je Rolle (Konzept §2.2, K32): gefiltert wird auf dem Server, **bevor** etwas serialisiert
// wird – Ausblenden in der Oberfläche gilt nicht als Schutz. Reines Modul (Unit-Test), genutzt von daten.js.

import { darfBetraege, monatJahr } from "./regeln.js";

/** Felder, die den Server nie verlassen (alle Rollen). */
const NIE = ["ip_hash", "idempotency_key", "doi_token_hash", "kunden_token_hash", "portal_token_hash"];
/** Zusätzlich für Mitarbeitende gesperrt (Zweckbindung, permlevel 1). */
const KARTE_OHNE_BETRAG = ["jahresumsatz_cent", "gesamtumsatz_cent", "umsatz_berechnet_am", "notizen_intern"];
const ANTRAG_INTERN = ["notizen_intern"];

function ohne(doc, felder) {
  if (!doc || typeof doc !== "object") return doc;
  const out = { ...doc };
  for (const f of felder) delete out[f];
  return out;
}

/** Karte für die Rolle: Mitarbeitende ohne Beträge/Intern; letzter Einkauf nur als Monat; ohne Einwilligung nie Umsatz. */
export function filtereKarte(doc, rolle) {
  if (!doc) return doc;
  let out = ohne(doc, NIE);
  const mitEinwilligung = Number(doc.einwilligung_auswertung) === 1;
  if (!darfBetraege(rolle)) {
    out = ohne(out, KARTE_OHNE_BETRAG);
    out.letzter_einkauf_monat = mitEinwilligung ? monatJahr(doc.letzter_einkauf) : null;
    delete out.letzter_einkauf;
  } else {
    out.letzter_einkauf_monat = mitEinwilligung ? monatJahr(doc.letzter_einkauf) : null;
    if (!mitEinwilligung) {
      out.jahresumsatz_cent = null;
      out.gesamtumsatz_cent = null;
      out.letzter_einkauf = null;
    }
  }
  if (rolle === "gf") delete out.notizen_intern; // GF liest Intern nur, wenn Frappe permlevel 1 freigibt – Next zeigt es nicht.
  return out;
}

/** Antrag: nie Hashes; Mitarbeitende ohne interne Notiz. `liste` = ohne E-Mail/Telefon (E-Mail nur in der Akte). */
export function filtereAntrag(doc, rolle, { liste = false } = {}) {
  if (!doc) return doc;
  let out = ohne(doc, NIE);
  if (rolle !== "leitung") out = ohne(out, ANTRAG_INTERN);
  if (liste) out = ohne(out, ["email", "telefon", "nachricht", "nachweis", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "klick_id"]);
  return out;
}

/** Felder einer Listenzeile Karte (§3.4) – nur diese werden abgefragt. */
export const KARTEN_LISTENFELDER = Object.freeze(["name", "kartennummer", "kunde_name", "kontakt", "status", "stufe", "stufe_seit", "stufe_manuell", "persoenlicher_berater", "letzter_einkauf", "einwilligung_auswertung", "sperrgrund_art", "sperrgrund", "gesperrt_am", "ausgestellt_am", "kanal", "modified", "wallet_pass_aktualisiert", "creation"]);
export const KARTEN_LISTENFELDER_BETRAG = Object.freeze([...KARTEN_LISTENFELDER, "jahresumsatz_cent"]);

export const ANTRAG_LISTENFELDER = Object.freeze(["name", "titel", "status", "quelle", "eingang", "kontakt", "kundenkarte", "doi_noetig", "bestaetigt_am", "vorname", "nachname", "plz", "ort", "doppelt_zu", "entschieden_am", "entscheidung_grund"]);

/** Einlösung: Kommentar bleibt, nie Schlüssel. */
export function filtereEinloesung(doc) {
  return ohne(doc, NIE);
}

/** Leert Euro-Spalten eines Berichts für Nicht-Leitung (bis Report P15 serverseitig, §3.8). */
export function filtereBerichtZeilen(zeilen = [], rolle, euroSpalten = []) {
  if (darfBetraege(rolle)) return zeilen;
  return zeilen.map((z) => ohne(z, euroSpalten));
}

/** Einzelfelder, die per „sofort + Undo“ gesetzt werden dürfen (§3.5.3, Action feldSetzen). */
export const SOFORT_FELDER = Object.freeze(["persoenlicher_berater", "kanal", "geburtstag_tag_monat"]);
