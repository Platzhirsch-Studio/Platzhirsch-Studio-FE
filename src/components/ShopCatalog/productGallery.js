"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { preloadLightboxImage } from "@/components/ShopCatalog/lightboxImage";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { withFallback } from "@/components/ShopCatalog/copy";

// Product gallery of the "Atelier" page.
// - Stage: native CSS scroll-snap track (swipe on touch, trackpad, arrow
//   buttons, arrow keys). The first image is in the server HTML and preloaded
//   (LCP). Manufacturer shots stay uncropped: 3:2 on bone, object-contain,
//   white backgrounds multiplied into the surface.
// - Inactive slides are `inert`, so only the visible image is focusable.
// - Counter with aria-live, real <button>s, arrow keys on the region.
// - Lightbox (zoom, swipe track): ./productLightbox.js, see there.
// - Reduced motion: every scroll jumps instead of gliding.
// QA history: R1 P2-1 zoom placeholder, P2-8 Safari focus return, P3-2 one
// live counter at a time; R2/R3 stage edge to edge with the enlarge control in
// the row below the photo; R4 q=75 stage image, no thumbnails on phones,
// stage capped at 28svh on phones.
//
// R5-produkt (TBT /de/produkte/lamps 379 ms): less work on page load.
// - The stage no longer boots Embla (its engine measured and wired every
//   slide during hydration); native scroll-snap does the swiping, a cheap
//   onScroll keeps the counter in step.
// - The lightbox (zoom, track, 4 icons) is a separate chunk, fetched on the
//   first hover/focus of an opener and mounted only when opened.
// - Thumbnails (from sm only) mount after the browser is idle; a box of the
//   same height is reserved in the server HTML, so nothing shifts (CLS 0).

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "reduced"
  );
}

const loadLightbox = () => import("@/components/ShopCatalog/productLightbox");
const ProductLightbox = dynamic(loadLightbox, { ssr: false });

// Stage image request (same src + sizes + quality as the stage <Image>): the
// lightbox shows it underneath until its own larger file has loaded, so the
// dialog is never an empty surface (QM R3-produkt P3-1).
const STAGE_SIZES = "(min-width: 1440px) 720px, (min-width: 1024px) 52vw, 100vw";
// R4-produkt (release-check §4): q=75 instead of 90 for the stage photo = the
// LCP image. Measured on the optimizer (perf/bildgroessen.txt): −21 % (AVIF)
// to −33 % (WebP) bytes at w=1200; no visible loss on the 4 device shots.
const STAGE_QUALITY = 75;

const ICON_BTN =
  "ph-press inline-flex size-[44px] shrink-0 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:bg-ink/5 disabled:opacity-40 disabled:hover:bg-transparent";

// Thumbnails only where they are shown (sm+), once the main thread is idle.
function useIdleFrom(query) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!window.matchMedia(query).matches) return undefined;
    const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = idle(() => setReady(true), { timeout: 2000 });
    return () => cancel(id);
  }, [query]);
  return ready;
}

// Design-Jury P2-20: the stage frame follows the first photo's format (from
// the server, so the box is right in the first paint – CLS 0), within 5:4 …
// 2:1; outside that range or unknown it stays 3:2. Never cropped.
export function stageRatio(ratio) {
  const r = Number(ratio);
  if (!Number.isFinite(r) || r <= 0) return 1.5;
  return Math.min(2, Math.max(1.25, Math.round(r * 1000) / 1000));
}

