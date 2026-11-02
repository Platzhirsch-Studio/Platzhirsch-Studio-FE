// /<locale>/kuechenplaner – 3D-Küchenplaner (früher /de/labs/kuechenplaner, 308), indexierbar.
// Sprachen (01.11.2026): DE, EN, FR, IT. Seitentexte: src/lib/kuechenplaner/content.js,
// Metadaten/JSON-LD: src/lib/kuechenplaner/seo.js (Muster Hotel & Objekt). Die Oberfläche
// bekommt NUR das Wörterbuch ihrer Sprache als Prop (copy/index.js → kpClientCopy, KpCopy.js);
// src/messages/*.json bleibt unberührt (Client-Budget).
// R2: Abstand über der H1 an den neuen Sticky-Header angeglichen: 32 px mobil, 40 px ab
// Tablet (PageHeader der Inhaltsseiten: 40–64 px). Der Planer bleibt bewusst knapper,
// damit Preis, „Anfragen“ und Ansicht auf 1440×900 über dem Falz bleiben (P2-3).
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
// R2 technik P1-1: Hydration erst bei Sichtbarkeit + Aktivität bzw. Interaktion (KuechenplanerGate)
import KuechenplanerApp from "@/components/Labs/Kuechenplaner/KuechenplanerGate";
// SEO Küchenplaner (31.10.2026): indexierbarer Leitfaden + FAQPage unter dem Werkzeug.
import PlanerGuide from "@/components/Labs/Kuechenplaner/PlanerGuide";
import { decodePlan } from "@/components/Labs/Kuechenplaner/planState";
import { getCatalog } from "@/components/Labs/Kuechenplaner/server/store";
import { pricesPublic, sendReleased } from "@/components/Labs/Kuechenplaner/release";
import HandBridge from "@/components/Reusable/HandBridge";
import JsonLd from "@/components/Reusable/JsonLd";
import { LinkArrow } from "@/components/ui";
import { KpCopyProvider } from "@/components/Labs/Kuechenplaner/KpCopy";
import { kpPageCopy } from "@/lib/kuechenplaner/content";
import { kpMetadata, kpSchema } from "@/lib/kuechenplaner/seo";
import { kpClientCopy } from "@/lib/kuechenplaner/copy";
import { ownCalendarActive } from "@/components/Booking/config";
import { getTranslations } from "next-intl/server";
import { GERAETE_PATH } from "@/lib/kueche/geraete";
import { KATALOG_MARKEN, produkteByWelt } from "@/lib/katalog";
import { heuteIso, katalogPreiseAn } from "@/lib/katalog/config";
import { buildGeraeteIndex, geraetParam } from "@/lib/kuechenplaner/geraete";

// Feste URL seit der Integration (Inhaber-Entscheidung Nr. 9): indexierbar.
// SEO Küchenplaner (31.10.2026): Description < 150 (clampDescription schnitt den
// Lochau-Satz ab); Title deckt „küchenplaner online“ und „küche planen“ ab –
// fitTitle kürzt den Zusatz auf „| Platzhirsch“ (53 Zeichen). Sprachen: eigene
// Canonical je Sprache, hreflang reziprok (kpLanguages).
export async function generateMetadata({ params }) {
  const { locale } = await params;
  return kpMetadata(locale);
}

/** Brücke Werkzeug → Mensch in EN/FR/IT (HandBridge ist deutsch): gleiche Gestaltung, Text aus content.js. */
function KpBridge({ copy, links }) {
  return (
    <aside aria-label={copy.label} data-hand-bridge="planer" className="mx-auto max-w-page px-gutter mt-10 !max-w-3xl !px-0">
      <div className="max-w-text border-l-2 border-ink py-1 pl-4">
        <p className="max-w-measure text-body text-text">{copy.text}</p>
        <p className="mt-2 flex flex-wrap gap-x-6">
          <LinkArrow href="/arbeitsweise">{copy.arbeitsweise}</LinkArrow>
          {links.map((l) => (
            <LinkArrow key={l.href} href={l.href}>
              {l.label}
            </LinkArrow>
          ))}
        </p>
      </div>
    </aside>
  );
}

