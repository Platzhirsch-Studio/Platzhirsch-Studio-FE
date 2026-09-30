// app/revalidate/produkte/route.js
// Called by the backend (POST) when "Produkte New" data changes. Flushes every
// cache tag the product-side fetchers in src/lib/api use: products + category
// listings (fetchAllProdukte), collections incl. their descriptions
// (fetchCollections), categories/sub-categories and the filter lookups
// (fetchKategorien, fetchSubKategorien, fetchFarben, fetchMaterialien).
// Pages and sitemaps built from them refresh on their next request. Keep this
// list in sync when a product fetcher gets a new tag.
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const PRODUCT_TAGS = ["products", "collections", "kategorien", "sub-kategorien", "farben", "materialien"];

export async function POST() {
  try {
    // { expire: 0 }: the next request fetches fresh data instead of being
    // served the stale copy first — edits show up on the first reload.
    // (Same behaviour as the old one-argument revalidateTag(tag), which is
    // deprecated in this Next version.)
    for (const tag of PRODUCT_TAGS) revalidateTag(tag, { expire: 0 });

    return NextResponse.json({
      revalidated: true,
      tags: PRODUCT_TAGS,
      now: Date.now(),
      message: "Produkte pages revalidated successfully using tags",
    });
  } catch (err) {
    console.error("❌ Revalidation failed:", err);
    return NextResponse.json(
      { revalidated: false, message: String(err) },
      { status: 500 }
    );
  }
}
