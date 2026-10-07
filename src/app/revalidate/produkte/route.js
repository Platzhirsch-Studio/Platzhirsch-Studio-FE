// src/app/revalidate/produkte/route.js
// Webhook called by the backoffice (POST) when "Produkte New" data (products, collections, categories, filter lookups) change.
// Requires the X-Revalidate-Secret header — see src/lib/revalidateAuth.js.
// Keep the tag list in sync with the fetchers in src/lib/api.
import { handleRevalidate } from "@/lib/revalidateAuth";

const TAGS = ["products", "collections", "kategorien", "sub-kategorien", "farben", "materialien"];

export async function POST(request) {
  return handleRevalidate(request, TAGS, "produkte");
}
