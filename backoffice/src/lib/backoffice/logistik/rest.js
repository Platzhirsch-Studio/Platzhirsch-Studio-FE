// Restmengen für „Lieferschein erzeugen“ (10-konzept-logistik § 5.1, E8, E9).
// Rest = bestellt − geliefert − Σ offene Lieferscheine (nicht storniert, nicht zugestellt) je Belegposition.
// Dezimalmengen (lfm, m²) kann der Lieferschein noch nicht abbilden (Anfrage A4) → gesperrt mit Text. Reines Modul.

export function istGanzzahl(x) {
  const n = Number(x);
  return Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-9;
}

/** Schlüssel einer Belegposition: Zeilenname, sonst „<Beleg>:<idx>“ (Mock-Zeilen haben keinen Namen). */
export function positionsSchluessel(beleg, zeile) {
  return zeile?.name || `${beleg}:${zeile?.idx ?? 0}`;
}

/** Nur Produkt- und Leistungszeilen, keine Alternativen (§ 5.1). */
export function lieferbar(zeile) {
  return ["Produkt", "Leistung"].includes(zeile?.art) && !Number(zeile?.alternativ);
}

/**
 * @param {{beleg:string, positionen:object[], offeneLieferscheine?:Array<{name:string, status:string, positionen:object[]}>}} p
 * @returns {Array<{schluessel:string, idx:number, bezeichnung:string, einheit:string, bestellt:number, geliefert:number, inLieferung:number, rest:number, dezimal:boolean, inLieferscheinen:string[]}>}
 */
export function restJePosition({ beleg, positionen = [], offeneLieferscheine = [] }) {
  const inLieferung = new Map();
  const wo = new Map();
  for (const ls of offeneLieferscheine) {
    if (["Storniert", "Zugestellt"].includes(ls.status)) continue;
    for (const p of ls.positionen || []) {
      if (!p.beleg_position) continue;
      inLieferung.set(p.beleg_position, (inLieferung.get(p.beleg_position) || 0) + Number(p.menge || 0));
      wo.set(p.beleg_position, [...(wo.get(p.beleg_position) || []), ls.name]);
    }
  }
  return positionen.filter(lieferbar).map((z) => {
    const schluessel = positionsSchluessel(beleg, z);
    const bestellt = Number(z.menge || 0);
    const geliefert = Number(z.lieferschein_menge || 0);
    const offen = inLieferung.get(schluessel) || 0;
    const dezimal = !istGanzzahl(bestellt) || !istGanzzahl(geliefert);
    return {
      schluessel,
      idx: Number(z.idx || 0),
      bezeichnung: z.bezeichnung || z.beschreibung || "Position",
      ausfuehrung: z.ausfuehrung_text || "",
      einheit: z.einheit || "Stk",
      bestellt,
      geliefert,
      inLieferung: offen,
      rest: Math.max(0, bestellt - geliefert - offen),
      dezimal,
      inLieferscheinen: wo.get(schluessel) || [],
    };
  });
}

/**
 * Prüft gewünschte Mengen gegen den Rest (Server-Rest kann kleiner sein als beim Öffnen).
 * @param {ReturnType<typeof restJePosition>} rest
 * @param {Record<string, number>} mengen  schluessel → Menge
 * @returns {{ok:boolean, fehler:Array<{schluessel:string, text:string}>, positionen:Array<{schluessel:string, menge:number}>}}
 */
export function pruefeMengen(rest, mengen = {}) {
  const fehler = [];
  const positionen = [];
  for (const r of rest) {
    const roh = mengen[r.schluessel];
    if (roh === undefined || roh === null || roh === "" || Number(roh) === 0) continue;
    const m = Number(roh);
    if (!Number.isFinite(m) || m < 0) {
      fehler.push({ schluessel: r.schluessel, text: `Position ${r.idx}: Menge ungültig.` });
      continue;
    }
    if (r.dezimal || !istGanzzahl(m)) {
      fehler.push({ schluessel: r.schluessel, text: `${String(m).replace(".", ",")} ${r.einheit} kann der Lieferschein noch nicht abbilden – Position über Faktura/Projekt klären` });
      continue;
    }
    if (m > r.rest) {
      const wo = r.inLieferscheinen.length ? ` (${r.inLieferung} in ${r.inLieferscheinen.join(", ")})` : "";
      fehler.push({ schluessel: r.schluessel, text: `Position ${r.idx}: nur noch ${r.rest} offen${wo}` });
      continue;
    }
    positionen.push({ schluessel: r.schluessel, menge: m });
  }
  if (!fehler.length && !positionen.length) fehler.push({ schluessel: "", text: "Mindestens eine Position mit Menge > 0." });
  return { ok: fehler.length === 0, fehler, positionen };
}
