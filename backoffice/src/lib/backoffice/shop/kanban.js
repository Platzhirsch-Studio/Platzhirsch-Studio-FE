// Kanban-Regeln Bestellungen (10-konzept-shop § 4.4): nur Dokumentmethoden, nie generisches Setzen. Rein.

import { offen } from "./geld.js";
import { T } from "./texte.js";

export const BAHNEN = Object.freeze({
  versand: ["offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "versendet"],
  abholung: ["reserviert", "bezahlt", "abholbereit", "abgeholt"],
});

/** Zielspalte „Abschließen“ (nur beim Ziehen sichtbar). */
export const ABSCHLIESSEN = "__abschliessen";

/**
 * Erlaubter Zug? → { ok:true, aktion } | { ok:false, grund }
 * @param {object} karte  Bestellung (status, lieferart, offen_cent …)
 * @param {string} nach   Zielstatus oder ABSCHLIESSEN
 * @param {{leitung?:boolean}} [ctx]
 */
export function zug(karte, nach, ctx = {}) {
  const von = karte.status;
  if (von === nach) return { ok: false, grund: "" };
  const bezahlt = offen(karte) === 0;
  if (von === "bezahlt" && nach === "versandbereit" && karte.lieferart === "versand") return { ok: true, aktion: "packen" };
  if (von === "versandbereit" && nach === "versendet") return { ok: true, aktion: "versendet" };
  if ((von === "bezahlt" || von === "reserviert") && nach === "abholbereit" && karte.lieferart === "abholung") {
    return bezahlt ? { ok: true, aktion: "abholbereit" } : { ok: false, grund: T.kanbanVerboten.erstZahlung };
  }
  if (von === "abholbereit" && nach === "abgeholt") return bezahlt ? { ok: true, aktion: "uebergeben" } : { ok: false, grund: T.kanbanVerboten.erstZahlung };
  if ((von === "versendet" || von === "abgeholt") && nach === ABSCHLIESSEN) return { ok: true, aktion: "abschliessen" };
  if (von === "pruefen" && nach === "bezahlt") return ctx.leitung ? { ok: true, aktion: "geprueft" } : { ok: false, grund: T.kanbanVerboten.nurLeitung };
  if (von === "bezahlt" && nach === "versendet") return { ok: false, grund: T.kanbanVerboten.ersterPacken };
  return { ok: false, grund: T.kanbanVerboten.keinUebergang(anzeigeKurz(von), anzeigeKurz(nach)) };
}

/** Alle erlaubten Ziele einer Karte (Menü „Verschieben nach …“, Tastatur). */
export function ziele(karte, spalten, ctx = {}) {
  return [...spalten, ABSCHLIESSEN].filter((s) => zug(karte, s, ctx).ok);
}

function anzeigeKurz(s) {
  return { offen: "Offen", zahlung_ausstehend: "Zahlung unterwegs", bezahlt: "Bezahlt", versandbereit: "Versandbereit", versendet: "Versendet", reserviert: "Reserviert", abholbereit: "Abholbereit", abgeholt: "Abgeholt", pruefen: "Prüfen", [ABSCHLIESSEN]: "Abschließen" }[s] || s;
}

/** Spalten je Bahn; „Prüfen“ immer, wenn Karten darin sind. */
export function spaltenFuer(bahn, karten) {
  const basis = bahn === "abholung" ? BAHNEN.abholung : bahn === "versand" ? BAHNEN.versand : [...new Set([...BAHNEN.versand, ...BAHNEN.abholung])];
  const gefiltert = karten.filter((k) => (bahn === "alle" ? true : bahn === "abholung" ? k.lieferart === "abholung" : k.lieferart !== "abholung"));
  const spalten = basis.map((status) => ({ status, karten: gefiltert.filter((k) => k.status === status) }));
  const pruefen = gefiltert.filter((k) => k.status === "pruefen");
  return pruefen.length ? [{ status: "pruefen", karten: pruefen }, ...spalten] : spalten;
}
