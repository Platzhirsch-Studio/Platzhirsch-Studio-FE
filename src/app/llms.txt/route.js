// src/app/llms.txt/route.js
// Serves /llms.txt — a concise, spec-compliant (llmstxt.org) Markdown index that helps
// AI answer engines (ChatGPT/Perplexity/Claude-Web, allowed in robots.js) understand and
// navigate the site. Generated from the live CMS brand list (like the sitemap) so the
// index never goes stale; a backend outage degrades to the static sections.
//
// The body is built by the pure module src/lib/seo/llms.js (unit-tested in
// tests/unit/llms.test.mjs): only index,follow pages, LANDING_PAGES only when they
// pass the doorway audit, Ratgeber only from getIndexableRatgeber() (today []).
// Ezarri: only the hub (noindex mosaics never appear, src/lib/ezarri/indexierung.js).
// Brand × category: only indexable combinations (>= 4 models, src/lib/marken/brandCategory.js).

import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { LANDING_PAGES } from "@/lib/content/landingPages";
import { MULTILINGUAL_PAGES, visibleExtraPages } from "@/lib/seo/sitemap/extraPages";
import { conciergeLive } from "@/lib/concierge/config";
import { APPOINTMENT_OFFERED } from "@/lib/agent/tools";
import { getIndexableRatgeber } from "@/lib/ratgeber";
import { buildLlmsTxt, LLMS_FEATURED_BRANDS } from "@/lib/seo/llms";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { buildBrandCategories } from "@/lib/marken/brandCategory";
import { withoutNonProducts } from "@/lib/marken/brandCategoryAudit";
import { generateSlug } from "@/lib/slugify";
import { ezarriInSitemap } from "@/lib/ezarri/config";
import { showroomSitemapPaths } from "@/lib/showroom/config";

// Pages with their own publication rule (integration 28.10.2026): listed only
// while they are indexable – Ezarri with EZARRI_PUBLIC, the showroom tour with
// a real, released recording.
function ruledPages() {
  const out = [];
  if (ezarriInSitemap()) {
    out.push({
      path: "/ezarri",
      label: "Ezarri Glasmosaik",
      llms: "Glasmosaik von Ezarri für Pool, Bad und Wellness: Sortiment, Mosaik-Übersicht, Konfigurator und Mengenrechner; Beratung und Muster in Lochau.",
      // Welle 2 (Nr. 13): the Ezarri world also in English (EZARRI_LOCALES).
      locales: ["de", "en"],
      en: { label: "Ezarri glass mosaic", llms: "Ezarri glass mosaic for pool, bath and wellness: range, mosaic overview, configurator and quantity calculator; advice and samples in Lochau." },
    });
  }
  for (const p of showroomSitemapPaths()) {
    // Runde 4 P5 (seo P1-4): kein 3D-Versprechen – die Seite zeigt, was es gibt.
    out.push({ path: p, label: "Showroom-Rundgang", llms: "Rundgang durch die Ausstellung in Lochau mit Stationen und ausgestellten Stücken." });
  }
  return out;
}

// Indexable brand × category pages of the featured brands (same rule as the
// sitemap); [] on any backend error.
async function loadBrandCategories(brands) {
  try {
    const featured = brands.filter((b) => LLMS_FEATURED_BRANDS.includes(generateSlug(b.name1)));
    const [kategorien, ...perBrand] = await Promise.all([
      fetchKategorien().catch(() => []),
      ...featured.map(async (b) => {
        const [rows, collections] = await Promise.all([
          fetchProdukteNewByMarke(b.name1).catch(() => []),
          fetchCollectionsByMarke(b.name1).catch(() => []),
        ]);
        return buildBrandCategories(withoutNonProducts(rows), { [b.name1]: collections });
      }),
    ]);
    const labels = Object.fromEntries((kategorien || []).map((k) => [k.category_key || k.name, k.name_de || k.category_key]));
    return { summaries: perBrand.flat(), labels };
  } catch (error) {
    console.error("llms.txt brand × category fetch failed:", error);
    return { summaries: [], labels: {} };
  }
}

export async function GET() {
  let brands = [];
  try {
    const marken = await fetchRawMarkenData();
    brands = (marken || []).filter((m) => m?.status === "Aktiv");
  } catch (error) {
    // A backend outage must not break /llms.txt — the brand section is left out,
    // which is still a valid llms.txt (H1, summary and Markdown links present).
    console.error("llms.txt brand fetch failed:", error);
  }

  let ratgeber = [];
  try {
    ratgeber = getIndexableRatgeber();
  } catch (error) {
    console.error("llms.txt ratgeber read failed:", error);
  }

  const { summaries, labels } = await loadBrandCategories(brands);
  const body = buildLlmsTxt({
    brands,
    brandCategories: summaries,
    categoryLabels: labels,
    landingPages: LANDING_PAGES,
    // Same rules as the sitemap; the /ki-assistenten line follows the
    // appointment switch like the MCP instructions (Runde 2, recht P1-3).
    // Runde 4 P5: the concierge line only while it really answers with a key
    // (conciergeLive(): ANTHROPIC_API_KEY set, no forced mock, no kill switch).
    // Welle 2: Hotel & Objekt and Architekten (DE/EN, MULTILINGUAL_PAGES).
    extraPages: [...visibleExtraPages({ conciergeAvailable: conciergeLive(), appointmentOffered: APPOINTMENT_OFFERED }), ...MULTILINGUAL_PAGES, ...ruledPages()],
    ratgeber,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const revalidate = 3600;
