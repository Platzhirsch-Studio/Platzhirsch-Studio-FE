// /de/gutscheine — Gutschein-ANFRAGE (Paket R5-commerce, Masterplan AP9 Nr. 1).
// Hinter dem Schalter VOUCHER_MODE: "off" (Standard) → 404, "anfrage" → Seite
// mit Anfrageformular. Nur Deutsch (andere Sprachen 404). Kein Geld, kein
// Online-Vertrag; nicht in Navigation, Sitemap oder llms.txt (das verdrahtet
// erst der Integrator nach Freigabe durch Insolvenzrechtler und Steuerberater).
// VOUCHER_MODE=stripe (wirksam, siehe mode.js): Online-Kauf über Stripe
// Checkout, die Anfrage bleibt für Firmengeschenke darunter.
// Entwicklung: /de/gutscheine?zahlung=mock zeigt die Kaufstrecke mit
// simulierter Bezahlseite, auch solange die Bedingungen Entwurf sind (nur
// NODE_ENV=development, nie in Produktion; noindex, Banner).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container, LinkArrow } from "@/components/ui";
import VoucherSection from "@/components/Gutschein/VoucherSection";
import { NOINDEX, voucherDevMock, voucherEnabled, voucherMode } from "@/lib/commerce/mode";
import { mockActive } from "@/lib/payments/config";
import { SITE_NAME, SITE_URL } from "@/lib/site";
// Service Nr. 10 (Integration 29.10.2026): Hinweis auf die teilbare Wunschliste.
import { wunschlisteAvailable } from "@/lib/wunschliste/mode";

const PAGE_URL = `${SITE_URL}/de/gutscheine`;
const TITLE = "Gutscheine für Einrichtung";
const DESCRIPTION = "Gutscheine ab 25 € für Möbel, Leuchten und Ausstellungsstücke im Showroom in Lochau. Unbefristet gültig, in Teilen einlösbar.";

const queryOf = (v) => (typeof v === "string" ? v : null);

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const { zahlung } = await searchParams;
  await connection();
  if (locale !== "de" || !voucherEnabled() || voucherDevMock(process.env, queryOf(zahlung))) return { robots: NOINDEX };
  return {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    openGraph: { type: "website", url: PAGE_URL, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: "de_AT" },
  };
}

export default async function GutscheinePage({ params, searchParams }) {
  const { locale } = await params;
  const { zahlung } = await searchParams;
  await connection();
  const devMock = locale === "de" && voucherDevMock(process.env, queryOf(zahlung));
  if (!devMock) {
    if (locale !== "de" || !voucherEnabled()) notFound();
  }
  const mode = devMock ? "stripe" : voucherMode();
  const mock = devMock || (mode === "stripe" && mockActive(process.env));
  return (
    <div className="bg-surface pt-10 pb-section text-text md:pt-14">
      {devMock && (
        <div role="note" className="-mt-10 mb-10 border-b border-line-strong bg-stone md:-mt-14">
          <Container className="py-4">
            <p className="text-ui text-text">Entwicklungs-Mock der Kaufstrecke</p>
            <p className="mt-1 max-w-measure text-small text-text">
              Simulierte Bezahlseite, es fließt kein Geld. Gutscheinbedingungen und Widerrufsbelehrung sind Entwurf. Nur im Entwicklungsserver sichtbar.
            </p>
          </Container>
        </div>
      )}
      <Container>
        <Breadcrumbs className="mb-stack-m" items={[{ label: "Startseite", href: "/" }, { label: "Gutscheine" }]} />
        <VoucherSection mode={mode} mock={mock} termsHref={devMock ? "/preview/commerce#bedingungen" : "/gutscheinbedingungen"} />
        {wunschlisteAvailable() && (
          <section aria-labelledby="gutschein-wunschliste" data-wunschliste-hinweis="" className="mt-section border-t border-line pt-6">
            <h2 id="gutschein-wunschliste" className="text-overline uppercase text-text-accent">
              Gemeinsam schenken
            </h2>
            <p className="mt-stack-s max-w-measure text-body text-text-soft">
              Zum Einzug oder zur Hochzeit: Teilen Sie Ihre Merkliste als Wunschliste. Familie und Freunde reservieren einzelne Stücke oder tragen zu einem Gutschein bei.
            </p>
            <LinkArrow href="/merkliste" className="mt-2">
              Zur Merkliste
            </LinkArrow>
          </section>
        )}
      </Container>
    </div>
  );
}
