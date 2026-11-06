import { redirect } from "next/navigation";
import { fakturaKontext } from "@/lib/backoffice/faktura/daten";

// /faktura/uva/[name] → Monatsansicht der UVA (kanonische Route des DocTypes, § 16.1).
export default async function UvaAuswertung({ params }) {
  const { name } = await params;
  const ctx = await fakturaKontext(`/faktura/uva/${name}`);
  const u = await ctx.client.getDoc("PH UVA Auswertung", decodeURIComponent(name)).catch(() => null);
  redirect(u ? `/faktura/uva?monat=${String(u.zeitraum_von).slice(0, 7)}` : "/faktura/uva");
}