export default function ProductGallery({ images, alt, ratio = null }) {
  const frameRatio = stageRatio(ratio);
  const locale = useLocale();
  const tc = withFallback(useTranslations("shop"), locale, "shop");
  const count = images.length;
  const multiple = count > 1;

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const stageRef = useRef(null);
  const thumbsRef = useRef(null);
  const openButtonRef = useRef(null);
  const thumbsReady = useIdleFrom("(min-width: 640px)") && multiple;

  const altFor = (i) => (i === 0 ? alt : tc("atelier.imageAlt", { name: alt, n: i + 1 }));

  // Keep the active thumbnail in view – by scrolling the strip sideways only.
  // Qualität (Designsystem, sharedNeeds Shop): scrollIntoView() also scrolled
  // the PAGE when the strip sat below the fold (900 px window: ~187 px, ~2.7 s
  // after load, breadcrumb under the header = axe target-size). Index 0 needs
  // no scroll at all (the strip starts there).
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip || index === 0) return;
    const el = strip.querySelector(`[data-thumb="${index}"]`);
    if (!el) return;
    const box = el.getBoundingClientRect();
    const left = strip.scrollLeft + box.left - strip.getBoundingClientRect().left - (strip.clientWidth - box.width) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [index, thumbsReady]);

  const scrollStageTo = useCallback((i, instant) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollTo({ left: i * stage.clientWidth, behavior: instant || prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  const goTo = useCallback(
    (i) => {
      const next = Math.max(0, Math.min(count - 1, i));
      setIndex(next);
      scrollStageTo(next);
    },
    [count, scrollStageTo]
  );

  // Swipe/trackpad on the stage drives the index.
  const onStageScroll = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const i = Math.round(stage.scrollLeft / Math.max(1, stage.clientWidth));
    if (i !== index && i >= 0 && i < count) setIndex(i);
  };

  const openLightbox = (i) => {
    setIndex(i);
    setLightbox(true);
  };

  const onLightboxClose = () => {
    setLightbox(false);
    scrollStageTo(index, true);
    // Back to the one tabbable opener in the control row (the stage buttons
    // are mouse/touch targets only, tabIndex -1 – QM P3-2). After the native
    // focus return of <dialog>.
    const current = index;
    window.setTimeout(() => {
      (openButtonRef.current || stageRef.current?.querySelector(`[data-slide-button="${current}"]`))?.focus({ preventScroll: true });
    }, 0);
  };

  // Warm the lightbox chunk and the current photo in lightbox size before
  // the click (hover/focus of an opener) – QM wm-r4, see lightboxImage.js.
  const warm = () => {
    loadLightbox();
    preloadLightboxImage(images[index]);
  };

  if (!count) return null;

  return (
    <div
      // Several photos: the carousel is a named group and the scrollable
      // stage below is the one region landmark (axe scrollable-region-
      // focusable, R5-produkt P2-1) – no two landmarks with the same name.
      role={multiple ? "group" : "region"}
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label={tc("atelier.galleryLabel", { name: alt })}
      onKeyDown={(e) => {
        if (!multiple || lightbox) return;
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        // The focused stage would also scroll natively – one step only.
        e.preventDefault();
        goTo(index + (e.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div className="relative">
        <div
          ref={stageRef}
          onScroll={multiple ? onStageScroll : undefined}
          onPointerEnter={warm}
          onFocus={multiple ? warm : undefined}
          // Keyboard-reachable scroll area (WCAG 2.1.1): Tab lands on the
          // stage, arrow keys page through the photos, Enter opens via the
          // "enlarge" button in the control row.
          tabIndex={multiple ? 0 : undefined}
          role={multiple ? "region" : undefined}
          aria-label={multiple ? tc("atelier.galleryLabel", { name: alt }) : undefined}
          className={`bg-surface-raised ${multiple ? "scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain" : "flex overflow-hidden"}`}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-[3/2] min-w-0 shrink-0 grow-0 basis-full max-sm:max-h-[28svh] max-sm:[@media(max-height:600px)]:max-h-[18svh] snap-center"
              // 3:2 class = fallback; the inline ratio (first photo's format) wins.
              style={{ aspectRatio: frameRatio }}
              role={multiple ? "group" : undefined}
              aria-roledescription={multiple ? "slide" : undefined}
              aria-label={multiple ? tc("atelier.counter", { n: i + 1, total: count }) : undefined}
              inert={i !== index ? true : undefined}
            >
              <button
                type="button"
                onClick={() => openLightbox(i)}
                data-slide-button={i}
                tabIndex={-1}
                aria-label={tc("atelier.openLightbox", { n: i + 1 })}
                aria-haspopup="dialog"
                className="absolute inset-0 cursor-zoom-in"
              >
                <Image
                  src={src}
                  alt={altFor(i)}
                  fill
                  sizes={STAGE_SIZES}
                  preload={i === 0 ? true : undefined}
                  quality={STAGE_QUALITY}
                  className="object-contain mix-blend-multiply"
                  data-pin-nopin="true" // Herstellerbild: nicht für Pinterest (QA Recht Pinterest P2-4)
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-4 sm:mt-3">
        {multiple ? (
          <p className="tabular whitespace-nowrap text-small text-text-soft" aria-live={lightbox ? undefined : "polite"}>
            {tc("atelier.counter", { n: index + 1, total: count })}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center">
          {multiple && (
            <>
              <button type="button" className={ICON_BTN} onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={tc("atelier.prev")}>
                <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
              <button type="button" className={ICON_BTN} onClick={() => goTo(index + 1)} disabled={index === count - 1} aria-label={tc("atelier.next")}>
                <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
            </>
          )}
          <button
            type="button"
            className={ICON_BTN}
            ref={openButtonRef}
            onClick={() => openLightbox(index)}
            onPointerEnter={warm}
            onFocus={warm}
            aria-haspopup="dialog"
            aria-label={tc("atelier.openLightbox", { n: index + 1 })}
          >
            <Maximize2 aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {multiple &&
        (thumbsReady ? (
          // Phones: no thumbnail strip (counter, arrows and swipe remain) –
          // keeps the primary button in the first screen (Abnahme R2).
          <ul ref={thumbsRef} aria-label={tc("atelier.thumbs")} className="scrollbar-hide mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
            {images.map((src, i) => (
              <li key={`thumb-${src}-${i}`} className="shrink-0">
                <button
                  type="button"
                  data-thumb={i}
                  onClick={() => goTo(i)}
                  aria-label={tc("atelier.showImage", { n: i + 1 })}
                  aria-current={i === index ? "true" : undefined}
                  className={`relative block size-20 overflow-hidden bg-surface-raised outline-offset-2 transition-[box-shadow,opacity] duration-(--duration-micro) ease-quiet ${
                    i === index ? "ring-1 ring-ink ring-offset-2 ring-offset-paper" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="80px" quality={75} className="object-cover mix-blend-multiply" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // Same box as the strip (mt-3 + 5 rem + pb-1), so nothing moves.
          <div aria-hidden="true" className="mt-3 hidden h-[calc(5rem+4px)] sm:block" />
        ))}

      {lightbox && (
        <ProductLightbox
          images={images}
          index={index}
          onIndex={setIndex}
          onClose={onLightboxClose}
          altFor={altFor}
          label={tc("atelier.galleryLabel", { name: alt })}
          labels={{
            counter: (n, total) => tc("atelier.counter", { n, total }),
            zoomIn: tc("atelier.zoomIn"),
            zoomOut: tc("atelier.zoomOut"),
            close: tc("atelier.close"),
            prev: tc("atelier.prev"),
            next: tc("atelier.next"),
          }}
          stageSizes={STAGE_SIZES}
          stageQuality={STAGE_QUALITY}
          iconButton={ICON_BTN}
          reducedMotion={prefersReducedMotion}
        />
      )}
    </div>
  );
}
