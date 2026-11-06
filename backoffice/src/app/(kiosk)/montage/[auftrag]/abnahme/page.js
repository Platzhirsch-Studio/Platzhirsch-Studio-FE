import { notFound, redirect } from "next/navigation";
import { kioskZugang } from "../../../kiosk";
import KioskShell from "@/components/Backoffice/Kiosk/KioskShell";
import AbnahmeMitKunde from "@/components/Backoffice/Projekte/AbnahmeMitKunde";
import { heuteIso, kontaktKurz, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const metadata = { title: "Abnahme mit Kunde" };
export const dynamic = "force-dynamic";

/** Abnahme mit Kunde im Kiosk (§ 6.5) – gleicher Ablauf wie am iPad im Backoffice. */
export default async function KioskAbnahme({ params }) {
  const { auftrag } = await params;
  const { session, geraet, benutzer } = await kioskZugang("montage");
  const client = projekteClient(session);
  let m;
  try {
    m = await client.getDoc("PH Montageauftrag", decodeURIComponent(auftrag));
  } catch {
    notFound();
  }
  if (m.status !== "Erledigt") redirect(`/montage/${auftrag}`);
  const p = await client.getDoc("PH Projekt", m.projekt).catch(() => ({ titel: m.titel, positionen: [] }));
  const [kontakt, leute] = await Promise.all([kontaktKurz(client, m.projekt, p.kontakt), personen(client, [session.user])]);
  return (
    <KioskShell titel={TEXTE.kiosk.titel} geraet={geraet} benutzer={benutzer} kontext={TEXTE.kiosk.abnahme} zurueckHref={`/montage/${auftrag}`}>
      <div className="bo-prj-kiosk">
        <div className="bo-kachel">
          <AbnahmeMitKunde kiosk montage={{ name: m.name, titel: m.titel }} leistungen={m.leistungen || []} positionen={(p.positionen || []).filter((x) => x.lieferstatus !== "storniert" && (!x.montage_art || x.montage_art === "Eigenmontage")).map((x) => ({ bezeichnung: x.bezeichnung }))} kunde={p.kunde_name} email={kontakt?.email || ""} studioName={leute[session.user]?.name || session.name} datum={datumKurz(heuteIso(), { jahr: true })} />
        </div>
      </div>
    </KioskShell>
  );
}
