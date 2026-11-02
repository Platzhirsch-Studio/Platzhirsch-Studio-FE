// Einsatz-Welt (Pool, Wellness, Bad, Küche, Fassade; Konzept §3.2). Eine
// Landeseite je Einsatz, keine Seiten je Ort (Doorway-Schutz §6.3).
// Server-Komponente; Daten kommen aus data.js (server-only).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Button, Container, Heading, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { countReferences, countWithProjectImage, getGalleryImageById, getGalleryImages, pickReferences } from "@/lib/ezarri/data";
import { serializeFilters } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { deLinkProps } from "@/lib/ezarri/deLinks";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import EzImage from "./EzImage";
import MosaicCard from "@/components/Ezarri/Katalog/MosaicCard";
import CompareBar from "@/components/Ezarri/Katalog/CompareBar";
import { CreditNote, PageHead, Schluss, SectionHead, ezCrumbsFor } from "./parts";
import { ezarriMetadata } from "./meta";
import HandBridge from "@/components/Reusable/HandBridge";
import HandZeile from "./HandZeile";

// Welle 2 (Inhaber 29.10.2026): Ezarri ↔ Hotel & Objekt – pool and spa worlds
// link the hotel page (DE and EN).
const HOTEL_WORLDS = new Set(["pool", "wellness"]);
// Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21): pool → hot tubs (Aquavia Spa),
// wellness → the whole page (sauna, heated loungers). Same path in DE and EN.
const WELLNESS_LINK = { pool: "/bad-wellness#marke-aquavia-spa", wellness: "/bad-wellness" };
import { brandNode, collectionPage } from "./schema";
import { staggerStyle } from "@/lib/ezarri/motion";

export function weltById(id, locale = "de") {
  return ezCopy(locale).WELTEN.find((w) => w.id === id) ?? null;
}

export async function einsatzMetadata(id, params) {
  const { locale } = await params;
  const w = weltById(id, locale);
  if (!w || !ezarriWeltLocaleEnabled(locale)) return {};
  const img = (w.bild && getGalleryImageById(w.bild.galerie)?.bild) ?? pickReferences(w.filter, 1)[0]?.bild;
  return ezarriMetadata({ locale, path: `/ezarri/${w.id}`, title: w.seoTitle, description: w.description, image: img?.web });
}

