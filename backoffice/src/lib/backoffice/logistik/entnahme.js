// Entnahme-Vorschlag je Lieferschein-Position (10-konzept-logistik § 6.2, B2). Reihenfolge: SN-Treffer ·
// für diese AB/Bestellung reserviert · Kommission des Lieferscheins · Packtisch-Lagerort · Standard-Lagerort;
// nur verfügbar und nicht gesperrt. Mehrdeutig → „Entnahme wählen“. Reines Modul.

function passtProdukt(b, pos) {
  if (pos.produkt && b.produkt) return b.produkt === pos.produkt;
  if (pos.ean && b.ean) return b.ean === pos.ean;
  return false;
}

function frei(b) {
  return !Number(b.gesperrt) && b.status !== "Gesperrt" && b.status !== "Verkauft" && b.status !== "Ausgeschieden";
}

/**
 * @param {object} pos  Lieferschein-Position
 * @param {object[]} bestaende  PH Lagerbestand-Zeilen
 * @param {{auftrag?:string, bestellung?:string, kommission?:string, packtischLagerort?:string, standardLagerort?:string, menge?:number}} ctx
 * @returns {{lagerbestand:string|null, mehrdeutig:boolean, kandidaten:object[], text:string, grund:string}}
 */
export function entnahmeVorschlag(pos, bestaende = [], ctx = {}) {
  if (pos.lagerbestand) {
    const b = bestaende.find((x) => x.name === pos.lagerbestand);
    return { lagerbestand: pos.lagerbestand, mehrdeutig: false, kandidaten: b ? [b] : [], text: b ? ortText(b) : "Entnahme gesetzt", grund: "gesetzt" };
  }
  const menge = Number(ctx.menge ?? pos.menge ?? 1);
  if (pos.seriennummer) {
    const sn = bestaende.filter((b) => b.seriennummer === pos.seriennummer && frei(b));
    if (sn.length === 1) return treffer(sn[0], "seriennummer");
  }
  const passend = bestaende.filter((b) => passtProdukt(b, pos) && frei(b));
  const reserviert = passend.filter((b) => b.reserviert_fuer && (b.reserviert_fuer === ctx.auftrag || b.reserviert_fuer === ctx.bestellung));
  if (reserviert.length === 1) return treffer(reserviert[0], "reserviert");
  if (ctx.kommission) {
    const k = passend.filter((b) => b.kommission === ctx.kommission);
    if (k.length === 1) return treffer(k[0], "kommission");
  }
  const verfuegbar = passend.filter((b) => b.status === "Verfuegbar" && Number(b.verfuegbar ?? b.menge) >= menge);
  for (const ort of [ctx.packtischLagerort, ctx.standardLagerort].filter(Boolean)) {
    const amOrt = verfuegbar.filter((b) => b.lagerort === ort);
    if (amOrt.length === 1) return treffer(amOrt[0], "lagerort");
    if (amOrt.length > 1) return { lagerbestand: null, mehrdeutig: true, kandidaten: amOrt, text: "Entnahme wählen", grund: "mehrdeutig" };
  }
  if (verfuegbar.length === 1) return treffer(verfuegbar[0], "einzig");
  if (verfuegbar.length > 1) return { lagerbestand: null, mehrdeutig: true, kandidaten: verfuegbar, text: "Entnahme wählen", grund: "mehrdeutig" };
  return { lagerbestand: null, mehrdeutig: false, kandidaten: [], text: "Ort unbekannt", grund: "keiner" };
}

function treffer(b, grund) {
  return { lagerbestand: b.name, mehrdeutig: false, kandidaten: [b], text: ortText(b), grund };
}

export function ortText(b) {
  return [b.lagerort, b.platz].filter(Boolean).join(" · ") || "Ort unbekannt";
}
