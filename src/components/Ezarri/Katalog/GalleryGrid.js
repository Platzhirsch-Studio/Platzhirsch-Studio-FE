"use client";
// Galerie-Raster mit Lightbox (<dialog> auf Paper, Konzept §3.6). Jedes Bild
// ist ein Knopf „Bild groß ansehen“; im Dialog Pfeiltasten/Knöpfe für vor und
// zurück, Esc schließt (nativ), der Fokus kehrt zum auslösenden Bild zurück.
// Bildunterschrift nur „Mosaik: Washes 25 →“ (QM Runde 2 P3-2/P2-4); der
// Credit „Bild: Ezarri“ steht einmal unter dem Raster (CreditNote) und in der
// Lightbox. Videos: eigene Liste (VideoList), Link zu YouTube (kein Einbetten
// vor Consent; YouTube ist im Dienste-Register noch nicht freigegeben).
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Play, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { imageSources } from "@/lib/ezarri/images";
import { GALERIE as GALERIE_DE, alt as ALT_DE } from "@/lib/ezarri/copy";
import { GALERIE as GALERIE_EN, alt as ALT_EN } from "@/lib/ezarri/copy.en";
import { GALERIE as GALERIE_FR, alt as ALT_FR } from "@/lib/ezarri/copy.fr";
import { GALERIE as GALERIE_IT, alt as ALT_IT } from "@/lib/ezarri/copy.it";

const GALERIE_COPY = { de: [GALERIE_DE, ALT_DE], en: [GALERIE_EN, ALT_EN], fr: [GALERIE_FR, ALT_FR], it: [GALERIE_IT, ALT_IT] };

/** Texte in der Sprache der Seite (Welle 2: de/en; 01.11.2026: fr/it). */
function useGalerieCopy() {
  const locale = useLocale();
  const [GALERIE, altText] = GALERIE_COPY[locale] ?? GALERIE_COPY.de;
  return { locale, GALERIE, altText };
}
import { ezarriCredit } from "@/lib/ezarri/config";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import SaveActions from "@/components/Pinterest/SaveActions";
import { DIALOG_FADE, IMAGE_HOVER, staggerStyle } from "@/lib/ezarri/motion";

// Pinterest + Ideenboard (Inhaber-Entscheidung Nr. 14): Ezarri-Bilder dürfen
// auf Pinterest (Quelle „Ezarri“). Pin-Ziel ist die Mosaikseite, sonst die
// Galerie; Pin-Bild die 1600er-Fassung, Board-Karte die 600er.
function GallerySave({ item, onDark = false }) {
  const { GALERIE, locale } = useGalerieCopy();
  if (!item?.bild?.web) return null;
  const href = item.referenz ? `/${locale}/ezarri/mosaike/${item.referenz}` : `/${locale}/ezarri/galerie`;
  const room = (GALERIE.einsatz || []).find((e) => e.id === item.einsatz?.[0])?.label;
  // Nicht altText.anwendung („Projekt mit Ezarri …“): das liest sich auf
  // Pinterest wie ein Platzhirsch-Projekt. Es ist ein Anwendungsbild von
  // Ezarri; die Beschreibung endet zusätzlich mit „Bild: Ezarri“ (url.js).
  const name = item.referenzName ? `Ezarri ${item.referenzName}` : "Ezarri";
  const title = { en: `${name}, application photo`, fr: `${name}, photo d’utilisation`, it: `${name}, foto d’impiego` }[locale] ?? `${name}, Anwendungsbild`;
  return (
    <SaveActions
      locale={locale}
      onDark={onDark}
      compact
      className="mt-1"
      card={{ type: "ezarri", title, subtitle: item.referenzName || null, href, image: `${item.bild.web}-600.webp`, quelle: "Ezarri", room }}
      pin={{ url: href, media: `${item.bild.web}-1600.webp`, title, brand: "Ezarri", room }}
    />
  );
}

