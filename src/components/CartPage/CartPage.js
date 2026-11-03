"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Printer, Share2, Trash2, X } from "lucide-react";
import { useCart, wishlistImageSrc } from "@/context/CartContext";
import { Link } from "@/i18n/navigation";
// Rat 9,5 B9: Merkliste (Stücke) und Ideenboard (Ideen) als Reiter von „Ihre Auswahl“.
import SelectionTabs from "./SelectionTabs";
import { selectionText } from "./selectionCopy";
import { decodeSelection, selectionShareUrl, shareFromHash } from "./selectionShare";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import AnfrageFormProduct from "@/components/AnfrageFormProduct/AnfrageFormProduct";
import { generateSlug } from "@/lib/slugify";
import { productsPath, localizeProductsHref, ROUTES } from "@/utils/routing";
import { leadsCopy, selectionLabel } from "@/lib/forms/leadsCopy";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import LinkArrow from "@/components/ui/LinkArrow";
import { withFallback } from "@/components/ShopCatalog/copy";
// Druck 02.11.: Kopf- und Fußzeile des Ausdrucks (Datum, Adresse der Seite, Studio-Kontakt).
import { ADDRESS, EMAIL, PHONE_DISPLAY, SITE_NAME, SITE_URL } from "@/lib/site";

// Druck 02.11.: „2. November 2026“ in der Sprache der Seite – nur im Ausdruck sichtbar.
const printDate = (locale) => {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

// Empty selection: three ways in (labels = menu labels, Shell.nav.*; own photos).
const EMPTY_WAYS = [
  { key: "living", fallback: "Wohnen", href: "/wohnzimmer-einrichten-vorarlberg", src: "/Images/Wohnen/bannerImage4.jpg" },
  { key: "kitchen", fallback: "Küche", href: "/kuechen-vorarlberg", src: "/Images/Kuche/bannerImageKuche1.jpg" },
  { key: "outdoor", fallback: "Outdoor", href: "/outdoor-gartenplanung", src: "/Images/Outdoor/bannerImage1.jpg" },
];

// "Ihre Auswahl" (Merkliste, Bibel §10): the saved pieces from CartContext
// (localStorage) as a quiet gallery, and ONE primary action – send the
// selection as a request (AnfrageFormProduct, unchanged). Logic as before:
// remove one, clear all, open the form with cartItems.
// R4-leads (AP3 Nr. 4): second way "Diese Auswahl im Showroom ansehen" →
// /beratung?produkt=<Marke Name, …>; the consultation form starts with the
// selection named. Texts: messages `cart.selection.showroom*`, fallback
// src/lib/forms/leadsCopy.js.
// The page (merkliste/page.js) renders the H1 „Ihre Auswahl“ in its banner.
// Rat 9,5 B9 (T2, ux Nr. 4, Bibel §10.2): no second heading any more (R6 P2-8),
// tabs „Stücke“ / „Ideen“, three equal ways (Angebot anfragen, im Showroom
// ansehen, Teilen per Link im #Fragment), Druckansicht/PDF, and in the empty
// state a way to the consultation. A shared link (#auswahl=…) shows the shared
// pieces with „In meine Auswahl übernehmen“ (selectionShare.js).
const itemKey = (item) => `${item.id}-${item.name}-${item.category || "default"}`;

const subscribeHash = (cb) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const hashSnapshot = () => window.location.hash;
const noHash = () => "";

export default function CartPage({ shop = false, shopLabel } = {}) {
  const { cartItems, removeFromCart, clearCart, addManyToCart } = useCart();
  const [showForm, setShowForm] = useState(false);
  const [say, setSay] = useState("");
  const hash = useSyncExternalStore(subscribeHash, hashSnapshot, noHash);
  const shared = useMemo(() => decodeSelection(shareFromHash(hash)), [hash]);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("cart");
  const tc = withFallback(t, locale, "cart");
  const tRoot = useTranslations();
  const tx = (k, v) => selectionText(t, locale, k, v);
  const beratungPath = ROUTES.beratung[locale] || ROUTES.beratung.de;

  const closeShared = () => {
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch {
      /* ignore */
    }
  };
  const takeShared = () => {
    addManyToCart(shared);
    closeShared();
    setSay(tx("sharedTaken"));
  };
  const share = async () => {
    const url = selectionShareUrl({ origin: window.location.origin, pathname: window.location.pathname, items: cartItems });
    if (!url) return;
    if (navigator.share && window.matchMedia?.("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: tx("shareTitle"), url });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setSay(tx("shareCopied"));
    } catch {
      window.prompt(tx("share"), url);
      setSay(tx("shareFailed"));
    }
  };

  if (showForm) {
    return <AnfrageFormProduct onBack={() => setShowForm(false)} cartItems={cartItems} />;
  }

  const count = cartItems.length;

  return (
    // Runde 5 (ux P2-9): the page head has no photo any more – little space
    // above, so the empty state ("Noch nichts gemerkt.") is in the first screen.
    <Container className="pt-2 pb-section md:pt-4" data-selection="">
      <p role="status" aria-live="polite" className="sr-only">
        {say}
      </p>
      <SelectionTabs active="stuecke" locale={locale} shop={shop} shopLabel={shopLabel} />
      {shared.length > 0 && (
        <section aria-labelledby="auswahl-geteilt" className="mt-8 border border-line bg-surface-raised p-6 print:hidden" data-selection-shared="">
          <Heading id="auswahl-geteilt" level={2} size="title">
            {tx("sharedTitle")}
          </Heading>
          <p className="mt-2 text-body text-text-soft">{tx("sharedText")}</p>
          <ul className="mt-4 space-y-1 text-body" role="list">
            {shared.map((item) => (
              <li key={itemKey(item)}>{[item.category, item.name].filter(Boolean).join(" · ")}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={takeShared}>
              {tx("sharedTake")}
            </Button>
            <Button variant="ghost" onClick={closeShared}>
              {tx("sharedDismiss")}
            </Button>
          </div>
        </section>
      )}
      {count > 0 && (
        // Druck 02.11.: Datum und Adresse der Seite nur im Ausdruck (Druckvorlage statt Bildschirmdruck).
        <p className="hidden pt-6 text-small text-text-soft print:block" data-selection-print-head="">
          {printDate(locale)} · {SITE_URL.replace(/^https?:\/\//, "")}
          {pathname}
        </p>
      )}
      {count > 0 && (
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pt-6 pb-8 print:pt-2 print:pb-4">
        <p className="max-w-measure text-body text-text-soft print:hidden">{tc("selection.lead")}</p>
        {count > 0 && (
          <div className="flex items-center gap-4">
            <p className="tabular text-small text-text-soft" aria-live="polite">
              {tc("selection.count", { count })}
            </p>
            <Button variant="ghost" onClick={clearCart} className="print:hidden">
              <span className="inline-flex items-center gap-2">
                <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {t("clearList")}
              </span>
            </Button>
          </div>
        )}
      </div>
      )}

      {count === 0 ? (
        <div className="py-10 md:py-12" data-selection-empty="">
          <p className="text-title text-text">{tc("selection.emptyTitle")}</p>
          <p className="mt-stack-s max-w-measure text-body text-text-soft">{tc("selection.emptyText")}</p>
          <LinkArrow href={productsPath(locale)} className="mt-4">
            {tc("selection.browse")}
          </LinkArrow>
          {/* QM content-legal r3 (iPad): the empty state was text in a lot of white – three
              ways in, with our own room photos (the same as on the planning pages). */}
          <ul className="mt-10 grid grid-cols-1 gap-x-grid gap-y-8 sm:grid-cols-3" data-selection-start="">
            {EMPTY_WAYS.map((w) => (
              <li key={w.key}>
                <Link href={w.href} className="group block">
                  <span className="relative block aspect-[3/2] overflow-hidden bg-surface-raised">
                    <Image src={w.src} alt="" fill sizes="(min-width: 1440px) 440px, (min-width: 640px) 30vw, 100vw" quality={60} className="object-cover transition-transform duration-(--duration-ui) ease-quiet group-hover:scale-[1.02] motion-reduce:transition-none" />
                  </span>
                  <span className="mt-3 block text-title text-text underline decoration-transparent underline-offset-4 group-hover:decoration-current">
                    {tRoot.has(`Shell.nav.${w.key}`) ? tRoot(`Shell.nav.${w.key}`) : w.fallback}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {/* QM content-legal: as an inline-flex inside running text the 44 px link
              stretched its line and broke "beraten / lassen?" apart on phones – text
              and link now wrap as two units. */}
          <p className="mt-10 flex flex-wrap items-center gap-x-2 border-t border-line pt-6 text-body text-text">
            <span>{tx("emptyAdvice")}</span>
            <LinkArrow href={beratungPath} data-selection-advice="">
              {tx("emptyAdviceLink")}
            </LinkArrow>
          </p>
        </div>
      ) : (
        <>
          {/* Druck 02.11.: zwei Stücke je Reihe, kompakter, keine Karte über den Seitenumbruch. */}
          <ul className="mt-12 grid grid-cols-1 gap-x-grid gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:mt-6 print:grid-cols-2 print:gap-y-6">
            {cartItems.map((item) => {
              const href = localizeProductsHref(item.href || productsPath("de", generateSlug(item?.kategories), item.url_slug), locale);
              const src = wishlistImageSrc(item?.image);
              return (
                <li key={itemKey(item)} className="print:break-inside-avoid">
                  <article className="group relative flex flex-col">
                    <div className="relative aspect-[3/2] overflow-hidden bg-surface-raised print:aspect-[2/1]">
                      {src && (
                        <Image
                          src={src}
                          alt={[item.category, item.name].filter(Boolean).join(" ")}
                          fill
                          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 46vw"
                          className="object-contain p-4 mix-blend-multiply sm:p-6"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey(item))}
                        aria-label={tc("selection.remove", { name: item.name })}
                        title={tc("selection.remove", { name: item.name })}
                        className="absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center bg-paper/90 text-ink transition-colors duration-(--duration-micro) hover:bg-paper print:hidden"
                      >
                        <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      {item.category && <p className="text-overline uppercase text-text-soft">{item.category}</p>}
                      <h3 className="text-ui text-text">
                        <Link
                          href={href}
                          locale={locale}
                          className="ph-stretched underline decoration-transparent underline-offset-4 group-hover:decoration-current"
                        >
                          {item.name}
                        </Link>
                      </h3>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          {/* Drei gleich gewichtete Wege (Bibel §10.2): gleiche Knopfart, gleiche Breite */}
          <section aria-labelledby="auswahl-wege" className="mt-20 border-t border-line pt-12 print:hidden" data-selection-ways="">
            <h2 id="auswahl-wege" className="text-overline uppercase text-text-accent">
              {tx("ways")}
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3" role="list">
              <li>
                <Button variant="secondary" onClick={() => setShowForm(true)} fullWidth data-selection-way="angebot">
                  {tx("offer")}
                </Button>
                <p className="mt-3 text-small text-text-soft">{tx("offerNote")}</p>
              </li>
              <li>
                <Button
                  variant="secondary"
                  href={`${beratungPath}?produkt=${encodeURIComponent(selectionLabel(cartItems))}`}
                  fullWidth
                  data-selection-way="termin"
                >
                  {leadsCopy(tRoot, locale, "cart.selection.showroom")}
                </Button>
                <p className="mt-3 text-small text-text-soft">{tx("terminNote")}</p>
              </li>
              <li>
                <Button variant="secondary" onClick={share} fullWidth data-selection-way="teilen">
                  <span className="inline-flex items-center gap-2">
                    <Share2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
                    {tx("share")}
                  </span>
                </Button>
                <p className="mt-3 text-small text-text-soft">{tx("shareNote")}</p>
              </li>
            </ul>
            <Button variant="link" onClick={() => window.print()} className="mt-8" data-selection-print="">
              <span className="inline-flex items-center gap-2">
                <Printer aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {tx("print")}
              </span>
            </Button>
          </section>
          {/* Druck 02.11.: Fußzeile des Ausdrucks – Studio-Kontakt statt der Website-Fußzeile. */}
          <p className="hidden border-t border-line pt-3 text-small text-text-soft print:mt-8 print:block" data-selection-print-foot="">
            {SITE_NAME} · {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city} · {PHONE_DISPLAY} · {EMAIL}
          </p>
        </>
      )}
    </Container>
  );
}
