import { Breadcrumbs, Container, Eyebrow, Heading, Lead, Media, cx } from "@/components/ui";
import { softHyphens } from "@/components/UberUns/softHyphens";
import { PAGE_CONTAINER } from "@/components/UberUns/zoomSafe";
import { hasLongWord, longestWordCap, titleParts } from "@/components/UberUns/titleParts";

// Page opening of the content pages (Bibel §10.2, Jury §3.1/3.2): light
// surface, breadcrumb, overline, H1 in Bodoni (display-l) and one lead
// paragraph – text NEXT TO the photo, never on it (no contrast trap, H1 is
// the first thing that paints). Asymmetric 12-column grid: text in columns
// 1/2–6, photo in 8–12; on phones the photo follows the text (3:2) and still
// reaches into the first viewport.
//
// The new header (components/Navbar/HeaderFrame) is sticky and in flow, so
// the page needs no offset for it – only its own top spacing.
const HEADER_OFFSET = "pt-10 md:pt-14 lg:pt-16";

// Real rendered width of the photo column (R4-shell-perf, LCP /de/kontakt):
// one column below 1024 px (gutter 20 px, 48 px from 768 px), then 6 of 12
// columns (gap 24 px) and from 1280 px 5 of 12 (gutter 80 px, gap 32 px),
// capped by the 1440 px page width. The old "100vw" made phones load
// 1200 px wide files for a 350 px wide box.
// ≥ lg the 3:2 photos sit in a 4:5 frame (object-cover, ≤ 600 px high), so the
// image must be ~1.875× the frame width – the old frame-width sizes were
// upscaled ~1.9× on every laptop/desktop (QM wohnen-marken, 01.11.2026).
const IMAGE_SIZES =
  "(min-width: 1024px) 900px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 40px)";

// German compounds in the H1s are long ("Einrichtungsberatung"). The H1 uses
// manual hyphenation (no dictionary in every engine – WebKit cut words without
// a hyphen, QA Runde 1 P2-1), so the break points are set here, at the
// compound joint, as soft hyphens (U+00AD, invisible unless the line breaks).
// The joints live in softHyphens.js (also used for leads and partner names, QM wm-fix3).

/** Soft hyphens at known compound joints (strings only; JSX passes through). */
export function hyphenateTitle(title) {
  if (typeof title !== "string") return title;
  // A dash never starts a line: bind it to the word before (no-break space).
  // T8 (Design-Studio): no widow either – the last two words stay together
  // when they are short (< 16 characters), so "Einrichtungsberatung in /
  // Lochau" breaks as "Einrichtungsberatung / in Lochau" in every engine.
  return softHyphens(title)
    .replace(/ – /g, " – ")
    .replace(/ (\S+) (\S+)$/u, (m, a, b) => (a.length + b.length < 16 ? ` ${a} ${b}` : m));
}

/**
 * @param {Array<{label: string, href?: string}>} breadcrumbs  hrefs without locale
 * @param {string} [eyebrow]
 * @param {ReactNode} title  the page's only H1
 * @param {string} [kicker] QM content-legal r3 (news): short first line INSIDE the H1
 *   (brand of "FLOS – Ausdrucksstarke …"), set small; screen readers hear "Flos – …".
 * @param {ReactNode} [lead]
 * @param {{src: string|object, alt: string, position?: string, quality?: number}} [image]  LCP image (preload + fetchPriority high,
 *   quality 50 unless given); position = object-position class
 * @param {ReactNode} [children] actions below the lead (max. one primary)
 * @param {"page"|"text"} [width="page"] "text" = no image, narrow column (legal pages)
 * @param {boolean} [breadcrumbSchema=false] also emit BreadcrumbList JSON-LD
 *   (only for pages that do not render one themselves)
 * @param {ReactNode} [media] replaces the photo (e.g. a portrait tile); same column
 * @param {ReactNode} [caption] Design-Jury P2-19: line under the photo (e.g. name ·
 *   role of a portrait), text-small, 8 px below. With a caption the photo is a
 *   <figure>; from lg it is 30 rem high (4:5) and right-aligned, so the short
 *   text column no longer faces a 600 px picture with an empty half.
 */
