// Schalter des Bereichs Logistik (10-konzept-logistik § 3.7). Standard in Klammern dort; Freigabe durch
// Backend-Anfrage bzw. Inhaber. Überschreiben (Betrieb/QA): BACKOFFICE_LOGISTIK_SCHALTER="teilzustellung,-anzahlungHart".
// Reines Modul.

export const SCHALTER_STANDARD = Object.freeze({
  teilzustellung: false, // ph_logistik A7
  ruecklieferung: false, // A5
  steuernachweisFelder: false, // A9
  mengenDezimal: false, // A4
  mobileKassa: false, // Kassa-Konzept + StB
  zeitstempelAnzeigen: false, // Inhaber (Betriebsvereinbarung/Zustimmung)
  anzahlungHart: true, // Inhaber § 12.4 – strengste Variante bis zur Antwort
  tonUnbekannt: true, // je Gerät, Leitung Logistik
});

/**
 * @param {string} [text] z. B. "teilzustellung,-anzahlungHart"
 * @returns {Record<keyof typeof SCHALTER_STANDARD, boolean>}
 */
export function schalter(text = typeof process !== "undefined" ? process.env?.BACKOFFICE_LOGISTIK_SCHALTER : "") {
  const out = { ...SCHALTER_STANDARD };
  for (const roh of String(text || "").split(",")) {
    const t = roh.trim();
    if (!t) continue;
    const aus = t.startsWith("-");
    const name = t.replace(/^[-+]/, "");
    if (name in out) out[name] = !aus;
  }
  return out;
}
