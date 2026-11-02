import TileImage from "@/components/ShopCatalog/tileImage";
import { Breadcrumbs, Container, Eyebrow, Heading, Lead } from "@/components/ui";

// Page head of the catalogue routes (hub, category): breadcrumb trail, overline,
// the H1 in Bodoni and the intro sentence.
// No BreadcrumbList here (schema=false): the pages emit their own in the
// CollectionPage graph.
// Top padding below the sticky header (in flow). Pages with a different
// rhythm can override it by setting
// --ph-page-top / --ph-page-top-lg without touching this file.
// QA Runde 1 (P2-6): tighter on phones, so the filter bar and the first tile
// (category) or the jump links (hub) reach the first screen. `compact` = the
// category page: short lead, the bar follows directly.
// On phones the lead is set in body size (≤ 2–4 lines instead of 5–6).
// `schema`: BreadcrumbList aus den Crumbs (Herstellerkatalog, dessen Graph keine eigene hat).
// QM wm-r4 (hub, 1440 × 900 / 1366 × 768): no picture above the fold, the right
// half was empty. Optional `media` ({ src, alt }) = a room photo beside the text
// from the page container's 64 rem on (one column at 200 % text size); below
// that it is display:none and, being lazy, never downloaded on phones.
export default function CatalogHeader({ crumbs, eyebrow, title, lead, compact = false, schema = false, media = null, children }) {
  return (
    <header
      className={`bg-surface pt-[var(--ph-page-top,2rem)] lg:pb-16 lg:pt-[var(--ph-page-top-lg,3rem)] ${compact ? "pb-6 sm:pb-10" : "pb-8 sm:pb-12"}`}
    >
      <Container>
        <Breadcrumbs items={crumbs} schema={schema} />
        <div className={media?.src ? "@5xl/page:grid @5xl/page:grid-cols-12 @5xl/page:items-end @5xl/page:gap-x-grid" : undefined}>
          <div className={media?.src ? "@5xl/page:col-span-7" : undefined}>
            <div className="mt-6 max-w-text sm:mt-10 lg:mt-14">
              {eyebrow && <Eyebrow className="mb-stack-s">{eyebrow}</Eyebrow>}
              <Heading level={1} size="display-l">
                {title}
              </Heading>
              {lead && <Lead className="mt-4 max-w-measure max-sm:text-body sm:mt-stack-m">{lead}</Lead>}
            </div>
            {children}
          </div>
          {media?.src && (
            <div className="relative hidden aspect-[3/2] overflow-hidden bg-linen @5xl/page:col-span-5 @5xl/page:block">
              <TileImage src={media.src} alt={media.alt || ""} sizes="(min-width: 1440px) 560px, 40vw" className="object-cover" />
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
