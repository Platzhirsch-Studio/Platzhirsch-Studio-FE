// /de/preview/einblicke – lokale Vorschau der Besucher-Einblicke
// (Marktresearch/digital/features/besucher-einblicke.md). Zeigt die anonymen
// Tagesaggregate aus .data/einblicke/tag/ (bzw. „heute“ aus den Rohdaten mit
// derselben k-Schwelle): Heatmap-Overlay auf dem Screenshot, Scroll-Kurve,
// Aufmerksamkeit, Pfade (Sankey), Signale, Planer – so, wie Frappe sie
// bekommt. Kein Schreibzugriff, kein Formular außer dem GET-Filter.
// Nur Dev bzw. FREIGABE_PREVIEW=1 (nie VERCEL_ENV=production), sonst 404.
// Nur Deutsch; immer noindex,nofollow; nicht in Sitemap oder Navigation.
// Die Einblicke selbst messen auf /preview/** nichts (config.js EXCLUDED).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Vorschau from "@/components/Einblicke/Vorschau";
import { einblickePreviewEnabled, loadVorschau } from "@/lib/einblicke/vorschau.server";

export const metadata = {
  title: "Besucher-Einblicke – Vorschau",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

const DEVICES = ["Handy", "Tablet", "Desktop"];
const LAYERS = ["klicks", "elemente", "bewegung", "scroll", "aufmerksamkeit"];

export default async function EinblickeVorschauPage({ params, searchParams }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !einblickePreviewEnabled()) notFound();
  const sp = (await searchParams) || {};
  const one = (v) => (Array.isArray(v) ? v[0] : v);
  const geraet = DEVICES.includes(one(sp.geraet)) ? one(sp.geraet) : "Desktop";
  const tage = [1, 7, 30, 0].includes(Number(one(sp.tage))) ? Number(one(sp.tage)) : 7;
  const quelle = one(sp.quelle) === "heute" ? "heute" : "aggregat";
  const ebene = LAYERS.includes(one(sp.ebene)) ? one(sp.ebene) : "klicks";
  const seite = typeof one(sp.seite) === "string" ? one(sp.seite).slice(0, 200) : undefined;
  const data = await loadVorschau({ seite, geraet, tage, quelle });
  return <Vorschau data={data} filter={{ geraet, tage, quelle, ebene }} devices={DEVICES} layers={LAYERS} />;
}
