// Fristen Gewährleistung/Garantie/Regress – Spiegel von ph_service/fristen.py (inkl. `sachart`), nur für die
// Live-Vorschau im Backoffice (10-konzept-service §3.2). Nach dem Speichern gelten die Werte des Servers.
// Reines Modul (keine "@/"-Importe), testbar mit node --test.

export const GEWAEHRLEISTUNG_MONATE = 24;
export const GEWAEHRLEISTUNG_UNBEWEGLICH_MONATE = 36;
export const VERMUTUNG_UNBEWEGLICH_MONATE = 6;
export const VERJAEHRUNG_MONATE = 3;
export const VERMUTUNG_MONATE = Object.freeze({ Verbraucher: 12, Unternehmer: 6 });
export const REGRESS_MONATE = 2;
export const REGRESS_ABSOLUT_JAHRE = 5;

export const STATUS = Object.freeze({
  vermutung: "Gewaehrleistung (Vermutung)",
  gewaehrleistung: "Gewaehrleistung",
  verjaehrung: "Verjaehrungsfrist",
  garantie: "Nur Garantie",
  abgelaufen: "Abgelaufen",
  unbekannt: "Unbekannt",
});

const TAG_MS = 86_400_000;

/** "2026-11-04" | Date | "2026-11-04 09:12:00" → Date (UTC-Mitternacht) oder null. */
export function alsDatum(wert) {
  if (wert === null || wert === undefined || wert === "") return null;
  if (wert instanceof Date) return Number.isNaN(wert.getTime()) ? null : new Date(Date.UTC(wert.getFullYear(), wert.getMonth(), wert.getDate()));
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(wert));
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Date → "JJJJ-MM-TT". */
export function iso(d) {
  return d ? d.toISOString().slice(0, 10) : null;
}

function schaltjahr(j) {
  return j % 4 === 0 && (j % 100 !== 0 || j % 400 === 0);
}

/** Datum + Monate, Monatsende-sicher (31.01. + 1 Monat = 28./29.02.) – wie monate_dazu() in fristen.py. */
export function monateDazu(wert, monate) {
  const d = alsDatum(wert);
  if (!d) return null;
  const n = Math.trunc(Number(monate) || 0);
  const gesamt = d.getUTCMonth() + n;
  const jahr = d.getUTCFullYear() + Math.floor(gesamt / 12);
  const monat = ((gesamt % 12) + 12) % 12;
  const tage = [31, schaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return new Date(Date.UTC(jahr, monat, Math.min(d.getUTCDate(), tage[monat])));
}

/** Tage von `heute` bis `datum` (negativ = vorbei). */
export function tageBis(datum, heute = new Date()) {
  const d = alsDatum(datum);
  const h = alsDatum(heute);
  if (!d || !h) return null;
  return Math.round((d.getTime() - h.getTime()) / TAG_MS);
}

/**
 * Alle Fristen eines Servicefalls (Spiegel von fristen.fristen()).
 * @returns {{basis:string|null, gewaehrleistung_bis:string|null, beweislast_bis:string|null, verjaehrung_bis:string|null,
 *   garantie_bis:string|null, regress_frist_bis:string|null, regress_absolut_bis:string|null, status:string,
 *   tage_rest:number|null, beweislast:"Unternehmer"|"Kunde"|null, garantie_aktiv:boolean}}
 */
export function fristen({
  kaufdatum = null,
  uebergabe = null,
  kundentyp = "Verbraucher",
  garantie_monate = 0,
  heute = new Date(),
  gewaehrleistung_monate = GEWAEHRLEISTUNG_MONATE,
  vermutung_monate = null,
  erledigt_am = null,
  lieferung_an_haendler = null,
  sachart = "Beweglich",
} = {}) {
  const h = alsDatum(heute) || alsDatum(new Date());
  const basis = alsDatum(uebergabe) || alsDatum(kaufdatum);
  const typ = kundentyp in VERMUTUNG_MONATE ? kundentyp : "Verbraucher";
  let gwlMonate = Number(gewaehrleistung_monate) || GEWAEHRLEISTUNG_MONATE;
  let vermMonate = vermutung_monate === null || vermutung_monate === undefined || vermutung_monate === "" ? null : Number(vermutung_monate);
  if (sachart === "Unbeweglich") {
    gwlMonate = Math.max(gwlMonate, GEWAEHRLEISTUNG_UNBEWEGLICH_MONATE);
    vermMonate = vermMonate === null ? VERMUTUNG_UNBEWEGLICH_MONATE : Math.min(vermMonate, VERMUTUNG_UNBEWEGLICH_MONATE);
  }
  if (vermMonate === null) vermMonate = VERMUTUNG_MONATE[typ];

  const out = {
    basis: iso(basis),
    gewaehrleistung_bis: null,
    beweislast_bis: null,
    verjaehrung_bis: null,
    garantie_bis: null,
    regress_frist_bis: null,
    regress_absolut_bis: null,
    status: STATUS.unbekannt,
    tage_rest: null,
    beweislast: null,
    garantie_aktiv: false,
  };
  const erledigt = alsDatum(erledigt_am);
  if (erledigt) out.regress_frist_bis = iso(monateDazu(erledigt, REGRESS_MONATE));
  const haendler = alsDatum(lieferung_an_haendler);
  if (haendler) out.regress_absolut_bis = iso(monateDazu(haendler, REGRESS_ABSOLUT_JAHRE * 12));
  if (!basis) return out;

  const gwl = monateDazu(basis, gwlMonate);
  const vermutung = monateDazu(basis, vermMonate);
  const verjaehrung = monateDazu(gwl, VERJAEHRUNG_MONATE);
  const gm = Number(garantie_monate) || 0;
  const garantie = gm > 0 ? monateDazu(basis, gm) : null;
  out.gewaehrleistung_bis = iso(gwl);
  out.beweislast_bis = iso(vermutung);
  out.verjaehrung_bis = iso(verjaehrung);
  out.garantie_bis = iso(garantie);
  out.garantie_aktiv = !!(garantie && h <= garantie);
  out.tage_rest = tageBis(gwl, h);
  if (h <= vermutung) Object.assign(out, { status: STATUS.vermutung, beweislast: "Unternehmer" });
  else if (h <= gwl) Object.assign(out, { status: STATUS.gewaehrleistung, beweislast: "Kunde" });
  else if (h <= verjaehrung) Object.assign(out, { status: STATUS.verjaehrung, beweislast: "Kunde" });
  else if (out.garantie_aktiv) Object.assign(out, { status: STATUS.garantie, beweislast: null });
  else Object.assign(out, { status: STATUS.abgelaufen, beweislast: null });
  return out;
}

/** Reaktionsfrist = gemeldet + n Werktage (Sa/So übersprungen) – wie reaktionsfrist() in fristen.py. */
export function reaktionsfrist(gemeldetAm, werktage = 2) {
  let d = alsDatum(gemeldetAm);
  if (!d) return null;
  let rest = Math.trunc(Number(werktage) || 0);
  while (rest > 0) {
    d = new Date(d.getTime() + TAG_MS);
    const wt = d.getUTCDay();
    if (wt !== 0 && wt !== 6) rest -= 1;
  }
  return iso(d);
}

/** Durchlaufzeit in Tagen (gemeldet → erledigt bzw. heute). */
export function durchlaufzeitTage(gemeldetAm, erledigtAm, heute = new Date()) {
  const start = alsDatum(gemeldetAm);
  if (!start) return null;
  const ende = alsDatum(erledigtAm) || alsDatum(heute);
  return Math.max(0, Math.round((ende.getTime() - start.getTime()) / TAG_MS));
}
