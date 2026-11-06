// Build-Umfang der Detailseiten (Produkte, Mosaike).
//
// Ohne Begrenzung erzeugt `next build` rund 23.000 statische Seiten. Auf Vercel
// dauert das länger als das Build-Limit von 45 Minuten. Mit PRERENDER_SCOPE wird nur ein Teil
// beim Build erzeugt. Der Rest entsteht beim ersten Aufruf (ISR) und bleibt
// danach im Cache. Unbekannte Slugs geben weiterhin 404, weil die Seiten selbst
// notFound() aufrufen.
//
//   PRERENDER_SCOPE=all  → alles beim Build (Standard, wie bisher)
//   PRERENDER_SCOPE=de   → nur deutsche Detailseiten beim Build
//   PRERENDER_SCOPE=none → keine Detailseiten beim Build
const SCOPE = (process.env.PRERENDER_SCOPE || "all").trim().toLowerCase();

export function limitPrerender(params) {
  if (SCOPE === "none") return [];
  if (SCOPE === "de") return params.filter((p) => p.locale === "de");
  return params;
}
