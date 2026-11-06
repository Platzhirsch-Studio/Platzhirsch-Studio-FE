// /shop/abholung – Abholung im Kiosk-Stil (10-konzept-shop § 9.2): dieselben Bausteine, die die Logistik in den
// Packtisch einbindet (components/Backoffice/Shop/Abholung.js). Eigenständig nutzbar am iPad im Showroom.
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle } from "@/lib/backoffice/shop/daten";
import { offen } from "@/lib/backoffice/shop/geld";
import KioskShell from "@/components/Backoffice/Kiosk/KioskShell";
import { AbholungArbeitsplatz } from "@/components/Backoffice/Shop/Abholung";

export const metadata = { title: "Abholung · Shop" };
export const dynamic = "force-dynamic";

export default async function Abholung() {
  const ctx = await zugang("/shop/abholung");
  const { client, session } = ctx;
  const { zeilen } = await alle(client, "PH Bestellung", { filters: [["status", "=", "abholbereit"]] });
  const heute = zeilen.sort((a, b) => String(a.abholung_bis || "9").localeCompare(String(b.abholung_bis || "9"))).map((b) => ({ name: b.name, kunde_name: b.kunde_name, abholung_bis: b.abholung_bis, offen_cent: offen(b), positionen: [] }));
  return (
    <KioskShell titel="Abholung" benutzer={{ name: session.name, user: session.user }} zurueckHref="/shop">
      <div className="mx-auto w-full max-w-[1180px] p-4" data-dichte="kiosk">
        <AbholungArbeitsplatz heute={heute} />
      </div>
    </KioskShell>
  );
}
