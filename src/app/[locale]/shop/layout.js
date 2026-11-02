// /<locale>/shop/* – Warenkorb, Kasse und Bestellbestätigung bekommen dieselbe
// Shop-Kopfleiste wie /accessoires/* (Kategorien, Suche), damit der Kunde aus
// der Kasse zurück in die Abteilungen findet. Nur bei aktivem Shop (SHOP_MODE
// test/live) – sonst sind die Seiten ohnehin 404. Kein Warenkorb-Link hier:
// das einzige Warenkorb-Symbol sitzt in der Hauptkopfzeile (CartLink).
import { getTranslations } from "next-intl/server";
import ShopSubHeader from "@/components/ShopStart/ShopSubHeader";
import { kategorieKey } from "@/lib/katalog/schema";
import { SHOP_LOCALES } from "@/lib/shop/shopStart";
import { shopActive } from "@/lib/shop/mode";

export default async function ShopLayout({ children, params }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale) || !shopActive()) return children;
  const t = await getTranslations({ locale, namespace: "katalog" });
  return (
    <>
      <ShopSubHeader locale={locale} katLabel={(k) => t(`kategorie.${kategorieKey(k)}`)} />
      {children}
    </>
  );
}
