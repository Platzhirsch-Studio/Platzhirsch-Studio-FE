import { notFound } from "next/navigation";
import StilfinderQuiz from "@/components/Labs/Stilfinder/StilfinderQuiz";
import HandBridge from "@/components/Reusable/HandBridge";
import StilfinderSeoInfo from "@/components/Labs/Stilfinder/SeoInfo";
import JsonLd from "@/components/Reusable/JsonLd";
import { stilfinderClientCopy, stilfinderCopy } from "@/lib/stilfinder/intl";
import { stilfinderMetadata, stilfinderSchema } from "@/lib/stilfinder/seo";

// /<locale>/stil-finder (früher /de/labs/stilfinder, 308) – Stil-Finder: a picture quiz (six picture questions + one optional) that ends in a style
// profile with palette, brands and a moodboard of real catalogue products.
// The quiz itself needs no server data; the result page
// (ergebnis/[profil]) loads the moodboard on demand.

// Feste URL seit der Integration (Inhaber-Entscheidung Nr. 9): indexierbar.
// Mehrsprachigkeit (01.11.2026): DE, EN, FR, IT – Texte serverseitig aus
// src/lib/stilfinder/intl (nicht in den Client-Messages), Metadaten mit eigener
// Canonical und reziprokem hreflang (src/lib/stilfinder/seo.js).
// mobil-code-seo fix-03: DE-Title/Description auf die gesuchte Frage
// („welcher einrichtungsstil passt zu mir“, SISTRIX DE 100/Monat – die
// häufigste der Varianten), H1 bleibt „Welcher Wohnstil sind Sie?“.
export async function generateMetadata({ params }) {
  const { locale } = await params;
  return stilfinderMetadata(locale);
}

export default async function StilfinderPage({ params }) {
  const { locale } = await params;
  const copy = stilfinderCopy(locale);
  if (!copy) notFound();
  const bridge = copy.page.bridge;
  return (
    <>
      <JsonLd data={stilfinderSchema(locale)} />
      <StilfinderQuiz copy={stilfinderClientCopy(locale)} />
      {/* Server-HTML: die fünf Stile + FAQ (FAQPage), crawlbar ohne Quiz-Start */}
      <StilfinderSeoInfo locale={locale} />
      <HandBridge
        className="pb-16"
        copy={locale === "de" ? null : { aria: bridge.aria, text: bridge.text, link: bridge.how }}
        // Sofaplaner gibt es auf Deutsch und Englisch (FR/IT: kein Link).
        links={bridge.sofa ? [{ href: "/sofaplaner", label: bridge.sofa }] : []}
      />
    </>
  );
}
