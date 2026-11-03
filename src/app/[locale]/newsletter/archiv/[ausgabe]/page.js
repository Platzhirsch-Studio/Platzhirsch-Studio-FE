// /de/newsletter/archiv/[ausgabe] — Web-Fassung einer versendeten Ausgabe
// („2026-11“). Nur Deutsch. Unbekannte oder noch nicht versendete Ausgaben:
// 404 (Entwicklung: ?vorschau=1 zeigt jede vorbereitete Ausgabe mit
// markierten Platzhaltern für leere Slots).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import NewsletterAusgabe from "@/components/Empfehlen/NewsletterAusgabe";
import { archivAusgaben, ausgabeBySlug, preheader } from "@/lib/kundenbetreuung/newsletter/newsletter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const vorschauAn = (sp) => process.env.NODE_ENV !== "production" && (sp?.vorschau === "1" || sp?.vorschau?.[0] === "1");

function sichtbar(slug, vorschau) {
  const a = ausgabeBySlug(slug);
  if (!a) return null;
  if (vorschau) return a;
  return archivAusgaben().some((x) => x.slug === slug) ? a : null;
}

export async function generateMetadata({ params, searchParams }) {
  const { locale, ausgabe: slug } = await params;
  const sp = await searchParams;
  await connection();
  const vorschau = vorschauAn(sp);
  const a = locale === "de" ? sichtbar(slug, vorschau) : null;
  if (!a) notFound();
  const url = `${SITE_URL}/de/newsletter/archiv/${a.slug}`;
  const title = `${a.bloecke.find((b) => b.typ === "brief")?.titel || a.betreff} · Post aus Lochau ${a.monat}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description: preheader(a) || a.betreff,
    robots: { index: !vorschau && Boolean(a.versendetAm), follow: true },
    alternates: { canonical: url },
    openGraph: { type: "article", url, title, description: preheader(a) || a.betreff, siteName: SITE_NAME, locale: "de_AT" },
  };
}

export default async function NewsletterAusgabePage({ params, searchParams }) {
  const { locale, ausgabe: slug } = await params;
  const sp = await searchParams;
  await connection();
  const vorschau = vorschauAn(sp);
  const a = locale === "de" ? sichtbar(slug, vorschau) : null;
  if (!a) notFound();

  return (
    // Druck 02.11.: Papier bleibt weiß.
    <div className="bg-surface pt-10 pb-section text-text md:pt-14 print:bg-white">
      {vorschau && (
        // Druck 02.11.: Vorschau-Banner ist Entwicklungsstand – nicht im Ausdruck.
        <div role="note" className="-mt-10 mb-10 border-b border-line-strong bg-stone md:-mt-14 print:hidden">
          <Container className="py-4">
            <p className="text-ui text-text">Vorschau im Entwicklungsserver</p>
            <p className="mt-1 max-w-measure text-small text-text">
              {a.versendetAm ? "Versendete Ausgabe." : `Noch nicht versendet, geplant für ${a.versandGeplant}.`} Gestrichelte Kästen sind leere Slots.
            </p>
          </Container>
        </div>
      )}
      <Container>
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Newsletter", href: "/newsletter" },
            { label: "Archiv", href: "/newsletter/archiv" },
            { label: a.monat },
          ]}
        />
        <div className="mt-stack-m grid gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-2">
            <NewsletterAusgabe ausgabe={a} vorschau={vorschau} />
            <div className="mt-12 border-t border-line pt-8 print:hidden">
              <p className="text-body">Möchten Sie die nächste Ausgabe per E-Mail bekommen?</p>
              <p className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
                <Link href="/newsletter" className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current">
                  Newsletter bestellen
                </Link>
                <Link
                  href={`/newsletter/archiv${vorschau ? "?vorschau=1" : ""}`}
                  className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
                >
                  Alle Ausgaben
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
