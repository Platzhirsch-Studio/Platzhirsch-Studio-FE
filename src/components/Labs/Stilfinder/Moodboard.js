"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlistCollectionToggle, useWishlistToggle } from "@/components/ShopCatalog/wishlistHeart";
import { toWishlistItem } from "@/lib/shop/wishlistItem";
import { splitProductName } from "@/lib/stilfinder/displayName";
import { localizeProductsHref } from "@/utils/routing";
import { useStilCopy } from "./StilCopy";
import { fmt } from "./localize";
import { fillRows } from "./fillRows";

// Mehrsprachigkeit (01.11.2026): Produktlink unter dem Katalogpfad der Sprache
// (/en/products/…, /fr/produits/…); die Merkliste speichert weiter den Pfad ohne Sprache.
const localHref = (href, locale) => (locale === "de" ? href : `/${locale}${localizeProductsHref(href.replace(/^\/de(?=\/)/, ""), locale)}`);

// Moodboard tiles from the live catalogue (same curation as the PDF). Layout on md (4 columns):
// one 2×2 hero piece, one 2×1 landscape piece and six squares = 12 cells,
// i.e. three full rows without gaps. On phones (2 columns) the same two
// pieces span the full width.
const TILE_BG = "#f3f0ea";

// Moodboard item → Merkliste entry (same shape as product cards use).
const toProduct = (item) => ({ ...item, href: item.href.replace(/^\/de(?=\/)/, "") });

// Scene or cut-out is decided on the server from the same image analysis as
// the PDF (QA Runde 2, P2.7). Scenes fill their tile; cut-outs and protected
// brands (Minotti: never cropped) are contained on the tile tone.
function MoodHeart({ item }) {
  const { t } = useStilCopy();
  const { saved, toggle } = useWishlistToggle(toWishlistItem(toProduct(item)));
  const label = fmt(saved ? t.moodboard.remove : t.moodboard.add, { label: `${item.brand} ${item.name}` });
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-[#f3f0ea] sm:right-3 sm:top-3"
    >
      <Heart
        size={18}
        strokeWidth={1.75}
        aria-hidden="true"
        className={saved ? "fill-gold text-gold" : "text-ink"}
      />
    </button>
  );
}

function Tile({ item, index, onBroken }) {
  const { locale } = useStilCopy();
  const photo = !item.cutout && !item.protected;
  // QA Runde 3, P2.6: big = room scene of the profile, wide only for a
  // landscape scene (boardItems in curate.js); older data: by position
  const big = item.tile ? item.tile === "big" : index === 0;
  const wide = item.tile ? item.tile === "wide" : index === 5;
  const span = big ? "col-span-2 md:row-span-2" : wide ? "col-span-2" : "";
  const frame = big
    ? "aspect-[4/3] md:aspect-auto md:min-h-0 md:flex-1"
    : wide
      ? // QM r5: 2:1 wäre auf md um die halbe Spaltenlücke (8 px) höher als die quadratischen
        // Nachbarn – Höhe = halbe Kachelbreite minus halbe Lücke (gap-x-4); Container = Link
        "aspect-[2/1] md:aspect-auto md:h-[calc(50cqw-0.5rem)]"
      : "aspect-square";
  // QM planer-tools: die große Kachel wird ab 768 px hochformatig (flex-1), ein Querformat-Bild
  // braucht dort per cover gut die doppelte Kachelbreite – mit 560px war es bis 2× hochskaliert.
  const sizes = big
    ? "(min-width: 1152px) 1200px, 100vw"
    : wide
      ? "(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw"
      : "(min-width: 1152px) 280px, (min-width: 768px) 25vw, 50vw";

  const shown = splitProductName(item.name);
  return (
    <li className={`reveal relative flex flex-col ${span}`}>
      <Link href={localHref(item.href, locale)} className={`group flex h-full flex-col outline-offset-4 ${wide ? "@container" : ""}`}>
        <span className={`relative block overflow-hidden ${frame}`} style={{ backgroundColor: TILE_BG }}>
          <Image
            src={item.image}
            alt={item.alt}
            fill
            sizes={sizes}
            quality={75}
            onError={() => onBroken?.(item.id)}
            className={`transition-transform duration-(--duration-enter) ease-quiet motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none ${
              photo ? "object-cover" : `object-contain ${item.cutout ? "mix-blend-multiply" : ""} ${big ? "p-6 sm:p-10" : "p-4 sm:p-6"}`
            }`}
          />
        </span>
        <span className="block pt-2.5">
          {/* Visual P1-5: magazine caption – plate number, then brand credit */}
          <span className="block text-[11px] uppercase tracking-[0.14em] text-gold-text">
            <span className="tabular-nums text-ink-soft">N° {String(index + 1).padStart(2, "0")}</span>
            <span className="mx-1.5 text-ink/30" aria-hidden="true">·</span>
            {item.brand}
          </span>
          {/* QM r3: gleich hohe Bildunterschriften – Name höchstens zwei, Ausführung eine Zeile */}
          <span className="font-display mt-0.5 line-clamp-2 block text-base leading-snug" title={shown.name}>{shown.name}</span>
          <span className="mt-0.5 line-clamp-1 block min-h-[1lh] text-[13px] leading-snug text-ink-soft">{shown.finish}</span>
        </span>
      </Link>
      <MoodHeart item={item} />
    </li>
  );
}

