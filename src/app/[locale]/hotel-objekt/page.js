// /<locale>/hotel-objekt – Hotel & Objekt (Welle 2, Auftrag Inhaber 29.10.2026).
// DE, EN, FR und IT mit eigener Canonical und hreflang (src/lib/hotel/seo.js).
// Inhaber-Entscheidung 01.11.2026: FR/IT sind eigene, übersetzte Seiten
// (src/lib/hotel/content-intl.js) – vorher 308 auf /en/hotel-objekt.
// Texte: src/lib/hotel/content.js · Layout: src/components/Hotel/HotelPage.js
// Anfrage: bestehender Lead-Weg /api/beratung_anfrage (src/lib/hotel/inquiry.js).
// Regeln: keine erfundenen Referenzen, Preise, Zertifikate oder Zusagen;
// Händler-Aussage nur ClassiCon und Ezarri; Kern-USP im Ablauf.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import HotelPage from "@/components/Hotel/HotelPage";
import { hotelCopy } from "@/lib/hotel/content";
import { hotelMetadata } from "@/lib/hotel/seo";
import { STEP1_KEYS, STEP2_KEYS } from "@/lib/forms/beratungContext";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return hotelMetadata(locale);
}

/** Wizard-Beschriftungen (Thema "objekt", Ort "hotel") in der Sprache der Seite – wie /beratung?thema=hotel. */
async function wizardLabels(locale) {
  const t = await getTranslations({ locale, namespace: "MultiStepForm" });
  const step1 = t.raw("step1Options") || [];
  const step2 = t.raw("step2Options") || [];
  return { topic: step1[STEP1_KEYS.indexOf("objekt")] || "Objekt oder Hotel", place: step2[STEP2_KEYS.indexOf("hotel")] || "Hotel oder Gastronomie" };
}

export default async function HotelObjektPage({ params }) {
  const { locale } = await params;
  const copy = hotelCopy(locale);
  if (!copy) notFound();
  const labels = await wizardLabels(locale);
  return <HotelPage locale={locale} copy={copy} labels={labels} />;
}
