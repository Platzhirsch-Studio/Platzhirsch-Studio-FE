// src/app/revalidate/news/route.js
// Webhook called by the backoffice (POST) when News (news pages + home page news block) change.
// Requires the X-Revalidate-Secret header — see src/lib/revalidateAuth.js.
// Keep the tag list in sync with the fetchers in src/lib/api.
import { handleRevalidate } from "@/lib/revalidateAuth";

const TAGS = ["news"];

export async function POST(request) {
  return handleRevalidate(request, TAGS, "news");
}
