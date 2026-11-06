// Berichte des Bereichs Service (10-konzept-service §2.12). Im Frappe-Modus die Script Reports der App
// (query_report.run), im Mock dieselben Spalten aus den Listen berechnet. Keine Auswertung je Techniker (R-13).
// Reines Modul (Client wird übergeben).
import { istMock } from "./dienst.js";
import { tageBis } from "./fristen.js";
import { OFFEN } from "./labels.js";

export const BERICHTE = Object.freeze({
  quote: { report: "PH Reklamationsquote je Marke", titel: "Reklamationen je Marke", netto: true },
  fehlercodes: { report: "PH Fehlercode-Statistik", titel: "Fehlercode-Statistik", netto: true },
  regress: { report: "PH Regressstatus", titel: "Regressstatus", netto: true },
  kosten: { report: "PH Servicekosten", titel: "Servicekosten", netto: true },
  fristen: { report: "PH Gewährleistungsfristen", titel: "Gewährleistungsfristen", netto: false },
});

export const SPALTEN = {
  quote: [
    { fieldname: "gruppe", label: "Marke" },
    { fieldname: "faelle", label: "Fälle", fieldtype: "Int" },
    { fieldname: "bestaetigt", label: "Bestätigt", fieldtype: "Int" },
    { fieldname: "abgelehnt", label: "Abgelehnt", fieldtype: "Int" },
    { fieldname: "offen", label: "Offen", fieldtype: "Int" },
    { fieldname: "transport", label: "Transport", fieldtype: "Int" },
    { fieldname: "kosten", label: "Kosten netto", fieldtype: "Int", cent: true },
    { fieldname: "regress", label: "Regress erhalten", fieldtype: "Int", cent: true },
    { fieldname: "nach_regress", label: "Kosten nach Regress", fieldtype: "Int", cent: true },
  ],
  fehlercodes: [
    { fieldname: "code", label: "Fehlercode" },
    { fieldname: "bereich", label: "Bereich" },
    { fieldname: "faelle", label: "Fälle", fieldtype: "Int" },
    { fieldname: "bestaetigt", label: "Bestätigt", fieldtype: "Int" },
    { fieldname: "tage", label: "Ø Tage", fieldtype: "Int", summe: false },
    { fieldname: "kosten", label: "Kosten netto", fieldtype: "Int", cent: true },
  ],
  regress: [
    { fieldname: "regress", label: "Regress" },
    { fieldname: "fall", label: "Fall" },
    { fieldname: "lieferant", label: "Lieferant" },
    { fieldname: "status", label: "Status" },
    { fieldname: "gefordert", label: "Gefordert", fieldtype: "Int", cent: true },
    { fieldname: "anerkannt", label: "Anerkannt", fieldtype: "Int", cent: true },
    { fieldname: "erhalten", label: "Erhalten", fieldtype: "Int", cent: true },
    { fieldname: "abgleich", label: "Abgleich" },
  ],
  kosten: [
    { fieldname: "monat", label: "Monat" },
    { fieldname: "faelle", label: "Fälle", fieldtype: "Int" },
    { fieldname: "intern", label: "Intern", fieldtype: "Int", cent: true },
    { fieldname: "extern", label: "Extern", fieldtype: "Int", cent: true },
    { fieldname: "kulanz", label: "Kulanz/Minderung", fieldtype: "Int", cent: true },
    { fieldname: "regress", label: "Regress", fieldtype: "Int", cent: true },
    { fieldname: "nach_regress", label: "Kosten nach Regress", fieldtype: "Int", cent: true },
  ],
  fristen: [
    { fieldname: "fall", label: "Fall" },
    { fieldname: "kunde", label: "Kunde" },
    { fieldname: "produkt", label: "Produkt" },
    { fieldname: "uebergabe", label: "Übergabe" },
    { fieldname: "vermutung", label: "Vermutung bis" },
    { fieldname: "gewaehrleistung", label: "Gewährleistung bis" },
    { fieldname: "rest", label: "Tage", fieldtype: "Int", summe: false },
  ],
};

const FALL_FELDER = ["name", "kunde_name", "produkt_name", "marke", "status", "art", "fehlercode", "fehlerbereich", "mangel_bestaetigt", "gemeldet_am", "dauer_tage", "kosten_intern_cent", "kosten_extern_cent", "kulanz_cent", "preisminderung_cent", "regress_erhalten_cent", "uebergabe_datum", "beweislast_bis", "gewaehrleistung_bis"];

function imZeitraum(f, von, bis) {
  const d = String(f.gemeldet_am || "").slice(0, 10);
  return (!von || d >= von) && (!bis || d <= bis);
}

