// /[locale]/termin/testraum – Platzhalter für den Frappe-Meet-Raum im Mock.
// Deutlich als Test markiert, erklärt den echten Ablauf (Warteraum, keine
// Aufzeichnung) und bietet eine rein lokale Kamera-/Mikrofonprüfung.
// Im Frappe-Betrieb gibt es die Seite nicht (404). noindex.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Eyebrow, Heading, Lead, LinkArrow } from "@/components/ui";
import DeviceCheck from "@/components/Termin/DeviceCheck";
import { TERMIN_LOCALES, terminCopy } from "@/lib/booking/copy";
import { terminMode } from "@/lib/booking/config";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: terminCopy(locale).testraum.metaTitle, robots: { index: false, follow: false } };
}

export default async function TestraumPage({ params }) {
  await connection();
  const { locale } = await params;
  if (!TERMIN_LOCALES.includes(locale) || terminMode() !== "mock") notFound();
  const t = terminCopy(locale).testraum;
  return (
    <Container size="text" className="py-16 md:py-24" data-termin-testraum>
      <Eyebrow>
        <span className="inline-block border border-current px-2 py-0.5">{t.badge}</span>
      </Eyebrow>
      <Heading level={1} className="mt-stack-s text-balance">
        {t.title}
      </Heading>
      <Lead tone="soft" className="mt-stack-s">
        {t.lead}
      </Lead>
      <ol className="mt-10 grid gap-4">
        {t.steps.map((s, i) => (
          <li key={i} className="flex gap-4 border-t border-line pt-4 text-body text-text">
            <span aria-hidden="true" className="tabular text-text-soft">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <DeviceCheck copy={{ testraum: t }} />
      <LinkArrow href="/termin" className="mt-10">
        {t.back}
      </LinkArrow>
    </Container>
  );
}
