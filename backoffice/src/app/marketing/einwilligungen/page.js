// Alte Route: dauerhaft (308) auf die Empfänger-Liste, Ansicht Einwilligungen.
import { permanentRedirect } from "next/navigation";

export default async function EinwilligungenAlt({ searchParams }) {
  const sp = await searchParams;
  const q = new URLSearchParams({ ansicht: "einwilligungen", ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)])) });
  permanentRedirect(`/marketing/empfaenger?${q}`);
}
