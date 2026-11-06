// CSV-Export (Excel-tauglich: Semikolon, BOM, Anführungszeichen). Reines Modul.

import { cent, datum, datumZeit } from "./format.js";

function zelle(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {Array<{fieldname:string,label:string,fieldtype?:string,cent?:boolean}>} spalten
 * @param {object[]} zeilen
 */
export function alsCsv(spalten, zeilen) {
  const kopf = spalten.map((s) => zelle(s.label || s.fieldname)).join(";");
  const body = zeilen.map((z) =>
    spalten
      .map((s) => {
        const v = z[s.fieldname];
        if (s.cent) return zelle(v === null || v === undefined || v === "" ? "" : (Number(v) / 100).toFixed(2).replace(".", ","));
        if (s.fieldtype === "Date") return zelle(v ? datum(v) : "");
        if (s.fieldtype === "Datetime") return zelle(v ? datumZeit(v) : "");
        if (s.fieldtype === "Check") return zelle(v ? "ja" : "nein");
        return zelle(v);
      })
      .join(";")
  );
  return `﻿${[kopf, ...body].join("\r\n")}\r\n`;
}

export { cent };
