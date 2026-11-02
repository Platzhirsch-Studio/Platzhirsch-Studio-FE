// src/lib/yacht/model.js
// View model of /de/yacht-interior, built from src/lib/yacht/concepts.json
// (concepts, zones, products, roles) and src/lib/yacht/renders.json (AI
// concept images). Pure functions (data in, data out) so node --test can
// check the rules without Next: no imports, no '@/' alias.
//
// Rules enforced here (Marktresearch/digital/features/yacht-signature-konzept.md §5/§9):
// - On a boat's open zones (deck, flybridge, bathing platform) only products
//   whose maker names marine/yachting use ("aussen-marine-hersteller") are
//   shown. Exception: Flos In Vitro Unplugged (loose battery lamp, "not while
//   under way"). Everything else moves to "Steg & Bootshaus" if it is an
//   outdoor product, or is left out (indoor textiles on deck).
// - Houseboat terraces count as terrace (outdoor catalogue products allowed).
// - Indoor products ("innen-lose") only below deck / in the saloon.
// - Every AI image carries the visible label (renderView → label).
// - Blender renderings (renders.json kiGeneriert: false, art "rendering",
//   02.11.2026) carry the caption "Visualisierung (Rendering)" instead.

export const KI_LABEL = "KI-generierte Konzeptvisualisierung";
/** Caption of the Blender renderings (no AI image, no photo). */
export const RENDER_LABEL = "Visualisierung (Rendering)";
export const CONCEPT_BADGE = "Beispielkonzept – kein Kundenprojekt";

/** Zones that are open to weather on a boat (not on a houseboat terrace). */
export const OPEN_ZONES = ["deck", "flybridge", "badeplattform"];
export const INNER_ZONES = ["salon", "kabine", "bad"];
/** Display order of the zone chips. */
export const ZONE_ORDER = ["deck", "flybridge", "salon", "kabine", "bad", "badeplattform", "bootshaus"];

/** Product ids allowed on open boat zones although only "aussen-katalog". */
export const OPEN_ZONE_EXCEPTIONS = {
  "In Vitro Unplugged": "Lose Akkuleuchte am Liegeplatz – nicht während der Fahrt.",
};

/** Notes on AI images whose result differs from the concept (honest captions).
 * Runabout cockpit and Riviera flybridge were re-rendered on 27.10.2026 (v2,
 * C2PA embedded) and match their concepts – no note needed any more. */
export const RENDER_NOTES = {
  "segelyacht-nordwind-deck": "Das Rigg ist im Bild vereinfacht dargestellt.",
};

/** Short eligibility labels for product cards. */
export const EIGNUNG_SHORT = {
  "aussen-marine-hersteller": "Außen · Hersteller nennt Yachting",
  "aussen-katalog": "Außen · laut Katalog",
  "innen-lose": "Innen · lose Ausstattung",
};

/**
 * Where a product may appear for a model.
 * @returns {{zone: string|null, reason?: string}} zone null = leave out
 */
export function placeProduct(product, modelKey) {
  const zone = product.zone;
  const houseboat = modelKey === "hausboot";
  if (zone === "bootshaus") {
    return product.eignung === "innen-lose" ? { zone: null, reason: "Wohnprodukt nicht im Freien" } : { zone };
  }
  if (OPEN_ZONES.includes(zone) && !houseboat) {
    if (product.eignung === "aussen-marine-hersteller") return { zone };
    if (OPEN_ZONE_EXCEPTIONS[product.id]) return { zone };
    if (product.eignung === "aussen-katalog") return { zone: "bootshaus", reason: "An Bord nicht belegt – nur Steg und Bootshaus" };
    return { zone: null, reason: "Wohnprodukt nicht an Deck" };
  }
  if (OPEN_ZONES.includes(zone) && houseboat) {
    return product.eignung === "innen-lose" ? { zone: null, reason: "Wohnprodukt nicht auf der Terrasse" } : { zone };
  }
  // inner zones
  return { zone };
}

/** Public image view of one render entry. */
export function renderView(r) {
  const [fw, fh] = String(r.format || "3:2").split(":").map(Number);
  return {
    id: r.id,
    zone: r.zone,
    title: r.titel,
    alt: r.alt,
    ratio: fw && fh ? fw / fh : 1.5,
    format: r.format,
    avif: { 1200: r.datei.avif["1200"], 2400: r.datei.avif["2400"] },
    webp: { 1200: r.datei.webp["1200"], 2400: r.datei.webp["2400"] },
    width: r.groesse?.gross?.breite || 2400,
    height: r.groesse?.gross?.hoehe || 1600,
    // AI Act: only true AI images carry the AI label; renderings their caption
    kiGenerated: r.kiGeneriert !== false,
    label: r.kiGeneriert === false ? RENDER_LABEL : KI_LABEL,
    note: RENDER_NOTES[r.id] || null,
    // LQIP: mean colour of the image, shown while it loads (no empty linen boxes)
    tone: r.farbe || null,
    lqip: r.lqip || null,
  };
}

