// Packlogik des Packtischs nach JTL (33-referenz-jtl-packtisch § 4, ph_logistik packtisch_regeln.py) und
// 10-konzept-logistik § 6.2. Spiegelt die Server-Regeln für die sofortige Rückmeldung am Gerät (< 100 ms);
// die Wahrheit bleibt beim Server (`scan_menge`, `verpacken`). Reines Modul.

export const OHNE_PLATZ = "(ohne Platz)";

function offen(p) {
  return Math.max(Number(p.menge || 0) - Number(p.menge_gepackt || 0), 0);
}

/** Position ohne Barcode (keine EAN/SN) – wird von Hand bestätigt (M4). */
export function ohneBarcode(p) {
  return !String(p.ean || "").trim() && !String(p.seriennummer || "").trim();
}

/** Positions-ID (Zeilenname, sonst idx). */
export function posId(p) {
  return p.name || `idx-${p.idx}`;
}

/** Zustand einer Zeile: fertig · aktiv (gerade gescannt) · manuell (ohne Barcode) · offen. Farbe immer + Text + Symbol. */
export function zeilenZustand(p, aktivId) {
  if (offen(p) === 0 && Number(p.menge) > 0) return "fertig";
  if (aktivId && posId(p) === aktivId) return "aktiv";
  if (ohneBarcode(p)) return "manuell";
  return "offen";
}

/** Erledigte rutschen nach unten, die aktive Zeile nach oben, sonst Originalreihenfolge. */
export function sortierePositionen(positionen = [], aktivId) {
  return positionen
    .map((p, i) => ({ p, i, z: zeilenZustand(p, aktivId) }))
    .sort((a, b) => (a.z === "fertig") - (b.z === "fertig") || (b.z === "aktiv") - (a.z === "aktiv") || a.i - b.i)
    .map((x) => x.p);
}

export function fortschritt(positionen = []) {
  const n = positionen.length;
  const fertig = positionen.filter((p) => offen(p) === 0 && Number(p.menge) > 0).length;
  const stueck = positionen.reduce((s, p) => s + Math.min(Number(p.menge_gepackt || 0), Number(p.menge || 0)), 0);
  const stueckGes = positionen.reduce((s, p) => s + Number(p.menge || 0), 0);
  return { positionen: n, fertig, offen: n - fertig, stueck, stueckGes, alleFertig: n > 0 && fertig === n, anteil: n ? fertig / n : 0 };
}

/** Trefferposition zu einem Code: EAN, Seriennummer, Slug, Produkt – unvollständige zuerst (JTL „wenigste offen“). */
export function findePosition(positionen = [], code) {
  const c = String(code || "").trim();
  if (!c) return null;
  const slug = c.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop().toLowerCase();
  const passt = positionen.filter((p) => (p.ean && p.ean === c) || (p.seriennummer && p.seriennummer.toLowerCase() === c.toLowerCase()) || (p.slug && p.slug.toLowerCase() === slug) || (p.produkt && p.produkt === c));
  if (!passt.length) return null;
  return passt.find((p) => offen(p) > 0) || passt[0];
}

/**
 * Mengenprüfung wie `packtisch_regeln.menge_pruefen`.
 * @returns {{ok:boolean, anzahl:number, bestaetigen:boolean, fehler:null|"ungueltig"|"vollstaendig"|"zu_viel", offen:number}}
 */
export function mengePruefen(p, anzahl = 1, { mengenBestaetigen = true, bestaetigt = false } = {}) {
  const n = anzahl === "" || anzahl === null || anzahl === undefined ? 1 : Math.trunc(Number(anzahl));
  const o = offen(p);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, anzahl: 0, bestaetigen: false, fehler: "ungueltig", offen: o };
  if (o <= 0) return { ok: false, anzahl: n, bestaetigen: false, fehler: "vollstaendig", offen: o };
  if (n > o) return { ok: false, anzahl: n, bestaetigen: false, fehler: "zu_viel", offen: o };
  if (mengenBestaetigen && n > 1 && !bestaetigt) return { ok: false, anzahl: n, bestaetigen: true, fehler: null, offen: o };
  return { ok: true, anzahl: n, bestaetigen: false, fehler: null, offen: o };
}

/**
 * Wendet einen Scan lokal an (optimistisch). Liefert das Ergebnis für Ring/Text/Ton und den neuen Stand.
 * @returns {{ergebnis:"erkannt"|"vollstaendig"|"zu_viel"|"bestaetigen"|"unbekannt"|"ungueltig", position:object|null, positionen:object[], anzahl:number}}
 */
export function wendeScanAn(positionen, code, anzahl = 1, opts = {}) {
  const p = findePosition(positionen, code);
  if (!p) return { ergebnis: "unbekannt", position: null, positionen, anzahl: 0 };
  const m = mengePruefen(p, anzahl, opts);
  if (m.bestaetigen) return { ergebnis: "bestaetigen", position: p, positionen, anzahl: m.anzahl };
  if (!m.ok) return { ergebnis: m.fehler, position: p, positionen, anzahl: m.anzahl };
  return { ergebnis: "erkannt", position: p, positionen: setzeMenge(positionen, posId(p), Number(p.menge_gepackt || 0) + m.anzahl), anzahl: m.anzahl };
}

