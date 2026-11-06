// Kostenzuordnung von Eingangsrechnungen (Projektnachkalkulation, Inhaber 04.11.2026; 51-backend-luecken
// „Kostenzuordnung Eingangsrechnung“). JavaScript-Spiegel von ph_faktura/rechenwerk/kostenzuordnung.py –
// gleiche Modi, gleiche Rundung (Rest auf die betragsmäßig größte Prozentzeile), gleiche Prüftexte, damit die
// Oberfläche live dasselbe meldet wie der Server. Rein, testbar mit node --test.

export const MODI = ["Ganz einem Projekt", "Nach Positionen", "Aliquot", "Gemeinkosten"];
const OHNE_POSITIONSBEZUG = new Set(["Text", "Zwischensumme"]);

const i = (v) => {
  const n = Math.trunc(Number(v) || 0);
  return Number.isFinite(n) ? n : 0;
};
const p = (v) => Number(v) || 0;
/** Kaufmännisch runden (ROUND_HALF_UP), auch negativ symmetrisch. */
export const rund = (x) => (x < 0 ? -Math.round(-x - 1e-9) : Math.round(x + 1e-9));

/**
 * Beträge je Zeile: Prozentzeile → netto × Prozent, sonst fester Betrag. Rundungsrest (höchstens 1 Cent je
 * Prozentzeile) auf die betragsmäßig größte Prozentzeile. → { betraege, differenz }
 */
export function aufteilen(nettoCent, zeilen = []) {
  const netto = i(nettoCent);
  const betraege = [];
  const prozentzeilen = [];
  zeilen.forEach((z, k) => {
    const pr = p(z?.prozent);
    if (pr) {
      betraege.push(rund((netto * pr) / 100));
      prozentzeilen.push(k);
    } else betraege.push(i(z?.betrag_cent));
  });
  let diff = netto - betraege.reduce((s, b) => s + b, 0);
  if (diff && prozentzeilen.length && Math.abs(diff) <= prozentzeilen.length) {
    const ziel = prozentzeilen.reduce((best, k) => (Math.abs(betraege[k]) > Math.abs(betraege[best]) ? k : best), prozentzeilen[0]);
    betraege[ziel] += diff;
    diff = 0;
  }
  return { betraege, differenz: diff };
}

/** „Nach Positionen“: je Belegposition (ohne Text/Zwischensumme/Alternativ) eine Zeile mit deren Netto. */
export function ausPositionen(positionen = [], vorhanden = [], projekt = null, kostenart = null) {
  const alt = new Map(vorhanden.filter((z) => i(z.belegposition)).map((z) => [i(z.belegposition), z]));
  const out = [];
  positionen.forEach((pos, k) => {
    if (OHNE_POSITIONSBEZUG.has(pos?.art || "") || i(pos?.alternativ)) return;
    const nr = i(pos.pos) || i(pos.idx) || k + 1;
    const a = alt.get(nr) || {};
    out.push({
      belegposition: nr,
      betrag_cent: i(pos.netto_cent),
      prozent: 0,
      projekt: a.projekt || projekt || "",
      kostenart: a.kostenart || kostenart || "",
      bemerkung: a.bemerkung || String(pos.bezeichnung || "").slice(0, 140),
      bezug_doctype: a.bezug_doctype || "",
      bezug_name: a.bezug_name || "",
    });
  });
  return out;
}

/** Vorschlag nach dem Verhältnis einer Vorlage (Ursprungsrechnung, mehrere Speditionsaufträge). */
export function anteilig(nettoCent, vorlage = []) {
  const v = vorlage.filter((z) => i(z.betrag_cent));
  const basis = v.reduce((s, z) => s + i(z.betrag_cent), 0);
  if (!basis) return [];
  const zeilen = v.map((z) => ({ projekt: z.projekt, kostenart: z.kostenart, bezug_doctype: z.bezug_doctype, bezug_name: z.bezug_name, bemerkung: z.bemerkung, prozent: 0, betrag_cent: rund((i(nettoCent) * i(z.betrag_cent)) / basis) }));
  const diff = i(nettoCent) - zeilen.reduce((s, z) => s + z.betrag_cent, 0);
  if (diff) zeilen.reduce((a, b) => (Math.abs(b.betrag_cent) > Math.abs(a.betrag_cent) ? b : a)).betrag_cent += diff;
  return zeilen;
}

const euro = (c) => (i(c) / 100).toFixed(2);

/** Fehlertexte (leer = vollständig zugeordnet); Summe der Zeilen muss dem Netto entsprechen. */
export function pruefen(modus, nettoCent, zeilen = []) {
  const fehler = [];
  if (!MODI.includes(modus)) return ["Bitte einen Zuordnungsmodus wählen."];
  if (modus === "Gemeinkosten") {
    if (zeilen.some((z) => z.projekt)) fehler.push("Gemeinkosten haben kein Projekt – Zeilen entfernen oder anderen Modus wählen.");
    return fehler;
  }
  if (!zeilen.length) return ["Keine Zuordnungszeilen."];
  zeilen.forEach((z, k) => {
    if (!z.projekt) fehler.push(`Zeile ${k + 1}: Projekt fehlt.`);
    if (!z.kostenart) fehler.push(`Zeile ${k + 1}: Kostenart fehlt.`);
    if (p(z.prozent) < 0 || p(z.prozent) > 100) fehler.push(`Zeile ${k + 1}: Prozent muss zwischen 0 und 100 liegen.`);
  });
  if (modus === "Ganz einem Projekt" && zeilen.length !== 1) fehler.push("„Ganz einem Projekt“ hat genau eine Zeile – sonst „Anteilig“ wählen.");
  if (modus === "Nach Positionen") {
    const pos = zeilen.map((z) => i(z.belegposition));
    if (!pos.every(Boolean)) fehler.push("„Nach Positionen“: jede Zeile braucht den Positionsbezug.");
    if (new Set(pos).size !== pos.length) fehler.push("„Nach Positionen“: eine Position ist mehrfach zugeordnet.");
  }
  const summe = zeilen.reduce((s, z) => s + i(z.betrag_cent), 0);
  if (summe !== i(nettoCent)) fehler.push(`Summe der Zuordnung ${euro(summe).replace(".", ",")} € ≠ Netto ${euro(nettoCent).replace(".", ",")} € (Differenz ${euro(i(nettoCent) - summe).replace(".", ",")} €).`);
  return fehler;
}

