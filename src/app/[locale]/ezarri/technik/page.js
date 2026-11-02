// /de/ezarri/technik – Technik-Hub (Team A, Konzept §3.7).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { LinkRow, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";

const PATH = "/ezarri/technik";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { TECHNIK } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: TECHNIK.seoTitle, description: TECHNIK.description });
}

export default async function TechnikPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { TECHNIK } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <>
      <PageHead crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb })} eyebrow={TECHNIK.eyebrow} title={TECHNIK.title} lead={TECHNIK.lead} />
      <Container size="text" className="pb-section">
        <ul className="border-t border-line">
          {TECHNIK.bereiche.map((b) => (
            <LinkRow key={b.href} href={b.href} title={b.title} text={b.text} />
          ))}
        </ul>
        <p className="mt-8 text-body text-text-soft">{TECHNIK.fachbetrieb}</p>
      </Container>
      <Schluss />
    </>
  );
}
