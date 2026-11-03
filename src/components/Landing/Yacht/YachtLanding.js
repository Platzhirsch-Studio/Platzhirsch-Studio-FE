// Layout for /de/yacht-interior – Signature "Die Werfthalle"
// (Marktresearch/digital/features/yacht-signature-konzept.md, yacht.md).
// Order: hero (typographic, own SVG stage) → prologue with three rules on
// board → "Sechs Boote, sechs Welten" (full-screen, scroll-coupled AI
// renderings) → Werfthalle (3D island) → six concepts (tabs) → materials
// (the ONE walnut surface) → course through the winter storage with the
// three parties as legend → Minotti reference Navetta 42 (real photos, no AI,
// owner decision 27.10.) → brands with real product images → area + showroom
// (one block) → FAQ → appointment.
// Length (QA round 2, P2.4): sections after the Werfthalle use the compact
// rhythm (SECTION_Y: 56/64 px instead of 96/176 px), so pb of one plus pt
// of the next never add up to 350 px of empty space.
// The former film band is gone: its image now lives in the chapter, so no
// rendering appears twice above the concept gallery (QA round 1, P2.1).
// Server component; client JS only in the chapter, the Werfthalle and the
// concept tabs.
// Metadata via landingMetadata (page.js); JSON-LD WebPage + Service + FAQPage.
//
// Wording rules (Marktresearch/29-geschaeftsfeld-yacht-interior.md, Abschnitt 8):
// no "Nr. 1"/"führend", no dealer or partner claims, no "marine-zertifiziert"
// or "schwer entflammbar", no "Bauleitung"/"Komplett-Refit aus einer Hand",
// no names of yards or upholsterers, no invented references, no prices.
import { MapPin } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import { Horizon, LinkArrow, Section } from "@/components/ui";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { breadcrumbList, graph, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { EMAIL } from "@/lib/site";
import { islandConcepts } from "@/lib/yacht/model";
import YachtHero from "@/components/Yacht/YachtHero";
import ConceptGallery from "@/components/Yacht/ConceptGallery";
import Werfthalle from "@/components/Yacht/Werfthalle";
import WorldsChapter from "@/components/Yacht/WorldsChapter";
import BrandShelf from "@/components/Yacht/BrandShelf";
import NavettaReference from "@/components/Yacht/NavettaReference";
import HandBridge from "@/components/Reusable/HandBridge";
import { NAVETTA_RELEASED } from "@/lib/yacht/navetta";
import styles from "@/components/Yacht/yacht.module.css";
import { FaqSection, LandingClosing, SectionHead, useLandingCopy } from "../parts";
import { heroImage } from "../imagery";

/** Compact section rhythm of this page (QA round 2, P2.4: page length). */
const SECTION_Y = "py-14 md:py-16";

const BOAT_SHORT = { runabout: "Runabout", daycruiser: "Daycruiser", segelyacht: "Segelyacht", motoryacht: "Motoryacht", hausboot: "Hausboot", superyacht: "Superyacht" };

function yachtSchema(content, path, primaryImage) {
  const url = `${SITE_URL}/de${path}`;
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: content.hero.title,
      inLanguage: "de-AT",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: `${SITE_URL}${primaryImage}`,
      breadcrumb: breadcrumbList(
        [{ name: "Home", url: `${SITE_URL}/de` }, { name: content.hero.crumb }],
        `${url}#breadcrumb`
      ),
    },
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: content.schema.serviceName,
      serviceType: content.schema.serviceType,
      description: content.schema.description,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: content.schema.areaServed.map((name) => ({ "@type": "Place", name })),
      url,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: content.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }
  );
}

