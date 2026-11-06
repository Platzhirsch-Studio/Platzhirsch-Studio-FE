// Beträge in Cent (10-konzept-faktura § 16.1 betraege.js): Positionssummen, USt je Satz, Summenblock wie
// ph_faktura.summenblock, vereinnahmte Anzahlungen (R-10), Zahlungsplan-Summe, Anteile, Altersband.
// Rein, nur Ganzzahlen. Rundung kaufmännisch je Position (wie rechenwerk/steuer.rund).

export function rund(x) {
  const v = Number(x) || 0;
  return v < 0 ? -Math.round(-v) : Math.round(v);
}

/** Netto einer Position: Menge × Einzelpreis − Rabatt (Promille). Alternativ- und Textzeilen zählen nicht. */
export function positionNetto(p) {
  if (!p || p.alternativ || p.art === "Text" || p.art === "Zwischensumme") return 0;
  const brutto = rund((Number(p.menge) || 0) * (Number(p.einzel_netto_cent) || 0));
  const rabatt = rund((brutto * (Number(p.rabatt_promille) || 0)) / 1000);
  return brutto - rabatt;
}

/**
 * Summen eines Belegs aus Positionen.
 * @returns {{netto_cent:number, rabatt_gesamt_cent:number, ust_cent:number, brutto_cent:number, alternativ_cent:number,
 *   ust_aufteilung:Array<{ust_satz_promille:number, netto_cent:number, ust_cent:number, brutto_cent:number}>}}
 */
export function belegSummen(positionen = []) {
  const saetze = new Map();
  let rabatt = 0;
  let alternativ = 0;
  for (const p of positionen) {
    if (p?.alternativ) {
      alternativ += rund((Number(p.menge) || 0) * (Number(p.einzel_netto_cent) || 0));
      continue;
    }
    const n = positionNetto(p);
    if (!n && p?.art !== "Rabatt") continue;
    rabatt += rund(((Number(p.menge) || 0) * (Number(p.einzel_netto_cent) || 0) * (Number(p.rabatt_promille) || 0)) / 1000);
    const satz = Number(p.ust_satz_promille ?? 200);
    saetze.set(satz, (saetze.get(satz) || 0) + n);
  }
  const aufteilung = [...saetze.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([satz, netto]) => {
      const ust = rund((netto * satz) / 1000);
      return { ust_satz_promille: satz, netto_cent: netto, ust_cent: ust, brutto_cent: netto + ust };
    });
  const netto = aufteilung.reduce((s, z) => s + z.netto_cent, 0);
  const ust = aufteilung.reduce((s, z) => s + z.ust_cent, 0);
  return { netto_cent: netto, rabatt_gesamt_cent: rabatt, ust_cent: ust, brutto_cent: netto + ust, alternativ_cent: alternativ, ust_aufteilung: aufteilung };
}

/**
 * Nur vereinnahmte Anzahlungen werden abgezogen (R-10, F-05, F-26).
 * @param {Array<{name:string, brutto_cent:number, bezahlt_cent:number, ust_satz_promille?:number}>} anzahlungsrechnungen
 * @returns {{abzug_brutto_cent:number, abzug_netto_cent:number, abzug_ust_cent:number, blockiert:Array<{name:string, bezahlt_cent:number, brutto_cent:number, rest_cent:number}>}}
 */
export function vereinnahmteAnzahlungen(anzahlungsrechnungen = []) {
  let brutto = 0;
  let netto = 0;
  let ust = 0;
  const blockiert = [];
  for (const a of anzahlungsrechnungen) {
    const b = Math.min(Number(a.bezahlt_cent) || 0, Number(a.brutto_cent) || 0);
    const satz = Number(a.ust_satz_promille ?? 200);
    const n = rund((b * 1000) / (1000 + satz));
    brutto += b;
    netto += n;
    ust += b - n;
    if (b < (Number(a.brutto_cent) || 0)) blockiert.push({ name: a.name, bezahlt_cent: b, brutto_cent: Number(a.brutto_cent) || 0, rest_cent: (Number(a.brutto_cent) || 0) - b });
  }
  return { abzug_brutto_cent: brutto, abzug_netto_cent: netto, abzug_ust_cent: ust, blockiert };
}

/** Summenblock einer Rechnung (Reihenfolge wie ph_faktura.summenblock). */
export function summenblock(doc = {}) {
  const brutto = Number(doc.brutto_cent) || 0;
  const abzug = Number(doc.anzahlung_brutto_cent) || 0;
  const zahlbar = doc.zahlbar_cent !== undefined && doc.zahlbar_cent !== null ? Number(doc.zahlbar_cent) : brutto - abzug;
  const bezahlt = Number(doc.bezahlt_cent) || 0;
  const offen = doc.offen_cent !== undefined && doc.offen_cent !== null && Number(doc.docstatus) === 1 ? Number(doc.offen_cent) : Math.max(zahlbar - bezahlt, 0);
  const aufteilung = Array.isArray(doc.ust_aufteilung) && doc.ust_aufteilung.length ? doc.ust_aufteilung : belegSummen(doc.positionen || []).ust_aufteilung;
  return {
    netto: Number(doc.netto_cent) || 0,
    rabatt: Number(doc.rabatt_gesamt_cent) || 0,
    ust: aufteilung.map((z) => ({ satz: (Number(z.ust_satz_promille) || 0) / 10, cent: Number(z.ust_cent) || 0 })),
    brutto,
    anzahlung: abzug,
    zahlbar,
    bezahlt,
    offen,
  };
}

