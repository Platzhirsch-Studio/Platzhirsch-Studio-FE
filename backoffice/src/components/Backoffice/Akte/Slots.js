import { Suspense } from "react";
import cx from "../cx";
import { AkteSlotListe, SlotInhalt, SlotKachel } from "./SlotListe";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import { ladeSlot, slotsFuer } from "@/lib/backoffice/akte/slots";
import { SLOTS } from "@/lib/backoffice/akte/slots/index";
import "./akte.css";

// Akte-Slots rendern (G-14, Team P0-5a). SLOT-API v1 und Register: lib/backoffice/akte/slots.js.
//
// Server-Seite (Kundenakte/Mappe), je Slot eigener Suspense-Rand (rechte Spalte/Abschnitte streamen,
// Q-L1) und eigener Fehlerblock (ein Slot, der fehlschlägt, zeigt nur seinen Abschnitt als Fehler):
//   <AkteSlots akte="kunde" tab="projekte-belege" id={kontakt} session={session} ctx={{ client }} />
// Schon geladene Ergebnisse (ladeSlotsFuer) oder Tests/Demos:
//   <AkteSlotListe eintraege={[{ slot, ergebnis }]} id={…} akte="kunde" tab="…" />
// Die Sitzung geht nie an die Slot-Komponente (sie darf nicht in den Browser).

async function SlotGeladen({ slot, session, id, akte, tab, ctx }) {
  const ergebnis = await ladeSlot(slot, session, id, { ...ctx, akte, tab });
  return <SlotInhalt slot={slot} ergebnis={ergebnis} id={id} akte={akte} tab={tab} />;
}

function SlotSkelett({ titel }) {
  return <div className="bo-akte-slot__skelett bo-skeleton" role="status" aria-label={TEXTE.akte.slotLaedt(titel)} />;
}

/**
 * Server-Komponente: alle sichtbaren Slots eines Reiters, jeder in eigenem Suspense-Rand.
 * @param {{akte:"kunde"|"projekt", tab:string, id:string, session:object, register?:object[], ctx?:object}} p
 */
export function AkteSlots({ akte, tab, id, session, register = SLOTS, ctx = {}, className, testid = "akte-slots" }) {
  const slots = slotsFuer({ akte, tab, session, register });
  if (!slots.length) return null;
  return (
    <div className={cx("bo-akte-slots", className)} data-testid={testid}>
      {slots.map((slot) => (
        <SlotKachel key={slot.id} slot={slot}>
          <Suspense fallback={<SlotSkelett titel={slot.titel} />}>
            <SlotGeladen slot={slot} session={session} id={id} akte={akte} tab={tab} ctx={ctx} />
          </Suspense>
        </SlotKachel>
      ))}
    </div>
  );
}

export { AkteSlotListe };
export default AkteSlots;
