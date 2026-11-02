// /de/preview/commerce — Abnahme-Vorschau für AP9 (Paket R5-commerce).
// Zeigt beide Strecken (Gutschein-Anfrage mit Bedingungen-Entwurf und
// Atelierverkauf mit Reservierungsanfrage), unabhängig von VOUCHER_MODE und
// ATELIER_MODE. Die Formulare senden hier NICHTS (demo).
// Sichtbar in der Entwicklung oder mit COMMERCE_PREVIEW=1 (mode.js), sonst
// 404; nur Deutsch; immer noindex. Atelier-Daten nur echt aus dem Sheet
// (ATELIER_CSV_URL), sonst Leerzustand: keine Beispielstücke auf der Seite.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, SmartLink } from "@/components/ui";
import VoucherSection from "@/components/Gutschein/VoucherSection";
import VoucherTerms from "@/components/Gutschein/VoucherTerms";
import AtelierIntro from "@/components/Atelier/AtelierIntro";
import AtelierList from "@/components/Atelier/AtelierList";
import AtelierDetail from "@/components/Atelier/AtelierDetail";
import ReservationForm from "@/components/Atelier/ReservationForm";
import { loadAtelier } from "@/lib/commerce/atelierSource";
import { NOINDEX, anzahlungMode, anzahlungModeRequested, atelierMode, commercePreviewEnabled, voucherMode, voucherModeRequested } from "@/lib/commerce/mode";
import { mockActive, paymentsConfigProblems } from "@/lib/payments/config";
import Widerrufsbelehrung from "@/components/Payments/Widerrufsbelehrung";
import { PRICE_NOTES } from "@/lib/commerce/priceRules";

export const metadata = {
  title: "Commerce-Vorschau – Entwurf",
  robots: NOINDEX,
};

const OPEN_POINTS = [
  "Insolvenz-/Gesellschaftsrechtler: Dürfen Gutscheine verkauft und Anzahlungen angenommen werden (Rechtspaket 0.1)?",
  "Kanzlei: Wer gibt die Gutscheine aus und wer verkauft die Ausstellungsstücke bis zur Eintragung der Handels-GmbH (W14)?",
  "Kanzlei: Widerrufsbelehrung, Muster-Formular und Seite „Vertrag widerrufen“ für Angebot und Rechnung (W5).",
  "Steuerberater: Einzweck- oder Mehrzweckgutschein, Café getrennt oder ausgenommen (W15).",
  "Team: PDF-Vorlage der drei Motive, Gutscheinregister mit Codes ab 12 Zeichen, Antwortzeit auf Anfragen.",
  "Team: Inventur, Veröffentlichungs-Tab des Atelier-Sheets, eigene Fotos und Zustandsbeschreibungen (E5).",
];

function Switch({ name, value, requested = value }) {
  const blocked = requested !== value;
  return (
    <li className="flex flex-wrap items-baseline gap-2">
      <code className="font-mono text-small">{name}</code>
      <span className="text-small">= {blocked ? `${requested}, wirksam ${value}` : value}</span>
      <span className="text-small text-text-soft">
        {blocked
          ? value === "off"
            ? "(Gutscheinbedingungen sind Entwurf: Seiten und API liefern 404)"
            : "(Online-Zahlung noch nicht bereit: Rückfall auf Anfrage)"
          : value === "off"
            ? "(Seiten und API liefern 404)"
            : value === "stripe"
              ? "(Online-Zahlung über Stripe aktiv)"
              : "(Anfragen aktiv, kein Geld)"}
      </span>
    </li>
  );
}

