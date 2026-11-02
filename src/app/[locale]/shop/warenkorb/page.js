// /[locale]/shop/warenkorb — Warenkorb und Kasse der Accessoire-Welt
// (Inhaber-Entscheidung Nr. 29). Nur bei SHOP_MODE test/live, sonst 404.
// Immer noindex. Texte: src/lib/shop/copy.js (Server), Insel: ShopCart.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import SelectionTabs from "@/components/CartPage/SelectionTabs";
import ShopCart from "@/components/Shop/ShopCart";
import TestBanner from "@/components/Shop/TestBanner";
import { NOINDEX } from "@/lib/commerce/mode";
import { heuteIso } from "@/lib/katalog/config";
import { shopCopy } from "@/lib/shop/copy";
import { SHOP_LEGAL, legalSlotDraft, legalSlotReleased } from "@/lib/shop/legal";
import { shopMode } from "@/lib/shop/mode";
import { leerVorschlaege } from "@/lib/shop/suggestions";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: `${shopCopy(locale).cartTitle} | Platzhirsch Home Living`, robots: NOINDEX };
}

export default async function WarenkorbPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  await connection();
  const mode = shopMode(process.env);
  if (mode === "off") notFound();
  const c = shopCopy(locale);
  const legal = SHOP_LEGAL.map((s) => ({ id: s.id, titel: s.titel, offen: !legalSlotReleased(s), entwurf: legalSlotDraft(s), path: s.path }));
  return (
    // Telefon (Optik-QA r2, iPhone SE): im ersten Bildschirm stand kein Artikel – Abstände über der Liste
    // mobil enger (Testhinweis, H1, Reiter, Schritte), ab sm wie bisher.
    <div className="bg-surface-raised pt-4 pb-section text-text sm:pt-6 md:pt-10">
      <Container>
        {mode === "test" && <TestBanner text={c.testBanner} />}
        {/* Telefon quer (≤ 500 px hoch): H1 nur für Screenreader – der aktive Reiter „Warenkorb“ direkt darunter nennt die
            Seite schon; so steht der erste Artikel im ersten Bildschirm (Optik-QA r3). */}
        <Heading level={1} size="display-m" className="mt-4 sm:mt-8 [@media(max-height:500px)]:sr-only">
          {c.cartTitle}
        </Heading>
        <SelectionTabs active="warenkorb" locale={locale} shop shopLabel={c.cartTab} className="mt-3 sm:mt-6 [@media(max-height:500px)]:mt-2" />
        <div className="mt-5 sm:mt-8 [@media(max-height:500px)]:mt-3">
          <ShopCart
            locale={locale}
            copy={c}
            legal={legal}
            test={mode === "test"}
            vorschlaege={leerVorschlaege({ heute: heuteIso(), mode, locale })}
            start={{ lieferart: sp?.lieferart, zahlung: sp?.zahlung, abbruch: sp?.abbruch === "1" }}
          />
        </div>
      </Container>
    </div>
  );
}
