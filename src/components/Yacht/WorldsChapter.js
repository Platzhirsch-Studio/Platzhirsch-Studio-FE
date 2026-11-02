"use client";
// "Sechs Boote, sechs Welten" – the full-screen chapter of /de/yacht-interior.
// One AI concept rendering per boat, with concept name, motto and boat type.
// Three presentations of the SAME data:
// - "list"     (server render, reduced motion / "Ruhige Ansicht", no JS):
//              a calm sequence of images, one below the other.
// - "film"     (≥ 768 px, motion allowed): sticky full-screen stage; six
//              scroll steps cross-fade the renderings (opacity + a slow
//              scale, Bibel §8), a step index on the right jumps to a world.
// - "carousel" (< 768 px, motion allowed): Embla carousel in full width.
// Every image carries the visible AI label (KiLabel). No product hotspots on
// the images – the furniture in them is not from our range.
import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import KiLabel from "./KiLabel";
import { lqipStyle } from "./ConceptImage";
import { istRuhig } from "@/lib/yacht/motion";

function Picture({ image, sizes, className = "", eager = false, high = false }) {
  const set = (fmt) => `${image[fmt][1200]} 1200w, ${image[fmt][2400]} 2400w`;
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={image.webp[1200]}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={high ? "high" : undefined}
        decoding="async"
        className={`absolute inset-0 size-full object-cover ${className}`}
      />
    </picture>
  );
}

function Caption({ w, i, n, tone = "dark" }) {
  const dark = tone === "dark";
  return (
    <>
      <p className={`text-overline uppercase ${dark ? "text-accent-on-dark" : "text-text-accent"}`}>
        <span className="tabular">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>{" "}
        · {w.boatType}
      </p>
      <h3 className={`mt-2 font-display text-display-l ${dark ? "text-text-inverse" : "text-text"}`}>{w.title}</h3>
      <p className={`mt-2 max-w-measure font-display-italic text-lead ${dark ? "text-text-inverse" : "text-text"}`}>„{w.motto}“</p>
      <a
        href={`#konzept-${w.id}`}
        className={`mt-4 inline-flex min-h-11 items-center text-ui underline underline-offset-4 ${dark ? "text-text-inverse decoration-line-inverse hover:decoration-current" : "text-text decoration-line-strong hover:decoration-current"}`}
      >
        Konzept „{w.title}“ ansehen
      </a>
    </>
  );
}

/** Calm sequence (server render, reduced motion, no JS). */
function List({ worlds }) {
  return (
    <ol className="mx-auto grid max-w-page grid-cols-1 gap-y-stack-m px-gutter pb-section" data-yacht-worlds-mode="list">
      {worlds.map((w, i) => (
        <li key={w.id}>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden bg-cover bg-center sm:aspect-[16/9]" style={lqipStyle(w.image, true)}>
              <Picture image={w.image} sizes="(min-width: 1440px) 1360px, 100vw" />
              <KiLabel ki={w.image.kiGenerated !== false} className="absolute bottom-3 left-3" />
            </div>
            <figcaption className="mt-4">
              <Caption w={w} i={i} n={worlds.length} />
            </figcaption>
          </figure>
        </li>
      ))}
    </ol>
  );
}

/** Sticky full-screen stage, six scroll steps (≥ 768 px). */
function Film({ worlds }) {
  const [active, setActive] = useState(0);
  const steps = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number(e.target.dataset.step));
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const go = (i) => steps.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="relative" data-yacht-worlds-mode="film">
      <div className="sticky top-0 h-svh overflow-hidden bg-ink-deep">
        <ol>
          {worlds.map((w, i) => {
            const on = i === active;
            return (
              <li
                key={w.id}
                aria-current={on ? "step" : undefined}
                className={`absolute inset-0 transition-opacity duration-[1200ms] ease-(--ease-quiet) ${on ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <figure className="absolute inset-0">
                  <div className="absolute inset-0 overflow-hidden bg-cover bg-center" style={lqipStyle(w.image, true)}>
                    <Picture
                      image={w.image}
                      sizes="100vw"
                      eager={i < 2}
                      className={`transition-transform duration-[2400ms] ease-(--ease-drift) ${on ? "scale-100" : "scale-[1.06]"}`}
                    />
                  </div>
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink-deep/90 via-ink-deep/55 to-transparent" />
                  <figcaption
                    className={`absolute inset-x-0 bottom-0 mx-auto max-w-page px-gutter pb-16 transition-[opacity,translate] duration-[1200ms] ease-(--ease-quiet) md:pb-20 ${on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  >
                    <div className="max-w-[40rem]" onFocus={() => go(i)}>
                      <Caption w={w} i={i} n={worlds.length} />
                    </div>
                  </figcaption>
                  {/* top right under the header: the concierge launcher sits bottom right
                      and must never cover the AI label (Art. 50, QA round 2 P1.2) */}
                  <KiLabel ki={w.image.kiGenerated !== false} className="absolute right-gutter top-[calc(var(--header-h)+1rem)]" />
                </figure>
              </li>
            );
          })}
        </ol>
        {/* step index: jump to a world – on a soft shade from the right, so it
            stays readable on bright skies (≥ 4.5:1) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 bg-linear-to-l from-ink-deep/65 via-ink-deep/30 to-transparent lg:block" />
        <nav aria-label="Welten" className="absolute right-gutter top-1/2 hidden -translate-y-1/2 lg:block">
          <ul className="flex flex-col items-end gap-1">
            {worlds.map((w, i) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === active ? "true" : undefined}
                  className="group flex min-h-11 items-center gap-3 text-small text-text-inverse [text-shadow:0_1px_6px_rgb(31_37_43/0.85)]"
                >
                  <span className={`transition-opacity duration-(--duration-micro) ${i === active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>{w.boatShort}</span>
                  <span aria-hidden="true" className={`block h-px transition-[width,background-color] duration-(--duration-ui) ${i === active ? "w-10 bg-brass-400" : "w-5 bg-paper/60"}`} />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* scroll track, pulled under the sticky stage: half a viewport per
          world (35 %), the last one a full viewport so the chapter ends flush
          with its image (no extra padding). 3 instead of 6 viewports – QA round 2,
          P2.4 (page length) */}
      <div aria-hidden="true" className="-mt-[100svh]">
        {worlds.map((w, i) => (
          <div key={w.id} ref={(el) => (steps.current[i] = el)} data-step={i} className={i === worlds.length - 1 ? "h-svh" : "h-[35svh]"} />
        ))}
      </div>
    </div>
  );
}

