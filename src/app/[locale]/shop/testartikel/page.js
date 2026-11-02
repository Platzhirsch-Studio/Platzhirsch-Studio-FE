// /[locale]/shop/testartikel — NUR SHOP_MODE test: Testartikel zum Prüfen von
// Warenkorb, Versand (LetMeShip-Mock) und Checkout (Stripe-Mock), solange der
// Katalog der Accessoire-Marken noch leer ist. Keine echten Produkte/Preise.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import AddToCart from "@/components/Shop/AddToCart";
import TestBanner from "@/components/Shop/TestBanner";
import { NOINDEX } from "@/lib/commerce/mode";
import { heuteIso } from "@/lib/katalog/config";
import { textOf } from "@/lib/katalog/schema";
import { TESTARTIKEL, sellableOf } from "@/lib/shop/catalog";
import { ADD_TO_CART_KEYS, fillCopy, pickCopy, shopCopy } from "@/lib/shop/copy";
import { anzeigeSatz } from "@/lib/shop/ust";
import { euro } from "@/lib/shop/format";
import { shopMode } from "@/lib/shop/mode";

export const metadata = { title: "Testartikel | Platzhirsch Home Living", robots: NOINDEX };

export default async function TestartikelPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  if (shopMode(process.env) !== "test") notFound();
  const c = shopCopy(locale);
  const copy = pickCopy(locale, ADD_TO_CART_KEYS);
  const items = TESTARTIKEL.map((p) => sellableOf(p, { heute: heuteIso(), mode: "test" })).filter(Boolean);
  return (
    <div className="bg-surface-raised pt-16 pb-section text-text md:pt-24">
      <Container>
        <TestBanner text={c.testBanner} />
        <Heading level={1} size="display-m" className="mt-8">
          {c.testItems}
        </Heading>
        <p className="mt-4 max-w-measure text-body text-text-soft">{c.testItemsLead}</p>
        <ul className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((p) => (
            <li key={p.slug} className="flex flex-col gap-3 border border-line bg-surface p-5" data-shop-testartikel={p.slug}>
              <h2 className="text-title text-text">{p.name}</h2>
              <p className="text-small text-text-soft tabular">
                {p.varianten.map((v) => `${v.name ? `${textOf(v.name, locale)}: ` : ""}${euro(v.cent, locale)}`).join(" · ")} {anzeigeSatz({ kategorie: p.kategorie }) == null ? c.inclVat : fillCopy(c.inclVatRate, { satz: anzeigeSatz({ kategorie: p.kategorie }) })}
              </p>
              <AddToCart slug={p.slug} varianten={p.varianten.map((v) => ({ id: v.id, name: v.name ? textOf(v.name, locale) : null }))} locale={locale} copy={copy} />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
