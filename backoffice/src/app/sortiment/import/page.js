import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Faehigkeit from "@/components/Backoffice/Faehigkeit";
import { sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { SORTIMENT } from "@/lib/backoffice/sortiment/faehigkeiten";
import { IMPORT } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Katalog-Import · Sortiment" };

/**
 * Katalog-Import (§ 3.12, T6, Leitung/Admin): Datei wählen, zuerst Probelauf, dann Import. Der Import läuft am Server
 * (ph_sortiment.importer.katalog.importieren_aus_anhang); ohne Server-Verbindung (Testmodus) bleibt der Knopf
 * über die Fähigkeit gesperrt – nie ein Knopf, der mit Fehler endet.
 */
export default async function ImportPage() {
  const { session, client, leitung } = await sortimentKontext({ pfad: "/sortiment/import", doctype: "PH Produkt" });
  return (
    <Shell session={session}>
      <Seitenkopf titel={IMPORT.titel} untertitel={IMPORT.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: IMPORT.titel }]} />
      {!leitung ? (
        <Leer art="recht" titel={IMPORT.nurLeitung} icon="Lock" />
      ) : (
        <Kachel titel={IMPORT.datei} unter="CSV oder JSON im Format der Katalogvorlage (import_vorlagen in ph_sortiment).">
          <div className="flex flex-col gap-4">
            <input type="file" accept=".csv,.json" aria-label={IMPORT.datei} className="bo-sor-eingabe pt-2.5 text-[13px]" />
            <div className="flex flex-wrap gap-2">
              <Faehigkeit session={session} id="sortiment.katalogimport" katalog={SORTIMENT} client={client}>
                {({ deaktiviert, grund }) => (
                  <span className="flex flex-col gap-1">
                    <span className="flex gap-2">
                      <Knopf variant="secondary" disabled={deaktiviert || client.modus === "mock"} grund={client.modus === "mock" ? "Im Testmodus ohne Server – Import läuft nur gegen Frappe" : undefined}>
                        {IMPORT.probelauf}
                      </Knopf>
                      <Knopf variant="primary" disabled grund="Erst nach fehlerfreiem Probelauf">
                        {IMPORT.importieren}
                      </Knopf>
                    </span>
                    {grund}
                  </span>
                )}
              </Faehigkeit>
            </div>
            <p className="bo-sor-klein">Importieren wird erst nach einem fehlerfreien Probelauf derselben Datei frei.</p>
          </div>
        </Kachel>
      )}
    </Shell>
  );
}
