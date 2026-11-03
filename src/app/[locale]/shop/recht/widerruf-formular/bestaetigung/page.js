// /[locale]/shop/recht/widerruf-formular/bestaetigung?id=WS-…&zeit=… —
// Bestätigungsseite der Online-Rücktrittsfunktion (§ 13a FAGG): zeigt nur
// Eingangsnummer und Zeitpunkt (keine Personendaten in der Adresse). Die
// Eingangsbestätigung mit dem Inhalt der Erklärung kommt per E-Mail (nicht
// im Testmodus). Nur bei SHOP_MODE test/live, immer noindex.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Heading } from "@/components/ui";
import TestBanner from "@/components/Shop/TestBanner";
import { NOINDEX } from "@/lib/commerce/mode";
import { shopCopy } from "@/lib/shop/copy";
import { ANBIETER } from "@/lib/shop/legalTexte";
import { shopMode } from "@/lib/shop/mode";

export const metadata = { title: "Widerruf eingegangen | Platzhirsch Home Living", robots: NOINDEX };

const ID_RE = /^WS-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default async function ShopWiderrufBestaetigungPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { id, zeit } = await searchParams;
  await connection();
  const mode = shopMode(process.env);
  if (mode === "off") notFound();
  const c = shopCopy(locale);
  const eingang = typeof id === "string" && ID_RE.test(id) ? id : null;
  const ms = typeof zeit === "string" ? Date.parse(zeit) : NaN;
  const wann = Number.isNaN(ms) ? null : new Intl.DateTimeFormat("de-AT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(ms));
  return (
    <div className="bg-surface-raised pt-6 pb-section text-text md:pt-10">
      <Container size="text">
        {mode === "test" && <TestBanner text={c.testBanner} />}
        <p className="mt-8 text-overline uppercase text-text-accent">Onlineshop</p>
        <Heading level={1} size="display-m" className="mt-stack-s">
          {eingang ? "Ihr Widerruf ist eingegangen" : "Widerruf"}
        </Heading>
        <div className="mt-6 max-w-measure space-y-3 text-body text-text" lang="de" data-shop-widerruf-bestaetigung={eingang || ""}>
          {eingang ? (
            <>
              <p>
                Eingangsnummer {eingang}
                {wann ? `, eingegangen am ${wann}` : ""}. Bitte notieren Sie sich die Eingangsnummer.
              </p>
              <p>
                {mode === "test"
                  ? "Im Testmodus wird keine E-Mail versendet."
                  : "Die Eingangsbestätigung mit dem Inhalt Ihrer Erklärung, Datum und Uhrzeit senden wir Ihnen per E-Mail an die angegebene Adresse."}
              </p>
              <p>
                Bitte senden Sie die Waren binnen vierzehn Tagen an {ANBIETER.firma}, Showroom {ANBIETER.marke}, zurück oder übergeben Sie sie dort. Wir erstatten alle Zahlungen einschließlich der Lieferkosten
                (Standardlieferung) spätestens binnen vierzehn Tagen über das ursprüngliche Zahlungsmittel, sobald wir die Waren zurückerhalten oder Ihren Nachweis der Rücksendung haben.
              </p>
            </>
          ) : (
            <p>Für diese Seite fehlt die Eingangsnummer. Haben Sie das Formular noch nicht abgeschickt, finden Sie es unter „Vertrag widerrufen“.</p>
          )}
          <p className="text-small text-text-soft">
            Fragen: {ANBIETER.email} oder {ANBIETER.telefon}.{" "}
            <Link href="/shop/recht/widerruf" prefetch={false} className="underline underline-offset-4">
              Widerrufsbelehrung
            </Link>
            {" · "}
            <Link href="/shop/recht/widerruf-formular" prefetch={false} className="underline underline-offset-4">
              Vertrag widerrufen
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
