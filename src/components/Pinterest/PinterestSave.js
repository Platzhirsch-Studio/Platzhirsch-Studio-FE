// „Auf Pinterest merken“ – ein einfacher Link, KEIN Pinterest-Skript.
// Vor dem Klick lädt nichts von Pinterest (kein Tracking, keine Einwilligung
// nötig); der Klick öffnet pinterest.com/pin/create/button/ in einem neuen
// Tab, rel="noopener noreferrer". Ohne Bildrecht (src/lib/pinterest/rights.js:
// nur eigene Fotos, Haralds Material, Ezarri) rendert die Komponente nichts.
// Server-sicher (kein "use client", nicht async): auch in Inseln nutzbar.
import { Pin } from "lucide-react";
import { pinterestHref } from "@/lib/pinterest/url";
import { fmt } from "@/lib/pinterest/copy";
import { usePinCopy } from "@/lib/pinterest/useCopy";

const cx = (...p) => p.filter(Boolean).join(" ");

/**
 * @param {string} url      Seite, auf die der Pin verlinkt (Pfad oder eigene URL)
 * @param {string} media    Bild (Pfad oder eigene URL)
 * @param {string} title    Titel für Beschreibung und aria-label
 * @param {string} [brand]  Marke (z. B. „Ezarri“)
 * @param {string} [room]   Raum („Pool“, „Bad“ …)
 * @param {string} [kiStufe] aus dem Bildregister; alles außer keine/retusche sperrt
 * @param {boolean} [onDark]
 * @param {boolean} [compact] nur „Pinterest“ als sichtbarer Text
 */
export default function PinterestSave({ url, media, title, brand, room, kiStufe, onDark = false, compact = false, className }) {
  const t = usePinCopy().pinterest; // Hook vor jedem return
  if (String(process.env.NEXT_PUBLIC_PINTEREST_SAVE || "").trim().toLowerCase() === "off") return null;
  const href = pinterestHref({ url, media, title, brand, room, kiStufe });
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={fmt(t.saveAria, { title: title || "" })}
      data-pinterest-save=""
      className={cx(
        "relative z-10 inline-flex min-h-11 items-center gap-2 px-3 text-small underline-offset-4 transition-colors duration-(--duration-micro) hover:underline",
        onDark ? "text-text-inverse hover:bg-paper/10" : "text-text hover:bg-ink/5",
        className
      )}
    >
      <Pin aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
      <span>{compact ? "Pinterest" : t.save}</span>
    </a>
  );
}
