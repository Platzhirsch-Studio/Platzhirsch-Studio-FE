// /<locale>/accessoires/* – gemeinsamer Rahmen aller Shop-Seiten: die
// Shop-Kopfleiste (Kategorien, Suche, Warenkorb) über Startseite, Listen,
// Marken-, Kategorie-, Produkt- und Suchseite. Kein eigener Datenabruf. Der
// Warenkorb-Link sitzt nur einmal in der Hauptkopfzeile (CartLink, navbar.js,
// nur bei shopActive()).
import { getTranslations } from "next-intl/server";
import ShopSubHeader from "@/components/ShopStart/ShopSubHeader";
import { kategorieKey } from "@/lib/katalog/schema";
import { SHOP_LOCALES } from "@/lib/shop/shopStart";

export default async function AccessoiresLayout({ children, params }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale)) return children;
  const t = await getTranslations({ locale, namespace: "katalog" });
  return (
    <>
      <ShopSubHeader locale={locale} katLabel={(k) => t(`kategorie.${kategorieKey(k)}`)} />
      {children}
    </>
  );
}
