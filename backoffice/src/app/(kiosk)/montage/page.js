import { kioskZugang } from "../kiosk";
import { MontageStart } from "@/components/Backoffice/Projekte/MontageKiosk";
import { heuteIso, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { kioskStopps } from "@/lib/backoffice/projekte/kiosk";

export const metadata = { title: "Montage" };
export const dynamic = "force-dynamic";

/** Arbeitsplatz Montage mobil (10-konzept-projekte.md § 8.1): Heute · Woche. „Tour“ folgt, sobald Logistik Touren liefert. */
export default async function MontagePage({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet, benutzer } = await kioskZugang("montage");
  const client = projekteClient(session);
  const heute = heuteIso();
  const ansicht = sp.ansicht === "woche" ? "woche" : "heute";
  const bis = new Date(`${heute}T12:00:00`);
  bis.setDate(bis.getDate() + 7);
  const stopps = await kioskStopps(client, session, { von: heute, bis: bis.toISOString().slice(0, 10) });
  return <MontageStart geraet={geraet} benutzer={benutzer} stopps={stopps} heute={heute} ansicht={ansicht} />;
}
