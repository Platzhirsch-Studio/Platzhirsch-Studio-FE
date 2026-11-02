// /de/ezarri/mosaik → /de/ezarri/mosaike (Kurzform, Filter bleiben erhalten).
// Die Übersicht heißt laut Konzept §2 „/mosaike“; diese Seite fängt die
// Einzahl ab (Tippfehler, alter Auftragstext) statt eines 404.
import { permanentRedirect } from "next/navigation";
import { withEzarriRobots } from "@/lib/ezarri/config";

export const metadata = withEzarriRobots({}, { utility: true });

export default async function MosaikRedirect({ params, searchParams }) {
  const { locale } = await params;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries((await searchParams) || {})) sp.set(k, Array.isArray(v) ? v.join(",") : v);
  const qs = sp.toString().replace(/%2C/g, ",");
  permanentRedirect(`/${locale}/ezarri/mosaike${qs ? `?${qs}` : ""}`);
}
