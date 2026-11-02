"use client";
// Gemeinsamer Zustand von Karte und Rechner: gewählter Ort → Land → Rechner.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LabsMotion, m, useMotionReady, useReducedMotion } from "../motion";
import { Car, Hammer, Receipt, Truck } from "lucide-react";
import DreilaenderMap from "./DreilaenderMap";
import PriceCalculator from "./PriceCalculator";
import { UI_DE, fill, localCountries, localPlaces } from "./i18n";
import { hasRate } from "./rate";
import s from "./dreilaender.module.css";
import Button from "@/components/ui/Button";

const EASE = [0.22, 1, 0.36, 1];
const MOBILE = "(max-width: 1023px)"; // unter Tailwind-lg

const isMobile = () => typeof window !== "undefined" && window.matchMedia(MOBILE).matches;

function InfoBlock({ icon: Icon, title, items }) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-text">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/85">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

// LazyMotion-Hülle (R5): Features laden nach der Hydration, siehe ../motion.js.
export default function DreilaenderClient(props) {
  return (
    <LabsMotion features="animation">
      <DreilaenderInner {...props} />
    </LabsMotion>
  );
}

function DreilaenderInner({ config, initialRate, copy = null }) {
  // Sprache der Seite: EN/FR/IT kommen als `copy` vom Server (src/lib/dreilaender/copy-intl.js).
  const T = copy?.ui ? { ...UI_DE, ...copy.ui } : UI_DE;
  const PLACES = localPlaces(copy);
  const COUNTRIES = localCountries(copy);
  const reduce = useReducedMotion();
  const motionReady = useMotionReady();
  const [placeId, setPlaceId] = useState("stgallen");
  const [country, setCountry] = useState("CH");
  const [rateInfo, setRateInfo] = useState(initialRate);
  // Auswahl per Tastatur: Infokarte nur kurz überblenden statt bei jedem Pfeil neu zu animieren.
  const [viaKey, setViaKey] = useState(false);
  const calcRef = useRef(null);
  const peekRef = useRef(null);
  const cardRef = useRef(null);
  const place = PLACES.find((p) => p.id === placeId) || PLACES[0];
  const info = COUNTRIES[place.country];

  // Nur wenn der Server keinen EZB-Kurs bekam: einmal nachfragen.
  useEffect(() => {
    if (!initialRate.fallback) return undefined;
    const ctrl = new AbortController();
    fetch("/api/labs/wechselkurs", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // Nur übernehmen, was besser ist: ein frischer EZB-Kurs oder überhaupt ein Kurs.
        if (d && hasRate(d) && (!d.fallback || !hasRate(initialRate))) setRateInfo(d);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- einmal pro Server-Kurs
  }, [initialRate.fallback]);

  function selectPlace(id, via) {
    setPlaceId(id);
    setViaKey(via === "key");
    const p = PLACES.find((x) => x.id === id);
    if (p) setCountry(p.country);
    // Mobil nach Tippen auf die Karte: nur scrollen, wenn die Kurzkarte gar
    // nicht im Bild ist – sonst bleibt die Karte ruhig stehen, damit man
    // mehrere Orte nacheinander antippen kann. Reduzierte Bewegung: ohne Animation.
    if (via === "pointer" && isMobile()) {
      requestAnimationFrame(() => {
        const el = peekRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.visualViewport?.height || window.innerHeight;
        // Sichtbar = mindestens 48 px der Kurzkarte (Ortsname und Fahrzeit) im Bild.
        if (r.top < vh - 48 && r.bottom > 48) return;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      });
    }
  }

  // Chips: ein Tab-Stopp (Roving Tabindex), Pfeiltasten/Pos1/Ende wechseln den Ort.
  function onChipKey(e) {
    const idx = PLACES.findIndex((p) => p.id === placeId);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next;
    if (step) next = PLACES[(idx + step + PLACES.length) % PLACES.length];
    else if (e.key === "Home") next = PLACES[0];
    else if (e.key === "End") next = PLACES[PLACES.length - 1];
    if (!next) return;
    e.preventDefault();
    selectPlace(next.id, "key");
    const el = document.getElementById(`dl-chip-${next.id}`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function toDetails() {
    cardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    cardRef.current?.focus({ preventScroll: true });
  }

  function toCalculator() {
    const code = place.country;
    setCountry(code);
    const behavior = reduce ? "auto" : "smooth";
    const radio = document.querySelector(`input[name="dl-country"][value="${code}"]`);
    // Mobil: Länderwahl und Betragsfeld anfahren; Desktop: ganze Rechner-Sektion.
    const target = isMobile() ? document.getElementById("dl-laender") : calcRef.current;
    target?.scrollIntoView({ behavior, block: "start" });
    radio?.focus({ preventScroll: true });
  }

  const ctaLabel = fill(T.cta, { forName: info.forName });
  const calm = reduce || viaKey;

  return (
    <>
      <section
        id="dl-karte-section"
        aria-labelledby="dl-karte"
        className="mx-auto max-w-page scroll-mt-24 px-4 py-12 sm:px-gutter md:py-20"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">{T.mapStep}</p>
        <h2 id="dl-karte" className="mt-2 font-display text-3xl text-ink md:text-4xl">
          {T.mapTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-ink/75">
          {T.mapLead}
        </p>

        {/* Stabile Live-Region (wird nicht neu gemountet): kurze Ansage beim Ortswechsel. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {fill(T.live, { place: place.name, country: info.name, time: place.labelLong })}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
          <figure className="m-0">
            <div className="overflow-hidden rounded-md border border-ink/10 bg-bone">
              <DreilaenderMap selectedId={placeId} country={country} onSelect={selectPlace} copy={copy} />
            </div>
            <figcaption className="mt-2 text-xs text-ink/75">
              {T.figcaption}
            </figcaption>

            {/* Mobil: Ergebnis direkt unter der Karte; die ausführliche Infokarte folgt nach den Chips. */}
            <div
              ref={peekRef}
              className="mt-3 scroll-mb-24 rounded-md bg-white p-4 shadow-[0_16px_32px_-24px_rgba(48,55,62,0.5)] ring-1 ring-ink/10 lg:hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/75">{info.name}</p>
                  <p className="mt-0.5 font-display text-2xl leading-tight text-ink">
                    {place.short && place.name.startsWith(info.name) ? place.short : place.name}
                  </p>
                </div>
                <p className="mt-1 flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink">
                  <Car aria-hidden="true" className="size-4 text-gold-text" />
                  {place.label}
                </p>
              </div>
              <p className="mt-2 text-sm leading-snug text-ink/85">{info.headline}</p>
              {/* CTA in eigener, voller Zeile (bricht bei 375 px nicht mehr dreizeilig um), Details darunter. */}
              <div className="mt-3 flex flex-col gap-2">
                {/* r8-leads (ux P1-6): standard Button instead of gold, upper-case buttons. */}
                <Button onClick={toCalculator} variant="primary" fullWidth className="px-3! text-center">
                  {ctaLabel}
                </Button>
                <Button onClick={toDetails} variant="secondary" fullWidth className="px-3!">
                  {T.details}
                </Button>
              </div>
            </div>

            <div
              role="group"
              aria-label={T.chips}
              className={`${s.chips} ${s.chipsFade} -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 pr-12 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0`}
            >
              {PLACES.map((p) => (
                <button
                  key={p.id}
                  id={`dl-chip-${p.id}`}
                  type="button"
                  aria-pressed={p.id === placeId}
                  tabIndex={p.id === placeId ? 0 : -1}
                  onClick={() => selectPlace(p.id, "chip")}
                  onKeyDown={onChipKey}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    p.id === placeId ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-gold"
                  }`}
                >
                  <span className="mr-1.5 text-[11px] font-semibold opacity-85">{p.country}</span>
                  {p.short || p.name}
                </button>
              ))}
            </div>
          </figure>

          <div className="lg:sticky lg:top-48 lg:self-start">
            <AnimatePresence mode="wait" initial={false}>
              <m.article
                key={place.id}
                ref={cardRef}
                tabIndex={-1}
                aria-labelledby="dl-ort-titel"
                initial={!motionReady ? false : calm ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={calm ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: calm ? 0.12 : 0.35, ease: EASE }}
                className="scroll-mt-24 rounded-md bg-white p-5 shadow-[0_24px_48px_-28px_rgba(48,55,62,0.45)] outline-none ring-1 ring-ink/10 sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/75">{info.name}</p>
                <h3 id="dl-ort-titel" className="mt-1 font-display text-3xl text-ink">
                  {place.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                  <Car aria-hidden="true" className="size-4 text-gold-text" />
                  <span>
                    <strong className="font-semibold">{place.label}</strong> {T.fromLochau}{" "}
                    <span className="text-ink/75">{T.estimate}</span>
                  </span>
                </p>
                <div className="mt-5 space-y-5 border-t border-ink/10 pt-5">
                  <InfoBlock icon={Receipt} title={T.steuer} items={info.steuer} />
                  <InfoBlock icon={Truck} title={T.lieferung} items={info.lieferung} />
                  <InfoBlock icon={Hammer} title={T.montage} items={info.montage} />
                </div>
                <Button onClick={toCalculator} variant="primary" fullWidth className="mt-6">
                  {ctaLabel}
                </Button>
              </m.article>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section
        id="dl-rechner-section"
        ref={calcRef}
        tabIndex={-1}
        aria-labelledby="dl-rechner"
        className="scroll-mt-28 bg-bone outline-none lg:scroll-mt-48"
      >
        <div className="mx-auto max-w-page px-gutter py-12 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">{T.calcStep}</p>
          <h2 id="dl-rechner" className="mt-2 font-display text-3xl text-ink md:text-4xl">
            {T.calcTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-ink/75">
            {T.calcLead}
          </p>
          <div className="mt-8">
            <PriceCalculator country={country} onCountry={setCountry} config={config} rateInfo={rateInfo} copy={copy} />
          </div>
        </div>
      </section>
    </>
  );
}
