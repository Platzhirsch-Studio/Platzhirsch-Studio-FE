import { Suspense } from "react";
import { notFound } from "next/navigation";
import { portalMetadata } from "@/lib/portal/metadata";
import PortalHeader from "@/components/Portal/Core/PortalHeader";

// Customer portal "Mein Platzhirsch" – German only, never indexed.
// No auth check here on purpose (layouts don't re-run on client navigation):
// every page calls getPortal() from @/lib/portal/dal, which redirects to the
// login when the session is missing. The header reads the session for display.
const PORTAL_METADATA = {
  title: { default: "Mein Platzhirsch", template: "%s | Mein Platzhirsch" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// EN/FR/IT: translated 404 title instead of the German one (R5 QM P2-2, WCAG
// 2.4.2); the pages do the same via portalMetadata, see @/lib/portal/metadata.
export const generateMetadata = portalMetadata(PORTAL_METADATA);

export default async function PortalLayout({ children, params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();

  return (
    <div className="min-h-screen bg-surface pb-28 pt-4 md:pb-20 md:pt-8 lg:pt-12">
      {/* Optik QA: surface token and the site grid (max-w-page + gutter), so the
          portal lines up with the logo and nav above (was max-w-6xl, 96 px in). */}
      <div className="mx-auto w-full max-w-page px-gutter">
        <Suspense fallback={<div className="mb-4 h-11 md:mb-10 md:h-[100px]" aria-hidden="true" />}>
          <PortalHeader />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
