import { GeparktKiosk } from "@/components/Backoffice/Kassa/NebenKiosk";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kassaClient } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { getGeraet } from "@/lib/backoffice/auth/dal";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Geparkte Bons · Kassa" };
export const dynamic = "force-dynamic";

// Geparkte Bons dieses Geräts (Team B-KAS, Konzept §3.13). Die Bons liegen lokal (IndexedDB), nie am Server.
export default async function GeparktSeite() {
  const { session, geraet } = await kioskZugang("kassa");
  const g = await getGeraet().catch(() => null);
  const kontext = await rufe(kassaClient(session), "kontext", { kasse: g?.kasse || undefined }).catch(() => null);
  if (!kontext?.kasse) return <KassaFehler session={session} geraet={geraet} code="ohne-kasse" />;
  return <GeparktKiosk kontext={kontext} benutzer={{ name: session.name, email: session.user }} />;
}
