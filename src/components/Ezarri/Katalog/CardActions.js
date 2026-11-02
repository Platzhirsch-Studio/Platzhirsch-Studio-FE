"use client";
// Merken (♡, bestehende Merkliste / CartContext) und Vergleichen (bis 4) für
// eine Mosaik-Karte oder die Detailseite. Beide aria-pressed, 44-px-Ziele.
// Merkliste: gleicher Mechanismus wie Shop-Produkte (useWishlistToggle), Eintrag
// mit href /ezarri/mosaike/<id>. Bild: das 600-px-WebP der Karte (Ezarri-Bild,
// unverändert); wishlistImageSrc() in CartContext kennt /ezarri/ (Integration
// 28.10.2026, Abnahme Ezarri-Welt Restpunkt 3).
import { GitCompareArrows, Heart } from "lucide-react";
import { useWishlistToggle } from "@/components/ShopCatalog/wishlistHeart";
import { useLocale } from "next-intl";
import { DETAIL as DETAIL_DE, KARTE as KARTE_DE } from "@/lib/ezarri/copy";
import { DETAIL as DETAIL_EN, KARTE as KARTE_EN } from "@/lib/ezarri/copy.en";
import { DETAIL as DETAIL_FR, KARTE as KARTE_FR } from "@/lib/ezarri/copy.fr";
import { DETAIL as DETAIL_IT, KARTE as KARTE_IT } from "@/lib/ezarri/copy.it";

// 01.11.2026: fr/it dazu (Ezarri-Welt in vier Sprachen).
const COPY = { de: { DETAIL: DETAIL_DE, KARTE: KARTE_DE }, en: { DETAIL: DETAIL_EN, KARTE: KARTE_EN }, fr: { DETAIL: DETAIL_FR, KARTE: KARTE_FR }, it: { DETAIL: DETAIL_IT, KARTE: KARTE_IT } };
const useCopy = () => COPY[useLocale()] ?? COPY.de;
import { useCompare } from "./compareStore";

export function toEzarriWishlistItem(card) {
  return {
    id: `ezarri-${card.id}`,
    name: card.name,
    image: card.bild?.web ? `${card.bild.web}-600.webp` : null,
    category: "Ezarri",
    kategories: "ezarri",
    url_slug: card.id,
    href: `/ezarri/mosaike/${card.id}`,
    produkte_id: `ezarri-${card.id}`,
  };
}

const BTN =
  "ph-press inline-flex min-h-11 items-center justify-center gap-2 text-ui transition-colors duration-(--duration-micro) disabled:cursor-not-allowed disabled:opacity-50";

export function MerkButton({ card, variant = "icon" }) {
  const { saved, toggle } = useWishlistToggle(toEzarriWishlistItem(card));
  const { DETAIL, KARTE } = useCopy();
  if (variant === "full") {
    return (
      <button type="button" onClick={toggle} aria-pressed={saved} className={`${BTN} border border-line-strong px-5 text-text hover:border-ink`}>
        <Heart aria-hidden="true" className={`ph-heart size-[18px] ${saved ? "fill-ink" : "fill-transparent"}`} strokeWidth={1.5} />
        {saved ? DETAIL.gemerkt : DETAIL.merken}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={KARTE.merken(card.name)}
      title={KARTE.merken(card.name)}
      className={`${BTN} size-11 shrink-0 text-text hover:bg-ink/5`}
    >
      <Heart aria-hidden="true" className={`ph-heart size-[18px] ${saved ? "fill-ink" : "fill-transparent"}`} strokeWidth={1.5} />
    </button>
  );
}

export function CompareButton({ card, variant = "compact" }) {
  const { has, full, toggle } = useCompare();
  const { KARTE } = useCopy();
  const on = has(card.id);
  const disabled = !on && full;
  return (
    <button
      type="button"
      onClick={() => toggle(card.id)}
      aria-pressed={on}
      disabled={disabled}
      title={disabled ? KARTE.vollerVergleich : undefined}
      className={`${BTN} ${variant === "full" ? "border border-line-strong px-5 hover:border-ink" : "px-2"} ${on ? "text-see" : "text-text-soft hover:text-text"}`}
    >
      <GitCompareArrows aria-hidden="true" className="size-4" strokeWidth={1.5} />
      <span>{on ? KARTE.verglichen : KARTE.vergleichen}</span>
      <span className="sr-only">: {card.name}</span>
    </button>
  );
}
