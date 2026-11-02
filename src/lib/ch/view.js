// Kurs-Anzeige des Schweiz-Hubs: Kurs, Datum, Quelle immer sichtbar.
// Texte kommen aus rateNotice() der Labs (eine Quelle für alle Rechner),
// Zahlen im de-CH-Format.
import { hasRate, rateNotice } from "../../components/Labs/Dreilaender/rate.js";
import { fmtRate, isoToCh } from "./estimate.js";

export const ECB_SOURCE = {
  label: "Europäische Zentralbank (EZB), Euro-Referenzkurs CHF",
  url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-chf.en.html",
};

const SOURCE_LABEL = {
  ezb: "EZB-Referenzkurs",
  zwischenspeicher: "EZB-Referenzkurs, zuletzt gespeichert",
  festwert: "EZB-Referenzkurs, hinterlegt",
  keiner: "kein Kurs verfügbar",
};

// `text` (optional): EN/FR/IT aus src/lib/ch/content-intl.js (VIEW: rate, sources).
export function rateInfoView(info, text = null) {
  const usable = hasRate(info);
  const notice = rateNotice(info, { date: isoToCh, rate: fmtRate }, text?.rate || null);
  const labels = text?.sources || SOURCE_LABEL;
  return {
    usable,
    level: notice.level,
    text: notice.text.replace(/ß/g, "ss"),
    rateText: usable ? fmtRate(info.rate) : "–",
    dateText: usable ? isoToCh(info.date) : "–",
    sourceText: labels[info?.source] ?? labels.keiner,
  };
}
