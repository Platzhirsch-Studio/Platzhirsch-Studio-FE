import { notFound } from "next/navigation";

// QA route for src/app/global-error.js (R1-plattform). It lives OUTSIDE
// [locale], so no locale layout and no error.js sits between the throw and
// global-error, which then replaces the whole document like after a crash of
// the root/locale layout. The dot in the folder name keeps the next-intl proxy
// (matcher skips paths with a dot) from redirecting it to /de/…
// Only in development, or with ERROR_PREVIEW=1; otherwise 404. Never indexed.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fehlerseiten-Test global",
  robots: { index: false, follow: false },
};

const enabled = () => process.env.NODE_ENV !== "production" || process.env.ERROR_PREVIEW === "1";

export default async function GlobalErrorPreviewPage() {
  if (!enabled()) notFound();
  throw new Error("R1 QA: absichtlicher Fehler zum Test von global-error.js");
}
