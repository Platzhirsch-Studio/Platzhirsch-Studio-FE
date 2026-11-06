// Berichte des Bereichs Faktura (10-konzept-faktura § 3.11, § 7) – rein aus geladenen Belegen gerechnet, damit sie im
// Mock und im Frappe-Modus gleich aussehen (Frappe-Reports PH Anzahlungsstand, PH Offene Posten, PH Nummernluecken …
// bleiben die Quelle der Kanzlei). Kein Wert ohne Quelle (Q-A6).

import { tageZwischen } from "./betraege.js";
import { monatName } from "./regeln.js";

export const BERICHTE = [
  { id: "uebersicht", titel: "Übersicht", text: "Umsatz je Monat, Angebote nach Status, Mahnstufen und Eingangsrechnungen" },
  { id: "anzahlungsstand", titel: "Anzahlungsstand", text: "Anzahlungen je Auftrag: Soll, Ist, offen" },
  { id: "offene-posten", titel: "Offene Posten", text: "Offene Rechnungen mit Tagen seit Fälligkeit" },
  { id: "nummernluecken", titel: "Nummernlücken", text: "Fortlaufende Nummern der gestellten Rechnungen und Gutschriften" },
  { id: "vertrieb", titel: "Vertriebscockpit", text: "Angebote, Quote und Auftragsbestand je Berater" },
  { id: "projektkosten", titel: "Projektkosten", text: "Zugeordnete Eingangsrechnungen je Projekt und Kostenart" },
  { id: "kassa-abgleich", titel: "Abgleich Kassa ↔ Faktura", text: "Folgt mit dem Backend-Report (P-02)" },
];

export function berichtDef(id) {
  return BERICHTE.find((b) => b.id === id) || null;
}

/** Umsatz netto je Monat (12 Monate, Leistungsrechnungen ohne Anzahlungen, − Gutschriften). */
export function umsatzJeMonat(rechnungen = [], gutschriften = [], heute) {
  const monate = [];
  const [j, m] = String(heute).slice(0, 7).split("-").map(Number);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(j, m - 1 - i, 1));
    monate.push(d.toISOString().slice(0, 7));
  }
  return monate.map((mo) => ({
    label: monatName(mo, false).slice(0, 3),
    wert:
      rechnungen.filter((r) => Number(r.docstatus) === 1 && r.art !== "Anzahlungsrechnung" && r.status !== "Storniert" && String(r.datum).slice(0, 7) === mo).reduce((s, r) => s + (Number(r.netto_cent) || 0), 0) -
      gutschriften.filter((g) => Number(g.docstatus) === 1 && g.art !== "Storno" && String(g.datum).slice(0, 7) === mo).reduce((s, g) => s + (Number(g.netto_cent) || 0), 0),
  }));
}

export function zaehleNach(liste, feld, reihenfolge = []) {
  const m = new Map(reihenfolge.map((r) => [r, 0]));
  for (const x of liste) m.set(x[feld], (m.get(x[feld]) || 0) + 1);
  return [...m.entries()].filter(([, n]) => n > 0).map(([k, n]) => ({ label: String(k), wert: n }));
}

export function anzahlungsstand(auftraege = []) {
  return auftraege
    .filter((a) => Number(a.anzahlung_soll_cent) > 0 && a.status !== "Storniert")
    .map((a) => ({ auftrag: a.name, kunde: a.kunde_name, status: a.status, soll_cent: Number(a.anzahlung_soll_cent) || 0, ist_cent: Number(a.anzahlung_ist_cent) || 0, offen_cent: Math.max((Number(a.anzahlung_soll_cent) || 0) - (Number(a.anzahlung_ist_cent) || 0), 0) }));
}

export function offenePosten(rechnungen = [], heute) {
  return rechnungen
    .filter((r) => Number(r.docstatus) === 1 && Number(r.offen_cent) > 0 && !["Storniert", "Uneinbringlich"].includes(r.status))
    .map((r) => ({ rechnung: r.name, kunde: r.kunde_name, faellig: r.faellig, tage: Math.max(0, tageZwischen(r.faellig, heute)), offen_cent: Number(r.offen_cent) || 0, mahnstufe: Number(r.mahnstufe) || 0 }))
    .sort((a, b) => b.tage - a.tage);
}

/** Lücken in den Nummernkreisen RE-/GU- je Jahr (fortlaufend nach § 11 UStG). */
export function nummernluecken(belege = []) {
  const kreise = new Map();
  for (const b of belege) {
    const m = /^(RE|GU)-(\d{4})-(\d+)$/.exec(b.name || "");
    if (!m || Number(b.docstatus) !== 1) continue;
    const k = `${m[1]}-${m[2]}`;
    if (!kreise.has(k)) kreise.set(k, []);
    kreise.get(k).push(Number(m[3]));
  }
  const out = [];
  for (const [k, nr] of kreise) {
    nr.sort((a, b) => a - b);
    const fehlend = [];
    for (let i = nr[0]; i <= nr[nr.length - 1]; i++) if (!nr.includes(i)) fehlend.push(i);
    out.push({ kreis: k, von: nr[0], bis: nr[nr.length - 1], anzahl: nr.length, luecken: fehlend.length, fehlend: fehlend.slice(0, 20).join(", ") || "–" });
  }
  return out;
}

export function vertrieb(angebote = [], auftraege = []) {
  const m = new Map();
  for (const a of angebote) {
    const k = String(a.zugewiesen_an || "–").split("@")[0];
    const x = m.get(k) || { berater: k, angebote: 0, offen_cent: 0, gewonnen: 0, entschieden: 0 };
    x.angebote++;
    if (["Entwurf", "Gesendet"].includes(a.status)) x.offen_cent += Number(a.brutto_cent) || 0;
    if (["Angenommen", "Abgelehnt", "Abgelaufen"].includes(a.status)) x.entschieden++;
    if (a.status === "Angenommen") x.gewonnen++;
    m.set(k, x);
  }
  return [...m.values()].map((x) => ({ ...x, quote: x.entschieden ? `${Math.round((x.gewonnen * 100) / x.entschieden)} %` : "–", bestand_cent: auftraege.filter((a) => String(a.zugewiesen_an || "–").split("@")[0] === x.berater && !["Abgerechnet", "Storniert"].includes(a.status)).reduce((s, a) => s + (Number(a.offen_cent) || 0), 0) }));
}

/** Kostenzuordnung je Projekt/Kostenart (Zuarbeit zur Projektnachkalkulation; Gemeinkosten als eigene Zeile). */
export function projektkosten(ers = []) {
  const m = new Map();
  for (const e of ers) {
    if (e.status === "Abgelehnt") continue;
    const vz = e.belegart === "Gutschrift" ? -1 : 1;
    if (e.zuordnung_modus === "Gemeinkosten") {
      const k = "Gemeinkosten::";
      const x = m.get(k) || { projekt: "Gemeinkosten", kostenart: "–", betrag_cent: 0, belege: 0 };
      x.betrag_cent += vz * (Number(e.netto_cent) || 0);
      x.belege++;
      m.set(k, x);
      continue;
    }
    for (const z of e.zuordnung || []) {
      const k = `${z.projekt}::${z.kostenart}`;
      const x = m.get(k) || { projekt: z.projekt || "ohne Projekt", kostenart: z.kostenart || "–", betrag_cent: 0, belege: 0 };
      x.betrag_cent += vz * (Number(z.betrag_cent) || 0);
      x.belege++;
      m.set(k, x);
    }
  }
  return [...m.values()].sort((a, b) => String(a.projekt).localeCompare(String(b.projekt)) || b.betrag_cent - a.betrag_cent);
}
