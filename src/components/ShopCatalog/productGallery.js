"use client";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

// Main image + thumbnail-nav slider for the shop product detail page, with a
// full-screen lightbox (click the image, the expand button, or a thumbnail
// while the lightbox is open) to view any shot at full size.
//
// Built on react-slick (already used elsewhere — see MarkenItems/markenitems.js)
// instead of a hand-rolled overflow/scroll strip: slick's own asNavFor
// linking keeps the big image and the thumbnail row in sync, slides one
// thumbnail at a time via real arrows, and never shows a scrollbar (it
// positions slides with a transform, not native scroll) — the thing every
// earlier CSS-based attempt at this kept fighting.
//
// With a single image, no Slider/arrows/thumbnails/expand button render at
// all — see getProductImages.
const GalleryPrevArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Previous image"
    className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#30373e] shadow-md transition-colors hover:bg-white"
  >
    <ChevronLeft size={20} />
  </button>
);

const GalleryNextArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Next image"
    className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#30373e] shadow-md transition-colors hover:bg-white"
  >
    <ChevronRight size={20} />
  </button>
);

const ThumbPrevArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Previous image"
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#30373e]/60 transition-colors hover:bg-gray-100 hover:text-[#30373e]"
  >
    <ChevronLeft size={18} />
  </button>
);

const ThumbNextArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Next image"
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#30373e]/60 transition-colors hover:bg-gray-100 hover:text-[#30373e]"
  >
    <ChevronRight size={18} />
  </button>
);

const LightboxPrevArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Previous image"
    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
  >
    <ChevronLeft size={24} />
  </button>
);

const LightboxNextArrow = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Next image"
    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
  >
    <ChevronRight size={24} />
  </button>
);

