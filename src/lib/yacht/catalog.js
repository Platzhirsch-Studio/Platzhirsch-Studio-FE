import "server-only";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { generateSlug } from "@/lib/slugify";

// Yacht concepts – live check of the products in concepts.json against the
// backoffice (read-only, same fetcher as the Stil-Finder: doctype "Produkte
// New", get_produkte_by_marke_api, Next data cache 1 h, tag "products").
// - A product that is no longer active, has no image or no path is dropped
//   silently (feature doc §3.4).
// - Image and link come from the live record, so the cards follow the
//   catalogue. Manufacturer images are shown unchanged (object-contain, no
//   overlay; Minotti condition).
// - If a brand cannot be fetched at all (empty answer = backoffice down),
//   the snapshot from concepts.json is kept, so the page never loses its
//   examples because of a timeout.

async function brandIndex(brand) {
  try {
    const list = await fetchProdukteNewByMarke(brand);
    if (!Array.isArray(list) || list.length === 0) return null;
    return new Map(list.map((p) => [p.name, p]));
  } catch {
    return null;
  }
}

function liveFields(p) {
  const first = p?.bild_anhangen?.[0]?.bild_anhangen;
  if (!p || p.status !== "Aktiv" || !p.path_field || !p.kategories || !first) return null;
  const cat = generateSlug(String(p.kategories).toLowerCase());
  return { href: `/de/produkte/${cat}/${p.path_field}`, bild: `/cmx${first}` };
}

/**
 * concepts.json with every product checked against the live catalogue.
 * @param {object} data concepts.json
 * @returns {Promise<object>} same shape, products filtered/updated
 */
export async function withLiveCatalog(data) {
  const brands = [...new Set(data.konzepte.flatMap((k) => k.produkte.map((p) => p.marke)))];
  const indexes = new Map(await Promise.all(brands.map(async (b) => [b, await brandIndex(b)])));
  return {
    ...data,
    konzepte: data.konzepte.map((k) => ({
      ...k,
      produkte: k.produkte.flatMap((p) => {
        const index = indexes.get(p.marke);
        if (!index) return [p]; // brand not reachable → keep the snapshot
        const live = liveFields(index.get(p.id));
        // bildtyp (freisteller/stimmung) was measured for the snapshot image only
        return live ? [{ ...p, ...live, bildtyp: live.bild === p.bild ? p.bildtyp : undefined }] : [];
      }),
    })),
  };
}