function Caption({ item, credit = false }) {
  const { GALERIE, locale } = useGalerieCopy();
  if (!item.referenz && !credit) return null;
  return (
    <p className="mt-2 text-small text-text-soft">
      {item.referenz && (
        <Link href={`/ezarri/mosaike/${item.referenz}`} className="relative z-10 inline-flex min-h-6 items-center text-text underline underline-offset-4">
          {GALERIE.diesesMosaik(item.referenzName || item.referenz)} →
        </Link>
      )}
      {credit && <span>{item.referenz ? " · " : ""}{ezarriCredit("bild", locale)}</span>}
    </p>
  );
}

/** Produktvideos von Ezarri (YouTube-Link, Poster = Mosaikbild). */
export function VideoList({ items }) {
  const { GALERIE } = useGalerieCopy();
  return (
    <ul className="grid grid-cols-2 gap-x-grid gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((g) => (
        <li key={g.id}>
          <a href={g.video} target="_blank" rel="noopener noreferrer" className="group relative block">
            {g.poster ? <EzImage image={g.poster} alt="" ratio="1/1" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw" /> : <div className="aspect-square bg-linen" />}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex size-12 items-center justify-center bg-paper text-text">
                <Play aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </span>
            </span>
            <span className="mt-2 flex items-center gap-1 text-small text-text underline underline-offset-4">
              {g.referenzName || "Video"}
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.5} />
            </span>
            <span className="sr-only">{GALERIE.video}. {GALERIE.videoHinweis}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function GalleryGrid({ items }) {
  const { GALERIE, altText } = useGalerieCopy();
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const [current, setCurrent] = useState(-1);
  const images = items.filter((x) => x.typ !== "video" && x.bild);
  const item = current >= 0 ? images[current] : null;
  const big = item ? imageSources(item.bild) : null;

  const open = (idx, el) => {
    openerRef.current = el;
    setCurrent(idx);
    dialogRef.current?.showModal();
  };
  const step = (d) => setCurrent((i) => (i + d + images.length) % images.length);
  const onClose = () => {
    setCurrent(-1);
    openerRef.current?.focus();
  };

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g, i) => {
          const idx = images.indexOf(g);
          return (
            <li key={g.id} className="reveal" style={staggerStyle(i, 3)}>
              <button type="button" onClick={(e) => open(idx, e.currentTarget)} className="group block w-full cursor-zoom-in text-left" aria-label={`${GALERIE.oeffnen}: ${altText.anwendung(g.referenzName)}`}>
                <EzImage
                  image={g.bild}
                  alt={altText.anwendung(g.referenzName)}
                  ratio="3/2"
                  preload={i < 2}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                  imgClassName={IMAGE_HOVER}
                />
              </button>
              <Caption item={g} />
              <GallerySave item={g} />
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={onClose}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-label={item ? altText.anwendung(item.referenzName) : GALERIE.oeffnen}
        className={`m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 text-text backdrop:bg-ink-deep/60 ${DIALOG_FADE}`}
      >
        {item && big && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-gutter py-2">
              <p className="text-small tabular-nums text-text-soft">
                {current + 1} / {images.length}
              </p>
              <button type="button" onClick={() => dialogRef.current?.close()} className="ph-press inline-flex size-11 items-center justify-center transition-colors duration-(--duration-micro) hover:bg-ink/5" aria-label={GALERIE.schliessen} autoFocus>
                <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 px-gutter">
              <picture>
                <source type="image/avif" srcSet={big.avif} sizes="100vw" />
                <source type="image/webp" srcSet={big.webp} sizes="100vw" />
                { }
                <img src={`${item.bild.web}-1600.webp`} alt={altText.anwendung(item.referenzName)} className="size-full object-contain" />
              </picture>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-gutter py-3">
              <div>
                <Caption item={item} credit />
                <GallerySave item={item} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => step(-1)} className="ph-press inline-flex size-11 items-center justify-center border border-line-strong transition-colors duration-(--duration-micro) hover:border-ink" aria-label={GALERIE.zurueck}>
                  <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </button>
                <button type="button" onClick={() => step(1)} className="ph-press inline-flex size-11 items-center justify-center border border-line-strong transition-colors duration-(--duration-micro) hover:border-ink" aria-label={GALERIE.vor}>
                  <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
