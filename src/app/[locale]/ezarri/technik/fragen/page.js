// /de/ezarri/technik/fragen – 18 Fragen, eigene Antworten (Team A, Konzept §3.7).
// FAQPage-JSON-LD nur der Klarheit wegen (kein Rich Result für Händlerseiten).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Accordion, Container } from "@/components/ui";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { faqPage } from "@/components/Ezarri/Welt/schema";

const PATH = "/ezarri/technik/fragen";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { FRAGEN, TECHNIK } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: FRAGEN.seoTitle, description: FRAGEN.description });
}

export default async function FragenPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { FRAGEN, TECHNIK } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <>
      <PageHead
        crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb, href: "/ezarri/technik" }, { label: FRAGEN.crumb })}
        eyebrow={TECHNIK.eyebrow}
        title={FRAGEN.title}
        jsonLd={[faqPage({ locale, path: PATH, items: FRAGEN.liste })]}
      />
      <Container size="text" className="pb-section">
        <Accordion headingLevel={2} items={FRAGEN.liste.map(([q, a], i) => ({ id: `frage-${i + 1}`, title: q, content: <p>{a}</p> }))} />
        <CreditNote kinds={["daten"]} className="mt-8" />
      </Container>
      <Schluss />
    </>
  );
}
