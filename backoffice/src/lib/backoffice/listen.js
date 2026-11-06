// Listen-Parameter aus searchParams (serverseitige Pagination, Sortierung,
// Filterleiste) → Frappe-Filter. Reines Modul.

export const SEITENGROESSE = 25;

/**
 * @param {Record<string,string|string[]|undefined>} sp  searchParams
 * @param {object} meta
 * @param {{standardSort?:string}} [opts]
 */
export function listenAbfrage(sp = {}, meta, opts = {}) {
  const get = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || "";
  const seite = Math.max(1, parseInt(get("seite"), 10) || 1);
  const groesse = Math.min(100, Math.max(5, parseInt(get("n"), 10) || SEITENGROESSE));
  const sortFeld = /^[a-z0-9_]+$/i.test(get("sort")) ? get("sort") : "";
  const richtung = get("r") === "asc" ? "asc" : "desc";
  const orderBy = sortFeld ? `${sortFeld} ${richtung}` : opts.standardSort || `${meta?.sort_field || "modified"} ${(meta?.sort_order || "DESC").toLowerCase()}`;

  const filters = [];
  const status = get("status");
  if (status) filters.push(["status", status.includes(",") ? "in" : "=", status.includes(",") ? status.split(",") : status]);
  const von = get("von");
  const bis = get("bis");
  const datumsfeld = datumsFeld(meta);
  if (datumsfeld && (von || bis)) filters.push([datumsfeld, "between", [von || "1900-01-01", bis || "2999-12-31"]]);
  for (const [k, v] of Object.entries(sp)) {
    const m = /^f_([a-z0-9_]+)$/i.exec(k);
    const wert = Array.isArray(v) ? v[0] : v;
    if (m && wert) filters.push([m[1], "=", wert]);
  }

  const q = get("q").trim().slice(0, 80);
  let orFilters = [];
  if (q && meta) {
    const felder = new Set(["name", meta.title_field, ...(meta.search_fields || [])].filter(Boolean));
    orFilters = [...felder].map((f) => [f, "like", `%${q}%`]);
  }

  return { seite, groesse, start: (seite - 1) * groesse, limit: groesse, orderBy, sortFeld, richtung, filters, orFilters, q, status, von, bis, datumsfeld };
}

/** Feld für den Datumsfilter: erstes Datetime/Date-Feld in Listenreihenfolge, sonst modified. */
export function datumsFeld(meta) {
  if (!meta) return "modified";
  const bevorzugt = ["eingang", "datum", "zeitpunkt", "start", "angelegt", "gemeldet_am", "datum_uhrzeit", "faellig"];
  for (const b of bevorzugt) if (meta.fields.some((f) => f.fieldname === b)) return b;
  const erstes = meta.fields.find((f) => f.fieldtype === "Datetime" || f.fieldtype === "Date");
  return erstes?.fieldname || "modified";
}

/** Baut eine URL mit geänderten Parametern (Paging-/Sortier-Links). */
export function mitParametern(basis, sp, aenderungen) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp || {})) {
    const wert = Array.isArray(v) ? v[0] : v;
    if (wert) u.set(k, wert);
  }
  for (const [k, v] of Object.entries(aenderungen || {})) {
    if (v === null || v === undefined || v === "") u.delete(k);
    else u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `${basis}?${s}` : basis;
}
