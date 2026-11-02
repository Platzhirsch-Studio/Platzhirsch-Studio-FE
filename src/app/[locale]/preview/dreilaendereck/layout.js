// Design-Prototyp "Dreiländereck": nur Deutsch, nie indexiert.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { designPreviewEnabled } from "@/components/Preview/gate";
import Shell from "@/components/Preview/dreilaendereck/Shell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DreilaendereckLayout({ children, params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (gate.js), Schalter zur Anfragezeit.
  await connection();
  if (locale !== "de" || !designPreviewEnabled()) notFound();
  return <Shell>{children}</Shell>;
}
