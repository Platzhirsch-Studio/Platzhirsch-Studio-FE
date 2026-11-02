import PageHeader from "@/components/UberUns/PageHeader";

// Former photo banner (title in white over a full-bleed photo, gold hover,
// white/40 separators, `priority`): replaced in R4-shell-perf (AP8 A11y rest)
// by the light page opening of the content pages. Same API as before, so the
// remaining caller (merkliste/page.js) keeps working unchanged:
//   info.title     → the page's only H1
//   info.subtitle  → lead paragraph
//   info.image     → photo next to the text (LCP: preload + fetchPriority high)
//   info.alt       → alt text (default: "<title> – Platzhirsch Home Living")
//   info.quality   → image quality (default 50 in PageHeader; must be one of
//                    images.qualities in next.config.js: 50, 75, 90, 100)
//   info.links     → [{ linkName, link }] breadcrumb, last entry = current page
// No "use client", no hooks: renders on the server, text never sits on a
// photo (contrast), no gold text (Bibel §4).
export default function SinglePageBanner({ info = {} }) {
  const links = Array.isArray(info.links) ? info.links : [];
  const breadcrumbs = links.map((link, index) => ({
    label: link?.linkName,
    // The last entry is the current page: no link (aria-current in Breadcrumbs).
    ...(index < links.length - 1 && link?.link ? { href: link.link } : {}),
  }));

  return (
    <PageHeader
      breadcrumbs={breadcrumbs}
      title={info.title}
      lead={info.subtitle}
      image={info.image ? { src: info.image, alt: info.alt || `${info.title} – Platzhirsch Home Living`, ...(info.quality ? { quality: info.quality } : {}) } : undefined}
    />
  );
}
