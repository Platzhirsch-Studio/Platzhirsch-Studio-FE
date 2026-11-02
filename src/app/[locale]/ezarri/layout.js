// /[locale]/ezarri/** – Seitenrahmen der Ezarri-Welt (Team A, Konzept §2/§7.4 Nr. 6).
// Liefert die lokale Navigation (LocalNav) für alle Ezarri-Seiten, auch für
// Konfigurator, Rechner, Custom Mix und Anfrage (Team B/C). Kein eigenes
// <main>: das kommt aus client-layout.js. Sprachen: nur EZARRI_LOCALES ("de",
// seit Welle 2 auch "en"), alles andere 404 – zusätzlich prüft jede Seite selbst.
// robots/Sitemap/Händler-Aussage hängen am Schalter EZARRI_PUBLIC
// (src/lib/ezarri/config.js); jede Seite ruft withEzarriRobots() auf.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import LocalNav from "@/components/Ezarri/Welt/LocalNav";
import { ezCopy, ezLang } from "@/lib/ezarri/lang";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import LangNotice from "@/components/Arbeitsweise/LangNotice";

export default async function EzarriLayout({ children, params }) {
  const { locale } = await params;
  // 01.11.2026: Welt in de/en/fr/it; die Werkzeuge prüfen ihre Sprachen selbst (ezarriLocaleEnabled).
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { NAV } = ezCopy(locale);
  // Werkzeug-Links (Konfigurator, Rechner, Muster) zeigen auf fr/it zur englischen Fassung.
  const nav = { ...NAV, items: NAV.items.map((i) => ({ ...i, linkProps: ezLinkProps(locale, i.href) })), muster: { ...NAV.muster, linkProps: ezLinkProps(locale, NAV.muster.href) } };
  return (
    <div data-welt="ezarri" lang={ezLang(locale)}>
      {/* R8 (gesamtwerk P1-2, neuland P1-6): /fr|it/ezarri/** → 308 → /de/…?lang=…; Layouts kennen
          keine searchParams, deshalb blendet ein Inline-Skript die passende Fassung vor dem ersten Bild ein.
          Auf der englischen Fassung entfällt der Hinweis (Seite ist selbst englisch). */}
      {locale === "de" && <LangNotice page="ezarri" />}
      {/* Texte vom Server: hält copy(.en).js aus dem Client-Bundle (Tempo 30.10.2026) */}
      <LocalNav nav={nav} />
      {children}
    </div>
  );
}
