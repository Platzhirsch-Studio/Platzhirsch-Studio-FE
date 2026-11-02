// /de/ezarri/technik/pflege – 8 Pflegethemen als <details> (Team A, Konzept §3.7). Eigene Texte.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Accordion, Container } from "@/components/ui";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";

const PATH = "/ezarri/technik/pflege";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { PFLEGE, TECHNIK } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: PFLEGE.seoTitle, description: PFLEGE.description });
}

export default async function PflegePage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { PFLEGE, TECHNIK } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <>
      <PageHead crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb, href: "/ezarri/technik" }, { label: PFLEGE.crumb })} eyebrow={TECHNIK.eyebrow} title={PFLEGE.title} lead={PFLEGE.lead} />
      <Container size="text" className="pb-section">
        <Accordion headingLevel={2} items={PFLEGE.themen.map(([title, text], i) => ({ id: `pflege-${i + 1}`, title, content: <p>{text}</p> }))} />
        <p className="mt-8 text-small text-text-soft">{PFLEGE.quelle}</p>
      </Container>
      <Schluss />
    </>
  );
}
