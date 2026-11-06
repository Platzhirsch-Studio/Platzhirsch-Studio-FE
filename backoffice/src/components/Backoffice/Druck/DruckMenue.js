"use client";
// G-17 Kiosk-Variante (Team P0-5c): Druckmenü für Packtisch, Kassa, Montage – Lieferschein, Packliste, Etikett, Bon.
// Strg/⌘+P öffnet (Kürzel `kiosk.drucken`). Einträge ohne Objekt oder ohne Weg bleiben sichtbar und nennen den Grund
// (Q-I5) – nie ein Eintrag ohne Wirkung. Gedruckt wird wie im Druckpanel (Frappe-Format bzw. Weg des Arbeitsplatzes).
//
//   <DruckMenue pdf={modus === "frappe"} eintraege={[
//     { id: "lieferschein", name: "LS-2026-00031" },                          // Standard aus KIOSK_DRUCK
//     { id: "packliste", name: "LS-2026-00031" },
//     { id: "etikett", onDrucken: etikettDrucken, laedt },                    // Versanddienst (Bereich)
//     { id: "bon", deaktiviert: true, grund: "Kein Bon zu diesem Auftrag" },
//   ]} />

import { useState } from "react";
import Knopf from "../Knopf";
import { Menue, MenuePunkt } from "../Overlay";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { KIOSK_DRUCK } from "@/lib/backoffice/druck";
import { druckeFormat } from "./DruckPanel";
import { druckAuftragHinzu, druckAuftragSetzen } from "./warteschlange";
import { DRUCK_TEXTE as T } from "./texte";

/**
 * @param {object} p
 * @param {Array<{id:string, titel?:string, icon?:string, doctype?:string, name?:string, format?:string|null,
 *   onDrucken?:() => void|Promise<void>, deaktiviert?:boolean, grund?:string}>} p.eintraege
 * @param {boolean} [p.pdf]          Frappe-PDF statt HTML-Druckansicht
 * @param {"kiosk"|"l"|"m"} [p.groesse]
 */
export default function DruckMenue({ eintraege = [], pdf = false, groesse = "kiosk", testid = "druck-menue" }) {
  const [offen, setOffen] = useState(false);
  const { zeige } = useToast();
  useKuerzel("kiosk", { "kiosk.drucken": () => setOffen(true) });

  const liste = eintraege.map((e) => ({ ...(KIOSK_DRUCK.find((k) => k.id === e.id) || {}), ...e }));

  const drucke = async (e) => {
    if (e.onDrucken) return e.onDrucken();
    const a = druckAuftragHinzu({ doctype: e.doctype, name: e.name, titel: `${e.titel} ${e.name}`, format: e.format });
    druckAuftragSetzen(a.id, "druckt");
    const ok = await druckeFormat({ doctype: e.doctype, name: e.name, format: e.format, pdf });
    druckAuftragSetzen(a.id, ok ? "gedruckt" : "fehler");
    if (!ok) zeige(T.vorschauFehler, { art: "fehler" });
  };

  return (
    <Menue
      label={T.kiosk.menue}
      offen={offen}
      onOffen={setOffen}
      breite={280}
      platzierung="oben-start"
      ausloeser={(p) => (
        <Knopf {...p} size={groesse} variant="secondary" icon="Printer" kuerzel={T.taste} data-testid={testid}>
          {T.kiosk.knopf}
        </Knopf>
      )}
    >
      {liste.map((e) => {
        const ohneWeg = !e.onDrucken && (!e.name || !e.format);
        const gesperrt = !!e.deaktiviert || ohneWeg;
        return (
          <MenuePunkt key={e.id} icon={e.icon || "Printer"} deaktiviert={gesperrt} grund={gesperrt ? e.grund || T.kiosk.nichtVerfuegbar : undefined} onWaehlen={() => drucke(e)} testid={`${testid}-${e.id}`}>
            {e.titel}
          </MenuePunkt>
        );
      })}
    </Menue>
  );
}
