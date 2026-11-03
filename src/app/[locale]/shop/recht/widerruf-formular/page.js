// /[locale]/shop/recht/widerruf-formular — Online-Rücktrittsfunktion „Vertrag
// widerrufen“ für Shop-Bestellungen (§ 13a FAGG, seit 01.10.2026; DE § 356a
// BGB). Felder wie das Muster-Widerrufsformular (Anhang I Teil B FAGG),
// Absenden über /api/shop/widerruf (src/lib/shop/widerruf.js), danach die
// Bestätigungsseite ./bestaetigung. Nur bei SHOP_MODE test/live (sonst 404),
// immer noindex. Deutsch ist verbindlich; EN/FR/IT mit LANG_HINWEIS.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Heading } from "@/components/ui";
import TestBanner from "@/components/Shop/TestBanner";
import WiderrufForm from "@/components/Shop/WiderrufForm";
import { NOINDEX } from "@/lib/commerce/mode";
import { shopCopy } from "@/lib/shop/copy";
import { LANG_HINWEIS } from "@/lib/shop/legal";
import { ANBIETER, ANSCHRIFT, WIDERRUF_PATH } from "@/lib/shop/legalTexte";
import { shopMode } from "@/lib/shop/mode";
import { BESTELLNUMMER_RE } from "@/lib/shop/widerruf";

export const metadata = { title: "Vertrag widerrufen | Platzhirsch Home Living", robots: NOINDEX };

export default async function ShopWiderrufFormularPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { bestellung } = await searchParams;
  await connection();
  const mode = shopMode(process.env);
  if (mode === "off") notFound();
  const c = shopCopy(locale);
  const initialRef = typeof bestellung === "string" && BESTELLNUMMER_RE.test(bestellung.toUpperCase()) ? bestellung.toUpperCase() : "";
  const lang = LANG_HINWEIS[locale];
  return (
    <div className="bg-surface-raised pt-6 pb-section text-text md:pt-10">
      <Container size="text">
        {mode === "test" && <TestBanner text={c.testBanner} />}
        <p className="mt-8 text-overline uppercase text-text-accent">Onlineshop</p>
        <Heading level={1} size="display-m" className="mt-stack-s">
          Vertrag widerrufen
        </Heading>
        {lang && (
          <p className="mt-4 text-small text-text-soft" lang={locale}>
            {lang}
          </p>
        )}
        <div className="mt-6 max-w-measure space-y-3 text-body text-text" lang="de" data-shop-widerruf-intro="">
          <p>
            Sie haben im Onlineshop bestellt oder einen Vertrag per E-Mail, Telefon, Video oder bei Ihnen zu Hause geschlossen und möchten ihn widerrufen? Innerhalb von vierzehn Tagen geht das ohne
            Angabe von Gründen. Füllen Sie das Formular aus und klicken Sie auf „Widerruf bestätigen“. Sie erhalten sofort eine Eingangsnummer und eine Eingangsbestätigung per E-Mail mit Inhalt, Datum
            und Uhrzeit Ihrer Erklärung. Eine Bestellnummer brauchen Sie nur bei Bestellungen im Onlineshop.
          </p>
          <p>
            Hiermit widerrufe(n) ich/wir den mit {ANBIETER.firma} („{ANBIETER.marke}“), {ANSCHRIFT}, abgeschlossenen Vertrag über den Kauf der folgenden Waren / die Erbringung der folgenden
            Dienstleistung:
          </p>
        </div>
        <div className="mt-8 border-t border-line-strong pt-8" lang="de">
          <WiderrufForm initialRef={initialRef} bestaetigungPath={`${WIDERRUF_PATH}/bestaetigung`} />
        </div>
        <p className="mt-10 max-w-measure text-small text-text-soft" lang="de">
          Sie können auch per E-Mail an {ANBIETER.email} oder per Brief an {ANBIETER.firma}, {ANSCHRIFT}, widerrufen – zum Beispiel mit dem Muster-Widerrufsformular. Einzelheiten, Ausnahmen und Folgen:{" "}
          <Link href="/shop/recht/widerruf" prefetch={false} className="underline underline-offset-4">
            Widerrufsbelehrung des Onlineshops
          </Link>{" "}
          bzw. für Verträge außerhalb des Onlineshops die{" "}
          <Link href="/widerruf" prefetch={false} className="underline underline-offset-4">
            allgemeine Widerrufsbelehrung
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
