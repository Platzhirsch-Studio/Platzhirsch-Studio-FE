import { Suspense } from "react";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { warmProfile } from "@/lib/stilfinder/warm";
import { z } from "zod";
import StilResult from "@/components/Labs/Stilfinder/StilResult";
import MoodboardLoader from "@/components/Labs/Stilfinder/MoodboardLoader";
import { MoodboardSkeleton } from "@/components/Labs/Stilfinder/Skeletons";
import { PROFILE_ORDER, PROFILES, profileBySlug } from "@/components/Labs/Stilfinder/profiles";
import { isValidCode, scoreAnswers, seedFromCode } from "@/components/Labs/Stilfinder/questions";
import { ownCalendarActive } from "@/components/Booking/config";
import { localizeProfile } from "@/components/Labs/Stilfinder/localize";
import { STILFINDER_LOCALES, stilfinderCopy } from "@/lib/stilfinder/intl";
import { stilfinderResultMetadata } from "@/lib/stilfinder/seo";

// Shareable result: /de/stil-finder/ergebnis/<profil>?a=<antwort-code>.
// The path names the profile; the optional answer code (validated, never
// stored) adds the personal mix and seeds the moodboard selection, so one link
// always shows the same board.

const paramsSchema = z.object({
  // Mehrsprachigkeit (01.11.2026): DE, EN, FR, IT (layout.js prüft dasselbe vor der Suspense-Grenze).
  locale: z.enum(STILFINDER_LOCALES),
  profil: z.enum(PROFILE_ORDER.map((k) => PROFILES[k].slug)),
});
const codeSchema = z
  .string()
  .max(16)
  .refine((v) => isValidCode(v))
  .optional()
  .catch(undefined);

// mobil-code-seo fix-02: canonical ohne ?a= (robots.js verspricht das für die
// Pinterest-Merken-Links), og:url/og:type/og:site_name/og:locale für Rich Pins
// und Messenger-Vorschauen. og:image und twitter:image liefern
// opengraph-image.js / twitter-image.js (Palettenkarte) – nicht mehr
// profile.hero.src (teils Herstellerbilder ohne Freigabe). Weiter noindex
// (Inhaber-Entscheidung), aber follow: die Marken-Links sind echte Seiten.
// Mehrsprachigkeit (01.11.2026): stilfinderResultMetadata() – Canonical je
// Sprache, robots { index: false, follow: true }, kein hreflang (noindex).
export async function generateMetadata({ params }) {
  const { locale, profil } = await params;
  const base = profileBySlug(profil);
  const copy = stilfinderCopy(locale);
  if (!base || !copy) return { robots: { index: false, follow: false } };
  return stilfinderResultMetadata(locale, localizeProfile(base, copy.profiles?.[base.key]));
}

export default async function StilErgebnisPage({ params, searchParams }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const profile = profileBySlug(parsed.data.profil);

  const sp = await searchParams;
  const code = codeSchema.parse(Array.isArray(sp?.a) ? sp.a[0] : sp?.a);
  const scored = code ? scoreAnswers(code) : null;
  // A hand-edited link whose answers point to another profile keeps the
  // profile in the path, but then the mix would contradict it – drop it.
  const result = scored && scored.primary === profile.key ? scored : null;

  // Profile, palette and brands render at once; the moodboard streams in
  // (Suspense) while the catalogue is fetched. loading.js covers the moment
  // before the first byte.
  const moodboard = (
    <Suspense fallback={<MoodboardSkeleton />}>
      <MoodboardLoader profile={profile} seed={seedFromCode(code || profile.slug)} locale={parsed.data.locale} />
    </Suspense>
  );

  // QA P1.1 b: while the visitor reads the result, the server loads the
  // pictures of this profile into the disk cache – the PDF is faster later.
  after(() => warmProfile(profile.key));

  return <StilResult profileKey={profile.key} result={result} moodboard={moodboard} code={result ? code : null} calendar={ownCalendarActive()} />;
}