function productView(p, eignung, zone) {
  return {
    id: p.id,
    name: p.name,
    brand: p.marke,
    href: p.href,
    // locale-free path for next-intl links (SmartLink adds /de itself)
    path: String(p.href || "").replace(/^\/de(?=\/)/, ""),
    image: p.bild,
    // tile treatment: cut-outs contain on white, mood photos cover 4:5;
    // Minotti images are never cropped (contain) – manufacturer condition
    imageKind: p.bildtyp || "unbekannt",
    imageFit: p.bildtyp === "stimmung" && p.marke !== "Minotti" ? "cover" : "contain",
    role: p.rolle,
    note: OPEN_ZONE_EXCEPTIONS[p.id] && OPEN_ZONES.includes(zone) ? OPEN_ZONE_EXCEPTIONS[p.id] : p.hinweis || null,
    eignung: p.eignung,
    eignungLabel: EIGNUNG_SHORT[p.eignung] || "",
    eignungRule: eignung?.[p.eignung]?.regel || "",
    zone,
  };
}

/**
 * All concepts as view objects.
 * @param {object} data concepts.json
 * @param {object} renders renders.json
 */
export function buildConcepts(data, renders) {
  const zoneMeta = Object.fromEntries(data.zonen.map((z) => [z.id, z]));
  const byConcept = new Map();
  for (const r of renders?.renders || []) {
    // every entry is shown: AI images (kiGeneriert: true) with the AI label,
    // renderings (kiGeneriert: false) with the caption "Visualisierung (Rendering)"
    if (typeof r.kiGeneriert !== "boolean") continue;
    if (!byConcept.has(r.konzept)) byConcept.set(r.konzept, []);
    byConcept.get(r.konzept).push(renderView(r));
  }
  return data.konzepte.map((k) => {
    const modelKey = k.modell3d;
    const model = data.modelle[modelKey];
    const products = [];
    const excluded = [];
    for (const p of k.produkte) {
      const placed = placeProduct(p, modelKey);
      if (!placed.zone) excluded.push({ id: p.id, reason: placed.reason });
      else products.push(productView(p, data.eignung, placed.zone));
    }
    const zoneIds = new Set(model.zonen);
    for (const p of products) zoneIds.add(p.zone);
    const images = byConcept.get(k.id) || [];
    const zones = ZONE_ORDER.filter((id) => zoneIds.has(id)).map((id) => {
      const meta = zoneMeta[id] || { id, label: id, kurz: id, text: "" };
      return {
        id,
        label: meta.label,
        short: meta.kurz,
        general: meta.text,
        text: k.zonen?.[id] || meta.text,
        onLand: Boolean(meta.anLand),
        products: products.filter((p) => p.zone === id),
        images: images.filter((img) => img.zone === id),
      };
    });
    return {
      id: k.id,
      model: modelKey,
      boatType: k.bootstyp,
      length: k.laenge,
      area: k.revier,
      title: k.titel,
      motto: k.leitsatz,
      mood: k.stimmung,
      // "(Token see)" etc. are notes for designers, not for visitors
      palette: k.farbwelt.map((f) => ({ ...f, rolle: String(f.rolle || "").replace(/\s*\(Token[^)]*\)/g, "").trim() })),
      materials: k.materialien,
      zones,
      products,
      excluded,
      images,
      sattler: k.sattler || [],
      werft: k.werft || [],
      gartenbau: (k.gartenbau || []).map((g) => g.replace(/\s*\([^)]*\)/g, "").trim()),
      inspiration: k.id === "superyacht-lounge",
      badge: CONCEPT_BADGE,
    };
  });
}

/** Unique brands of all concepts (for the brand block), sorted by count. */
export function conceptBrands(concepts) {
  const count = new Map();
  for (const c of concepts) for (const p of c.products) count.set(p.brand, (count.get(p.brand) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([brand, n]) => ({ brand, n }));
}

/** Slim copy of the concepts for the client island (no long texts twice). */
export function islandConcepts(concepts) {
  return concepts.map((c) => ({
    id: c.id,
    model: c.model,
    boatType: c.boatType,
    length: c.length,
    title: c.title,
    motto: c.motto,
    palette: c.palette.map((p) => ({ name: p.name, hex: p.hex })),
    inspiration: c.inspiration,
    sattler: c.sattler,
    werft: c.werft,
    zones: c.zones.map((z) => ({
      id: z.id,
      label: z.label,
      short: z.short,
      text: z.text,
      onLand: z.onLand,
      products: z.products.map(({ id, name, brand, href, image, imageFit, role, note, eignungLabel }) => ({ id, name, brand, href, image, imageFit, role, note, eignungLabel })),
      image: z.images[0] ? { id: z.images[0].id, alt: z.images[0].alt, kiGenerated: z.images[0].kiGenerated, avif: z.images[0].avif[1200], webp: z.images[0].webp[1200], ratio: z.images[0].ratio, lqip: z.images[0].lqip } : null,
    })),
  }));
}
