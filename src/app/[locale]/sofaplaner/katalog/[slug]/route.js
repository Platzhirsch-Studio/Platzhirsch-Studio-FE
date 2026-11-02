import { NextResponse } from "next/server";
import { clientFamily, ensureCatalog } from "@/lib/sofaplaner/catalog.server";

// GET /de/sofaplaner/katalog/<slug> → one normalised family (neutral planning
// types, or Minotti only with MINOTTI_DATA_CONSENT – src/lib/sofaplaner/consent.js)
// (elements with manufacturer measures, options, start shapes). Read-only,
// no personal data. Labs: German only, never indexed.
export async function GET(request, { params }) {
  const { locale, slug } = await params;
  if (locale !== "de" || !/^[a-z0-9-]{2,64}$/.test(slug)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await ensureCatalog();
  const family = clientFamily(slug);
  if (!family) return NextResponse.json({ error: "Modell nicht gefunden." }, { status: 404 });
  return NextResponse.json(family, {
    headers: { "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex, nofollow" },
  });
}
