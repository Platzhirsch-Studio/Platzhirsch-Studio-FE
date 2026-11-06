// „Operative Fakten schieben die Phase“ (10-konzept-projekte.md E4, § 7.1). Kaufmännische/rechtliche Schritte nie
// automatisch: Beauftragen, Bestellen, Abschließen bleiben bei Menschen. Reines Modul.

import { PHASEN, statusText } from "./texte.js";

const MONTAGE_LAEUFT = new Set(["In Arbeit", "Erledigt", "Abgenommen"]);
const ABNAHME_UNTERZEICHNET = new Set(["Unterzeichnet", "Mit Maengeln", "Abgeschlossen"]);

/**
 * Ein Schritt, den die Fakten verlangen – oder null.
 * @param {{projekt:{status:string}, montagen?:object[], positionen?:object[], abnahmen?:object[], lieferscheine?:object[]}} m
 * @returns {{aktion:string, ziel:string, fakt:string, grund:string}|null}
 */
export function phaseSchieben(m) {
  const status = m?.projekt?.status;
  if (status === "Lieferung") {
    const lauf = (m.montagen || []).find((x) => MONTAGE_LAEUFT.has(x.status));
    if (lauf) return { aktion: "Montieren", ziel: "Montage", fakt: `Montage ${lauf.status === "In Arbeit" ? "läuft" : "ist fertig"}`, grund: `Montageauftrag ${lauf.name} ist „${statusText("PH Montageauftrag", lauf.status)}“.` };
  }
  if (status === "Bestellung") {
    const pos = (m.positionen || []).filter((p) => p.lieferstatus !== "storniert");
    const allesDa = pos.length > 0 && pos.every((p) => p.lieferstatus === "geliefert" || p.lieferstatus === "montiert");
    const ls = m.lieferscheine || [];
    const zugestellt = ls.length > 0 && ls.every((l) => /zugestellt|geliefert|übergeben|uebergeben/i.test(l.status || ""));
    if (allesDa || zugestellt) return { aktion: "Liefern", ziel: "Lieferung", fakt: "Alle Positionen geliefert", grund: allesDa ? "Alle Positionen sind geliefert." : "Alle Lieferscheine sind zugestellt." };
  }
  if (status === "Montage") {
    const abn = (m.abnahmen || []).find((a) => ABNAHME_UNTERZEICHNET.has(a.status));
    if (abn) return { aktion: "Übergeben", ziel: "Uebergabe", fakt: "Schlussabnahme unterzeichnet", grund: `Abnahme ${abn.name} ist unterzeichnet.` };
  }
  return null;
}

/** Hinweise, die nie automatisch schieben (nur Leitung entscheidet). */
export function phaseHinweise(m) {
  const out = [];
  if (m?.projekt?.status === "Angebot" && (m.auftraege || []).some((a) => a.status !== "Storniert" && a.docstatus !== 2)) out.push({ id: "ab-vorhanden", text: "AB vorhanden – Beauftragen?" });
  return out;
}

/** Ziel-Phase eines Zurücksetzens ist gültig, wenn sie vor der aktuellen liegt. Liefert die Schrittfolge (Anzahl „Zurück“). */
export function zuruecksetzenSchritte(von, ziel) {
  const a = PHASEN.indexOf(von);
  const b = PHASEN.indexOf(ziel);
  if (a < 0 || b < 0 || b >= a || von === "Abgeschlossen") return 0;
  return a - b;
}
