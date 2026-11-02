// /<locale>/accessoires – Shop-Startseite der Accessoire-Welt (bisher 404).
// Hero, Serviceleiste, Kategorien, Edits, Marken, Café – alles aus dem
// statischen Katalog und der Shop-Konfiguration (src/lib/shop/shopStart.js),
// Texte server-only (src/lib/shop/startCopy.js). Gleicher Pfad in allen vier
// Sprachen, eigene Canonical je Sprache, hreflang de/en/fr/it + x-default
// (buildPageMetadata). Statisch, täglich neu (Preise blenden sich nach Ablauf
// aus, Shop-Modus wie die Produktseiten).
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import ShopStartseite from "@/components/ShopStart/ShopStartseite";
import { LAENDER } from "@/lib/commerce/shipping/config";
import { textOf } from "@/lib/katalog/schema";
import { produkteByWelt, markenMitProdukten } from "@/lib/katalog";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { SHOP_LOCALES, SHOP_START_PATH, SHOP_WELT, heroLook, serviceLeiste } from "@/lib/shop/shopStart";
import { startCopy } from "@/lib/shop/startCopy";
import { shopMode } from "@/lib/shop/mode";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return produkteByWelt(SHOP_WELT).length ? SHOP_LOCALES.map((locale) => ({ locale })) : [];
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale) || !produkteByWelt(SHOP_WELT).length) return { robots: { index: false, follow: true } };
  const c = startCopy(locale);
  const hero = heroLook();
  return buildPageMetadata({
    locale,
    pathByLocale: SHOP_START_PATH,
    title: `${c.metaTitle} | Platzhirsch`,
    description: c.metaDescription(markenMitProdukten(SHOP_WELT).length),
    ...(hero ? { image: hero.bild.src, imageAlt: textOf(hero.bild.alt, locale) } : {}),
  });
}

// Café-Foto (public/Images/Cafe/cafe.jpg + cafe.json mit Maßen und Bildnachweis),
// sonst Café-Abschnitt ohne Bild. Einmal beim Rendern gelesen.
function cafeBild() {
  try {
    const dir = path.join(process.cwd(), "public", "Images", "Cafe");
    const m = JSON.parse(fs.readFileSync(path.join(dir, "cafe.json"), "utf8"));
    if (fs.existsSync(path.join(dir, "cafe.jpg")) && m.width > 0 && m.height > 0 && m.credit) {
      return { src: "/Images/Cafe/cafe.jpg", width: m.width, height: m.height, credit: m.credit };
    }
  } catch {
    /* kein Café-Foto abgelegt */
  }
  return null;
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale) || !produkteByWelt(SHOP_WELT).length) notFound();
  const mode = shopMode(process.env);
  return <ShopStartseite locale={locale} service={serviceLeiste(mode, LAENDER, locale)} mode={mode} cafeBild={cafeBild()} />;
}
