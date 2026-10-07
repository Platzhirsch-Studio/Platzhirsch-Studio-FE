// src/lib/revalidateAuth.js
// Shared guard for the on-demand revalidation webhooks (src/app/revalidate/*).
// Only the backoffice may trigger them: Frappe sends the shared secret in the
// `X-Revalidate-Secret` header (configured on its Webhook records), and it must
// match REVALIDATE_SECRET from the env files. Without the env var every call is
// rejected — the site then simply refreshes on its normal 1-hour timer.
import "server-only";
import { timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export function isAuthorizedRevalidate(request) {
  const expected = process.env.REVALIDATE_SECRET || "";
  const given = request.headers.get("x-revalidate-secret") || "";
  if (!expected || given.length !== expected.length) return false;
  // Constant-time comparison, so the secret can't be guessed via timing.
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

// Handler body shared by every webhook route: check the secret, then flush
// the given cache tags. `{ expire: 0 }` makes the next request fetch fresh
// data instead of first serving the stale copy (the one-argument
// revalidateTag(tag) form is deprecated in this Next version).
export function handleRevalidate(request, tags, label) {
  if (!isAuthorizedRevalidate(request)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
    return NextResponse.json({ revalidated: true, tags, now: Date.now() });
  } catch (err) {
    // Details stay in the server log; the caller only learns it failed.
    console.error(`Revalidation (${label}) failed:`, err);
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
