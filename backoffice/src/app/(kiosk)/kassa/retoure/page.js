import { RetoureKiosk } from "@/components/Backoffice/Kassa/NebenKiosk";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kassaClient, leitungFuerFreigabe } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { getGeraet } from "@/lib/backoffice/auth/dal";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Zurücknehmen · Kassa" };
export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,79}$/;

// Rücknahme-Assistent (Team B-KAS, Konzept §3.5, Umschalt+F7) – ?beleg= aus „Belege“ oder Bon-QR-Scan.
export default async function RetoureSeite({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet } = await kioskZugang("kassa");
  const client = kassaClient(session);
  const g = await getGeraet().catch(() => null);
  const kontext = await rufe(client, "kontext", { kasse: g?.kasse || undefined }).catch(() => null);
  if (!kontext?.kasse) return <KassaFehler session={session} geraet={geraet} code="ohne-kasse" />;
  const [faehig, leitung] = await Promise.all([kassaFaehigkeiten(session, { client }), leitungFuerFreigabe(client).catch(() => [])]);
  const beleg = NAME.test(sp?.beleg || "") ? sp.beleg : null;
  const daten = beleg && faehig.retoure?.an ? await rufe(client, "retoure_vorbereiten", { beleg }).catch(() => null) : null;
  return <RetoureKiosk kontext={kontext} benutzer={{ name: session.name }} daten={daten} leitung={leitung} faehig={faehig} />;
}
