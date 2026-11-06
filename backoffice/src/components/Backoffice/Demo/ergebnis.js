"use client";
// Demo „ErgebnisKarte“ (Team P0-5a, G-16) für /einstellungen?tab=system&baustein=ergebnis – nur Admin,
// nur Mock. Drei Nutzer: Kassa (Rückgeld zuerst, kompakt), Faktura (Rechnung gestellt, Dokumente) und
// Logistik (Paket abgeschlossen, ohne Betrag). „Erneut zeigen“ zeichnet das Häkchen neu. Beispielwerte.

import { useState } from "react";
import Knopf from "../Knopf";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";

const TEXTE = {
  titel: "ErgebnisKarte",
  team: "Baustein von Team P0-5a",
  einleitung: "Der eine Erfolgsmoment am Ende eines Vorgangs: Häkchen, die wichtigste Zahl zuerst, alle erzeugten Dokumente und genau ein Weiter.",
  neu: "Erneut zeigen",
  kassa: { titel: "Bon K1-2026-004812 gebucht", unter: "Bar · Kundenkarte Platzhirsch Plus", zahl: "Rückgeld", weiter: "Nächster Kunde", beleg: "Beleg per E-Mail" },
  faktura: { titel: "Rechnung RE-2026-0251 gestellt", unter: "Familie Brändle · fällig 18.11.2026", zahl: "Rechnungsbetrag", weiter: "Zur Rechnung", mahnung: "Zahlungserinnerung planen", drucken: "Drucken" },
  logistik: { titel: "Paket für LS-2026-0377 abgeschlossen", unter: "6 von 6 Positionen · 13 Stück", weiter: "Nächster Auftrag" },
  dokumente: {
    bon: { titel: "K1-2026-004812", info: "Kassenbon · PDF", icon: "Receipt" },
    rechnung: { titel: "RE-2026-0251.pdf", info: "Rechnung · 2 Seiten", icon: "FileText" },
    lieferschein: { titel: "LS-2026-0377", info: "Lieferschein", icon: "Truck" },
    etikett: { titel: "Versandetikett", info: "62 × 29 mm", icon: "Tag" },
  },
};

export default function ErgebnisDemo() {
  const [n, setN] = useState(0);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-ergebnis">
      <header className="flex min-w-0 flex-wrap items-end justify-between gap-4 pb-2">
        <div className="min-w-0">
          <p className="bo-unterzeile">{TEXTE.team}</p>
          <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
          <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
        </div>
        <Knopf icon="RotateCcw" onClick={() => setN((x) => x + 1)} data-testid="demo-ergebnis-neu">
          {TEXTE.neu}
        </Knopf>
      </header>

      <div key={n} className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <ErgebnisKarte
          className="lg:col-span-5"
          kompakt
          testid="demo-ergebnis-kassa"
          titel={TEXTE.kassa.titel}
          unter={TEXTE.kassa.unter}
          zahl={{ titel: TEXTE.kassa.zahl, cent: 1550 }}
          dokumente={[{ ...TEXTE.dokumente.bon, href: "#bon" }]}
          aktionen={[{ titel: TEXTE.kassa.beleg, icon: "Mail", onClick: () => {} }]}
          weiter={{ titel: TEXTE.kassa.weiter, onClick: () => setN((x) => x + 1), kuerzel: "F12" }}
        />
        <ErgebnisKarte
          className="lg:col-span-7"
          testid="demo-ergebnis-faktura"
          primaer={false}
          titel={TEXTE.faktura.titel}
          unter={TEXTE.faktura.unter}
          zahl={{ titel: TEXTE.faktura.zahl, cent: 8916000 }}
          dokumente={[{ ...TEXTE.dokumente.rechnung, href: "#rechnung" }]}
          aktionen={[
            { titel: TEXTE.faktura.drucken, icon: "Printer", href: "#drucken" },
            { titel: TEXTE.faktura.mahnung, icon: "CalendarPlus", href: "#mahnung" },
            { titel: "Wird nicht gezeigt", href: "#vierter" },
          ]}
          weiter={{ titel: TEXTE.faktura.weiter, href: "#rechnung" }}
        />
        <ErgebnisKarte
          className="lg:col-span-7"
          testid="demo-ergebnis-logistik"
          primaer={false}
          titel={TEXTE.logistik.titel}
          unter={TEXTE.logistik.unter}
          dokumente={[{ ...TEXTE.dokumente.lieferschein, href: "#ls" }, { ...TEXTE.dokumente.etikett }]}
          weiter={{ titel: TEXTE.logistik.weiter, href: "#weiter" }}
        />
      </div>
    </div>
  );
}
