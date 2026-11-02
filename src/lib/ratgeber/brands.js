// Brand pages the Ratgeber may link to (relatedBrands in the front matter).
// Only slugs whose page /de/ueber-uns/marken/<slug> answered HTTP 200 are
// listed here – checked with curl against localhost:3000 on 26.10.2026.
// A slug missing here is shown without a link (never as a dead link).
// Plain brand names only: no dealer or partner wording.
export const VERIFIED_BRAND_PAGES = {
  gloster: "Gloster",
  minotti: "Minotti",
  next125: "next125",
  "paola-lenti": "Paola Lenti",
  poliform: "Poliform",
  rimadesio: "Rimadesio",
  schueller: "Schüller",
  solpuri: "Solpuri",
  trapa: "Trapa",
  treca: "Treca",
  tuuci: "Tuuci",
  umbrosa: "Umbrosa",
};

// relatedBrands slugs → [{ slug, name, href }] (href null when unverified).
export function relatedBrandLinks(slugs = []) {
  return slugs.map((slug) => {
    const name = VERIFIED_BRAND_PAGES[slug];
    return name
      ? { slug, name, href: `/ueber-uns/marken/${slug}` }
      : { slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), href: null };
  });
}
