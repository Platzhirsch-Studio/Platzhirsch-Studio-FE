// Die zwei Merken-Handlungen an einer Quelle: „Auf Pinterest merken“ (nur
// mit Bildrecht, sonst entfällt der Link) und „Zum Ideenboard“ (immer).
// Server-sicher (kein "use client", nicht async), in Server-Komponenten und
// Inseln nutzbar. Einbau: an Raumbildern, Ezarri-Galerie, Konfigurator,
// Stil-Finder-Ergebnis und Projekten (Doku qa-screenshots/pinterest/website-bau.md).
import PinterestSave from "./PinterestSave";
import IdeenboardAdd from "./IdeenboardAdd";

const cx = (...p) => p.filter(Boolean).join(" ");

/**
 * @param {object} card  Ideenboard-Karte {type, title, subtitle?, href, image, quelle?, room?}
 * @param {object} [pin] {url, media, title, brand, room, kiStufe} – Standard aus `card`
 * @param {"de"|"en"|"fr"|"it"} [locale]
 * @param {boolean} [onDark]
 * @param {boolean} [pinterest=true] false blendet den Pinterest-Link aus – auch
 *   später im Ideenboard (Karte bekommt nopin, z. B. Projekt ohne Einwilligung „pinterest“)
 */
export default function SaveActions({ card, pin, locale = "de", onDark = false, pinterest = true, compact = false, className }) {
  const p = {
    url: card?.href || null,
    media: card?.image,
    title: card?.title,
    brand: card?.quelle === "Ezarri" ? "Ezarri" : undefined,
    room: card?.room,
    ...pin,
  };
  const boardCard = pinterest ? card : card && { ...card, nopin: true };
  return (
    <div className={cx("-ml-3 flex flex-wrap items-center gap-x-1", className)} data-save-actions="">
      <IdeenboardAdd card={boardCard} locale={locale} onDark={onDark} />
      {pinterest && <PinterestSave {...p} onDark={onDark} compact={compact} />}
    </div>
  );
}
