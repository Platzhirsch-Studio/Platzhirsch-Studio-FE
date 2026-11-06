import KassaVerkauf from "@/components/Backoffice/Kassa/KassaVerkauf";
import { KassaFehler } from "@/components/Backoffice/Kassa/KioskSeite";
import { kioskDaten } from "@/lib/backoffice/kassa/daten";
import { IS_PRODUCTION } from "@/lib/backoffice/config";
import { kioskZugang } from "../kiosk";

export const metadata = { title: "Kassa" };
export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,79}$/;

// Arbeitsplatz Kassa (Team B-KAS, Konzept §3.1, Lounge §7.4): Verkauf mit Zahlmaske und Ergebnis.
// Kasse kommt aus dem Gerät (ph_core PH Geraet.kasse), sonst aus den Kassa-Einstellungen (Standard-Kasse).
// ?kunde=&beleg= kommen von „An der Kassa kassieren“ (AnDieKassa) aus anderen Bereichen.
export default async function KassaPage({ searchParams }) {
  const sp = await searchParams;
  const { session, geraet } = await kioskZugang("kassa");
  let daten;
  try {
    daten = await kioskDaten(session, { kasse: NAME.test(sp?.kasse || "") ? sp.kasse : undefined });
  } catch (err) {
    return <KassaFehler session={session} geraet={geraet} code={err?.code || "unavailable"} message={err?.message} />;
  }
  if (!daten.kontext?.kasse) return <KassaFehler session={session} geraet={geraet} code="ohne-kasse" />;
  const start = { kunde: NAME.test(sp?.kunde || "") ? sp.kunde : null, beleg: NAME.test(sp?.beleg || "") ? sp.beleg : null };
  // Mock-Schalter für Abnahme/E2E (nie in Produktion, nie im Frappe-Modus wirksam): ?mock_fehler=netz
  const simuliere = !IS_PRODUCTION && sp?.mock_fehler === "netz" ? "netz" : null;
  return (
    <KassaVerkauf
      kontext={daten.kontext}
      katalog={daten.katalog}
      kategorien={daten.kategorien}
      schnelltasten={daten.schnelltasten}
      leitung={daten.leitung}
      faehig={daten.faehig}
      geraet={geraet}
      benutzer={{ name: session.name, email: session.user }}
      simuliere={simuliere}
      start={start}
    />
  );
}