/** Materials as drawn swatches on the page's one walnut surface. */
// Desktop: head on top, three columns of materials. Phones: a compact list
// with a small swatch next to the name (QA round 2, P2.4).
function Materials({ data }) {
  return (
    <Section tone="inverse" labelledBy="materials-title" spacing="none" className={SECTION_Y}>
      <SectionHead id="materials-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} tone="dark" />
      <ul className="mt-stack-m grid grid-cols-1 gap-x-8 sm:grid-cols-2 sm:gap-y-8 lg:grid-cols-3">
        {data.items.map((m) => (
          <li key={m.name} className="flex gap-3 border-t border-line-inverse py-4 sm:gap-4 sm:pb-0 sm:pt-5">
            <span aria-hidden="true" className={`mt-1 block size-6 shrink-0 sm:mt-0 sm:size-12 ${styles[m.swatch] || ""}`} />
            <div>
              <h3 className="text-ui text-text-inverse sm:text-title">{m.name}</h3>
              <p className="mt-1 text-small text-text-inverse-soft sm:mt-2 sm:text-body">{m.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Course through the winter storage: Gantt on desktop, list on phones. The
 * three parties stand once, as the legend above the Gantt (the former
 * section "Drei Beteiligte" is merged in here – QA round 2, P2.5).
 */
function Course({ data, roles }) {
  const n = data.months.length;
  return (
    <Section tone="surface" labelledBy="course-title" spacing="none" className={SECTION_Y}>
      <SectionHead id="course-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} className="scroll-mt-28" />
      <div className="mt-stack-m border-t border-line-strong pt-6">
        <h3 className="text-overline uppercase text-text-soft">{roles.heading}</h3>
        <p className="mt-2 max-w-text text-body text-text-soft">{roles.text}</p>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-3">
          {roles.columns.map((col) => (
            <div key={col.title}>
              <dt className="text-overline uppercase text-text-accent">{col.title}</dt>
              <dd className="mt-2 text-small text-text">{col.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Horizon className="mt-stack-m" />
      <div aria-hidden="true" className="mt-4 hidden grid-cols-12 gap-x-8 lg:grid">
        <div className="col-span-4" />
        <div className="col-span-8 grid text-overline uppercase text-text-soft" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {data.months.map((m) => (
            <span key={m} className="border-l border-line pl-2">
              {m}
            </span>
          ))}
        </div>
      </div>
      <ol className="mt-4">
        {data.items.map((step, i) => (
          <li key={step.title} className="grid grid-cols-1 gap-y-3 border-b border-line py-4 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-4">
              <p className="text-overline uppercase text-text-accent">
                <span className="tabular">{String(i + 1).padStart(2, "0")}</span> · {step.when}
              </p>
              <h3 className="mt-2 text-title text-text">{step.title}</h3>
            </div>
            <div className="lg:col-span-8">
              <div aria-hidden="true" className="relative hidden h-2 bg-stone lg:block">
                <span
                  className="absolute inset-y-0 bg-see"
                  style={{ left: `${(step.from / n) * 100}%`, width: `${((step.to - step.from + 1) / n) * 100}%` }}
                />
              </div>
              <dl className="grid grid-cols-1 gap-3 text-small sm:grid-cols-3 lg:mt-4">
                <div>
                  <dt className="text-overline uppercase text-text-soft">Platzhirsch</dt>
                  <dd className="mt-1 text-text">{step.us}</dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">Bootssattler</dt>
                  <dd className="mt-1 text-text">{step.sattler}</dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">Werft</dt>
                  <dd className="mt-1 text-text">{step.werft}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default function YachtLanding({ content, path, concepts }) {
  const { hero, worlds: worldsCopy, intro, werfthalle, materials, course, roles, brands, area, cta, faq } = content;
  const l = useLandingCopy();
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent(cta.mailSubject)}`;
  const allImages = concepts.flatMap((c) => c.images);
  // one rendering per boat for the full-screen chapter (no product hotspots)
  const worlds = concepts
    .map((c) => ({ id: c.id, title: c.title, motto: c.motto, boatType: c.boatType, boatShort: BOAT_SHORT[c.model], image: allImages.find((img) => img.id === worldsCopy.renders[c.id]) || c.images[0] }))
    .filter((w) => w.image);
  const filmImage = worlds[0]?.image || allImages[0];
  // JSON-LD primaryImageOfPage: the register's hero (unchanged) – the AI
  // image is a visualisation, not the page's photo.
  const heroImg = heroImage(path, filmImage?.webp[2400], hero.title);
  const island = islandConcepts(concepts);

  return (
    <div>
      <JsonLd data={yachtSchema(content, path, heroImg.src)} />

      <YachtHero
        title={hero.title}
        eyebrow={hero.eyebrow}
        lead={hero.lead}
        crumb={hero.crumb}
        motto={hero.motto}
        primaryLabel={cta.primaryLabel}
        secondary={hero.secondary}
        image={heroImg.show ? heroImg.src : null}
        alt={heroImg.alt}
      />

      {/* Prologue: the three rules on board */}
      <Section tone="surface" labelledBy="intro-title" spacing="none" className={SECTION_Y}>
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-5">
            <SectionHead id="intro-title" eyebrow={intro.eyebrow} title={intro.heading} />
            <div className="mt-stack-m max-w-measure space-y-4 text-body text-text">
              {intro.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <ol className="grid grid-cols-1 gap-x-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:grid-cols-1 lg:self-end">
            {intro.rules.map((r, i) => (
              <li key={r.name} className="border-t border-line-strong py-6">
                <p className="font-display text-display-m text-text-soft tabular" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-title text-text">{r.name}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{r.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Signature chapter: six boats, six worlds (full screen, scroll-coupled) */}
      <section aria-labelledby="worlds-title" className="bg-ink-deep pt-14 text-text-inverse md:pt-16" data-yacht-worlds="">
        <div className="mx-auto grid max-w-page grid-cols-1 gap-y-6 px-gutter pb-stack-m lg:grid-cols-12 lg:gap-x-8">
          <SectionHead id="worlds-title" eyebrow={worldsCopy.eyebrow} title={worldsCopy.heading} text={worldsCopy.text} tone="dark" className="lg:col-span-7" />
          <p className="max-w-measure border-l-2 border-brass-400 pl-4 text-small text-text-inverse-soft lg:col-span-4 lg:col-start-9 lg:self-end">{worldsCopy.aiNote}</p>
        </div>
        <WorldsChapter worlds={worlds} />
      </section>

      {/* Signature: Die Werfthalle */}
      <Section tone="band" labelledBy="werfthalle-title" id="werfthalle" className={`scroll-mt-20 ${SECTION_Y}`} spacing="none">
        <SectionHead id="werfthalle-title" eyebrow={werfthalle.eyebrow} title={werfthalle.heading} text={werfthalle.text} />
        <div className="mt-stack-m">
          <Werfthalle concepts={island} initial={werfthalle.initial} />
        </div>
        <p className="mt-stack-m max-w-measure text-small text-text-soft">{werfthalle.note}</p>
      </Section>

      {/* Six concepts */}
      <Section tone="surface" labelledBy="konzepte-title" id="konzepte" spacing="none" className={SECTION_Y}>
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
          <SectionHead id="konzepte-title" eyebrow={content.concepts.eyebrow} title={content.concepts.heading} text={content.concepts.text} className="lg:col-span-7" />
          <p className="max-w-measure border-l-2 border-see pl-4 text-small text-text-soft lg:col-span-4 lg:col-start-9 lg:self-end" data-ki-hinweis="">
            {content.concepts.imageNote}
          </p>
        </div>
        <div className="mt-stack-m">
          <ConceptGallery concepts={concepts} avoidLead={Object.values(worldsCopy.renders)} />
        </div>
      </Section>

      <Materials data={materials} />

      <Course data={course} roles={roles} />

      {/* Reference: Minotti on a yacht – real photos, unchanged, credited, no AI
          label. Only after the written release of Minotti and Custom Line
          (NAVETTA_RELEASED, src/lib/yacht/navetta.js); until then left out. */}
      {NAVETTA_RELEASED ? (
        <Section tone="band" labelledBy="navetta-title" spacing="none" className={SECTION_Y}>
          <NavettaReference />
        </Section>
      ) : null}

      {/* Kern-USP (Inhaber-Entscheidung Nr. 8): the same process on board */}
      <HandBridge variant="feld" className="py-12" />

      {/* Brands – only collections with the maker's stated use */}
      <Section tone="surface" labelledBy="brands-title" spacing="none" className={SECTION_Y}>
        <SectionHead id="brands-title" eyebrow={brands.eyebrow} title={brands.heading} text={brands.text} />
        <div className="mt-stack-m">
          <BrandShelf groups={brands.groups} concepts={concepts} />
        </div>
        <LinkArrow href="/outdoor-gartenplanung" className="mt-stack-m">
          {l("outdoorLink")}
        </LinkArrow>
      </Section>

      {/* Area – Bodensee and Mediterranean (typographic, no foreign place photos) */}
      {/* one block, two columns: head + showroom left, the two areas right (QA round 2, P2.4) */}
      <Section tone="band" labelledBy="area-title" spacing="none" className={SECTION_Y}>
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-5">
            <SectionHead id="area-title" eyebrow={area.eyebrow} title={area.heading} />
            <p className="mt-stack-m flex max-w-measure items-start gap-3 text-body text-text-soft">
              <MapPin aria-hidden="true" strokeWidth={1.5} className="mt-1 size-5 shrink-0 text-text-soft" />
              <span>{area.showroom}</span>
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:self-end">
            {area.regions.map((r) => (
              <li key={r.title} className="border-t border-line-strong py-5">
                <h3 className="text-title text-text">{r.title}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <FaqSection faq={faq} />

      <LandingClosing
        heading={cta.heading}
        text={cta.text}
        primaryLabel={cta.primaryLabel}
        secondary={{ href: mailHref, label: l("mail") }}
        showPhone
      />
    </div>
  );
}
