// /<locale>/accessoires/produkte/<slug> – Produktdetail des statischen Herstellerkatalogs.
// Logik: src/components/Katalog/katalogRoutes.js, Darstellung: ShopProduktDetail.js
// (Shop-Produktseite, Inhaber 31.10.2026: „echtes Webshop-Gefühl“).
// Qualität 01.11.2026: eindeutige Titel bei gleichnamigen Artikeln und
// Meta-Descriptions ≥ 70 Zeichen aus Katalogdaten (./shopMeta.js).
import { getTranslations } from "next-intl/server";
import ShopProduktDetail from "@/components/Katalog/ShopProduktDetail";
import { produktMetadata, produktParams, produktProps } from "@/components/Katalog/katalogRoutes";
import { detailBild } from "@/components/Katalog/kachelBild";
import { markeBySlug, produktBySlug, produkteByWelt } from "@/lib/katalog";
import { KATALOG_LOCALES, kategorieKey, textOf } from "@/lib/katalog/schema";
import { produktPath } from "@/lib/katalog/welten";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { metaBeschreibung, shopTitel } from "./shopMeta";

const WELT = "accessoires";
// Titel aller Shop-Produkte je Sprache (einmal je Prozess berechnet, garantiert verschieden).
const TITEL = new Map();
export const dynamicParams = false;
// Täglich neu: Preise (Nr. 26/27) blenden sich nach Ablauf aus, ohne neuen Build.
export const revalidate = 86400;

export function generateStaticParams() {
  return produktParams(WELT);
}

export async function generateMetadata(props) {
  const { locale, slug } = await props.params;
  const p = produktBySlug(slug);
  if (!KATALOG_LOCALES.includes(locale) || !p || p.welt !== WELT) return produktMetadata(WELT, props);
  const m = markeBySlug(p.marke);
  const t = await getTranslations({ locale, namespace: "katalog" });
  const kat = t(`kategorie.${kategorieKey(p.kategorie)}`);
  if (!TITEL.has(locale)) {
    const katLabel = (x) => t(`kategorie.${kategorieKey(x.kategorie)}`);
    TITEL.set(locale, shopTitel(produkteByWelt(WELT), { markeName: (x) => markeBySlug(x.marke)?.name || "", kategorie: katLabel }));
  }
  // og:image = Hero der Produktseite (Inhaber 03.11.2026, kachelBild.js detailBild; Shop-Welt: Freisteller zuerst).
  const bild = detailBild(p);
  return buildPageMetadata({
    locale,
    pathByLocale: produktPath(WELT, slug),
    title: TITEL.get(locale).get(slug) || `${m.name} ${p.name} – ${kat} | Platzhirsch`,
    description: metaBeschreibung({ kurz: textOf(p.kurz, locale), name: p.name, merkmale: (p.merkmale || []).map((x) => textOf(x, locale)), locale }),
    ...(bild ? { image: bild.src, imageAlt: textOf(bild.alt, locale) } : {}),
  });
}

export default async function Page(props) {
  const p = await produktProps(WELT, props);
  return <ShopProduktDetail {...p} />;
}
