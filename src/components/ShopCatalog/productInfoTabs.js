import { ExternalLink, Plus } from "lucide-react";
import { Button, Container, Heading } from "@/components/ui";
import DownloadList from "@/components/ShopCatalog/downloadList";
import DimensionDiagram from "@/components/ShopCatalog/dimensionDiagram";
import { splitDescription, withoutSpecDuplicates } from "@/components/ShopCatalog/descriptionBlocks";

// "Atelier" detail sections (Bibel §10): description, material & finish,
// dimensions and downloads – no longer client-side tabs but plain, server-
// rendered sections, all in the HTML (crawlers, find-in-page, screen-reader
// heading navigation). A small in-page index links them.
// Layout from the Galerie prototype: heading in columns 1–4, content 5–12.
// QA Runde 1 (P1-2): the manufacturer text is no longer one wall of text –
// two paragraphs are visible, the rest sits in <details>; the technical part
// (CMS heading "Ausführungen", "<strong>Gestell:</strong> …") moves into
// "Material und Ausführung" as one disclosure per component; CMS h4 → h3.
// File name kept for history; the component is ProductDetailSections.

const RICH =
  "[&_a]:underline [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_li+li]:mt-2 [&_p+p]:mt-4 [&_p+ul]:mt-4 [&_ul+p]:mt-4 " +
  "[&_h3]:mt-stack-m [&_h3]:mb-3 [&_h3]:font-sans [&_h3]:text-title [&_h3]:text-text";

function Block({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 border-t border-line py-12 lg:grid lg:grid-cols-12 lg:gap-grid lg:py-16">
      <Heading id={`${id}-title`} level={2} size="title" className="lg:col-span-4">
        {title}
      </Heading>
      <div className="mt-6 lg:col-span-8 lg:mt-0">{children}</div>
    </section>
  );
}

