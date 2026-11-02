// /de/newsletter/archiv — Archiv des Newsletters „Post aus Lochau“ (nur
// Deutsch; EN/FR/IT 404). Zeigt NUR versendete Ausgaben mit Inhalt
// (lib/kundenbetreuung/newsletter/newsletter.js archivAusgaben). Solange keine
// Ausgabe versendet ist, sagt die Seite das ehrlich und bleibt noindex.
// Entwicklung: ?vorschau=1 listet auch die vorbereiteten Ausgaben (mit Banner).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { archivAusgaben, datumLang, inhaltZeile, versandbereit } from "@/lib/kundenbetreuung/newsletter/newsletter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/de/newsletter/archiv`;
const TITLE = "Newsletter-Archiv";
const DESCRIPTION = "Alle bisherigen Ausgaben von „Post aus Lochau“: neue Stücke in der Ausstellung, Haralds Skizze des Monats und Termine im Showroom.";

const vorschauAn = (sp) => process.env.NODE_ENV !== "production" && (sp?.vorschau === "1" || sp?.vorschau?.[0] === "1");

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") {
    await connection();
    notFound();
  }
  const hasIssues = archivAusgaben().length > 0;
  return {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    robots: { index: hasIssues, follow: true },
    alternates: { canonical: PAGE_URL },
    openGraph: { type: "website", url: PAGE_URL, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: "de_AT" },
  };
}

export default async function NewsletterArchivPage({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") {
    await connection();
    notFound();
  }
  const sp = await searchParams;
  const vorschau = vorschauAn(sp);
  const ausgaben = archivAusgaben(undefined, { vorschau });

  return (
    <div className="bg-surface pt-10 pb-section text-text md:pt-14">
      {vorschau && (
        <div role="note" className="-mt-10 mb-10 border-b border-line-strong bg-stone md:-mt-14">
          <Container className="py-4">
            <p className="text-ui text-text">Vorschau im Entwicklungsserver</p>
            <p className="mt-1 max-w-measure text-small text-text">
              Zeigt auch Ausgaben, die noch nicht versendet sind. Öffentlich erscheinen nur versendete Ausgaben mit Inhalt.
            </p>
          </Container>
        </div>
      )}
      <Container>
        <Breadcrumbs items={[{ label: "Startseite", href: "/" }, { label: "Newsletter", href: "/newsletter" }, { label: "Archiv" }]} />
        <div className="mt-stack-m grid gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-2">
            <p className="text-overline uppercase text-text-accent">Post aus Lochau</p>
            <h1 className="mt-stack-s font-display text-display-l">{TITLE}</h1>
            <p className="mt-stack-m max-w-measure text-lead">
              Etwa einmal im Monat ein kurzer Brief: neue Stücke in der Ausstellung, Haralds Skizze des Monats und Termine im Haus. Keine
              täglichen Angebote.
            </p>

            {ausgaben.length ? (
              <ol className="mt-12 divide-y divide-line border-y border-line">
                {ausgaben.map((a) => (
                  <li key={a.slug} className="py-6">
                    <p className="tabular text-small text-text-soft">
                      Nr. {a.nr} · {a.monat}
                      {a.versendetAm ? ` · versendet am ${datumLang(a.versendetAm)}` : " · noch nicht versendet"}
                      {vorschau && !versandbereit(a) ? " · Slots offen" : ""}
                    </p>
                    <h2 className="mt-1 text-title">
                      <Link
                        href={`/newsletter/archiv/${a.slug}${vorschau ? "?vorschau=1" : ""}`}
                        className="underline decoration-line-strong underline-offset-4 hover:decoration-current"
                      >
                        {a.bloecke.find((b) => b.typ === "brief")?.titel || a.betreff}
                      </Link>
                    </h2>
                    {inhaltZeile(a) && <p className="mt-1 text-body text-text-soft">{inhaltZeile(a)}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-12 max-w-measure border-l-2 border-line-strong pl-4 text-body">
                Die erste Ausgabe ist in Vorbereitung. Sobald sie versendet ist, finden Sie sie hier.
              </p>
            )}

            <p className="mt-stack-m text-body">
              <Link href="/newsletter" className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                Newsletter bestellen
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
