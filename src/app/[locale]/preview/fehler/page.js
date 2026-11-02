import { notFound } from "next/navigation";

// QA route for the error boundary src/app/[locale]/error.js (R1-plattform).
// Throws on purpose while rendering, so the real error page shows inside the
// locale layout (Navbar/Footer stay). Only in development, or in a production
// build when ERROR_PREVIEW=1 is set; otherwise a normal 404. Never indexed.
//   /de/preview/fehler   /en/preview/fehler   /fr/preview/fehler   /it/preview/fehler
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fehlerseiten-Test",
  robots: { index: false, follow: false },
};

const enabled = () => process.env.NODE_ENV !== "production" || process.env.ERROR_PREVIEW === "1";

export default async function FehlerPreviewPage() {
  if (!enabled()) notFound();
  throw new Error("R1 QA: absichtlicher Fehler zum Test von [locale]/error.js");
}
