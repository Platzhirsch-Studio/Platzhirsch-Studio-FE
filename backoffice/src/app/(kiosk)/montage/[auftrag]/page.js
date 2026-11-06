import { notFound } from "next/navigation";
import { kioskZugang } from "../../kiosk";
import { MontageStopp } from "@/components/Backoffice/Projekte/MontageKiosk";
import { personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { stoppAus } from "@/lib/backoffice/projekte/kiosk";

export const metadata = { title: "Montage · Stopp" };
export const dynamic = "force-dynamic";

/** Stopp-Seite im Montage-Kiosk (§ 8.1). Zustandsknopf nur, wenn der Workflow die Aktion für die Rolle erlaubt. */
export default async function MontageStoppSeite({ params }) {
  const { auftrag } = await params;
  const { session, geraet, benutzer } = await kioskZugang("montage");
  const client = projekteClient(session);
  let m;
  try {
    m = await client.getDoc("PH Montageauftrag", decodeURIComponent(auftrag));
  } catch {
    notFound();
  }
  const [p, transitions, rechnungen] = await Promise.all([
    client.getDoc("PH Projekt", m.projekt).catch(() => null),
    client.getTransitions("PH Montageauftrag", m.name).catch(() => []),
    client.getList("PH Rechnung", { fields: ["name", "status"], filters: [["projekt", "=", m.projekt], ["status", "not in", ["Bezahlt", "Storniert", "Entwurf"]]], limit: 1 }).catch(() => []),
  ]);
  const leute = await personen(client, (m.team || []).map((t) => t.user));
  const darfStatus = transitions.some((t) => ["Losfahren", "Beginnen", "Erledigt melden"].includes(t.action)) || m.status === "Erledigt";
  return <MontageStopp geraet={geraet} benutzer={benutzer} s={stoppAus(m, p, leute)} darfStatus={darfStatus} rechnung={rechnungen[0] || null} />;
}
