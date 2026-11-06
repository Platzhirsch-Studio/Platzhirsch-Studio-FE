import AbschlussKiosk from "@/components/Backoffice/Kassa/AbschlussKiosk";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kassaClient } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { betrieb } from "@/lib/backoffice/config";
import { getGeraet } from "@/lib/backoffice/auth/dal";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Tagesabschluss · Kassa" };
export const dynamic = "force-dynamic";

async function laden(client, kasse, datum) {
  try {
    const kontext = await rufe(client, "kontext", { kasse });
    if (!kontext?.kasse) return { fehler: { code: "ohne-kasse" } };
    const abschluss = await rufe(client, "abschluss_laden", { kasse: kontext.kasse, datum: datum || undefined });
    return { kontext, abschluss };
  } catch (err) {
    return { fehler: { code: err?.code || "unavailable", message: err?.message } };
  }
}

// Tagesabschluss-Assistent (Team B-KAS, Konzept §3.8, F9). ?datum=JJJJ-MM-TT holt einen Vortag nach (nur Leitung).
export default async function AbschlussSeite({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet } = await kioskZugang("kassa");
  const client = kassaClient(session);
  const g = await getGeraet().catch(() => null);
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(sp?.datum || "") ? sp.datum : null;
  const d = await laden(client, g?.kasse || undefined, datum);
  if (d.fehler) return <KassaFehler session={session} geraet={geraet} code={d.fehler.code} message={d.fehler.message} />;
  const faehig = await kassaFaehigkeiten(session, { client });
  return <AbschlussKiosk kontext={d.kontext} abschluss={d.abschluss} leitung={!!d.kontext.leitung} faehig={faehig} blind={betrieb("blindzaehlung")} datum={datum} benutzer={{ name: session.name }} />;
}
