"use client";
// Mein Bereich (Konzept § 5.2): Knöpfe „Urlaub beantragen“ / „Krank melden“ mit Sheets; `?sheet=urlaub|krank`
// öffnet direkt (Stempelpille → 3 Klicks). Schließen entfernt den Parameter (Browser-Zurück bleibt sauber).

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useWechsel } from "./hooks";
import Knopf from "../Knopf";
import { UrlaubSheet, KrankSheet } from "./Abwesenheit";
import { T } from "@/lib/backoffice/personal/texte";

/**
 * @param {{heute:string, eigener:string, darfVertretung:boolean, vertretungen:Array, konto:object|null, bestehende:object[],
 *   start?:string, nurKnoepfe?:boolean, primaer?:boolean}} p
 */
export default function MeinBereichAktionen({ heute, eigener, darfVertretung = false, vertretungen = [], konto = null, bestehende = [], start = null, primaer = false, krankAn = true }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const [sheet, setSheet] = useState(start);
  useWechsel(start, setSheet);
  const schliessen = () => {
    setSheet(null);
    if (sp.get("sheet")) {
      const q = new URLSearchParams(sp.toString());
      q.delete("sheet");
      router.replace(`${pfad}${q.toString() ? `?${q}` : ""}`, { scroll: false });
    }
  };
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {krankAn && (
          <Knopf variant="secondary" onClick={() => setSheet("krank")} data-testid="per-krank-oeffnen">
            {T.stempel.krank}
          </Knopf>
        )}
        <Knopf variant={primaer ? "primary" : "secondary"} icon="CalendarPlus" onClick={() => setSheet("urlaub")} data-testid="per-urlaub-oeffnen">
          {T.stempel.urlaub}
        </Knopf>
      </div>
      <UrlaubSheet offen={sheet === "urlaub"} onSchliessen={schliessen} heute={heute} eigener={eigener} darfVertretung={darfVertretung} vertretungen={vertretungen} konto={konto?.urlaub || null} bestehende={bestehende} />
      <KrankSheet offen={sheet === "krank"} onSchliessen={schliessen} heute={heute} />
    </>
  );
}
