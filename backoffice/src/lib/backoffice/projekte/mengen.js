// Mengen (10-konzept-projekte.md E10, MASTER Q-D6): bis das Backend Dezimalmengen + Einheit trägt (Fähigkeit
// projekte.mengen_dezimal) nur ganze Zahlen. „3,6“ wird abgelehnt – nie still gerundet. Reines Modul.

/**
 * @param {string|number} eingabe
 * @param {{dezimal?:boolean}} [opts]
 * @returns {{ok:true, wert:number} | {ok:false, fehler:string}}
 */
export function parseMenge(eingabe, { dezimal = false } = {}) {
  const t = String(eingabe ?? "").trim().replace(/\s/g, "");
  if (!t) return { ok: false, fehler: "Menge fehlt." };
  if (dezimal) {
    if (!/^\d+(?:[.,]\d{1,3})?$/.test(t)) return { ok: false, fehler: "Menge mit höchstens drei Nachkommastellen." };
    const n = Number(t.replace(",", "."));
    return n > 0 ? { ok: true, wert: n } : { ok: false, fehler: "Menge muss größer als 0 sein." };
  }
  if (/^\d+[.,]\d+$/.test(t)) return { ok: false, fehler: "Dezimalmengen folgen – 3,6 lfm vorerst in der Ausführung notieren." };
  if (!/^\d+$/.test(t)) return { ok: false, fehler: "Menge als ganze Zahl." };
  const n = Number(t);
  return n > 0 ? { ok: true, wert: n } : { ok: false, fehler: "Menge muss größer als 0 sein." };
}

/** Anzeige „3 Stk.“ bzw. mit Dezimal „2,5 lfm“. */
export function mengeText(menge, einheit = "Stk.") {
  const n = Number(menge || 0);
  return `${n.toLocaleString("de-DE", { maximumFractionDigits: 3 })} ${einheit}`;
}
