"use client";
// src/components/Katalog/ZuletztAngesehen.js
// „Zuletzt angesehen“ der Accessoire-Welt (Shop-Liste und Produktseite).
// Nur im Browser (localStorage, Schlüssel ANGESEHEN_KEY), jeder Zugriff in
// try/catch: privates Fenster, gesperrter Speicher → die Leiste fehlt einfach.
// Gespeichert werden nur Slug, Name, Marke, interner Pfad und Bildpfad
// (angesehenLesen prüft jedes Feld) – keine Preise, nichts Persönliches,
// nichts verlässt den Browser. Server-HTML und Hydration: nichts (kein
// Hydrationsfehler); die Leiste steht ganz unten, verschiebt also nichts (CLS).
import { useEffect, useSyncExternalStore } from "react";
import Container from "@/components/ui/Container";
import TileImage from "@/components/ShopCatalog/tileImage";
import { ANGESEHEN_KEY, angesehenLesen, angesehenMerken } from "@/lib/katalog/shopListe";
import { shopTitel } from "./shopTitel";

const EVENT = "ph-katalog-angesehen";
const lesen = () => {
  try {
    return window.localStorage.getItem(ANGESEHEN_KEY) || "[]";
  } catch {
    return "[]";
  }
};
const subscribe = (cb) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const schreiben = (list) => {
  try {
    window.localStorage.setItem(ANGESEHEN_KEY, JSON.stringify(list));
  } catch {
    /* gesperrt: nichts merken */
  }
  window.dispatchEvent(new Event(EVENT));
};

/**
 * @param {{ locale: string, copy: {zuletzt: string, zuletztLeeren: string}, aktuell?: {s: string, n: string, b?: string|null, h: string, i?: string|null}|null }} props
 *   aktuell: Produkt dieser Seite (wird gemerkt, aber nicht angezeigt)
 */
export default function ZuletztAngesehen({ locale, copy, aktuell = null }) {
  const raw = useSyncExternalStore(subscribe, lesen, () => null);
  const slug = aktuell?.s || null;

  useEffect(() => {
    if (!aktuell) return;
    schreiben(angesehenMerken(angesehenLesen(lesen()), aktuell));
    // nur beim Aufruf der Seite (Slug), nicht bei jeder Prop-Identität
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (raw == null) return null;
  const list = angesehenLesen(raw).filter((x) => x.s !== slug);
  if (!list.length) return null;

  return (
    <section aria-labelledby="kat-zuletzt-title" className="ph-arrive border-t border-line bg-surface py-12 md:py-16" data-kat-zuletzt="">
      <Container>
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="kat-zuletzt-title" className="text-title text-text">
            {copy.zuletzt}
          </h2>
          <button type="button" onClick={() => schreiben(aktuell ? [angesehenLesen(JSON.stringify([aktuell]))[0]].filter(Boolean) : [])} className="min-h-11 text-small text-text-soft underline underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text">
            {copy.zuletztLeeren}
          </button>
        </div>
        {/* Wie die Shop-Leisten: rechts ausgeblendet = sichtbarer Hinweis aufs Weiterwischen, pr-10 hält das letzte Bild am Ende frei. */}
        <ul className="scrollbar-hide -mx-gutter mt-6 flex snap-x gap-4 overflow-x-auto px-gutter pr-10 pb-2 [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]">
          {list.map((x) => (
            <li key={x.s} className="w-36 shrink-0 snap-start sm:w-44">
              <a href={`/${locale}${x.h}`} className="group block text-text no-underline">
                <span className="relative block aspect-[4/5] overflow-hidden bg-surface-raised">
                  {x.i && <TileImage src={x.i} alt="" sizes="176px" quality={50} className="object-contain p-[6%] mix-blend-multiply transition-transform duration-(--duration-ui) ease-drift motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]" />}
                </span>
                {x.b && <span className="mt-2 block text-overline uppercase text-text-soft">{x.b}</span>}
                <span className="mt-1 block text-small text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">{shopTitel(x.n)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
