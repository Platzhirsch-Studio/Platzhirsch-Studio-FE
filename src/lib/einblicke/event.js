// src/lib/einblicke/event.js – Melde-API der Einblicke für Planer, Formulare und
// analytics.js (Konzept §2.5). Winzig, importiert den Sammler NICHT.
//
// Die Warteschlange window.__phEb gibt es nur, wenn das Tor offen ist
// (Einwilligung, kein DNT/GPC, Route erlaubt): der Lader
// (src/components/Einblicke/EinblickeLoader.js) legt sie an, der Sammler
// leert sie. Ohne sie ist jeder Aufruf ein No-op – ohne Einwilligung wird
// also auch im Speicher nichts gesammelt.
//
// Erlaubt sind nur feste Namen; der Sammler und der Server prüfen die Felder:
//   einblicke("ziel", { t: "termin|anfrage|planer|merkliste|kontakt", f?: formular })
//   einblicke("planer", { n: "kuechenplaner|sofaplaner|ezarri|stilfinder",
//                         a: "start|schritt|variante|uebergabe|abbruch|ergebnis",
//                         s?: schritt (feste Liste), p?: profil })
//   einblicke("form_error", { f: formular, st: HTTP-Status })
// Nie Werte, Maße, Freitexte oder Uploads übergeben.
import { GOAL_OF_GA } from "./config.js";

export function einblicke(name, data) {
  if (typeof window === "undefined") return;
  const q = window.__phEb;
  if (!q || typeof q.push !== "function") return;
  try {
    q.push([String(name), data && typeof data === "object" ? { ...data } : {}]);
  } catch {
    /* Messung darf nie stören */
  }
}

/** Planer-Ereignis: einblickePlaner("kuechenplaner", "schritt", { s: "fronten" }). */
export const einblickePlaner = (n, a, extra) => einblicke("planer", { ...extra, n, a });

/** Aus trackEvent (analytics.js): GA4-Ereignis → Ziel der Einblicke, sonst nichts. */
export function einblickeAusGa(name, params) {
  const t = GOAL_OF_GA[name];
  if (!t) return;
  einblicke("ziel", { t, f: params && typeof params.form === "string" ? params.form : undefined });
  if (name === "kuechenplaner_uebergabe" || name === "kuechenplaner_termin") einblickePlaner("kuechenplaner", "uebergabe");
}
