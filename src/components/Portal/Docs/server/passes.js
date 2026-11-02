import "server-only";

// Product passes of the signed-in customer, built ONLY from the portal adapter
// interface (portal = getPortal() / requireApiSession().portal).
//
// The interface has no listProductPasses(); passes are discovered through
// Project.items[].productPassId and loaded with getProductPass(). Optional
// fields below (model, dimensions, purchasedAt, photo, gtin, manufacturer,
// countryOfOrigin, recycling) are NOT part of the ProductPass type yet – they
// are read when an adapter delivers them and otherwise shown as "folgt".

/**
 * @returns {Promise<Array<{pass:object, item:object, project:{id:string,title:string,room:string}, purchasedAt:string|null}>>}
 */
export async function listPasses(portal) {
  const [projects, orders] = await Promise.all([portal.listProjects(), portal.listDocuments({ type: "auftragsbestaetigung" })]);
  const refs = projects.flatMap((project) =>
    (project.items || []).filter((i) => i.productPassId).map((item) => ({ project, item }))
  );
  const passes = await Promise.all(refs.map((r) => portal.getProductPass(r.item.productPassId)));
  return refs
    .map((r, i) => ({
      pass: passes[i],
      item: r.item,
      project: { id: r.project.id, title: r.project.title, room: r.project.room },
      purchasedAt: passes[i]?.purchasedAt || firstOrderDate(orders, r.project.id),
    }))
    .filter((e) => e.pass);
}

export async function getPassEntry(portal, passId) {
  const all = await listPasses(portal);
  return all.find((e) => e.pass.id === passId) || null;
}

function firstOrderDate(orders, projectId) {
  const dates = orders.filter((d) => d.projectId === projectId).map((d) => d.date).sort();
  return dates[0] || null;
}

/** Adds months to an ISO date; null when unknown. */
export function addMonths(iso, months) {
  if (!iso || !months) return null;
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/**
 * Machine-readable export, structured along the information blocks of the
 * EU Digital Product Passport (ESPR, Verordnung (EU) 2024/1781). Product
 * specific requirements for furniture are not yet set by delegated acts, so
 * this is a preparation, not a compliant DPP. schema.org/Product as carrier.
 */
export function toDppJson({ pass, item, project, purchasedAt }, { url }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: pass.product,
    model: pass.model || item.variant || null,
    brand: { "@type": "Brand", name: pass.brand },
    category: item.category,
    serialNumber: pass.serialNumber || null,
    gtin: pass.gtin || null,
    material: pass.materials,
    additionalProperty: [
      pass.dimensions ? { "@type": "PropertyValue", name: "Maße", value: pass.dimensions } : null,
      { "@type": "PropertyValue", name: "Projekt", value: `${project.title} (${project.room})` },
    ].filter(Boolean),
    digitalProductPassport: {
      status: "vorbereitet – keine ESPR-konforme Ausgabe",
      legalBasis: "Verordnung (EU) 2024/1781 (Ökodesign-Verordnung, ESPR); Anforderungen für Möbel per delegiertem Rechtsakt noch offen",
      uniqueProductIdentifier: pass.dppId || null,
      passId: pass.id,
      manufacturer: pass.manufacturer || null,
      countryOfOrigin: pass.countryOfOrigin || null,
      materials: pass.materials,
      careAndRepair: pass.care,
      warranty: pass.warranty,
      endOfLife: pass.recycling || null,
      purchasedAt,
      deliveredAt: pass.deliveredAt,
      dataSource: "Platzhirsch Home Living, Kundenportal",
    },
  };
}
