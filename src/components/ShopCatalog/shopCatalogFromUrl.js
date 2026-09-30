"use client";
import { useSearchParams } from "next/navigation";
import ShopCatalog from "./shopCatalog";
import { generateSlug } from "@/lib/slugify";

// Same catalog, but starts filtered to the brand in ?marke=<brand-slug> (the
// brand page's category tiles link here that way). Reads the URL, so it must
// sit inside a <Suspense> — whose fallback should be a plain <ShopCatalog>, so
// the full list is still prerendered. Lives in its own file (default export)
// because server pages importing it as a named export from shopCatalog.js
// resolved to undefined in the browser under Turbopack.
export default function ShopCatalogFromUrl(props) {
  const marke = useSearchParams().get("marke");
  const initialBrands = marke
    ? [...new Set(props.products.map((p) => p.brand))].filter((b) => b && generateSlug(b) === marke)
    : [];
  return <ShopCatalog key={marke || "all"} {...props} initialBrands={initialBrands} />;
}