/** Zahlungsplan-Summe gegen Brutto (Live-Fehler § 4.3). */
export function zahlungsplanPruefen(zeilen = [], bruttoCent = 0) {
  const summe = zeilen.reduce((s, z) => s + (Number(z.betrag_cent) || 0), 0);
  const prozent = zeilen.reduce((s, z) => s + (Number(z.prozent) || 0), 0);
  return { summe_cent: summe, prozent, ok: summe === Number(bruttoCent), differenz_cent: Number(bruttoCent) - summe };
}

/** Zahlungsplan aus einer Zahlungsbedingung (Rest auf die letzte Zeile, damit die Summe stimmt). */
export function zahlungsplanAus(bedingung = {}, bruttoCent = 0) {
  const a = Number(bedingung.anzahlung_prozent) || 0;
  const t = Number(bedingung.teilzahlung_prozent) || 0;
  const r = Math.max(100 - a - t, 0);
  const zeilen = [];
  if (a) zeilen.push({ art: "Anzahlung", prozent: a, faellig_bei: "Auftrag" });
  if (t) zeilen.push({ art: "Teilzahlung", prozent: t, faellig_bei: "Lieferung" });
  if (r) zeilen.push({ art: "Schlusszahlung", prozent: r, faellig_bei: "Montage" });
  let rest = Number(bruttoCent) || 0;
  zeilen.forEach((z, i) => {
    z.betrag_cent = i === zeilen.length - 1 ? rest : rund(((Number(bruttoCent) || 0) * z.prozent) / 100);
    rest -= z.betrag_cent;
    z.status = "Offen";
    z.bezahlt_cent = 0;
  });
  return zeilen;
}

/** Live-Satz der Zahlungsbedingung („Kunde zahlt 40 % bei Auftrag, 50 % bei Lieferung, 10 % nach Montage“). */
export function zahlungsbedingungSatz(b = {}) {
  const a = Number(b.anzahlung_prozent) || 0;
  const t = Number(b.teilzahlung_prozent) || 0;
  const r = 100 - a - t;
  if (r < 0) return { ok: false, satz: "Anzahlung und Teilzahlung dürfen 100 % nicht übersteigen" };
  const teile = [];
  if (a) teile.push(`${a} % bei Auftrag`);
  if (t) teile.push(`${t} % bei Lieferung`);
  if (r) teile.push(`${r} % nach ${a || t ? "Montage" : "Rechnung"}`);
  return { ok: true, satz: `Kunde zahlt ${teile.join(", ")}` };
}

/** Anteil in Prozent, gerundet (für Stand-Band und Texte). */
export function anteil(teil, ganz) {
  const g = Number(ganz) || 0;
  if (!g) return 0;
  return Math.max(0, Math.min(100, Math.round(((Number(teil) || 0) * 100) / g)));
}

/** Stand eines Auftrags (Stand-Band ersetzt stand_html). */
export function auftragStand(ab = {}) {
  const wert = Number(ab.auftragswert_cent || ab.brutto_cent) || 0;
  return {
    bezahlt: anteil(ab.bezahlt_cent, wert),
    abgerechnet: anteil(ab.abgerechnet_cent, wert),
    geliefert: anteil(ab.geliefert_cent, wert),
    anzahlungErfuellt: (Number(ab.anzahlung_soll_cent) || 0) > 0 && (Number(ab.anzahlung_ist_cent) || 0) >= (Number(ab.anzahlung_soll_cent) || 0),
    offen: Number(ab.offen_cent ?? wert - (Number(ab.bezahlt_cent) || 0)),
  };
}

/** Tage zwischen zwei ISO-Daten (b − a), ganzzahlig. */
export function tageZwischen(a, b) {
  const da = new Date(`${String(a).slice(0, 10)}T00:00:00Z`).getTime();
  const db = new Date(`${String(b).slice(0, 10)}T00:00:00Z`).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}

export const ALTERS_SEGMENTE = [
  { id: "0-7", titel: "0–7", von: 0, bis: 7 },
  { id: "8-30", titel: "8–30", von: 8, bis: 30 },
  { id: "31-60", titel: "31–60", von: 31, bis: 60 },
  { id: "60+", titel: "> 60", von: 61, bis: Infinity },
];

/** Offene Posten nach Alter (Tage seit Fälligkeit, nicht fällige zählen zu 0–7). */
export function altersband(rechnungen = [], heute) {
  const out = ALTERS_SEGMENTE.map((s) => ({ ...s, cent: 0, anzahl: 0 }));
  for (const r of rechnungen) {
    const offen = Number(r.offen_cent) || 0;
    if (offen <= 0) continue;
    const t = Math.max(0, tageZwischen(r.faellig || heute, heute));
    const seg = out.find((s) => t >= s.von && t <= s.bis) || out[0];
    seg.cent += offen;
    seg.anzahl += 1;
  }
  const gesamt = out.reduce((s, x) => s + x.cent, 0);
  return out.map((s) => ({ ...s, bis: Number.isFinite(s.bis) ? s.bis : null, anteil: gesamt ? s.cent / gesamt : 0 }));
}

/** Passt eine Rechnung in ein Alterssegment (Filter ?alter=). */
export function inAlter(rechnung, segmentId, heute) {
  const s = ALTERS_SEGMENTE.find((x) => x.id === segmentId);
  if (!s) return true;
  const t = Math.max(0, tageZwischen(rechnung.faellig || heute, heute));
  return t >= s.von && t <= s.bis;
}
