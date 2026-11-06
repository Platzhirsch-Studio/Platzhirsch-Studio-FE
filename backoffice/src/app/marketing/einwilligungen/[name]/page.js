// Alte Route: dauerhaft (308) auf die Personen-Akte der Einwilligung (Reiter Einwilligungen).
import { notFound, permanentRedirect } from "next/navigation";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";

export const dynamic = "force-dynamic";

export default async function EinwilligungAlt({ params }) {
  const { name } = await params;
  const session = await requireSession(`/marketing/einwilligungen/${name}`);
  const w = await backoffice(session).getDoc("PH Einwilligung", decodeURIComponent(name)).catch(() => null);
  if (!w) notFound();
  permanentRedirect(`/marketing/empfaenger/${encodeURIComponent(w.email)}?tab=einwilligungen`);
}