export default async function CommercePreviewPage({ params }) {
  const { locale } = await params;
  await connection();
  if (!commercePreviewEnabled() || locale !== "de") notFound();
  const atelier = await loadAtelier();
  const first = atelier.items[0] || null;

  return (
    <div className="bg-surface pb-section text-text">
      <div role="note" aria-labelledby="cp-banner" className="border-b border-line-strong bg-stone">
        <Container className="py-5">
          <p id="cp-banner" className="text-ui text-text">
            Entwurf, Freigabe Insolvenzrechtler/Steuerberater offen
          </p>
          <p className="mt-1 max-w-measure text-small text-text">
            Vorschau zur Abnahme, nicht öffentlich und nicht indexiert. Die Formulare senden hier nichts. Es wird kein Geld angenommen.
          </p>
          <ul className="mt-3 space-y-1">
            <Switch name="VOUCHER_MODE" value={voucherMode()} requested={voucherModeRequested()} />
            <Switch name="ATELIER_MODE" value={atelierMode()} />
            <Switch name="ANZAHLUNG_MODE" value={anzahlungMode()} requested={anzahlungModeRequested()} />
          </ul>
        </Container>
      </div>

      <Container className="pt-10 md:pt-14">
        <p className="text-overline uppercase text-text-accent">Vorschau · noindex</p>
        <Heading level={1} className="mt-stack-s">
          Gutscheine und Atelierverkauf
        </Heading>
        <nav aria-label="Abschnitte der Vorschau" className="mt-stack-m">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-ui">
            {[
              ["#gutscheine", "Gutscheine"],
              ["#bedingungen", "Gutscheinbedingungen"],
              ["#online-kauf", "Online-Kauf (Stripe)"],
              ["#atelier", "Atelierverkauf"],
              ["#offen", "Offene Punkte"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:decoration-2">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <section id="gutscheine" aria-label="Gutscheine" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <Container>
          <VoucherSection demo titleLevel={2} termsHref="#bedingungen" />
        </Container>
      </section>

      <section id="bedingungen" aria-labelledby="cp-bedingungen" className="mt-16 scroll-mt-24 border-t border-line bg-surface-raised py-12">
        <Container size="text">
          <p className="text-overline uppercase text-text-accent">Entwurf · vor Verwendung anwaltlich prüfen</p>
          <Heading level={2} id="cp-bedingungen" className="mt-stack-s">
            Gutscheinbedingungen
          </Heading>
          <div className="mt-8">
            <VoucherTerms headingLevel={3} />
          </div>
        </Container>
      </section>

      <section id="online-kauf" aria-labelledby="cp-online" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <Container>
          <p className="text-overline uppercase text-text-accent">Vorschau · Stripe Checkout</p>
          <Heading level={2} id="cp-online" className="mt-stack-s">
            Online-Kauf mit Zahlung
          </Heading>
          <p className="mt-4 max-w-measure text-body text-text">
            So sieht die Kaufstrecke mit VOUCHER_MODE=stripe aus. Das Formular hier sendet nichts. Den ganzen Ablauf mit simulierter Bezahlseite zeigt{" "}
            <SmartLink href="/gutscheine?zahlung=mock" className="underline underline-offset-4 hover:decoration-2">
              /de/gutscheine?zahlung=mock
            </SmartLink>{" "}
            im Entwicklungsserver.
          </p>
          <dl className="mt-6 max-w-text border-t border-line text-small">
            <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
              <dt className="text-text-soft">Noch offen für Stripe</dt>
              <dd className="sm:col-span-2">{paymentsConfigProblems().join(" · ") || "nichts, Schlüssel gesetzt"}</dd>
            </div>
            <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
              <dt className="text-text-soft">Mock (PAYMENTS_MOCK)</dt>
              <dd className="sm:col-span-2">{mockActive() ? "aktiv" : "aus"}</dd>
            </div>
          </dl>
          <div className="mt-12">
            <VoucherSection demo mode="stripe" titleLevel={3} termsHref="#bedingungen" anchorPrefix="online-" />
          </div>
        </Container>
      </section>

      <section id="atelier" aria-label="Atelierverkauf" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <Container>
          <AtelierIntro titleLevel={2} />
          <div className="mt-12">
            <AtelierList items={atelier.items} state={atelier.state} headingLevel={3} />
          </div>
          <dl className="mt-10 max-w-text border-t border-line text-small">
            <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
              <dt className="text-text-soft">Datenquelle</dt>
              <dd className="sm:col-span-2">
                {atelier.state === "empty"
                  ? "Keine ATELIER_CSV_URL gesetzt: Leerzustand."
                  : `${atelier.items.length} sichtbare Stücke, ${atelier.skipped.length} Zeilen übersprungen (Status: ${atelier.state}).`}
              </dd>
            </div>
            <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
              <dt className="text-text-soft">Pflichtzusätze je Preis</dt>
              <dd className="sm:col-span-2">{PRICE_NOTES.join(" · ")}</dd>
            </div>
            <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-3">
              <dt className="text-text-soft">Vergleichspreise</dt>
              <dd className="sm:col-span-2">Keine Streichpreise. UVP des Herstellers für Neuware nur mit Betrag, Stand und Quelle.</dd>
            </div>
          </dl>
        </Container>

        <Container className="mt-16">
          {first ? (
            <AtelierDetail item={first} demo titleLevel={3} />
          ) : (
            <div className="max-w-2xl border-t border-line-strong pt-8">
              <Heading level={3} size="title">
                Reservierungsanfrage
              </Heading>
              <p className="mt-2 mb-8 text-small text-text-soft">
                So sieht das Formular auf der Seite eines Stücks aus. Ohne Sheet-Daten ist hier kein Stück ausgewählt.
              </p>
              <ReservationForm slug="vorschau" title="Stück aus der Liste" demo />
            </div>
          )}
        </Container>
      </section>

      <section id="offen" aria-labelledby="cp-offen" className="mt-16 scroll-mt-24 border-t border-line pt-12">
        <Container size="text">
          <Heading level={2} size="display-m" id="cp-offen">
            Offen vor dem Einschalten
          </Heading>
          <ol className="mt-8 list-decimal space-y-3 pl-6 text-body">
            {OPEN_POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </Container>
      </section>
    </div>
  );
}