// Visual P1-5: editorial "Materialkarte" above the board – the three material
// swatches of the profile (same files as the PDF, ambientCG CC0, credited)
// next to the named palette tones. Replaces the 12 px colour strip.
function MaterialCard({ materials, palette }) {
  const { t } = useStilCopy();
  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
      {materials.length > 0 && (
        <figure className="m-0">
        <ul className="flex flex-wrap gap-x-4 gap-y-3 sm:gap-x-5" aria-label={t.moodboard.materialsAria}>
          {materials.map((m) => (
            // QM r5: Spalte breiter als der Kreis – „Nussbaum geölt“ bleibt einzeilig wie die Nachbarn
            <li key={m.label} className="w-20 text-center sm:w-24">
              <span className="relative mx-auto block size-16 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(31,37,43,0.08)] sm:size-20">
                <Image src={m.img} alt="" fill sizes="160px" /* QM r4: auch bei 200 % Text scharf */ className="object-cover" />
              </span>
              <span className="mt-2 block text-[11px] leading-tight text-ink/80">{m.label}</span>
            </li>
          ))}
        </ul>
        {/* QM r2: Quelle direkt bei den Materialfotos, nicht unter der letzten Produktkachel */}
        <figcaption className="mt-2 text-[11px] text-ink/70">{t.moodboard.materialsCredit}</figcaption>
        </figure>
      )}
      <ul className="flex flex-wrap gap-x-1.5 gap-y-3" aria-label={t.moodboard.paletteAria}>
        {palette.map((c) => (
          // Optik-QA: 48 px waren zu schmal – „Nussbaum“/„Champagner“ liefen in den Nachbarnamen („NussbaumOliv“)
          <li key={c.hex} className="w-[3.75rem] min-w-0 sm:w-16">
            <span className="block h-16 sm:h-20" style={{ backgroundColor: c.hex }} aria-hidden="true" />
            <span className="mt-2 block hyphens-auto text-[11px] leading-tight text-ink/80 [overflow-wrap:anywhere]">{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Moodboard({ items, palette, materials = [] }) {
  const { t } = useStilCopy();
  const [status, setStatus] = useState("");
  // QM r3: Kachel ohne ladbares Bild (leere beige Fläche) fällt weg; danach so viele Einzelkacheln
  // vom Ende, dass das 4er-Raster (md) ohne Waise in der letzten Reihe endet.
  const [broken, setBroken] = useState(() => new Set());
  const onBroken = (id) => setBroken((b) => (b.has(id) ? b : new Set(b).add(id)));
  const shownItems = fillRows(items.filter((i) => i.image && !broken.has(i.id)));
  const wishItems = items.map((i) => toWishlistItem(toProduct(i)));
  const { saved: allSaved, toggle: toggleAll } = useWishlistCollectionToggle(wishItems);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <MaterialCard materials={materials} palette={palette} />
        <button
          type="button"
          onClick={() => {
            toggleAll();
            setStatus(allSaved ? t.moodboard.allRemoved : t.moodboard.allAdded);
          }}
          aria-pressed={allSaved}
          className="ph-press inline-flex min-h-12 items-center gap-2 border border-ink px-5 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-white"
        >
          <Heart className={`size-4 ${allSaved ? "fill-current" : ""}`} aria-hidden="true" />
          {allSaved ? t.moodboard.allSaved : t.moodboard.saveAll}
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <ul className="mt-8 grid grid-flow-row-dense grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-4 md:gap-y-8">
        {shownItems.map((item, i) => (
          <Tile key={item.id} item={item} index={i} onBroken={onBroken} />
        ))}
      </ul>
    </>
  );
}
