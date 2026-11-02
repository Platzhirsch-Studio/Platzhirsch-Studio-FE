// src/lib/forms/requestHeaders.js
// Headers of the ORIGINAL incoming request, read from the Next.js request
// scope (next/headers). /api/upload/inquiry/[kind] calls the POST handlers of
// the inquiry routes with a new Request that carries no X-Forwarded-For; the
// request scope still belongs to the visitor's request, so headers() returns
// its X-Forwarded-For / Referer / Accept-Language (QA R1 P1-1: rate limit per
// IP instead of one shared bucket for every visitor).
// Outside a request scope (node --test) it returns null.
import { headers } from "next/headers";

export async function originalRequestHeaders() {
  try {
    return await headers();
  } catch {
    return null;
  }
}
