// /de/preview/kino-film – Kino-Lab 1 „Showroom-Film“ (Labs-Studie, nicht öffentlich).
// Die Startseite als Film: sechs Szenen à 100svh, Letterbox, Titelkarten,
// Szenenschnitte beim Scrollen. Bewegtbild = WebGL-Kamerafahrt (2.5D) über das
// eigene Showroom-Foto (aboutHome.jpg, Heidegger Fotografie). Liegt später
// echtes Material unter public/video/hero.mp4, ersetzt es den Foto-Film
// automatisch (Prüfung hier am Server). Herstellerbilder (Szene 4) nur
// unverändert, ganz, ohne Zoom/Beschnitt. Händlersätze nur über den Claim-Guard.
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";
import { ADDRESS, DIRECTIONS_URL, PHONE_DISPLAY, PHONE_HREF, openingHoursLine } from "@/lib/site";
import { CAFE_PROFILE } from "@/lib/seo/siteSchema";
import { dealerStatementList, dealerStudio } from "@/lib/legal/claims";
import { landingTermin } from "@/components/Landing/parts";
import Film from "@/components/Preview/kino-film/Film";

export const generateMetadata = previewMetadata({
  title: "Kino-Lab Showroom-Film | Platzhirsch Home Living",
  description: "Design-Prototyp der Startseite als Film: Linie, Raum, Minotti Studio, Wasser & Wärme, Abend im Café. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const WELLNESS = [
  {
    slug: "dornbracht",
    brand: "Dornbracht",
    src: "/Images/Wellness/produkte/dornbracht/dornbracht-aquahalo-1.webp",
    width: 1600,
    height: 1098,
    alt: "Dornbracht Aquahalo: Regenbrause über einer runden Duschfläche in einem Raum aus hellem Holz",
  },
  {
    slug: "starpool",
    brand: "Starpool",
    src: "/Images/Wellness/produkte/starpool/starpool-classic-sauna-1.webp",
    width: 1600,
    height: 768,
    alt: "Starpool Classic Sauna aus Holz mit Panoramafenster und Saunaofen",
  },
  {
    slug: "antoniolupi",
    brand: "antoniolupi",
    src: "/Images/Wellness/produkte/antoniolupi/antoniolupi-ilbagno-1.webp",
    width: 1600,
    height: 788,
    alt: "antoniolupi Il Bagno: Waschtisch mit schlankem Holzgestell vor heller Wand",
  },
];

export default async function KinoFilmPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound();

  const hasVideo = fs.existsSync(path.join(process.cwd(), "public", "video", "hero.mp4"));
  const minotti = dealerStudio("minotti", "de");
  const termin = landingTermin({ thema: "Showroom-Film" }, "de");

  const data = {
    hasVideo,
    minotti: minotti ? { title: minotti.title, statement: minotti.statement, evidenceUrl: minotti.showEvidenceLink ? minotti.evidenceUrl : null } : null,
    wellness: WELLNESS,
    wellnessDealer: dealerStatementList(WELLNESS.map((w) => w.slug), "de"),
    cafeHours: CAFE_PROFILE.openingLineDe,
    showroomHours: openingHoursLine("de"),
    address: { street: ADDRESS.street, postalCode: ADDRESS.postalCode, city: ADDRESS.city, country: ADDRESS.country },
    directions: DIRECTIONS_URL,
    phone: { display: PHONE_DISPLAY, href: PHONE_HREF },
    termin,
  };

  return <Film data={data} />;
}
