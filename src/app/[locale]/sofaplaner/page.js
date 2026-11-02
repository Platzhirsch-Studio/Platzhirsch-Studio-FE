import { notFound } from "next/navigation";
import HandBridge from "@/components/Reusable/HandBridge";
import { WerkzeugJsonLd, werkzeugMetadata } from "@/components/Labs/werkzeugSeo";
// Tempo (30.10.2026): Planer im HTML wie bisher, sein Code lädt erst nach dem ersten Malen (PlannerGate.js).
import Planner from "@/components/Labs/Sofaplaner/PlannerGate";
import FamilyList from "@/components/Labs/Sofaplaner/FamilyList";
import { loadPlan } from "@/components/Labs/Sofaplaner/server/store";
import { WALKWAY_IDEAL, WALKWAY_MIN, openShared, planFor } from "@/components/Labs/Sofaplaner/model";
import { DEFAULT_FAMILY, clientFamily, ensureCatalog, familyIndex } from "@/lib/sofaplaner/catalog.server";
import { SOURCE_COPY } from "@/lib/sofaplaner/consent";
import Silhouette from "@/components/Labs/Sofaplaner/Silhouette";
import Draufsicht from "@/components/Labs/Sofaplaner/Draufsicht";
import s from "@/components/Labs/Sofaplaner/sofaplaner.module.css";
import { sofaplanerCopy } from "@/lib/sofaplaner/copy";
import JsonLd from "@/components/Reusable/JsonLd";
import ProcessBridge from "@/components/Yacht/ProcessBridge";
import { seoAlternates } from "@/lib/seo/pageMetadata";
import { sourceCopy } from "@/lib/sofaplaner/copy/source";
import { localizeIndex } from "@/lib/sofaplaner/copy/family-en";
import { PAGE_EN, SOFA_LOCALES, sofaLanguages, sofaMetadataEn, sofaSchemaEn } from "@/lib/sofaplaner/copy/page-en";
import { ownCalendarActive } from "@/components/Booking/config";
import { SITE_URL } from "@/lib/seo/structuredData";
import { faqPageSchema } from "@/lib/seo/faqSchema";
import { getIndexableRatgeber } from "@/lib/ratgeber";
import { SOFA_RATGEBER_SLUGS, sofaFaqDe } from "@/lib/sofaplaner/copy/faq-de";
// Sprachen-Welle FR/IT (01.11.2026): /fr und /it – Wörterbuch nachladen, Seitentexte/SEO serverseitig.
import { loadDict } from "@/lib/sofaplaner/copy/dicts";
import { dictFor } from "@/lib/sofaplaner/copy/t";
import { localizeIndexIntl } from "@/lib/sofaplaner/copy/family-intl";
import { sofaMetadataIntl, sofaPageIntl, sofaSchemaIntl } from "@/lib/sofaplaner/copy/page-intl";

// Rat 9,5 (T2): A11 Harald-Zeile unter dem Lead + Desktop-Knopf „Planung starten ↓“,
// B11/C1 mobil die Draufsicht mit Bemaßung (Haarlinie) statt der flachen
// Vorderansicht, B2 „Termin mit diesem Plan“ zielt bei aktivem Kalender auf /termin.
const HAND_DE = "Online starten – Harald Menghin zeichnet Ihr Konzept danach von Hand.";

// /de/sofaplaner (früher /de/labs/sofaplaner, 308) – German only, indexable.
// R2 neuland P0-1: ohne MINOTTI_DATA_CONSENT (src/lib/sofaplaner/consent.js) plant
// die Seite mit eigenen Sofa-Typen in Rastermaßen und nennt keine Herstellerdaten.
// R2 seo P2-3/P2-4: deOnlyMetadata, Title ≤ 65, Description ≤ 165.
// R8: Title und Description aus SOURCE_COPY (beide Fassungen in consent.js).
// Welle 2 (team EN-Yacht-Sofa, 29.10.2026): German and English. EN texts:
// src/lib/sofaplaner/copy/{source,page-en,ui-en,family-en,glossary-en}.js;
// Sprachen-Welle FR/IT (01.11.2026): auch /fr und /it (Texte in
// src/lib/sofaplaner/copy/{ui-fr,ui-it,page-texts,page-intl,family-intl}.js,
// Wörterbuch als eigener Chunk über copy/dicts.js). hreflang alle vier Sprachen
// + x-default (= de). Der 308 FR/IT → /de in src/lib/seo/deOnlyRedirects.cjs
// (FR_IT_ONLY_EXACT "sofaplaner") muss die Integration entfernen.
const META_DE = werkzeugMetadata("sofaplaner", { title: SOURCE_COPY.metaTitle, description: SOURCE_COPY.metaDescription });

