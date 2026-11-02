// /<locale>/wunschliste/verwalten#<Schlüssel> — Verwaltung einer geteilten
// Wunschliste, nur für den Ersteller. Der Schlüssel steht im #Fragment und
// wird nie an den Server geschickt (kein Log, kein Referrer); die Seite liest
// ihn im Browser und fragt /api/wunschliste/verwalten per POST.
// noindex, kein Referrer. Statische Hülle, Inhalt kommt nach dem Laden.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui";
import ManageClient from "@/components/Wunschliste/ManageClient";
import { wunschlisteAvailable } from "@/lib/wunschliste/mode";
import { localeOf, wlCopyFrom } from "@/lib/wunschliste/copy";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const root = await getTranslations({ locale });
  const c = wlCopyFrom(localeOf(locale), root);
  return {
    title: { absolute: `${c("manage.title")} | ${SITE_NAME}` },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function WunschlisteVerwaltenPage() {
  await connection();
  if (!wunschlisteAvailable()) notFound();
  return (
    <Container className="pt-10 pb-section md:pt-14">
      <ManageClient />
    </Container>
  );
}