/** Embla carousel in full width (< 768 px). */
function Carousel({ worlds }) {
  const [ref, api] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const on = () => setIndex(api.selectedScrollSnap());
    api.on("select", on);
    api.on("reInit", on);
    return () => {
      api.off("select", on);
      api.off("reInit", on);
    };
  }, [api]);
  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);
  return (
    <div role="region" aria-roledescription="Karussell" aria-label="Sechs Boote, sechs Welten" data-yacht-worlds-mode="carousel" className="pb-14 md:pb-16">
      <div ref={ref} className="overflow-hidden">
        <ol className="flex touch-pan-y">
          {worlds.map((w, i) => (
            <li key={w.id} aria-roledescription="Folie" aria-label={`${i + 1} von ${worlds.length}: ${w.title}`} className="min-w-0 shrink-0 grow-0 basis-[88%] pl-gutter last:pr-gutter">
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden bg-cover bg-center" style={lqipStyle(w.image, true)}>
                  {/* first two slides load early, the rest are next in line (QA round 2, P2.3) */}
                  <Picture image={w.image} sizes="88vw" eager={i < 3} high={i < 2} />
                  <KiLabel ki={w.image.kiGenerated !== false} className="absolute bottom-3 left-3" />
                </div>
                <figcaption className="mt-4 pr-2">
                  <Caption w={w} i={i} n={worlds.length} />
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
      {/* controls LEFT, counter right: the concierge launcher sits bottom right
          and must never cover a focused control (WCAG 2.4.11, QA round 2 P2.6) */}
      <div className="mt-4 flex items-center justify-between px-gutter" data-yacht-worlds-controls="">
        <div className="flex gap-2">
          <button type="button" onClick={prev} disabled={index === 0} aria-label="Vorige Welt" className="inline-flex size-11 items-center justify-center border border-line-inverse text-text-inverse disabled:opacity-40">
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={next} disabled={index === worlds.length - 1} aria-label="Nächste Welt" className="inline-flex size-11 items-center justify-center border border-line-inverse text-text-inverse disabled:opacity-40">
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-small text-text-inverse-soft tabular" aria-live="polite">
          {index + 1} / {worlds.length}
        </p>
      </div>
    </div>
  );
}

function pickMode() {
  const reduced = istRuhig(); // System ODER html[data-motion="reduced" | "calm"]
  if (reduced) return "list";
  return window.matchMedia?.("(min-width: 768px)").matches ? "film" : "carousel";
}

/**
 * @param {Array<{id, title, motto, boatType, boatShort, image}>} worlds
 */
export default function WorldsChapter({ worlds }) {
  const [mode, setMode] = useState("list");
  useEffect(() => {
    const update = () => setMode(pickMode());
    update();
    const mq = [window.matchMedia("(min-width: 768px)"), window.matchMedia("(prefers-reduced-motion: reduce)")];
    mq.forEach((m) => m.addEventListener("change", update));
    // "Ruhige Ansicht" switch sets html[data-motion]
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      mq.forEach((m) => m.removeEventListener("change", update));
      mo.disconnect();
    };
  }, []);
  if (mode === "film") return <Film worlds={worlds} />;
  if (mode === "carousel") return <Carousel worlds={worlds} />;
  return <List worlds={worlds} />;
}