export default async function EinsatzWelt({ id, params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const w = weltById(id, locale);
  if (!w) notFound();
  const { alt: altText } = ezCopy(locale);
  const t = ezT(locale);
  const en = locale !== "de";
  // 01.11.2026: Texte der Auswahl je Sprache (de, en, fr, it).
  const MEHRZAHL = {
    en: { pool: "pools", wellness: "spas", bad: "bathrooms", kueche: "kitchens", fassade: "façades" },
    fr: { pool: "les piscines", wellness: "le spa", bad: "la salle de bains", kueche: "la cuisine", fassade: "les façades" },
    it: { pool: "piscine", wellness: "spa", bad: "bagno", kueche: "cucina", fassade: "facciate" },
  };
  const ZUSATZ = {
    en: { pool: "See the sun on the pool (in German)", hotel: "Pools and spas for hotels", wellness: "Plan hot tubs, saunas and heated loungers" },
    fr: { pool: "Voir le soleil sur le bassin (en allemand)", hotel: "Piscines et spas pour hôtels", wellness: "Planifier bains à remous, saunas et lits chauffants" },
    it: { pool: "Vedere il sole sulla vasca (in tedesco)", hotel: "Piscine e spa per hotel", wellness: "Progettare idromassaggi, saune e lettini riscaldati" },
  };

  const auswahl = pickReferences(w.filter, 9, { prefer: w.galerie });
  // Eignung (Datenblatt) und „mit Projektbild“ getrennt zählen (QM P1-3).
  const total = countReferences(w.filter);
  const mitBild = w.galerie.length ? countWithProjectImage(w.galerie) : 0;
  // Kopfbild fest kuratiert (copy.WELTEN[].bild), danach weitere Projekte ohne dieses Bild.
  const kurat = w.bild ? getGalleryImageById(w.bild.galerie) : null;
  const used = new Set(kurat ? [kurat.id] : []);
  const weitere = w.galerie.length ? getGalleryImages({ einsatz: w.galerie, limit: kurat ? 6 : 7, exclude: used }) : [];
  const [lead, ...galerie] = kurat ? [kurat, ...weitere] : weitere;
  const leadAlt = kurat ? w.bild.alt : altText.anwendung(lead?.referenzName, w.label);
  const filterHref = `/ezarri/mosaike?${serializeFilters(w.filter)}`;
  const bildHref = mitBild ? `/ezarri/mosaike?bild=${w.galerie.join(",")}` : null;
  const galerieHref = w.galerie.length ? `/ezarri/galerie?einsatz=${w.galerie.join(",")}` : null;
  const path = `/ezarri/${w.id}`;
  const crumbs = ezCrumbsFor(locale, { label: w.label });
  const ld = [brandNode(), collectionPage({ locale, path, name: w.title, description: w.description, items: auswahl.map((c) => ({ name: `Ezarri ${c.name}`, href: `/ezarri/mosaike/${c.id}` })) })];

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={`${t("Einsatz", "Application", "Utilisation", "Impiego")} · ${w.label}`} title={w.title} lead={w.lead} jsonLd={ld} />
      {lead?.bild && (
        <Container className="pb-section">
          <EzImage image={lead.bild} alt={leadAlt} ratio="21/9" sizes="100vw" preload credit className="[&>div]:max-md:aspect-[4/5]" />
        </Container>
      )}

      <Section labelledBy="ez-hinweise" spacing="none" className="pb-section">
        <SectionHead id="ez-hinweise" eyebrow={`${t("Planung", "Planning", "Planification", "Progettazione")} · ${w.label}`} title={t("Worauf es ankommt", "What matters", "Ce qui compte", "Ciò che conta")} />
        <dl className="mt-stack-m grid gap-x-grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {w.hinweise.map(([t, text]) => (
            <div key={t} className="border-t border-line pt-4">
              <dt className="text-ui text-text">{t}</dt>
              <dd className="mt-2 text-body text-text-soft">{text}</dd>
            </div>
          ))}
        </dl>
        {/* R2 gesamtwerk P1-4: Kern-USP (Entscheidung Nr. 8) auf jeder Einsatz-Welt, u. a. /ezarri/pool */}
        {/* Welle 2: HandBridge ist rein deutsch → englisch dieselbe Zeile über HandZeile. */}
        {en ? (
          <HandZeile className="mt-10 !px-0" links={[
              ...(w.id === "pool" ? [{ href: "/bodensee-licht?szene=pool", label: ZUSATZ[locale].pool }] : []),
              ...(HOTEL_WORLDS.has(w.id) ? [{ href: "/hotel-objekt", label: ZUSATZ[locale].hotel }] : []),
              ...(WELLNESS_LINK[w.id] ? [{ href: WELLNESS_LINK[w.id], label: ZUSATZ[locale].wellness }] : []),
            ]}
          />
        ) : (
          <HandBridge variant="feld" className="mt-10 !px-0" links={[
              ...(w.id === "pool" ? [{ href: "/bodensee-licht?szene=pool", label: "Sonnenstand am Becken ansehen" }] : []),
              ...(HOTEL_WORLDS.has(w.id) ? [{ href: "/hotel-objekt", label: "Pool und Spa im Hotel" }] : []),
              ...(WELLNESS_LINK[w.id] ? [{ href: WELLNESS_LINK[w.id], label: "Whirlpool, Sauna und Wärmeliegen planen" }] : []),
            ]}
          />
        )}
      </Section>

      <Section tone="raised" labelledBy="ez-auswahl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            id="ez-auswahl"
            eyebrow={t("Auswahl", "Selection", "Sélection", "Selezione")}
            title={en ? t("", `Mosaics for ${MEHRZAHL.en[w.id]}`, `Mosaïques pour ${MEHRZAHL.fr[w.id]}`, `Mosaici per ${MEHRZAHL.it[w.id]}`) : `Mosaike für ${w.label}`}
            text={
              en
                ? t(
                    "",
                    `${mitBild ? "First, mosaics that Ezarri shows in projects of this kind" : "Mosaics with project photos and water effect first"}, one per collection. According to the data sheets, ${total} mosaics are suitable.`,
                    `${mitBild ? "D’abord les mosaïques qu’Ezarri montre dans des projets de ce type" : "D’abord les mosaïques avec photos de projets et effet d’eau"}, une par collection. Selon les fiches techniques, ${total} mosaïques conviennent.`,
                    `${mitBild ? "Prima i mosaici che Ezarri mostra in progetti di questo tipo" : "Prima i mosaici con foto di progetti ed effetto dell’acqua"}, uno per collezione. Secondo le schede tecniche sono adatti ${total} mosaici.`
                  )
                : mitBild
                  ? `Zuerst Mosaike, die Ezarri in Projekten dieser Art zeigt, je Kollektion eines. Geeignet sind laut Datenblatt ${total} Mosaike.`
                  : `Mosaike mit Projektbildern und Wasserwirkung zuerst, je Kollektion eines. Geeignet sind laut Datenblatt ${total} Mosaike.`
            }
          />
        </div>
        <ul className="mt-stack-m grid grid-cols-2 gap-x-grid gap-y-10 sm:grid-cols-3">
          {auswahl.map((c, i) => (
            <li key={c.id} className="reveal" style={staggerStyle(i, 3)}>
              <MosaicCard card={c} eager={!lead && i < 2} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 33vw, 50vw" />
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <CreditNote kinds={["bild", "daten"]} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {bildHref && (
              <Link href={bildHref} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
                {t(`${mitBild} davon mit Ezarri-Projektbild`, `${mitBild} of them with an Ezarri project photo`, `dont ${mitBild} avec photo de projet Ezarri`, `di cui ${mitBild} con foto di progetto Ezarri`)}
              </Link>
            )}
            <Button href={filterHref} variant="secondary" arrow>
              {t(`Alle ${total} geeigneten Mosaike`, `All ${total} suitable mosaics`, `Les ${total} mosaïques adaptées`, `Tutti i ${total} mosaici adatti`)}
            </Button>
          </div>
        </div>
      </Section>

      {galerie.length > 0 && (
        <Section labelledBy="ez-projekte">
          <SectionHead
            id="ez-projekte"
            eyebrow={t("Projekte mit Ezarri-Mosaik", "Projects with Ezarri mosaic", "Projets en mosaïque Ezarri", "Progetti con mosaico Ezarri")}
            title={t("Aus Ezarris Projektarchiv", "From Ezarri's project archive", "Les archives de projets d’Ezarri", "Dall’archivio progetti di Ezarri")}
            text={t("Ezarri-Projekte, keine Projekte von Platzhirsch. Zu jedem Bild finden Sie das Mosaik.", "Ezarri projects, not projects by Platzhirsch. For each photo you will find the mosaic.", "Projets d’Ezarri, pas de Platzhirsch. Chaque photo indique la mosaïque utilisée.", "Progetti di Ezarri, non di Platzhirsch. Ogni foto indica il mosaico utilizzato.")}
          />
          <ul className="mt-stack-m grid grid-cols-1 gap-x-grid gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {galerie.map((g) => (
              <li key={g.id}>
                <EzImage image={g.bild} alt={altText.anwendung(g.referenzName, w.label)} ratio="3/2" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
                {g.referenz && (
                  <p className="mt-2 text-small text-text-soft">
                    {t("Mosaik:", "Mosaic:", "Mosaïque :", "Mosaico:")}{" "}
                    <Link href={`/ezarri/mosaike/${g.referenz}`} className="inline-flex min-h-6 items-center underline underline-offset-4">
                      {g.referenzName}
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
          <CreditNote className="mt-6" />
          {galerieHref && (
            <Link href={galerieHref} className="mt-4 inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
              {t("Weitere Projekte in der Galerie", "More projects in the gallery", "Plus de projets dans la galerie", "Altri progetti nella galleria")}
            </Link>
          )}
        </Section>
      )}

      <Section tone="band" labelledBy="ez-ph" spacing="compact">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-grid">
          <div className="lg:col-span-7">
            <Heading id="ez-ph" level={2} size="display-m">
              {w.platzhirsch.title}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-text-soft">{w.platzhirsch.text}</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Link href={w.platzhirsch.href} {...deLinkProps(locale, w.platzhirsch.href)} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
              {w.platzhirsch.label}
            </Link>
          </div>
        </div>
      </Section>
      <Schluss tone="surface" />
      <CompareBar />
    </>
  );
}
