import cx from "../cx";
import Kachel from "../Kachel";
import Fehler from "../Fehler";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import "./akte.css";

// Darstellung geladener Akte-Slots (G-14, Team P0-5a) – ohne Register-Import, daher auch in
// Client-Komponenten und Demos nutzbar. Laden: Slots.js (Server) bzw. ladeSlotsFuer().

export function SlotInhalt({ slot, ergebnis, id, akte, tab }) {
  if (!ergebnis?.ok) {
    return <Fehler code={ergebnis?.code === "forbidden" ? "forbidden" : "unavailable"} message={TEXTE.akte.slotFehler} kompakt />;
  }
  if (ergebnis.leer) return <p className="bo-akte-slot__ruhe">{slot.leerText || TEXTE.akte.slotLeer}</p>;
  const K = slot.Komponente;
  return <K daten={ergebnis.daten} id={id} akte={akte} tab={tab} />;
}

export function SlotKachel({ slot, children }) {
  return (
    <Kachel titel={slot.titel} data-breite={slot.breite || "voll"} data-slot={slot.id} testid={`slot-${slot.id}`}>
      {children}
    </Kachel>
  );
}

/** Synchron: rendert bereits geladene Slots (Reihenfolge wie übergeben). */
export function AkteSlotListe({ eintraege = [], id, akte, tab, className, testid = "akte-slots" }) {
  if (!eintraege.length) return null;
  return (
    <div className={cx("bo-akte-slots", className)} data-testid={testid}>
      {eintraege.map(({ slot, ergebnis }) => (
        <SlotKachel key={slot.id} slot={slot}>
          <SlotInhalt slot={slot} ergebnis={ergebnis} id={id} akte={akte} tab={tab} />
        </SlotKachel>
      ))}
    </div>
  );
}