/** Zeilen eines Berichts (Mock: berechnet; Frappe: Script Report). */
export async function berichtZeilen(client, id, { von = "", bis = "", tage = 60, heute = new Date() } = {}) {
  const def = BERICHTE[id];
  if (!def) return [];
  if (!istMock(client)) {
    const r = await client.getReport(def.report, { von, bis, from_date: von, to_date: bis, tage });
    return r.result || [];
  }
  if (id === "regress") {
    const liste = await client.getList("PH Lieferantenregress", { fields: ["name", "servicefall", "lieferant", "status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "abgleich_status", "gemeldet_am"], limit: 1000 });
    return liste.filter((r) => imZeitraum({ gemeldet_am: r.gemeldet_am }, von, bis)).map((r) => ({ regress: r.name, fall: r.servicefall, lieferant: r.lieferant, status: r.status, gefordert: r.betrag_gefordert_cent || 0, anerkannt: r.betrag_anerkannt_cent || 0, erhalten: r.betrag_erhalten_cent || 0, abgleich: r.abgleich_status || "" }));
  }
  const faelle = (await client.getList("PH Servicefall", { fields: FALL_FELDER, limit: 5000 })).filter((f) => imZeitraum(f, von, bis));
  const kosten = (f) => (Number(f.kosten_intern_cent) || 0) + (Number(f.kosten_extern_cent) || 0) + (Number(f.kulanz_cent) || 0) + (Number(f.preisminderung_cent) || 0);
  if (id === "quote") {
    const g = new Map();
    for (const f of faelle) {
      const z = g.get(f.marke || "Ohne Marke") || { gruppe: f.marke || "Ohne Marke", faelle: 0, bestaetigt: 0, abgelehnt: 0, offen: 0, transport: 0, kosten: 0, regress: 0 };
      z.faelle += 1;
      if (["Ja", "Teilweise"].includes(f.mangel_bestaetigt)) z.bestaetigt += 1;
      if (f.status === "Abgelehnt") z.abgelehnt += 1;
      if (OFFEN.includes(f.status)) z.offen += 1;
      if (f.art === "Transportschaden") z.transport += 1;
      z.kosten += kosten(f);
      z.regress += Number(f.regress_erhalten_cent) || 0;
      g.set(z.gruppe, z);
    }
    return [...g.values()].map((z) => ({ ...z, nach_regress: z.kosten - z.regress })).sort((a, b) => b.faelle - a.faelle);
  }
  if (id === "fehlercodes") {
    const g = new Map();
    for (const f of faelle) {
      const k = f.fehlercode || "ohne";
      const z = g.get(k) || { code: k, bereich: f.fehlerbereich || "–", faelle: 0, bestaetigt: 0, summeTage: 0, mitTagen: 0, kosten: 0 };
      z.faelle += 1;
      if (["Ja", "Teilweise"].includes(f.mangel_bestaetigt)) z.bestaetigt += 1;
      if (Number(f.dauer_tage)) {
        z.summeTage += Number(f.dauer_tage);
        z.mitTagen += 1;
      }
      z.kosten += kosten(f);
      g.set(k, z);
    }
    return [...g.values()].map(({ summeTage, mitTagen, ...z }) => ({ ...z, tage: mitTagen ? Math.round(summeTage / mitTagen) : 0 })).sort((a, b) => b.faelle - a.faelle);
  }
  if (id === "kosten") {
    const g = new Map();
    for (const f of faelle) {
      const m = String(f.gemeldet_am).slice(0, 7);
      const z = g.get(m) || { monat: m, faelle: 0, intern: 0, extern: 0, kulanz: 0, regress: 0 };
      z.faelle += 1;
      z.intern += Number(f.kosten_intern_cent) || 0;
      z.extern += Number(f.kosten_extern_cent) || 0;
      z.kulanz += (Number(f.kulanz_cent) || 0) + (Number(f.preisminderung_cent) || 0);
      z.regress += Number(f.regress_erhalten_cent) || 0;
      g.set(m, z);
    }
    return [...g.values()].map((z) => ({ ...z, nach_regress: z.intern + z.extern + z.kulanz - z.regress })).sort((a, b) => a.monat.localeCompare(b.monat));
  }
  // fristen
  return faelle
    .filter((f) => OFFEN.includes(f.status) && f.gewaehrleistung_bis)
    .map((f) => ({ fall: f.name, kunde: f.kunde_name, produkt: f.produkt_name, uebergabe: f.uebergabe_datum, vermutung: f.beweislast_bis, gewaehrleistung: f.gewaehrleistung_bis, rest: tageBis(f.gewaehrleistung_bis, heute) }))
    .filter((z) => z.rest !== null && z.rest <= Number(tage || 365))
    .sort((a, b) => a.rest - b.rest);
}
