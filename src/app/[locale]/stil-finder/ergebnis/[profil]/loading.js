"use client";

import { useParams } from "next/navigation";
import { ResultSkeleton } from "@/components/Labs/Stilfinder/Skeletons";
import { profileBySlug } from "@/components/Labs/Stilfinder/profiles";
import { useStilCopy } from "@/components/Labs/Stilfinder/StilCopy";

// Instant loading state for the result route: the quiz navigates here and the
// skeleton (profile head + palette) shows at once instead of the quiz hanging
// on "Wir legen Ihr Moodboard aus …" until the server has answered.
// Visual P1-4: client component so it can read the slug (loading.js gets no
// params) and show the profile's own name, tones and blurred hero at once.
// Mehrsprachigkeit (01.11.2026): layout.js liegt über dieser Suspense-Grenze und
// gibt die Texte der Sprache als Context mit (StilCopyProvider).
export default function Loading() {
  const { profil } = useParams();
  const { t, profiles } = useStilCopy();
  const base = profileBySlug(profil);
  return <ResultSkeleton profile={base ? profiles[base.key] : null} t={{ loading: t.skeleton.loading, eyebrow: t.result.eyebrow }} />;
}