export function status(modus, nettoCent, zeilen = []) {
  const f = pruefen(modus, nettoCent, zeilen);
  if (modus === "Gemeinkosten" && !f.length) return "Gemeinkosten";
  return MODI.includes(modus) && !f.length ? "Vollstaendig" : "Offen";
}

/**
 * Zeilen je Modus bilden (wie zuordnung_berechnen im Controller): Ganz → eine Zeile über Netto,
 * Positionen → aus Positionen, Aliquot → aufteilen, Gemeinkosten → keine Zeilen.
 */
export function berechne({ modus, netto_cent, zeilen = [], positionen = [], projekt = "", kostenart = "" }) {
  let out = [];
  if (modus === "Ganz einem Projekt") out = [{ projekt: zeilen[0]?.projekt || projekt, kostenart: zeilen[0]?.kostenart || kostenart, prozent: 0, betrag_cent: i(netto_cent), bezug_doctype: zeilen[0]?.bezug_doctype || "", bezug_name: zeilen[0]?.bezug_name || "", bemerkung: zeilen[0]?.bemerkung || "" }];
  else if (modus === "Nach Positionen") out = ausPositionen(positionen, zeilen, projekt, kostenart);
  else if (modus === "Aliquot") {
    const { betraege } = aufteilen(netto_cent, zeilen);
    out = zeilen.map((z, k) => ({ ...z, betrag_cent: betraege[k] }));
  }
  const summe = out.reduce((s, z) => s + i(z.betrag_cent), 0);
  return {
    zeilen: out,
    summe_cent: modus === "Gemeinkosten" ? i(netto_cent) : summe,
    differenz_cent: modus === "Gemeinkosten" ? 0 : i(netto_cent) - summe,
    status: status(modus, netto_cent, out),
    fehler: pruefen(modus, netto_cent, out),
  };
}

/** Protokolltext einer Umbuchung (alt → neu). */
export function unterschied(alt = [], neu = []) {
  const text = (z) => z.map((x) => `${x.projekt || "–"}/${x.kostenart || "–"} ${euro(x.betrag_cent)}`).join("; ") || "–";
  return `${text(alt)} → ${text(neu)}`;
}

export function vorzeichen(belegart) {
  return belegart === "Gutschrift" ? -1 : 1;
}

/**
 * Budget-Hinweis je Projekt/Kostenart (Warnung, blockiert nie): gebunden = Ist + Obligo + diese Rechnung.
 * Schwellen wie PH Projekte Einstellungen (gelb ab 90 %, rot über 100 %), ohne Budget gelb.
 * @param {Array<{projekt:string, kostenart:string, betrag_cent:number}>} zeilen
 * @param {Record<string, {titel?:string, kostenarten: Record<string, {budget_cent:number, gebunden_cent:number}>}>} budgets
 * @returns {Array<{projekt:string, projektTitel:string, kostenart:string, budget_cent:number|null, gebunden_cent:number, prozent:number|null, stufe:"ok"|"gelb"|"rot"|"ohne"}>}
 */
export function budgetHinweise(zeilen = [], budgets = {}, { gelb = 90, rot = 100 } = {}, belegart = "Rechnung") {
  const summe = new Map();
  for (const z of zeilen) {
    if (!z.projekt || !z.kostenart) continue;
    const k = `${z.projekt}::${z.kostenart}`;
    summe.set(k, (summe.get(k) || 0) + vorzeichen(belegart) * i(z.betrag_cent));
  }
  const out = [];
  for (const [k, betrag] of summe) {
    const [projekt, kostenart] = k.split("::");
    const b = budgets[projekt];
    const zeile = b?.kostenarten?.[kostenart];
    const titel = b?.titel || projekt;
    if (!zeile || !i(zeile.budget_cent)) {
      out.push({ projekt, projektTitel: titel, kostenart, budget_cent: null, gebunden_cent: i(zeile?.gebunden_cent) + betrag, prozent: null, stufe: "ohne" });
      continue;
    }
    const gebunden = i(zeile.gebunden_cent) + betrag;
    const prozent = Math.round((gebunden * 100) / i(zeile.budget_cent));
    out.push({ projekt, projektTitel: titel, kostenart, budget_cent: i(zeile.budget_cent), gebunden_cent: gebunden, prozent, stufe: prozent > rot ? "rot" : prozent >= gelb ? "gelb" : "ok" });
  }
  return out;
}

/** Umbuchen erlaubt? Nur Leitung (Faktura/Projekte/Admin), Grund Pflicht. */
export function pruefeUmbuchen({ leitung, grund }) {
  if (!leitung) return { ok: false, code: "forbidden", text: "Umbuchen nur Faktura-Leitung" };
  if (!String(grund || "").trim()) return { ok: false, code: "invalid", text: "Bitte den Grund der Umbuchung angeben." };
  return { ok: true };
}
