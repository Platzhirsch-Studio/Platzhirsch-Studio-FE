"use server";
// Server Function des CHF-Rechners (Schweiz-Hub). Läuft nur auf dem Server:
// EZB-Kurs über Labs/Dreilaender/ecb.server.js (12 h Next-Data-Cache, Fallback-
// Kette in rate.js), Richtwerte über store.server.js, Rechnung über
// src/lib/ch/estimate.js → calc.js. Der Client bekommt nur fertige Texte und
// Zahlen – kein Rechenkern und kein zod im Browser (Insel ≤ 3 KB).
// Kein Speichern, kein Versand, keine personenbezogenen Daten.
import { getEurChf } from "../../components/Labs/Dreilaender/ecb.server.js";
import { getConfig } from "../../components/Labs/Dreilaender/store.server.js";
import { estimateChf, readForm } from "./estimate.js";
import { rateInfoView } from "./view.js";
import { chCopy } from "./content-intl.js";

export async function estimateAction(_prev, formData) {
  // Sprache der Seite (verstecktes Feld `lang` im Formular): EN/FR/IT-Texte, sonst de-CH.
  const t = chCopy(String(formData?.get?.("lang") ?? "").slice(0, 2));
  const input = readForm(formData, t?.EST);
  const [config, info] = await Promise.all([getConfig(), getEurChf()]);
  const rate = rateInfoView(info, t?.VIEW);
  if (!input.ok) return { status: "invalid", errors: input.errors, values: input.values, rate };
  if (!rate.usable) return { status: "norate", values: input.values, rate };
  const result = estimateChf({ grossEur: input.grossEur, freightEur: input.freightEur, rate: info.rate, config, text: t?.EST });
  return { status: "ok", values: input.values, rate, result };
}
