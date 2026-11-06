// /checkin/[event] – Event-Check-in am Eingang (10-konzept-marketing § 7.1, Kiosk). Start: Primäraktion der Event-Akte
// am Eventtag und Kachel „Event-Check-in“ (Arbeitsplatz-Eintrag ist Fundament/Zentrale). Zugang: Marketing- bzw.
// CRM-Recht am Event; keine Seitenleiste, Ziele ≥ 48 px, Schrift ≥ 18 px, Kiosk-Sperre am Eventtag aus.
import { notFound } from "next/navigation";
import { getGeraet, requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Checkin from "@/components/Backoffice/Marketing/Checkin";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { mockNachzug } from "@/lib/backoffice/marketing/daten";
import { faehigkeit } from "@/lib/backoffice/faehigkeiten";
import { MARKETING, S } from "@/lib/backoffice/marketing/faehigkeiten";
import { mockUeberschreibung } from "@/components/Backoffice/Faehigkeit";
import { eventHeute } from "@/lib/backoffice/marketing/regeln";
import { CHECKIN } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event-Check-in · Marketing" };

export default async function CheckinSeite({ params }) {
  const { event: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/checkin/${roh}`);
  const client = backoffice(session);
  mockNachzug(client);
  await requireDocRecht(await ladeMeta(client, "PH Event"), "write", `/checkin/${roh}`);
  const ev = await client.getDoc("PH Event", name).catch(() => null);
  if (!ev) notFound();
  const [geraet, code] = await Promise.all([getGeraet(), faehigkeit(session, S.checkin, { katalog: MARKETING, client, ueberschreibung: await mockUeberschreibung() })]);
  const heute = eventHeute(ev);
  if (!heute || !["Offen", "Ausgebucht"].includes(ev.status)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-(--color-bo-bg) p-6">
        <Leer titel={ev.titel} text={CHECKIN.nichtHeute} aktion={<Knopf href={`/marketing/events/${encodeURIComponent(ev.name)}`}>Zum Event</Knopf>} />
      </main>
    );
  }
  return <Checkin ev={{ name: ev.name, titel: ev.titel, uhrzeit_von: ev.uhrzeit_von, anmeldungen: ev.anmeldungen }} geraet={geraet ? { name: geraet.name, standort: geraet.standort } : null} benutzer={{ name: session.name }} codeFaehig={code.an} heute={heute} />;
}
