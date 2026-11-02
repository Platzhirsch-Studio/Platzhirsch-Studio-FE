// EUR/CHF-Referenzkurs der EZB (nur Server).
// Quelle: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
// Cache: Next-Data-Cache 12 h (fetch revalidate). Fallback-Kette (rate.js):
// EZB → zuletzt gespeicherter Kurs (.data/dreilaender/ecb-last.json) → fester
// Wert aus der Konfiguration (EZB 23.10.2026: 0,9227) → kein Kurs. Jede Stufe
// liefert Datum und Alter mit; die Seite zeigt den Stand sichtbar an.
import { readLastRate, saveLastRate, getConfig } from "./store.server";
import { parseEcbXml, resolveEurChf } from "./rate";

export { parseEcbXml };
export const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
export const RATE_TTL_SECONDS = 60 * 60 * 12;

export async function getEurChf() {
  const { fallbackRate } = await getConfig();
  return resolveEurChf({
    fetchXml: async () => {
      const res = await fetch(ECB_URL, {
        next: { revalidate: RATE_TTL_SECONDS, tags: ["labs-ecb-chf"] },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`EZB HTTP ${res.status}`);
      return res.text();
    },
    readLast: readLastRate,
    saveLast: saveLastRate,
    fixed: fallbackRate,
    warn: (err) => console.warn("[labs/dreilaender] EZB-Kurs nicht abrufbar, nutze Fallback:", err?.message),
  });
}
