// Slot „Herstellerbestellungen“ für Auftragsmappe (Reiter belege-lieferung) und Kundenakte (projekte-belege):
// Bestellung, Lieferant, Status, bestätigter Termin – Klick öffnet die Bestellakte. Nur explizit verknüpfte
// Bestellungen (Bezug = Akte, Q-A11). Bekommt { daten }, nie die Sitzung.
import Link from "next/link";
import { Status } from "./Bausteine";
import { datum } from "@/lib/backoffice/format";

export default function SlotBestellungen({ daten = [] }) {
  return (
    <ul className="flex flex-col gap-1">
      {daten.map((b) => (
        <li key={b.name}>
          <Link href={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`} className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 hover:bg-bo-fill">
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium">{b.lieferant || b.name}</span>
              <span className="bo-sor-klein block truncate tabular-nums">
                {b.name}
                {b.bestaetigter_termin ? ` · Termin ${datum(b.bestaetigter_termin)}` : ""}
              </span>
            </span>
            <Status gruppe="bestellung" wert={b.status} groesse="sm" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