const ProductGallery = ({ images, alt }) => {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [navMain, setNavMain] = useState(null);
  const [navThumb, setNavThumb] = useState(null);
  // centerMode measures real DOM widths to offset the track, which doesn't
  // exist yet during server rendering — the server and the client's very
  // first render would produce different slick-list markup/styles either
  // way, so the thumbnail slider only mounts once we're definitely on the
  // client, after that first render has already matched the server's.
  const [thumbsMounted, setThumbsMounted] = useState(false);
  const mainSliderRef = useRef(null);
  const thumbSliderRef = useRef(null);
  const hasMultiple = images.length > 1;
  const active = images[index] || images[0];

  useEffect(() => {
    setThumbsMounted(true);
  }, []);

  // react-slick's asNavFor needs the OTHER slider's actual instance, which
  // only exists once both have mounted (and the thumbnail one specifically
  // only mounts after thumbsMounted flips — see above) — setting it from a
  // ref during render would stay stuck at the initial null forever, since a
  // ref changing doesn't trigger a re-render on its own.
  useEffect(() => {
    if (!hasMultiple || !thumbsMounted) return;
    setNavMain(mainSliderRef.current);
    setNavThumb(thumbSliderRef.current);
  }, [hasMultiple, thumbsMounted]);

  // Single source of truth: slick owns the visible slide for the inline
  // gallery (afterChange keeps `index` in sync); the lightbox — a separate,
  // plain <Image> rather than its own slider, since it's an overlay, not a
  // second synced carousel — reads/writes the same `index`, and pushes any
  // change back into the inline slider via slickGoTo so the two never drift.
  const go = (delta) => {
    const next = (index + delta + images.length) % images.length;
    setIndex(next);
    mainSliderRef.current?.slickGoTo(next);
  };

  const goTo = (i) => {
    setIndex(i);
    mainSliderRef.current?.slickGoTo(i);
  };

  // Zoom resets whenever the lightbox (re)opens or the user switches images —
  // otherwise the next photo would open already zoomed in.
  useEffect(() => {
    setZoomed(false);
  }, [index, lightboxOpen]);

  const originFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return `${x}% ${y}%`;
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    if (!zoomed) setZoomOrigin(originFromEvent(e));
    setZoomed((z) => !z);
  };

  // While zoomed, panning follows the cursor: move toward the top and the
  // (eased, so it glides rather than snaps) transform-origin shifts toward the
  // top, revealing more of the image above — same for every edge.
  const handleMouseMove = (e) => {
    if (!zoomed) return;
    setZoomOrigin(originFromEvent(e));
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (hasMultiple && e.key === "ArrowLeft") go(-1);
      if (hasMultiple && e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, hasMultiple]);

  if (!hasMultiple) {
    return (
      <div className="relative w-full aspect-square overflow-hidden rounded-lg border border-[#30373e]/10 bg-gray-100">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open full-screen view"
          className="group absolute inset-0 h-full w-full cursor-zoom-in"
        >
          <Image
            src={active}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority
          />
        </button>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open full-screen view"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#30373e] shadow-md transition-colors hover:bg-white"
        >
          <Maximize2 size={16} />
        </button>

        {lightboxOpen && (
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close full-screen view"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={22} />
            </button>
            <div className="relative flex-1 bg-black" onClick={() => setLightboxOpen(false)}>
              <div
                className={`relative h-full w-full overflow-hidden p-6 sm:p-12 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                onClick={toggleZoom}
                onMouseMove={handleMouseMove}
              >
                <Image
                  src={active}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className={`object-contain select-none transition-transform ease-out ${zoomed ? "scale-[2] duration-500" : "scale-100 duration-300"}`}
                  style={{ transformOrigin: zoomOrigin }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-lg border border-[#30373e]/10 bg-gray-100">
        <Slider
          ref={mainSliderRef}
          asNavFor={navThumb}
          afterChange={setIndex}
          arrows
          infinite
          speed={400}
          slidesToShow={1}
          slidesToScroll={1}
          prevArrow={<GalleryPrevArrow />}
          nextArrow={<GalleryNextArrow />}
        >
          {images.map((src, i) => (
            <div key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Open full-screen view"
                className="group relative block aspect-square w-full cursor-zoom-in"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  priority={i === 0}
                />
              </button>
            </div>
          ))}
        </Slider>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open full-screen view"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#30373e] shadow-md transition-colors hover:bg-white"
        >
          <Maximize2 size={16} />
        </button>
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
          {index + 1} / {images.length}
        </span>
      </div>

      {/* gallery-thumb-nav: slick renders prevArrow/slick-list/nextArrow as
          plain block siblings, which stack vertically with no layout of our
          own — the global rule below turns that into the left-arrow /
          track / right-arrow row this is supposed to be. centerMode keeps
          whichever thumbnail matches the big image centered in the row
          (not just scrolled into view) as you move through the slides. */}
      <div className="mt-3 gallery-thumb-nav">
        {thumbsMounted ? (
          <Slider
            ref={thumbSliderRef}
            asNavFor={navMain}
            slidesToShow={Math.min(images.length, 5)}
            slidesToScroll={1}
            centerMode
            centerPadding="0px"
            swipeToSlide
            focusOnSelect
            arrows
            infinite
            prevArrow={<ThumbPrevArrow />}
            nextArrow={<ThumbNextArrow />}
            responsive={[
              {
                breakpoint: 480,
                settings: { slidesToShow: Math.min(images.length, 3), centerMode: true, centerPadding: "0px" },
              },
            ]}
          >
            {images.map((src, i) => (
              <div key={`thumb-${src}-${i}`} className="px-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={`relative aspect-square w-full overflow-hidden rounded-md border-2 transition-colors ${
                    i === index ? "border-[#d1b250]" : "border-transparent hover:border-[#30373e]/25"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                </button>
              </div>
            ))}
          </Slider>
        ) : (
          // Matches the server-rendered first paint exactly (same markup on
          // both sides) — swapped for the real Slider the instant we're
          // mounted client-side, see thumbsMounted above. flex-1 splits the row
          // evenly, like the slider's slidesToShow, so the thumbs don't start
          // out full-width and then shrink.
          <div className="flex gap-2 overflow-hidden">
            {images.slice(0, 5).map((src, i) => (
              <div key={`thumb-fallback-${src}-${i}`} className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-md border-2 border-transparent">
                <Image src={src} alt="" fill sizes="100px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
        <style jsx global>{`
          .gallery-thumb-nav .slick-slider {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .gallery-thumb-nav .slick-list {
            flex: 1;
            min-width: 0;
          }
        `}</style>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close full-screen view"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={22} />
          </button>

          {/* Clicking the image toggles zoom (in on the point you clicked, out
              back to fit) instead of closing — only clicking the surrounding
              black backdrop closes the lightbox. While zoomed, moving the mouse
              pans toward whichever edge the cursor is near (handleMouseMove). */}
          <div className="relative flex-1 bg-black" onClick={() => setLightboxOpen(false)}>
            <div
              className={`relative h-full w-full overflow-hidden p-6 sm:p-12 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              onClick={toggleZoom}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={active}
                alt={alt}
                fill
                sizes="100vw"
                className={`object-contain select-none transition-transform ease-out ${zoomed ? "scale-[2] duration-500" : "scale-100 duration-300"}`}
                style={{ transformOrigin: zoomOrigin }}
              />
            </div>

            <LightboxPrevArrow onClick={(e) => { e.stopPropagation(); go(-1); }} />
            <LightboxNextArrow onClick={(e) => { e.stopPropagation(); go(1); }} />
          </div>

          <div
            className="scrollbar-hide flex w-full justify-center gap-2 overflow-x-auto px-4 pb-6 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={`lb-${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  i === index ? "border-[#d1b250]" : "border-white/20 hover:border-white/50"
                }`}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