// SEO (Sofaplaner-Team seo-inhalte): geteilte Pläne (?p=…) tragen einen frei
// gewählten Plannamen und sind Einzelansichten – noindex, follow. Die
// Modell-Einstiege (?m=…) bleiben indexierbar und kanonisch auf /sofaplaner.
const SHARED_ROBOTS = { index: false, follow: true };

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!SOFA_LOCALES.includes(locale)) return {};
  const { p } = await searchParams;
  const robots = typeof p === "string" ? SHARED_ROBOTS : META_DE.robots;
  if (locale === "en") return sofaMetadataEn(robots);
  if (locale === "fr" || locale === "it") {
    await loadDict(locale);
    return sofaMetadataIntl(locale, robots);
  }
  return { ...META_DE, robots, alternates: seoAlternates({ canonical: META_DE.alternates.canonical, languages: sofaLanguages(), robots }) };
}

export default async function SofaplanerPage({ params, searchParams }) {
  const { locale } = await params;
  // DE, EN, FR, IT (SOFA_LOCALES). FR/IT: Wörterbuch vor dem ersten makeT/sourceCopy laden.
  if (!SOFA_LOCALES.includes(locale)) notFound();
  await loadDict(locale);
  const en = locale === "en";
  const ix = sofaPageIntl(locale); // FR/IT-Seitentexte, sonst null
  const fx = en || !!ix; // nicht Deutsch
  const SC = sourceCopy(locale);
  const { p, m } = await searchParams;

  await ensureCatalog();
  const index = ix ? localizeIndexIntl(familyIndex(), dictFor(locale)) : en ? localizeIndex(familyIndex()) : familyIndex();
  const loaded = typeof p === "string" ? await loadPlan(p) : null;
  // a link whose model is gone from the catalogue counts as "not found" (openShared, model.js)
  const opened = openShared(loaded, clientFamily);
  const stored = opened ? loaded : null;
  let family = opened?.family || null;
  let plan = opened?.plan || null;
  const dropped = opened?.dropped || 0;
  const picked = typeof m === "string" ? clientFamily(m) : null;
  const unknownModel = typeof m === "string" && !picked && !stored;
  if (!plan) {
    family = picked || clientFamily(DEFAULT_FAMILY) || clientFamily(index[0].slug);
    plan = planFor(family);
  }
  const step = stored && plan ? 3 : picked ? 2 : 1;
  const total = index.reduce((n, f) => n + f.count, 0);
  const heroType = index.find((f) => f.slug === DEFAULT_FAMILY) || index[0];
  // SEO (seo-inhalte): FAQ + Ratgeber nur Deutsch; Ratgeber nur freigegebene Artikel (in Produktion sonst 404).
  const faq = fx ? [] : sofaFaqDe({ walkMin: WALKWAY_MIN, walkIdeal: WALKWAY_IDEAL });
  const ratgeber = fx ? [] : getIndexableRatgeber().filter((a) => SOFA_RATGEBER_SLUGS.includes(a.slug));

  return (
    <div className={s.page}>
      {ix ? <JsonLd data={sofaSchemaIntl(locale)} /> : en ? <JsonLd data={sofaSchemaEn()} /> : <WerkzeugJsonLd id="sofaplaner" description={META_DE.description} />}
      <div className={s.pageWrap}>
        <div className={step === 1 ? s.headGrid : undefined}>
        {/* QM r3: mit gewähltem Modell (Schritt ≥ 2) kompakter Kopf – der Planer beginnt im ersten Bildschirm
            statt unter einer halbleeren Hero-Fläche (iPad quer, 1920 px). */}
        <header className={step === 1 ? s.pageHead : `${s.pageHead} ${s.pageHeadCompact}`}>
          <p className={s.overline}>{SC.overline}</p>
          {/* R5 (gesamtwerk P2): H1 als ganzer Satz wie Küchenplaner („Ihre Küche,
              in 3D geplant.“); der Werkzeugname steht in der Overline. Mobil steht
              der kurze Lead, ab Tablet der lange. */}
          {fx ? <h1 className={s.h1}>{SC.h1Satz}</h1> : <h1 className={s.h1}>{SOURCE_COPY.h1Satz}</h1>}
          <p className={`${s.pageLead} ${s.pageLeadShort}`}>{SC.leadShort}</p>
          <p className={`${s.pageLead} ${s.pageLeadLong}`}>{SC.lead}</p>
          <p className={s.handLine} data-hand-line="">{ix ? ix.handLine : en ? PAGE_EN.handLine : HAND_DE}</p>
          {step === 1 && (
            <p className={s.startRow}>
              <a href="#planer-start" className={`${s.btnPrimary} ${s.startBtn}`} data-planer-start="">
                {ix ? ix.startCta : en ? PAGE_EN.startCta : "Planung starten"} <span aria-hidden="true">↓</span>
              </a>
            </p>
          )}
          {/* R2 neuland P1-5: ein Sofa im ersten Bildschirm (eigene Zeichnung, kein Herstellerbild) */}
          {step === 1 && heroType && (
            <div className={`${s.heroSofaMobil} ${s.heroPlanMobil}`} data-sofa-hero="">
              <Draufsicht depth={heroType.depth} className={s.draufsicht} locale={locale} titleId="sp-draufsicht-mobil" compact />
            </div>
          )}
          {(fx ? SC.showroom : SOURCE_COPY.showroom) && (
            <p className={`${s.small} ${s.showroomNote}`} data-sofa-showroom="">
              {fx ? SC.showroom : SOURCE_COPY.showroom}
            </p>
          )}
          {/* Fix-Runde 1 (F2): Abgrenzung zu Minotti (Texte in src/lib/sofaplaner/copy/{de,en,fr,it}.js) – nur, wenn Minotti-Daten geladen sind */}
          <p className={s.small} data-sofa-unabhaengig="">{fx ? SC.unabhaengig : SOURCE_COPY.brand ? sofaplanerCopy(locale).unabhaengig : SOURCE_COPY.unabhaengig}</p>
          {unknownModel && (
            <p role="alert" className={s.err}>
              {ix ? ix.unknownModel(String(m).slice(0, 40)) : en ? PAGE_EN.unknownModel(String(m).slice(0, 40)) : <>Das Modell „{String(m).slice(0, 40)}“ wurde nicht gefunden. Bitte wählen Sie ein Modell aus der Liste.</>}
            </p>
          )}
          {p && !stored && (
            <p role="alert" className={s.err}>
              {ix ? ix.badShare : en ? PAGE_EN.badShare : "Der geteilte Plan wurde nicht gefunden oder der Link ist ungültig. Sie sehen einen Startvorschlag."}
            </p>
          )}
          {stored && (
            <p role="status" className={s.note}>
              {ix ? ix.sharedLoaded(stored.name, dropped) : en ? PAGE_EN.sharedLoaded(stored.name, dropped) : <>Geteilter Plan „{stored.name}“ geladen. Änderungen betreffen nur Ihre Ansicht.{dropped ? ` ${dropped} Element(e) gibt es im Katalog nicht mehr.` : ""}</>}
            </p>
          )}
        </header>
        {/* R5 neuland P2-1: rechte Hälfte am Desktop – Vorderansicht und Draufsicht im Grundriss (eigene Zeichnungen) */}
        {step === 1 && heroType && (
          <aside className={s.headAside} aria-label={ix ? ix.asideLabel : en ? PAGE_EN.asideLabel : "Beispiel: Sofa in Vorderansicht und Grundriss"} data-sofa-head-aside="">
            <figure className={s.heroSofa}>
              <Silhouette height={heroType.height} depth={heroType.depth} seat={heroType.seat} className={s.silhouette} title={ix ? ix.heroTitle(SC.modelWord, heroType.name) : en ? PAGE_EN.heroTitle(heroType.name) : `${SOURCE_COPY.modelWord} ${heroType.name} in der Vorderansicht`} />
              <figcaption>
                {ix ? ix.heroCaption(SC.modelWord, heroType.name, heroType.depth, heroType.height) : en ? PAGE_EN.heroCaption(false, heroType.name, heroType.depth, heroType.height) : <>{SOURCE_COPY.modelWord} „{heroType.name}“, Vorderansicht · Tiefe {heroType.depth} cm, Höhe {heroType.height} cm</>}
              </figcaption>
            </figure>
            <Draufsicht depth={heroType.depth} className={s.draufsicht} locale={locale} />
          </aside>
        )}
        </div>

        {/* Step 1 needs only the index; the family is fetched when a model is picked (smaller page). */}
        <div id="planer-start" tabIndex={-1} className={s.startAnchor} />
        <Planner index={index} initialFamily={step === 1 ? null : family} initialPlan={plan} initialStep={step} calendar={ownCalendarActive()} />

        {/* Server-rendered guidance (readable without JavaScript). */}
        <section aria-labelledby="sp-tipps" className={s.tips}>
          <h2 id="sp-tipps" className={`${s.h2} ph-chapter`}>
            {ix ? ix.tipsTitle : en ? PAGE_EN.tipsTitle : "Worauf es beim Planen ankommt"}
          </h2>
          {fx ? (
            <ul className={`${s.plainList} reveal-group`}>
              {(ix || PAGE_EN).tips(WALKWAY_MIN, WALKWAY_IDEAL).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}</strong> {v}
                </li>
              ))}
            </ul>
          ) : (
          <ul className={`${s.plainList} reveal-group`}>
            <li>
              <strong>Laufwege:</strong> {WALKWAY_MIN}–{WALKWAY_IDEAL} cm vor dem Sofa und zwischen Möbeln lassen, Hauptwege zu Türen eher {WALKWAY_IDEAL} cm und mehr.
            </li>
            <li>
              <strong>Anbau links/rechts:</strong> Endelemente gibt es mit Armlehne links oder rechts, Blick von vorn auf das Sofa. Der Planer wählt die passende
              Seite beim Andocken selbst.
            </li>
            <li>
              <strong>Fenster:</strong> Rückenhöhe und Brüstung vergleichen – liegt die Brüstung tiefer, ragt die Lehne ins Fenster.
            </li>
            <li>
              <strong>Lieferweg:</strong> Treppenhaus, Türbreiten und Lift vorab messen – modulare Elemente kommen einzeln ins Haus.
            </li>
          </ul>
          )}
          <FamilyList items={index.map((f) => [f.slug, f.name, f.count, f.completeness, f.outdoor])} total={total} locale={locale} />
          {fx ? (
            <ProcessBridge locale={locale} className="my-8 !mx-0 !px-0" links={[SC.brandLink]} />
          ) : (
          <HandBridge
            className="my-8 !mx-0 !px-0"
            links={[SOURCE_COPY.brand ? { href: "/ueber-uns/marken/minotti", label: "Minotti in Lochau" } : { href: "/ueber-uns/marken", label: "Unsere Marken im Showroom" }]}
          />
          )}
          <p className={s.small}>{SC.sourceNote}</p>
        </section>

        {faq.length > 0 && (
          <section aria-labelledby="sp-faq" className={s.tips} data-sofa-faq="">
            <JsonLd data={faqPageSchema(`${SITE_URL}/de/sofaplaner`, "de", faq)} />
            <h2 id="sp-faq" className={`${s.h2} ph-chapter`}>
              Häufige Fragen zum Sofaplaner
            </h2>
            <dl>
              {faq.map((it) => (
                <div key={it.q} className="border-b border-line py-4">
                  <dt className="font-medium">{it.q}</dt>
                  <dd className="mt-1">{it.a}</dd>
                </div>
              ))}
            </dl>
            {ratgeber.length > 0 && (
              <>
                <h3 className="mt-8 font-medium">Weiterlesen im Ratgeber</h3>
                <ul className={s.plainList}>
                  {ratgeber.map((a) => (
                    <li key={a.slug}>
                      <a href={`/de/ratgeber/${a.slug}`}>{a.title}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
