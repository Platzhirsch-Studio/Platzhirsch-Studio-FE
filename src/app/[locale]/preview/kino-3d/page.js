// /de/preview/kino-3d – Kino-Lab 2 „3D-Bühne“ (Labs-Studie, nicht öffentlich).
// Vollbild-Filmset: Bleistift-Umriss → Möbel materialisiert sich im
// Scheinwerfer, Scroll-Drehbuch mit Kamerafahrt, Schnitt aufs Detail,
// Modellwechsel und Licht „Morgen am See“ → „Abend“, dann Welten und Termin.
// Modelle: CC0-Beispielmodelle (Poly Haven) aus dem 3D/AR-Viewer der Website,
// klar als Beispiel gekennzeichnet – kein Herstellermodell, keine Herstellerangabe.
// Texte über das Studio nur aus den Messages (HomePage) bzw. dem Claim-Guard
// (über unikatCopy); neu formuliert sind nur Sätze über diese Seite selbst.
import { notFound } from "next/navigation";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";
import { AR_MODELS, SAMPLE_NOTICE } from "@/components/Labs/ArViewer/data/catalog";
import { unikatCopy } from "@/components/Preview/unikat/content";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { productsPath } from "@/utils/routing";
import Kino3D from "@/components/Preview/kino3d/Kino3D";
import s from "@/components/Preview/kino3d/kino3d.module.css";

export const generateMetadata = previewMetadata({
  title: "Prototyp Kino 3D-Bühne | Platzhirsch Home Living",
  description: "Design-Prototyp: ein Möbel auf der Bühne – erst die Linie, dann das Volumen. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const LINKS = {
  sofa_02: { href: productsPath("de", "sofas-couches"), label: "Sofas & Couches im Sortiment" },
  mid_century_lounge_chair: { href: productsPath("de", "armchairs-stools"), label: "Sessel & Hocker im Sortiment" },
  modern_ceiling_lamp_01: { href: productsPath("de", "lamps"), label: "Leuchten im Sortiment" },
};

function modelData() {
  return ["sofa_02", "mid_century_lounge_chair", "modern_ceiling_lamp_01"].map((id) => {
    const m = AR_MODELS.find((x) => x.id === id);
    return {
      id,
      src: m.src,
      name: m.name,
      kategorie: m.category,
      notice: SAMPLE_NOTICE,
      credit: m.credit,
      link: LINKS[id],
      hotspots: Object.fromEntries(m.hotspots.map((h) => [h.id, { title: h.title, text: h.text }])),
      variants: Object.fromEntries((m.variants || []).map((v) => [v.variant, v.note])),
    };
  });
}

export default async function Kino3DPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  const u = await unikatCopy();
  const models = modelData();
  const [sofa, chair, lamp] = models;

  const copy = {
    slates: ["Erst die Linie", "Dann Ihr Raum", "Detail", "Szenenwechsel", "Abend am See", "Welten", "Termin"],
    cards: [
      { id: "linie", overline: "Kino-Lab · 3D-Bühne", title: u.hero.title[0], text: u.hero.lead },
      { id: "raum", overline: "Unsere Arbeitsweise", title: u.hero.title[1], text: u.stage.steps.find((x) => x.id === "raum")?.text },
      {
        id: "detail",
        overline: `Im Detail · ${sofa.name}`,
        title: `${sofa.hotspots.ruecken.title}.`,
        text: sofa.hotspots.ruecken.text,
        note: `Farbe Cognac: ${sofa.variants.cognac}.`,
      },
      {
        id: "wechsel",
        overline: `Szenenwechsel · ${chair.name}`,
        title: "Ein zweites Stück, dieselbe Bühne.",
        text: `${chair.hotspots.schale.title}: ${chair.hotspots.schale.text}`,
      },
      {
        id: "abend",
        overline: `Abend · ${lamp.name}`,
        title: "Abends am See.",
        text: "Dieselbe Bühne im Abendlicht: Die Pendelleuchte geht an, das Licht wird wärmer. Ziehen Sie am Möbel, um es im neuen Licht zu drehen.",
      },
      { id: "welten", overline: u.worlds.eyebrow, title: u.worlds.title, worlds: u.worlds.items },
      {
        id: "termin",
        overline: u.cta.eyebrow,
        title: u.cta.title,
        text: u.cta.text,
        cta: { href: "/beratung", label: u.cta.primary, phone: `Anrufen: ${PHONE_DISPLAY}`, phoneHref: PHONE_HREF },
      },
    ],
  };

  const still = {
    src: "/labs/kino-3d/standbild.webp",
    w: 1600,
    h: 900,
    alt: `Gerendertes Standbild der 3D-Bühne: ${sofa.name} (Beispielmodell) im Scheinwerferlicht auf dunklem Walnussboden`,
    caption: "Standbild der 3D-Bühne · Beispielmodell (CC0, Poly Haven), kein Produkt aus unserem Sortiment",
  };

  return (
    <div className={s.root} data-kino3d="">
      <Kino3D copy={copy} models={models} still={still} />
    </div>
  );
}
