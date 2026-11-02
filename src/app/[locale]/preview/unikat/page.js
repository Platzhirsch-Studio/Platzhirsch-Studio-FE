// /de/preview/unikat – Startseite als Unikat (Labs-Studie, nicht öffentlich).
// Reihenfolge: LIVE-Leiste → Foto-Hero mit Raum-Starter → Marken-Lauftext →
// „Die Linie wird Raum“ (Scroll-Bühne: Linie → Skizze → Modell → Raum →
// Bodensee-Licht) → Zahlen → Marken, Welten, Haus & Café, Termin.
// Doku: qa-screenshots/labs-unikat/README.md. Die echte Startseite bleibt unverändert.
import { notFound } from "next/navigation";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";
import { OPENING_HOURS } from "@/lib/site";
import { CAFE_PROFILE } from "@/lib/seo/siteSchema";
import s from "@/components/Preview/unikat/unikat.module.css";
import Stage from "@/components/Preview/unikat/Stage";
import Chapters from "@/components/Preview/unikat/Chapters";
import { Hero, Live, Marquee, Zahlen } from "@/components/Preview/unikat/Top";
import { unikatCopy } from "@/components/Preview/unikat/content";
import { katalogZahlen, marqueeNamen, starterData, stilOptionen } from "@/components/Preview/unikat/starterData";

export const generateMetadata = previewMetadata({
  title: "Prototyp Unikat – Die Linie wird Raum | Platzhirsch Home Living",
  description: "Design-Prototyp der Startseite: vom Strich zur Skizze, zum Modell, zum Raum – im Licht von Lochau. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const LIVE_FALLBACK = [
  { k: "sonne", text: "Sonnenstand über Lochau", note: "berechnet" },
  { k: "cafe", text: `Café ${CAFE_PROFILE.openingLineDe}` },
  { k: "showroom", text: "Showroom Di–Fr 10–18 Uhr, Sa 10–14 Uhr" },
];

export default async function UnikatPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  const copy = await unikatCopy();
  const starter = { raeume: starterData(), stile: stilOptionen() };
  const cafe = { days: [...CAFE_PROFILE.openingHours.days], opens: CAFE_PROFILE.openingHours.opens, closes: CAFE_PROFILE.openingHours.closes };
  const showroom = OPENING_HOURS.map((r) => ({ ...r, days: [...r.days] }));

  return (
    <div className={s.root} data-unikat="">
      <Live showroom={showroom} cafe={cafe} fallback={LIVE_FALLBACK} />
      <Hero copy={copy} starter={starter} />
      <Marquee names={marqueeNamen()} />
      <Stage copy={copy} nextId="u-kapitel" />
      <Zahlen z={katalogZahlen()} />
      <Chapters copy={copy} firstId="u-kapitel" />
    </div>
  );
}
