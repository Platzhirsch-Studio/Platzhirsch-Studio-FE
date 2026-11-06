// Kassa – Scan-Erkennung (Team B-KAS). Port von Backend-Import/ph_kassa/ph_kassa/logik/codes.py (`erkennen`),
// gleiche Muster und Reihenfolge wie der Server (Konzept §2.6). Der Server hat inzwischen `page.code_erkennen`
// (Fähigkeit `kassa.code_erkennen`); dieser Port bleibt die Sofort-Entscheidung im Browser (Scan wirkt ohne
// Netz-Rundlauf) und die Grundlage im Mock. Reines Modul.

export const ARTEN = Object.freeze(["kundenkarte", "gutschein", "kassenbeleg", "rksv_qr", "auftrag", "rechnung", "bestellung", "ean", "suche"]);

const KK = /^KK-?[0-9A-Z]{6}$/;
const GS = /^(TEST-?)?PH-?([0-9A-Z]{4}-?){3}[0-9A-Z]{4}$/;
const AB = /^AB-\d{4}-\d{3,6}$/;
const RE = /^RE-\d{4}-\d{3,6}$/;
const BEST = /^PH-S-\d{2}\.?\d{2}\.?\d{2}-?\d{3,6}$|^PH-S-[0-9.-]+$/;
const BELEG = /^[A-Z0-9][A-Z0-9-]*-\d{6}$/;

/** GTIN-8/12/13/14 mit Modulo-10-Prüfziffer (wie ean_pruefziffer_ok). */
export function eanPruefzifferOk(code) {
  const s = String(code || "");
  if (!/^\d+$/.test(s) || ![8, 12, 13, 14].includes(s.length)) return false;
  const z = [...s].map(Number);
  const pruef = z.pop();
  const summe = z.reverse().reduce((a, d, i) => a + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (summe % 10)) % 10 === pruef;
}

/**
 * Code → {art, wert} (+ kassen_id/belegnummer beim RKSV-QR).
 * @param {string} code
 */
export function erkennen(code) {
  const roh = String(code ?? "").trim();
  if (!roh) return { art: "suche", wert: "" };
  if (roh.startsWith("_R1-AT")) {
    const teile = roh.split("_");
    return { art: "rksv_qr", wert: roh, kassen_id: teile.length > 3 ? teile[2] : null, belegnummer: teile.length > 3 ? teile[3] : null };
  }
  const gross = roh.toUpperCase().replace(/ /g, "");
  if (KK.test(gross)) return { art: "kundenkarte", wert: gross.includes("-") ? gross : `KK-${gross.slice(2)}` };
  if (AB.test(gross)) return { art: "auftrag", wert: gross };
  if (RE.test(gross)) return { art: "rechnung", wert: gross };
  if (gross.startsWith("PH-S-") && BEST.test(gross)) return { art: "bestellung", wert: gross };
  if (GS.test(gross)) return { art: "gutschein", wert: gross };
  if (/^\d+$/.test(gross) && eanPruefzifferOk(gross)) return { art: "ean", wert: gross };
  if (BELEG.test(gross)) return { art: "kassenbeleg", wert: gross };
  return { art: "suche", wert: roh };
}

/** Darf eine Eingabe im Suchfeld schon suchen? (§2.4: ab 2 Zeichen, reine Ziffern erst ab 4). */
export function suchbar(text) {
  const t = String(text || "").trim();
  if (t.length < 2) return false;
  if (/^\d+$/.test(t) && t.length < 4) return false;
  return true;
}

/**
 * Was darf ein Scan im aktuellen Kassenzustand? (§2.6, Fokusmodell §2.4)
 * @param {string} art erkannte Art
 * @param {"bon"|"zahlmaske"|"karte"|"ergebnis"|"dialog"} zustand
 * @returns {{wirkt:boolean, hinweis?:string}}
 */
export function scanErlaubt(art, zustand) {
  if (zustand === "karte") return { wirkt: false, hinweis: "zahlungLaeuft" };
  if (zustand === "dialog") return { wirkt: false, hinweis: "eingabeBeenden" };
  if (zustand === "zahlmaske") return ["gutschein", "kundenkarte"].includes(art) ? { wirkt: true } : { wirkt: false, hinweis: "zahlungBeenden" };
  return { wirkt: true };
}
