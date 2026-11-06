// Bereich Sortiment – Auswertungen für /sortiment/berichte (§ 11.2, § 11.3). Reine Rechenfunktionen über die
// gelesenen Listen (keine Schätzungen; fehlt die Quelle, liefert die Funktion leere Reihen).

import { BESTELL_REIHENFOLGE } from "./status.js";
import { tageZwischen, plusTage, isoTag } from "./regeln.js";

/** Veröffentlichte Produkte je Marke, Top n + „weitere“. */
export function produkteJeMarke(produkte = [], n = 10) {
  const m = new Map();
  for (const p of produkte) if (p.status === "Aktiv") m.set(p.marke || "ohne Marke", (m.get(p.marke || "ohne Marke") || 0) + 1);
  const sortiert = [...m].sort((a, b) => b[1] - a[1]);
  const top = sortiert.slice(0, n).map(([label, wert]) => ({ label, wert }));
  const rest = sortiert.slice(n).reduce((a, [, w]) => a + w, 0);
  return rest ? [...top, { label: "weitere", wert: rest }] : top;
}

/** Offene Bestellungen je Schritt in Workflow-Reihenfolge (ohne Abgeschlossen/Storniert). */
export function bestellungenNachStatus(bestellungen = []) {
  return BESTELL_REIHENFOLGE.filter((s) => !["Abgeschlossen", "Storniert"].includes(s)).map((s) => ({ status: s, wert: bestellungen.filter((b) => b.status === s).length }));
}

/** Bestellungen je Monat (12 Monate bis zum Bezugsmonat), ohne Storniert. */
export function bestellungenJeMonat(bestellungen = [], { jetzt = new Date(), monate = 12 } = {}) {
  const namen = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const out = [];
  for (let i = monate - 1; i >= 0; i--) {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: namen[d.getMonth()], wert: bestellungen.filter((b) => b.status !== "Storniert" && String(b.datum || "").startsWith(key)).length });
  }
  return out;
}

/** Ø Tage zwischen Wunsch- und bestätigtem Termin je Lieferant (nur Bestellungen mit beiden Terminen). */
export function termintreue(bestellungen = []) {
  const m = new Map();
  for (const b of bestellungen) {
    if (!b.lieferant || !b.wunschtermin || !b.bestaetigter_termin) continue;
    const t = tageZwischen(b.wunschtermin, b.bestaetigter_termin);
    if (t === null) continue;
    const x = m.get(b.lieferant) || { summe: 0, n: 0 };
    x.summe += t;
    x.n += 1;
    m.set(b.lieferant, x);
  }
  return [...m].map(([label, x]) => ({ label, wert: Math.round((x.summe / x.n) * 10) / 10, n: x.n })).sort((a, b) => b.wert - a.wert);
}

/** Kennzahlen der Tabelle (§ 11.2). */
export function berichtKennzahlen({ produkte = [], eingaenge = [] }, { jetzt = new Date() } = {}) {
  const vor30 = plusTage(isoTag(jetzt), -30);
  return {
    shopOhneLieferzeit: produkte.filter((p) => p.verkauf_online && !p.lieferzeit_freigegeben).length,
    reklamiert30: eingaenge.filter((w) => w.status === "Reklamiert" && String(w.datum || "") >= vor30).length,
    uebersetzungen: produkte.filter((p) => p.status === "Aktiv" && !p.kurz_en).length,
    preisVeraltet: produkte.filter((p) => p.status === "Aktiv" && p.preisstand_alt).length,
    ohneBild: produkte.filter((p) => p.status !== "Ausgelaufen" && !p.bild_freigegeben).length,
  };
}
