// Page context the browser sends with each user turn (architecture §4.1).
// Only structure: route name, slugs from the URL, known filter params, section
// ids (+ short heading label) and the NUMBER of saved pieces. No page text,
// no contents of the selection. The server resolves names (lib/concierge/
// pageContext.js + prepare.js).
import { ROUTES } from "@/utils/routing";
import { FILTER_PARAM_LIST, SLUG_RE } from "@/lib/concierge/actionKinds";

const LANDING = /^(yacht-interior|outdoor-gartenplanung|einkaufen-aus-der-schweiz|kuechen-vorarlberg|interior-design-vorarlberg|moebel-bodensee|wohnzimmer-einrichten-vorarlberg|designermoebel-[a-z-]+|gutscheine|atelierverkauf|adventsabend)$/;

const strip = (p) => String(p || "").replace(/^\//, "");

/** pathname → { route, categoryKey?, productSlug?, brandSlug?, collectionSlug? } */
export function routeOf(pathname, locale) {
  const rest = String(pathname || "").split("/").filter(Boolean).slice(1);
  const joined = rest.join("/");
  if (!rest.length) return { route: "home" };
  const base = (key) => strip(ROUTES[key]?.[locale] || ROUTES[key]?.de);
  const prod = base("produkte");
  if (rest[0] === prod) {
    if (rest.length === 1) return { route: "produkte" };
    if (rest.length === 2) return { route: "kategorie", categoryKey: rest[1] };
    return { route: "produkt", categoryKey: rest[1], productSlug: rest[2] };
  }
  const marken = base("marken");
  if (joined === marken) return { route: "marken" };
  if (joined.startsWith(`${marken}/`)) {
    const [brandSlug, collectionSlug] = joined.slice(marken.length + 1).split("/");
    return collectionSlug ? { route: "kollektion", brandSlug, collectionSlug } : { route: "marke", brandSlug };
  }
  for (const key of ["beratung", "kontakt", "merkliste"]) if (joined === base(key)) return { route: key };
  if (rest[0] === base("news")) return { route: "news" };
  if (rest[0] === "ratgeber") return { route: "ratgeber" };
  if (rest.length === 1 && LANDING.test(rest[0])) return { route: "thema" };
  return { route: "other" };
}

function filtersOf(search) {
  const params = new URLSearchParams(search || "");
  const out = {};
  for (const p of FILTER_PARAM_LIST) {
    const values = (params.get(p) || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => SLUG_RE.test(v))
      .slice(0, 3);
    if (values.length) out[p] = values;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Jump targets: [data-concierge-section] first, else <main> h2[id]. */
export function sectionsOf(doc = document) {
  const out = [];
  const seen = new Set();
  const add = (id, label) => {
    if (!id || seen.has(id) || !SLUG_RE.test(id) || out.length >= 12) return;
    seen.add(id);
    out.push({ id, label: String(label || id).replace(/\s+/g, " ").trim().slice(0, 60) });
  };
  for (const el of doc.querySelectorAll("main [data-concierge-section]")) {
    add(el.getAttribute("data-concierge-section"), el.getAttribute("aria-label") || el.querySelector("h2,h3")?.textContent);
  }
  if (!out.length) for (const h of doc.querySelectorAll("main h2[id]")) add(h.id, h.textContent);
  return out.length ? out : undefined;
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export function collectContext({ pathname, locale, selectionCount = 0, actions }) {
  const r = routeOf(pathname, locale);
  const slug = (v) => (v && SLUG_RE.test(v) ? v : undefined);
  const path = /^\/(de|en|fr|it)(\/[\w\-.~%]*)*$/.test(pathname || "") && pathname.length <= 200 ? pathname : undefined;
  return clean({
    locale,
    route: r.route,
    path,
    categoryKey: slug(r.categoryKey),
    productSlug: slug(r.productSlug),
    brandSlug: slug(r.brandSlug),
    collectionSlug: slug(r.collectionSlug),
    filters: typeof location !== "undefined" ? filtersOf(location.search) : undefined,
    sections: typeof document !== "undefined" ? sectionsOf(document) : undefined,
    selectionCount: Math.max(0, Math.min(999, selectionCount | 0)),
    actions: actions?.length ? actions.slice(-6) : undefined,
  });
}
