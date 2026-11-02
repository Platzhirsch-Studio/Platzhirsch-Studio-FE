import { notFound } from "next/navigation";
import { connection } from "next/server";
import { designPreviewEnabled } from "@/components/Preview/gate";
import Shell from "@/components/Preview/galerie/Shell";

// Design prototype "Galerie" – German only, never indexed.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function GalerieLayout({ children, params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (gate.js), Schalter zur Anfragezeit.
  await connection();
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  return <Shell>{children}</Shell>;
}
