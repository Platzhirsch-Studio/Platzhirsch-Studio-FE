import { notFound } from "next/navigation";
import { connection } from "next/server";
import { designPreviewEnabled } from "@/components/Preview/gate";
import Shell from "@/components/Preview/buehne/Shell";
import { NOINDEX } from "@/components/Preview/buehne/content";

// Design prototype "Bühne": German only, never indexed.
// F5: the title only when the preview is on – the production 404 must not
// name the prototype.
export function generateMetadata() {
  return designPreviewEnabled() ? { title: "Prototyp Bühne | Platzhirsch", robots: NOINDEX } : { robots: NOINDEX };
}

export default async function BuehneLayout({ children, params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (gate.js), Schalter zur Anfragezeit.
  await connection();
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  return <Shell>{children}</Shell>;
}
