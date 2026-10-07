// src/app/revalidate/karriere/route.js
// Webhook called by the backoffice (POST) when Karriere (career/job pages) change.
// Requires the X-Revalidate-Secret header — see src/lib/revalidateAuth.js.
// Keep the tag list in sync with the fetchers in src/lib/api.
import { handleRevalidate } from "@/lib/revalidateAuth";

const TAGS = ["career"];

export async function POST(request) {
  return handleRevalidate(request, TAGS, "karriere");
}