export default function PageHeader({
  breadcrumbs = [],
  breadcrumbSchema = false,
  eyebrow,
  title,
  kicker,
  lead,
  image,
  media,
  caption,
  children,
  width = "page",
  className,
}) {
  const hasImage = Boolean(image?.src) || Boolean(media);
  return (
    // Own "page" container (QM wm-r4): the header is also used outside the
    // Über-uns/Produkte wrappers (Kontakt, Beratung, News …).
    <div className={cx(PAGE_CONTAINER, "bg-surface pb-16 md:pb-20 lg:pb-24", HEADER_OFFSET, className)}>
      <Container size={width === "text" ? "text" : "page"}>
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} schema={breadcrumbSchema} />}
        <div
          className={cx(
            "mt-stack-m grid grid-cols-1 gap-y-10 gap-x-grid",
            hasImage && "@5xl/page:grid-cols-12 @5xl/page:items-start"
          )}
        >
          <div className={cx(hasImage && "@5xl/page:col-span-6 xl:@5xl/page:col-span-7", "min-w-0")}>
            {eyebrow && <Eyebrow className="mb-stack-s">{eyebrow}</Eyebrow>}
            {/* Optik-Runde: die weichen Trennstellen nur bis md – ab 768 px passt
                „Einrichtungsstudio“ in die Spalte, eine Trennung im Display-Titel
                („Einrichtungs-/studio“ bei 1440) wirkte zufällig. */}
            <Heading
              level={1}
              size="display-l"
              className={cx(
                "hyphens-manual break-words text-pretty md:hyphens-none",
                hasLongWord(title) && "max-sm:text-[length:min(var(--text-display-l),9.6vw)]!",
                // QM content-legal r3: with 200 % text even short words ("Impressum") were cut –
                // single column (< md): the size never exceeds what the longest word needs.
                longestWordCap(hyphenateTitle(title)) && "max-md:[font-size:min(var(--text-display-l),var(--ph-h1-cap))]"
              )}
              style={longestWordCap(hyphenateTitle(title)) ? { "--ph-h1-cap": longestWordCap(hyphenateTitle(title)) } : undefined}
            >
              {kicker && (
                <span className="mb-1 block font-sans text-title text-text-soft">
                  {kicker}
                  <span className="sr-only"> –</span>
                </span>
              )}
              {titleParts(title) ? (
                <>
                  {hyphenateTitle(titleParts(title)[0])}
                  <span className="sr-only"> –</span> <span className="block">{hyphenateTitle(titleParts(title)[1])}</span>
                </>
              ) : (
                hyphenateTitle(title)
              )}
            </Heading>
            {lead && <Lead tone="soft" className="mt-stack-m break-words">{typeof lead === "string" ? softHyphens(lead).replace(/ – /g, " – ") : lead}</Lead>}
            {children && <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>}
          </div>
          {hasImage && (
            <div className={cx("@5xl/page:col-span-6 @5xl/page:col-start-7 xl:@5xl/page:col-start-8 xl:@5xl/page:col-span-5", caption && "@5xl/page:self-end")}>
              {media ||
                (() => {
                  const photo = (
                    <Media
                      src={image.src}
                      alt={image.alt ?? ""}
                      // Portrait with caption: 4:5 and at most 20rem wide below lg –
                      // the 3:2 full-width crop was a soft, oversized face on tablets
                      // (CMS portraits are ~600 px; QM wohnen-marken 01.11.2026). Phones: full
                      // text width (320 px left a 15 px strip on the right, QM wm-fix3).
                      ratio={caption ? "4/5" : "3/2"}
                      className={cx(
                        caption ? "w-36 shrink-0 sm:w-44" : "lg:ml-auto lg:aspect-[4/5] lg:max-h-[min(600px,calc(100svh-220px))]"
                      )}
                      imgClassName={image.position}
                      sizes={caption ? "(min-width: 640px) 176px, 144px" : IMAGE_SIZES}
                      quality={caption ? 75 : (image.quality ?? 50)}
                      preload
                      fetchPriority="high"
                    />
                  );
                  if (!caption) return photo;
                  // QM wm-r4: CMS portraits are ~230–360 px. Stretched to 320 × 400
                  // (tablet) or 384 × 480 (desktop) they were ~3× soft, on iPad
                  // portrait the face stood at 40 % width beside an empty
                  // half, and at 200 % text size the rem height pushed it past
                  // the grid. Now a small portrait (144/176 px, ≈ its own pixels
                  // on a 2× screen) with name and role beside it.
                  return (
                    <figure className="m-0 flex items-end gap-4 @5xl/page:justify-end">
                      {photo}
                      <figcaption className="min-w-0 pb-1 text-small text-text-soft" data-header-caption="">
                        {caption}
                      </figcaption>
                    </figure>
                  );
                })()}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
