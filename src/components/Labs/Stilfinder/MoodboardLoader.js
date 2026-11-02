import "server-only";
import { loadMoodboard } from "./catalog";
import Moodboard from "./Moodboard";
import { PREVIEW_MATERIALS, PREVIEW_MATERIAL_LABELS } from "./materialImages";
import { localizeProfile } from "./localize";
import { stilfinderCopy } from "@/lib/stilfinder/intl";

// Async Server Component, rendered inside <Suspense> by the result page: the
// profile, palette and brands are on screen immediately, only this part waits
// for the backoffice.
// Mehrsprachigkeit (01.11.2026): `locale` → Hinweistext, Material- und Tonnamen der Sprache.
export default async function MoodboardLoader({ profile, seed, locale = "de" }) {
  const copy = stilfinderCopy(locale) || stilfinderCopy("de");
  const { items } = await loadMoodboard(profile, seed);
  if (!items.length) {
    return <p className="mt-10 border border-ink/15 bg-white p-6 text-sm text-ink/80">{copy.ui.moodboard.unavailable}</p>;
  }
  const labels = copy.materials?.[profile.key] || PREVIEW_MATERIAL_LABELS[profile.key] || [];
  const materials = (PREVIEW_MATERIALS[profile.key] || []).map((img, i) => ({
    img,
    label: labels[i] || "",
  }));
  const palette = localizeProfile(profile, copy.profiles?.[profile.key]).palette;
  return <Moodboard items={items} palette={palette} materials={materials} />;
}
