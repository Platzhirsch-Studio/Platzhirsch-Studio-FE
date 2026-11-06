import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import VorschlaegeListe from "@/components/Backoffice/Sortiment/VorschlaegeListe";
import { sortimentKontext, vorschlaegeListe } from "@/lib/backoffice/sortiment/daten";
import { VORSCHLAEGE } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bestellvorschläge · Sortiment" };

/**
 * Bestellvorschläge aus dem Meldebestand (Inhaber-Entscheidung: Herstellerbestellung inkl. Meldebestand/
 * Bestellvorschläge). Daten und Rechte gehören ph_logistik; fehlt das Leserecht für Sortiment, zeigt die Seite das
 * ehrlich (Backend-Anfrage im Übergabeprotokoll) statt einer leeren Liste.
 */
export default async function VorschlaegePage() {
  const { session, client, leitung, ek, darf } = await sortimentKontext({ pfad: "/sortiment/bestellvorschlaege", doctype: "PH Herstellerbestellung" });
  const lesbar = await darf("PH Bestellvorschlag", "read");
  const liste = lesbar ? await vorschlaegeListe(client).catch(() => []) : [];
  return (
    <Shell session={session}>
      <Seitenkopf titel={VORSCHLAEGE.titel} untertitel={VORSCHLAEGE.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: VORSCHLAEGE.titel }]} kennzahlen={lesbar ? [{ wert: liste.length, text: "unter Meldebestand" }] : []} aktionen={<Knopf href="/sortiment/bestellungen/neu" icon="Plus">Bestellung von Hand</Knopf>} />
      {!lesbar ? (
        <Leer
          titel="Bestellvorschläge sind für Sortiment noch nicht lesbar"
          text="Die Vorschläge berechnet die Logistik aus dem Meldebestand. Das Leserecht für Team und Leitung Sortiment fehlt im Backend noch."
          icon="Lock"
          aktion={<Knopf href="/sortiment/bestellungen/neu">Bestellung von Hand anlegen</Knopf>}
        />
      ) : liste.length === 0 ? (
        <Leer art="erledigt" titel={VORSCHLAEGE.leer} text={VORSCHLAEGE.leerText} />
      ) : (
        <VorschlaegeListe vorschlaege={liste} leitung={leitung} ek={ek} />
      )}
    </Shell>
  );
}
