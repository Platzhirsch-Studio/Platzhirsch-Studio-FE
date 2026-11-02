// Stil-Finder – loading skeletons (plain markup, usable from Server and
// Client Components). `ResultSkeleton` is the route's loading.js, shown the
// instant the quiz navigates; `MoodboardSkeleton` is the Suspense fallback
// while the catalogue products stream in.

import { blurBackdrop } from "./blurBackdrop";

// Motion (01.11.2026): shared .ph-skeleton (globals.css) – linen base with one
// paper shimmer (--duration-shimmer) instead of a pulsing opacity; static under
// reduced motion and "Ruhige Ansicht".
const block = "ph-skeleton";

export function MoodboardSkeleton({ count = 8 }) {
  return (
    <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const big = i === 0;
        const wide = i === 5;
        return (
          <li key={i} className={big ? "col-span-2 md:row-span-2" : wide ? "col-span-2" : ""}>
            <div
              className={`${block} ${big ? "aspect-[4/3] md:aspect-square" : wide ? "aspect-[2/1]" : "aspect-square"}`}
            />
            <div className={`${block} mt-3 h-3 w-16`} />
            <div className={`${block} mt-2 h-4 w-28`} />
          </li>
        );
      })}
    </ul>
  );
}

// Visual P1-4: profile-aware skeleton. loading.js knows the slug, so the
// skeleton already shows what is certain – the profile name, tagline and the
// five palette tones – instead of grey bars. The hero slot is the palette
// shutter fully closed over the blurred photo: exactly the first frame of the
// reveal in StilResult (fix-01), so skeleton → page reads as one shot.
// Paddings mirror the StilResult header (before: lg:pt-52 vs. lg:pt-28 –
// the head jumped ~96 px up when the page arrived).
// Mehrsprachigkeit (01.11.2026): `profile` kommt bereits mit dem Text-Overlay
// der Sprache, `t` = UI-Texte (Standard: Deutsch).
export function ResultSkeleton({ profile = null, t = { loading: "Ihr Stilprofil wird geladen …", eyebrow: "Ihr Stilprofil" } }) {
  return (
    <div className="bg-[#faf8f4] text-ink" role="status" aria-live="polite">
      <span className="sr-only">{t.loading}</span>
      <div className="px-4 pb-16 pt-8 sm:px-6 sm:pt-16 md:pt-24 lg:pb-24 lg:pt-28" aria-hidden="true">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-12 md:gap-12">
          {profile ? (
            <div
              className="relative -mx-4 flex aspect-[4/3] overflow-hidden bg-stone sm:mx-0 md:order-last md:col-span-6 md:aspect-[5/6]"
              style={blurBackdrop(profile.hero.img)}
            >
              {profile.palette.map((c) => (
                <span key={c.hex} className="h-full flex-1" style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          ) : (
            <div className={`${block} -mx-4 aspect-[4/3] sm:mx-0 md:order-last md:col-span-6 md:aspect-[5/6]`} />
          )}
          <div className="md:col-span-6">
            {profile ? (
              <>
                <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.eyebrow}</p>
                <p className="font-display mt-3 pb-[0.08em] text-5xl leading-[1.02] sm:mt-4 sm:text-6xl lg:text-7xl">
                  {profile.name}
                </p>
                <p className="font-display mt-4 text-2xl italic text-ink/85">{profile.tagline}</p>
              </>
            ) : (
              <>
                <div className={`${block} h-3 w-28`} />
                <div className={`${block} mt-5 h-12 w-4/5 sm:h-16`} />
                <div className={`${block} mt-5 h-6 w-3/5`} />
              </>
            )}
            <div className={`${block} mt-6 h-4 w-full max-w-md`} />
            <div className={`${block} mt-2 h-4 w-11/12 max-w-md`} />
            <div className={`${block} mt-2 h-4 w-3/4 max-w-md`} />
          </div>
        </div>
      </div>
      <div className="border-t border-ink/10 px-4 py-16 sm:px-6" aria-hidden="true">
        <div className="mx-auto max-w-6xl">
          <div className={`${block} h-3 w-24`} />
          <div className={`${block} mt-4 h-9 w-72 max-w-full`} />
          <div className="mt-10 grid grid-cols-1 gap-1 sm:grid-cols-5 sm:gap-2">
            {Array.from({ length: 5 }, (_, i) =>
              profile ? (
                <div key={i} className="h-14 sm:h-64" style={{ backgroundColor: profile.palette[i]?.hex }} />
              ) : (
                <div key={i} className={`${block} h-14 sm:h-64`} />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