export default async function KuechenplanerPage({ params, searchParams }) {
  const { locale } = await params;
  const copy = kpPageCopy(locale);
  if (!copy) notFound();
  const { k, t, geraet } = await searchParams;
  const initialPlan = typeof k === "string" ? decodePlan(k) : null;
  // Einstieg von /kuechengeraete („In meine Küchenplanung aufnehmen“, ?geraet=<marke|produkt>):
  // nur Werte, die im Katalog stehen; Produkt → erste passende Nische, Marke → zuerst gelistet.
  const initialGeraet =
    typeof geraet === "string"
      ? geraetParam(geraet, buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: heuteIso(), an: katalogPreiseAn(), marken: Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name])) }))
      : null;
  const catalog = await getCatalog();
  // Fix 2 (P3-1): Handy schon im Server-Render erkennen (Client Hint, sonst User-Agent),
  // damit der Plan ohne Maßketten-Sprung startet. Nur Startwert – der Client misst nach.
  const h = await headers();
  const chMobile = h.get("sec-ch-ua-mobile");
  const initialMobile = chMobile ? chMobile.includes("1") : /iPhone|iPod|Android.+Mobile|Mobile Safari/i.test(h.get("user-agent") || "");
  const showPrices = pricesPublic(catalog.priceTable);
  // Im Dev-Server ist der Testmodus (ohne ?senden=1) Standard, im Produktions-Build die Freigabe.
  const live = process.env.NODE_ENV === "production" && sendReleased();
  // Inhaber-Entscheidung Nr. 18: Link auf /kuechengeraete, Text aus den Messages (H1 der Geräteseite).
  const tr = await getTranslations({ locale });

  return (
    <div data-kp-page="" className="bg-[#faf8f4] text-ink [--kp-top:56px] lg:[--kp-top:72px]">
      <JsonLd data={kpSchema(locale)} />
      {/* Fix-Runde 1 (F2): Ränder nach Design-Bibel (px-gutter: 20/48/80 px) wie alle Werkzeugseiten */}
      <div className="mx-auto max-w-page px-gutter pt-8 sm:pt-10">
        <header className="mb-3 max-w-4xl lg:mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-text">{copy.header.eyebrow}</p>
          <h1 className="font-display mt-1.5 text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.75rem]">{copy.header.title}</h1>
          <p className="mt-2 text-[0.9375rem] leading-snug text-ink/80 lg:text-base">
            {copy.header.lead}
            <span className="hidden sm:inline"> {copy.header.leadMore}</span>
          </p>
          {/* Rat 9,5 A11 (T2): Werkzeug → Mensch, direkt unter dem Lead (Kern-USP, Inhaber Nr. 8) */}
          <p className="mt-1.5 border-l-2 border-ink pl-3 text-[0.875rem] leading-snug text-ink/85" data-hand-line="">
            {copy.header.hand}
          </p>
        </header>
        <KpCopyProvider copy={kpClientCopy(locale)}>
          <KuechenplanerApp initialPlan={initialPlan} linkInvalid={typeof k === "string" && !initialPlan} initialTab={typeof t === "string" ? t : undefined} catalog={catalog} initialMobile={initialMobile} calendar={ownCalendarActive()} initialGeraet={initialGeraet} />
        </KpCopyProvider>
        <PlanerGuide locale={locale} copy={copy.guide} />
        {locale === "de" ? (
          <HandBridge className="mt-10 !max-w-3xl !px-0" links={[{ href: "/bodensee-licht", label: "Licht in Ihrer Küche ansehen" }, { href: "/kuechen-vorarlberg", label: "Küchenplanung im Studio" }, { href: GERAETE_PATH, label: tr("kuechengeraete.title") }]} />
        ) : (
          // Bodensee-Licht und Küchenplanung im Studio gibt es nur auf Deutsch (308 auf /de) – hier nur die Geräte-Seite.
          <KpBridge copy={copy.bridge} links={[{ href: GERAETE_PATH, label: tr("kuechengeraete.title") }]} />
        )}
        <aside className="mx-auto mb-[calc(var(--kp-bar-h,5rem)+3rem)] max-w-3xl space-y-2 border-t border-ink/10 pt-6 text-[0.8125rem] text-ink/75 lg:mb-16">
          <p>
            {showPrices ? copy.notes.priceShown : copy.notes.priceHidden}{" "}
            {copy.notes.line}
          </p>
          <p>
            {copy.notes.local}{" "}
            {live ? (
              <>
                {copy.notes.liveBefore}{" "}
                <Link className="underline underline-offset-2" href={`/${locale}/datenschutz`}>{copy.notes.privacy}</Link>.
              </>
            ) : (
              copy.notes.test
            )}
            {" "}{copy.notes.textures}
          </p>
        </aside>
      </div>
    </div>
  );
}