/** Absoluter Stand einer Position (Offline-Puffer `positionen_setzen`). */
export function setzeMenge(positionen, id, menge) {
  return positionen.map((p) => {
    if (posId(p) !== id) return p;
    const m = Math.max(0, Math.min(Number(menge), Number(p.menge || 0)));
    return { ...p, menge_gepackt: m, gepackt: m >= Number(p.menge || 0) ? 1 : 0 };
  });
}

/** Stand aller Positionen als {id: menge_gepackt} für `positionen_setzen`. */
export function standAus(positionen = []) {
  return Object.fromEntries(positionen.map((p) => [posId(p), Number(p.menge_gepackt || 0)]));
}

/** Gewichts-Plausibilität wie `gewicht_plausibel` (Standard-Toleranzen der App: 250 ‰, mindestens 300 g). */
export function gewichtPlausibel(manuellG, vorschlagG, { toleranzPromille = 250, toleranzMinG = 300, maxG = null } = {}) {
  const m = Math.trunc(Number(manuellG || 0));
  if (m <= 0) return { ok: false, grund: "gewicht_fehlt", von: null, bis: null };
  if (maxG && m > Number(maxG)) return { ok: false, grund: "ueber_profilgrenze", von: null, bis: Number(maxG) };
  if (!vorschlagG) return { ok: true, grund: null, von: null, bis: null };
  const v = Math.trunc(Number(vorschlagG));
  const tol = Math.max(Math.trunc((v * Number(toleranzPromille || 0)) / 1000), Number(toleranzMinG || 0));
  return { ok: Math.abs(m - v) <= tol, grund: Math.abs(m - v) <= tol ? null : "abweichung", von: Math.max(0, v - tol), bis: v + tol };
}

/**
 * Sperrgründe vor „Verpacken“ wie `verpacken_pruefen` (leer = darf).
 * @returns {string[]}
 */
export function verpackenPruefen({ positionen = [], pakete = [], lieferart, gewichtPflicht = true, hinweiseOffen = 0, zurueckgestellt = false, teillieferung = false }) {
  const g = [];
  if (zurueckgestellt) g.push("zurueckgestellt");
  const gepackt = positionen.reduce((s, p) => s + Number(p.menge_gepackt || 0), 0);
  if (teillieferung) {
    if (gepackt <= 0) g.push("nichts_gepackt");
  } else if (!positionen.length || positionen.some((p) => offen(p) > 0)) g.push("nicht_alles_gepackt");
  if (lieferart === "Versand" || lieferart === "Spedition") {
    if (!pakete.length) g.push("keine_pakete");
    else if (gewichtPflicht) for (const pk of pakete) if (!(Number(pk.gewicht_g) > 0)) g.push(`gewicht_paket_${pk.paket_nr}`);
  }
  if (hinweiseOffen) g.push("packhinweise_bestaetigen");
  return g;
}

/**
 * Die eine Primärtaste der Pack-Ansicht je Lieferart (E1, § 6.2; Lounge „Paket abschließen“ / „An Tour übergeben“).
 * @returns {{id:"verpacken"|"abholbereit"|"gepackt", titel:string, verzoegert:boolean}}
 */
export function primaerAktion(ls) {
  switch (ls?.lieferart) {
    case "Versand":
      return { id: "verpacken", titel: "Paket abschließen", verzoegert: false };
    case "Abholung":
      return { id: "abholbereit", titel: "Abholbereit melden", verzoegert: true };
    case "Eigenlieferung":
      return { id: "gepackt", titel: ls?.tour ? "An Tour übergeben" : "Gepackt melden", verzoegert: true };
    default:
      return { id: "gepackt", titel: "Gepackt melden", verzoegert: true };
  }
}

/** Packhinweise aus Regeln + Lieferschein (Glas, Geschenk, Kommission, Lieferhinweis). */
export function packhinweise(ls, regeln = []) {
  const out = [];
  const land = ls?.liefer_land || "AT";
  for (const r of regeln) {
    if (!Number(r.aktiv ?? 1)) continue;
    if (r.lieferart && r.lieferart !== ls?.lieferart) continue;
    if (Number(r.nur_zerbrechlich) && !Number(ls?.zerbrechlich)) continue;
    if (r.laender && !String(r.laender).split(/[,\s]+/).filter(Boolean).includes(land)) continue;
    out.push({ id: r.name || r.bezeichnung, text: r.hinweis || r.bezeichnung, ton: r.ton || "eiche", icon: r.icon || "Wine", bestaetigen: !!Number(r.bestaetigen) });
  }
  if (Number(ls?.geschenk)) out.push({ id: "geschenk", text: "Geschenk – Rechnung nicht beilegen.", ton: "cognac", icon: "Gift", bestaetigen: false });
  if (ls?.kommission) out.push({ id: "kommission", text: `Kommission ${ls.kommission} – Etikett je Packstück.`, ton: "see", icon: "Tag", bestaetigen: false });
  if (ls?.lieferhinweis) out.push({ id: "lieferhinweis", text: ls.lieferhinweis, ton: "stein", icon: "MapPin", bestaetigen: false });
  return out;
}
