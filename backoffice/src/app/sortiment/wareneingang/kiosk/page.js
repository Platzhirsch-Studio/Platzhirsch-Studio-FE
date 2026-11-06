import KioskShell from "@/components/Backoffice/Kiosk/KioskShell";
import Fehler from "@/components/Backoffice/Fehler";
import WareneingangAssistent from "@/components/Backoffice/Sortiment/WareneingangAssistent";
import { erwarteteLieferungen, ladeFuerEingang, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { WARENEINGANG } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wareneingang am Packtisch" };

/**
 * Kiosk-Variante von S3 (§ 13 „Packtisch-Kiosk“): große Ziele (Kiosk-Dichte), F2 Suchen · F6 Buchen.
 * Sortiment liefert sie als eigene Route und als Komponente; eingehängt in (kiosk)/packtisch wird sie vom
 * Logistik-Bauauftrag (Kachel „Wareneingang“ → /sortiment/wareneingang/kiosk).
 */
export default async function WareneingangKiosk({ searchParams }) {
  const sp = await searchParams;
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/wareneingang/kiosk", doctype: "PH Wareneingang", aktion: "create" });
  const [erwartet, l] = await Promise.all([erwarteteLieferungen(client, { tage: 14 }).catch(() => []), ladeFuerEingang(client, session, sp.bestellung ? String(sp.bestellung) : "")]);
  return (
    <KioskShell titel={WARENEINGANG.kiosk} benutzer={{ name: session.name }} kontext={WARENEINGANG.kioskUnter} zurueckHref={l.bestellung ? "/sortiment/wareneingang/kiosk" : "/arbeitsplatz"}>
      <div data-dichte="kiosk" className="mx-auto w-full max-w-[1180px] px-4 pb-6">
        {l.grund ? <Fehler code="invalid" message={l.grund} zurueckHref="/sortiment/wareneingang/kiosk" /> : <WareneingangAssistent key={l.bestellung?.name || "suche"} erwartet={erwartet} bestellung={l.bestellung} bilder={l.bilder} kiosk />}
      </div>
    </KioskShell>
  );
}
