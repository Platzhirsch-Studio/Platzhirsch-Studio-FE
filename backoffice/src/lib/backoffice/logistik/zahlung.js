// Anzahlungs- und Bezahlt-Prüfung (10-konzept-logistik E10, E11, § 6.3). Strengste Variante als Standard
// (Schalter `anzahlungHart`): offene Anzahlung sperrt Tour-Freigabe, Übergeben und Abholung ausgeben;
// Leitung/GF überschreibt mit Pflichtgrund (als Kommentar, bis Felder A5 existieren). Kein Bargeld-Feld. Reines Modul.

/** @param {{anzahlung_soll_cent?:number, anzahlung_ist_cent?:number, offen_cent?:number, waehrung?:string}|null} ab */
export function anzahlungStatus(ab) {
  if (!ab) return { offen: false, sollCent: 0, istCent: 0, fehltCent: 0, offenCent: 0, waehrung: "EUR" };
  const soll = Number(ab.anzahlung_soll_cent || 0);
  const ist = Number(ab.anzahlung_ist_cent || 0);
  return { offen: soll > 0 && ist < soll, sollCent: soll, istCent: ist, fehltCent: Math.max(0, soll - ist), offenCent: Number(ab.offen_cent || 0), waehrung: ab.waehrung || "EUR" };
}

/** Shop-Bestellung: bezahlt nur mit `bezahlt_am`. */
export function bezahltStatus(bestellung) {
  if (!bestellung) return { bezahlt: true, offenCent: 0 };
  return { bezahlt: !!bestellung.bezahlt_am && Number(bestellung.offen_cent || 0) <= 0, offenCent: Number(bestellung.offen_cent || 0) };
}

/**
 * Sperre für Übergeben, Tour-Freigabe und Ausgeben.
 * @param {{lieferschein?:object, ab?:object|null, bestellung?:object|null, schalter?:{anzahlungHart?:boolean}, aktion?:"uebergeben"|"freigeben"|"ausgeben"}} p
 * @returns {{gesperrt:boolean, art:null|"anzahlung"|"bezahlung", fehltCent:number, text:string}}
 */
export function zahlungsSperre({ ab = null, bestellung = null, schalter = { anzahlungHart: true }, aktion = "uebergeben" } = {}) {
  const a = anzahlungStatus(ab);
  if (a.offen) {
    return {
      gesperrt: schalter.anzahlungHart !== false,
      art: "anzahlung",
      fehltCent: a.fehltCent,
      text: schalter.anzahlungHart !== false ? "Anzahlung offen – Freigabe nur Leitung mit Grund" : "Anzahlung offen – bitte prüfen",
    };
  }
  if (aktion === "ausgeben") {
    if (bestellung) {
      const b = bezahltStatus(bestellung);
      if (!b.bezahlt) return { gesperrt: true, art: "bezahlung", fehltCent: b.offenCent, text: "Noch nicht bezahlt – zuerst an der Kassa" };
    } else if (ab && Number(ab.offen_cent || 0) > 0) {
      return { gesperrt: true, art: "bezahlung", fehltCent: Number(ab.offen_cent), text: "Offen laut AB – zuerst an der Kassa" };
    }
  }
  return { gesperrt: false, art: null, fehltCent: 0, text: "" };
}

/** Override: nur Leitung/GF, Grund ≥ 5 Zeichen. */
export function pruefeOverride({ leitung, grund }) {
  if (!leitung) return { ok: false, code: "forbidden", message: "Überschreiben darf nur die Leitung." };
  if (String(grund || "").trim().length < 5) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben (mindestens 5 Zeichen).", fehler: { grund: "Grund fehlt" } };
  return { ok: true };
}

/** Warenwert nur in Euro anzeigen; Fremdwährung der AB → Hinweistext statt Betrag (QA 20). */
export function warenwertAnzeige(lieferschein, ab) {
  const w = ab?.waehrung && ab.waehrung !== "EUR" ? ab.waehrung : null;
  if (w) return { cent: null, text: `in ${w} – siehe AB` };
  return { cent: Number(lieferschein?.warenwert_cent || 0), text: null };
}

/** Ausfuhr/innergemeinschaftlich steuerfrei → Steuernachweis nötig. */
export function steuernachweisNoetig(ab) {
  const f = String(ab?.ust_fall || "").toLowerCase();
  return f.includes("ausfuhr") || f.includes("innergemeinschaft") || f.includes("steuerfrei");
}