const Html = ({ html, className }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;

// One disclosure per component (Gestell, Kissen …). Same look as ui/Accordion,
// but the content is CMS rich text (and stays in the HTML when closed).
function SpecItem({ label, html }) {
  if (!html) {
    return <p className="border-b border-line py-4 text-ui text-text">{label}</p>;
  }
  return (
    <details className="ph-accordion border-b border-line">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-left">
        <span className="text-ui text-text">{label}</span>
        <Plus aria-hidden="true" className="ph-accordion__icon size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
      </summary>
      <Html html={html} className={`max-w-measure pb-6 text-body text-text-soft ${RICH}`} />
    </details>
  );
}

/**
 * @param {object} labels   translated headings/notes (see page)
 * @param {string[]} descriptionParagraphs sanitized CMS html
 * @param {object|null} dims parseDimensions() result
 * @param {string|null} dimensionsRaw original text (shown when it can't be parsed)
 * @param {Array<{key,label,value:string[]}>} materialsFields
 * @param {Array<{group:string|null,label:string,value:string}>|null} [dimensionRows]
 *   labelled table rows (src/lib/shop/dimensions.js, formatted by the page);
 *   null → the raw text is shown
 * @param {string[]} [dimensionNotes] remarks from the data ("may vary by 5 %")
 * @param {Array<{href,label,fileName}>} downloads
 * @param {{href,label}|null} [planningRequest] "Planungsdaten anfragen" link
 * @param {string} [productLabel] "Marke Modell" (download event)
 * @param {(key:string)=>string} dimLabel
 * @param {boolean} [fromManufacturer] the text is the manufacturer's (not the fallback blurb)
 * @param {object|null} [curated] checked product copy (src/lib/productCopy, R3):
 *   { paragraphs?: string[], facts?: {key,label,value,source}[], faq?: {question,answer}[],
 *     brand, productName, preview?: boolean } – only approved fields arrive here
 *   (published view); it supplements the manufacturer text, never replaces it.
 *   The FAQ is rendered in the HTML (<details>, content in the DOM) – the page
 *   emits FAQPage JSON-LD for exactly these items.
 */
export default function ProductDetailSections({
  labels,
  descriptionParagraphs,
  dims,
  dimensionsRaw,
  materialsFields,
  downloads,
  dimensionRows = null,
  dimensionNotes = [],
  planningRequest = null,
  productLabel = "",
  dimLabel,
  fromManufacturer = true,
  curated = null,
}) {
  const { intro, more, spec } = splitDescription(descriptionParagraphs);
  const curatedParagraphs = curated?.paragraphs?.length ? curated.paragraphs : [];
  const curatedFacts = curated?.facts?.length ? curated.facts : [];
  const curatedFaq = curated?.faq?.length ? curated.faq : [];
  const hasManufacturerDescription = intro.length > 0 || more.length > 0;
  const hasDescription = hasManufacturerDescription || curatedParagraphs.length > 0;
  const fields = withoutSpecDuplicates(materialsFields, spec);
  const hasFields = fields.length > 0;

  const blocks = [
    hasDescription ? { id: "beschreibung", title: labels.description } : null,
    curatedFacts.length ? { id: "fakten", title: labels.curatedFacts } : null,
    { id: "material", title: labels.materials },
    dims || dimensionsRaw ? { id: "masse", title: labels.dimensions } : null,
    downloads?.length || planningRequest ? { id: "downloads", title: labels.downloads } : null,
    curatedFaq.length ? { id: "fragen", title: labels.faqNav } : null,
  ].filter(Boolean);

  return (
    <Container>
      <nav aria-label={labels.onThisPage} className="py-6">
        <p className="text-overline uppercase text-text-soft">{labels.onThisPage}</p>
        <ul className="mt-2 flex flex-wrap gap-x-6">
          {blocks.map((b) => (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
              >
                {b.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {hasDescription && (
        <Block id="beschreibung" title={labels.description}>
          {curated?.preview && labels.previewNote && (
            <p role="note" className="mb-6 max-w-measure border-l-2 border-line-strong pl-4 text-small text-text-soft">
              {labels.previewNote}
            </p>
          )}
          {curatedParagraphs.length > 0 && (
            <div className={`max-w-measure text-body text-text ${hasManufacturerDescription ? "mb-10" : ""}`}>
              {curatedParagraphs.map((text, i) => (
                <p key={i} className={i > 0 ? "mt-4" : undefined}>
                  {text}
                </p>
              ))}
            </div>
          )}
          {/* Manufacturer copy, labelled as such right above it (P3-10): its
              praise is the maker's, not a claim by the studio. */}
          {hasManufacturerDescription && fromManufacturer && labels.manufacturerText && (
            <p className="mb-4 text-overline uppercase text-text-soft">{labels.manufacturerText}</p>
          )}
          <div className={`max-w-measure text-body text-text ${RICH}`}>
            {intro.map((html, i) => (
              <Html key={i} html={html} className={i > 0 ? "mt-4" : undefined} />
            ))}
          </div>
          {more.length > 0 && (
            <details className="ph-accordion group mt-6 max-w-measure">
              <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                <span className="group-open:hidden">{labels.readMore}</span>
                <span className="hidden group-open:inline">{labels.readLess}</span>
                <Plus aria-hidden="true" className="ph-accordion__icon size-4 shrink-0" strokeWidth={1.5} />
              </summary>
              <Html html={more.join("")} className={`mt-4 text-body text-text ${RICH}`} />
            </details>
          )}
        </Block>
      )}

      {curatedFacts.length > 0 && (
        <Block id="fakten" title={labels.curatedFacts}>
          <dl className="max-w-measure border-t border-line">
            {curatedFacts.map((f) => (
              <div key={f.key} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[10rem_1fr] sm:gap-grid">
                <dt className="text-small text-text-soft sm:pt-1">{f.label}</dt>
                <dd className="text-body text-text">
                  {f.value}{" "}
                  <a
                    href={f.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-6 items-center gap-1 whitespace-nowrap text-small text-text-soft underline decoration-line-strong underline-offset-4 hover:decoration-current"
                  >
                    {labels.factSource}
                    <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                    <span className="sr-only">{labels.factSourceSr}</span>
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      <Block id="material" title={labels.materials}>
        {hasFields && (
          <dl className="max-w-measure space-y-6">
            {fields.map((f) => (
              <div key={f.key} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-grid">
                <dt className="text-small text-text-soft sm:pt-1">{f.label}</dt>
                <dd className="text-body text-text">
                  {f.value.map((v, vi) => (
                    <p key={vi}>{v}</p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {spec.map((group, gi) => (
          <div key={gi} className={`max-w-measure ${hasFields || gi > 0 ? "mt-stack-m" : ""}`}>
            {group.title && (
              // Optik-Runde: Gruppentitel als Overline wie „Beschreibung des
              // Herstellers“ – ein zweiter Titel gleicher Größe direkt unter
              // der H2 „Material und Ausführung“ las sich wie eine Doppelung.
              <h3 className="mb-4 text-overline uppercase text-text-soft">{group.title}</h3>
            )}
            {group.extra.length > 0 && <Html html={group.extra.join("")} className={`mb-4 text-body text-text ${RICH}`} />}
            {group.items.length > 0 && (
              <div className="border-t border-line">
                {group.items.map((item, ii) => (
                  <SpecItem key={ii} label={item.label} html={item.html} />
                ))}
              </div>
            )}
          </div>
        ))}

        <p className={`max-w-measure text-body text-text-soft ${hasFields || spec.length ? "mt-8" : ""}`}>{labels.materialFallback}</p>
      </Block>

      {(dims || dimensionsRaw) && (
        <Block id="masse" title={labels.dimensions}>
          {/* R4: the labelled values as a real table (th scope=row), the
              drawing beside it when width/height are known; groups (sizes,
              components) get their own header row. Unlabelled data ("220 x
              98 x 74 cm" – order not stated) stays raw text. */}
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-16">
            {dims && (dims.width || dims.height || dims.diameter) ? (
              <div className="w-full max-w-[280px] text-text">
                <DimensionDiagram dims={dims} size="lg" />
              </div>
            ) : null}
            {dimensionRows?.length ? (
              <table className="w-full max-w-measure flex-1 border-collapse text-left">
                <caption className="sr-only">{labels.dimensionsCaption}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{labels.dimensionsColLabel}</th>
                    <th scope="col">{labels.dimensionsColValue}</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensionRows.map((r, i) => {
                    const groupStart = r.group && r.group !== dimensionRows[i - 1]?.group;
                    return [
                      groupStart ? (
                        <tr key={`g-${i}`}>
                          <th scope="colgroup" colSpan={2} className={`pb-2 text-ui text-text ${i === 0 ? "pt-0" : "pt-6"}`}>
                            {r.group}
                          </th>
                        </tr>
                      ) : null,
                      <tr key={i} className="border-b border-line">
                        <th scope="row" className="py-3 pr-6 align-top text-small font-normal text-text-soft">
                          {r.label}
                        </th>
                        <td className="tabular py-3 text-body text-text">{r.value}</td>
                      </tr>,
                    ];
                  })}
                </tbody>
              </table>
            ) : (
              <p className="tabular max-w-measure text-body text-text">{dimensionsRaw}</p>
            )}
          </div>
          {dimensionNotes.map((n) => (
            <p key={n} className="mt-4 max-w-measure text-small text-text-soft">
              {n}
            </p>
          ))}
          <p className="mt-8 max-w-measure text-small text-text-soft">{labels.dimensionsNote}</p>
        </Block>
      )}

      {(downloads?.length > 0 || planningRequest) && (
        <Block id="downloads" title={labels.downloads}>
          <p className="max-w-measure text-body text-text-soft">{downloads?.length ? labels.downloadsText : labels.downloadsNone}</p>
          <DownloadList downloads={downloads} product={productLabel} newTabLabel={labels.newTab} />
          {planningRequest && (
            <div className="mt-8 max-w-measure">
              <p className="text-small text-text-soft">{labels.planningText}</p>
              <Button href={planningRequest.href} variant="secondary" className="mt-4">
                {planningRequest.label}
              </Button>
            </div>
          )}
        </Block>
      )}

      {curatedFaq.length > 0 && (
        <Block id="fragen" title={labels.faqHeading}>
          <div className="max-w-measure border-t border-line">
            {curatedFaq.map((f) => (
              <details key={f.question} className="ph-accordion border-b border-line">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-left">
                  <span className="text-ui text-text">{f.question}</span>
                  <Plus aria-hidden="true" className="ph-accordion__icon size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
                </summary>
                <p className="pb-6 text-body text-text-soft">{f.answer}</p>
              </details>
            ))}
          </div>
        </Block>
      )}
    </Container>
  );
}
