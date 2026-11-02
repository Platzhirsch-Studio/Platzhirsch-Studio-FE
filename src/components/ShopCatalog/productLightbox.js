"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { LIGHTBOX_QUALITY, LIGHTBOX_SIZES } from "@/components/ShopCatalog/lightboxImage";

// Lightbox of the product gallery (R5-produkt: split out of productGallery.js
// and loaded with next/dynamic only when a visitor first opens it, so its
// code – zoom, swipe track, icons – is neither downloaded nor hydrated on
// page load; TBT /de/produkte/lamps).
// Behaviour unchanged from R1–R4:
// - native <dialog> on paper (Bibel §9), showModal() = focus trap + Escape;
// - native CSS scroll-snap track (swipe on touch, 0 KB);
// - zoom = the image at 200 % inside a scroll container, panning is plain
//   native scrolling (touch, wheel, keyboard);
// - the already cached stage image sits underneath as placeholder (P3-1),
//   the zoom version loads eager at quality 75, never beyond 1920 px (P2-1);
// - reduced motion: the track jumps instead of scrolling smoothly.
// The parent owns `index` and gets it back through onIndex; onClose runs on
// the native close (Escape, close button) and returns focus (P2-8 Safari).

// QM wm-fix3: the disabled first/last arrow was only a pale square – it is
// hidden now (no step that way), the active ones get a hairline frame so they
// read on the paper surface.
const ARROW = "absolute top-1/2 -translate-y-1/2 border border-line bg-paper disabled:invisible";

export default function ProductLightbox({
  images,
  index,
  onIndex,
  onClose,
  altFor,
  label,
  labels,
  stageSizes,
  stageQuality,
  iconButton,
  reducedMotion,
}) {
  const count = images.length;
  const multiple = count > 1;
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef(null);
  const trackRef = useRef(null);
  const zoomRef = useRef(null);

  const scrollTrackTo = (i, instant) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: instant || reducedMotion() ? "auto" : "smooth" });
  };

  // Mounted = opened: show the modal at once.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // (Re)position the swipe track on the current image whenever it mounts:
  // on open and after leaving the zoom view.
  useEffect(() => {
    if (!zoomed) scrollTrackTo(index, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed]);

  const go = (i) => {
    const next = Math.max(0, Math.min(count - 1, i));
    setZoomed(false);
    onIndex(next);
    scrollTrackTo(next);
  };

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || zoomed) return;
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== index) onIndex(i);
  };

  // Zoom in at the clicked point: scroll the 200 % image so that point sits
  // in the middle of the viewport.
  const toggleZoom = (e) => {
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    const fx = rect && e.clientX ? (e.clientX - rect.left) / rect.width : 0.5;
    const fy = rect && e.clientY ? (e.clientY - rect.top) / rect.height : 0.5;
    setZoomed(true);
    requestAnimationFrame(() => {
      const box = zoomRef.current;
      if (!box) return;
      box.scrollLeft = fx * box.scrollWidth - box.clientWidth / 2;
      box.scrollTop = fy * box.scrollHeight - box.clientHeight / 2;
      box.focus({ preventScroll: true });
    });
  };

  const onKey = (e) => {
    if (!multiple || zoomed) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onKeyDown={onKey}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-surface p-0 text-text transition-opacity duration-(--duration-swap) ease-quiet backdrop:bg-paper open:flex open:flex-col motion-reduce:transition-none starting:open:opacity-0"
    >
      {/* QM wm-fix4: on short landscape phones (≤ 500 px high) the toolbar floats
          over the free side margins of the picture instead of taking ~70 px of
          its height – the photo gets the full screen height. */}
      {/* QM wm-r4: floating over a dark photo the zoom and close icons get the
          paper square with a hairline frame of the arrows; the counter a paper
          backing – readable on any picture. */}
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2 sm:px-6 [@media(max-height:500px)]:absolute [@media(max-height:500px)]:inset-x-0 [@media(max-height:500px)]:top-0 [@media(max-height:500px)]:z-10 [@media(max-height:500px)]:border-b-0 [@media(max-height:500px)]:pointer-events-none [@media(max-height:500px)]:[&>*]:pointer-events-auto [@media(max-height:500px)]:[&_button]:border [@media(max-height:500px)]:[&_button]:border-line [@media(max-height:500px)]:[&_button]:bg-paper [@media(max-height:500px)]:[&>p:not(:empty)]:bg-paper/90 [@media(max-height:500px)]:[&>p:not(:empty)]:px-2">
        <p className="tabular text-small text-text-soft" aria-live="polite">
          {multiple ? labels.counter(index + 1, count) : null}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" className={iconButton} onClick={() => toggleZoom()} aria-pressed={zoomed} aria-label={zoomed ? labels.zoomOut : labels.zoomIn}>
            {zoomed ? <ZoomOut aria-hidden="true" className="size-5" strokeWidth={1.5} /> : <ZoomIn aria-hidden="true" className="size-5" strokeWidth={1.5} />}
          </button>
          <button type="button" className={iconButton} onClick={() => dialogRef.current?.close()} aria-label={labels.close} autoFocus>
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {!zoomed && (
          <div ref={trackRef} onScroll={onTrackScroll} className="scrollbar-hide flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
            {images.map((src, i) => (
              <div key={`lb-${src}-${i}`} className="relative h-full w-full shrink-0 snap-center" inert={i !== index ? true : undefined}>
                {/* QM wm-fix3: same image matching as the gallery stage – the button is
                    blended (multiply) as one layer, so the white backdrop of
                    a cut-out melts into the paper and placeholder + image
                    don't darken each other; slimmer insets use the area. */}
                <button type="button" onClick={toggleZoom} aria-label={labels.zoomIn} className="absolute inset-2 cursor-zoom-in mix-blend-multiply sm:inset-x-16 sm:inset-y-4 [@media(max-height:500px)]:inset-y-1">
                  {/* Already cached stage image as placeholder (P3-1). */}
                  {Math.abs(i - index) <= 1 && (
                    <Image src={src} alt="" aria-hidden="true" fill sizes={stageSizes} quality={stageQuality} loading="eager" className="object-contain" />
                  )}
                  <Image
                    src={src}
                    alt={altFor(i)}
                    fill
                    sizes={LIGHTBOX_SIZES}
                    quality={LIGHTBOX_QUALITY}
                    loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                    fetchPriority={i === index ? "high" : undefined}
                    className="object-contain"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        {zoomed && (
          <div ref={zoomRef} tabIndex={0} aria-label={altFor(index)} className="h-full w-full overflow-auto overscroll-contain">
            <button
              type="button"
              onClick={toggleZoom}
              aria-label={labels.zoomOut}
              className="relative block h-[max(100%,min(200%,1280px))] w-[max(100%,min(200%,1920px))] cursor-zoom-out mix-blend-multiply"
            >
              {/* Already loaded (lightbox slide): shows at once, sharpens below. */}
              <Image src={images[index]} alt="" aria-hidden="true" fill sizes={LIGHTBOX_SIZES} quality={LIGHTBOX_QUALITY} loading="eager" className="object-contain" />
              <Image src={images[index]} alt={altFor(index)} fill sizes="200vw" quality={75} loading="eager" fetchPriority="high" className="object-contain" />
            </button>
          </div>
        )}

        {multiple && !zoomed && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={labels.prev}
              className={`${iconButton} ${ARROW} left-2 sm:left-4`}
            >
              <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              aria-label={labels.next}
              className={`${iconButton} ${ARROW} right-2 sm:right-4`}
            >
              <ChevronRight aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
