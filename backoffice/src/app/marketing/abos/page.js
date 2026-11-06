// Alte Route (10-konzept-marketing § 2.0.1): dauerhaft (308) auf die Empfänger-Liste, Ansicht Personen.
import { permanentRedirect } from "next/navigation";

export default async function AbosAlt({ searchParams }) {
  const sp = await searchParams;
  const q = new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  permanentRedirect(`/marketing/empfaenger${q.size ? `?${q}` : ""}`);
}
