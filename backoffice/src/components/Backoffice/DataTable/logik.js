// Reine Logik der Liste (Team P0-5b) – ohne JSX, testbar mit node --test.

const STATUS = ["status", "workflow_state"];
const NEBEN = ["name", "modified", ...STATUS];
const PERSON_FELD = /(^|_)(zugewiesen_an|berater|beraterin|verantwortlich|bearbeiter|bearbeitet_von|erledigt_von|owner|mitarbeiter|monteur|fahrer|zustaendig)$/;

/** Spalte zeigt eine Person (Avatar je Zeile): Link auf User oder sprechender Feldname. */
export function istPersonSpalte(s) {
  if (!s) return false;
  if (s.person === true) return true;
  if (s.person === false) return false;
  return (s.fieldtype === "Link" && s.options === "User") || PERSON_FELD.test(String(s.fieldname || ""));
}

/** „lena.moosbrugger@demo.local“ → „Lena Moosbrugger“; Namen bleiben, wie sie sind. */
export function personName(wert) {
  const s = String(wert ?? "").trim();
  if (!s) return "";
  if (!s.includes("@")) return s;
  const lokal = s.split("@")[0].replace(/[._-]+/g, " ").trim();
  return lokal.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/**
 * Kopfzelle der Zeile (Lounge: Bild/Avatar + Titel + Unterzeile statt getrennter Nr.-Spalte).
 * Greift, wenn die erste sichtbare Spalte „name“ ist und eine Titelspalte folgt (oder `titelFeld` gesetzt ist).
 * @returns {{titel:object|null, nr:object|null, spalten:object[]}}  spalten = übrige Spalten in Reihenfolge
 */
export function zeilenAufbau(sichtbar = [], { titelFeld, zusammenfassen = true } = {}) {
  if (!zusammenfassen || !sichtbar.length) return { titel: null, nr: null, spalten: sichtbar };
  const nr = sichtbar.find((s) => s.fieldname === "name") || null;
  let titel = titelFeld ? sichtbar.find((s) => s.fieldname === titelFeld) : null;
  if (!titel && nr && sichtbar[0] === nr) titel = sichtbar.find((s) => !NEBEN.includes(s.fieldname) && !istPersonSpalte(s) && !s.cent && !["Date", "Datetime", "Check", "Int", "Float", "Currency"].includes(s.fieldtype)) || null;
  if (!titel) return { titel: null, nr: null, spalten: sichtbar };
  return { titel, nr, spalten: sichtbar.filter((s) => s !== titel && s !== nr) };
}

/** Spalte bricht nicht um (Nr., Datum, Zahl, Status, einzeilige Werte). */
export function ohneUmbruch(s) {
  return s.fieldname === "name" || s.cent || STATUS.includes(s.fieldname) || ["Date", "Datetime", "Int", "Float", "Currency", "Data", "Link", "Select"].includes(s.fieldtype);
}

/** Rechtsbündig (Beträge, Zahlen). */
export function rechtsbuendig(s) {
  return !!s.cent || ["Int", "Float", "Currency", "Percent"].includes(s.fieldtype);
}

/** Aktive Filter in den Listen-Parametern (für den Leer-Fall „gefiltert“). */
export function hatFilter(params = {}) {
  return Object.keys(params).some((k) => ["status", "von", "bis", "q"].includes(k) || k.startsWith("f_"));
}

export { STATUS as STATUS_FELDER };
