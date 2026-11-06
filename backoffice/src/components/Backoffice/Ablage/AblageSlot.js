import Link from "next/link";
import { Folder, FolderLock } from "lucide-react";
import Knopf from "../Knopf";
import Vorschaubild from "./Vorschaubild";
import { T } from "@/lib/backoffice/ablage/texte";
import { ordnerName } from "@/lib/backoffice/ablage/regeln";

// Ablage-Abschnitt in Kundenakte (Reiter „Mehr“) und Auftragsmappe (Reiter „Dateien“) – Slot-API v1.
// Bekommt { daten } aus akte/slots/ablage.js (nie die Sitzung): Stammordner des Bezugs mit Unterordnern
// (Anzahl je Ordner) und die letzten Dateien mit Vorschaubild. Hochladen öffnet die Ablage im Ordner.
// Server-tauglich (keine Hooks).

export default function AblageSlot({ daten }) {
  const w = daten?.wurzel;
  if (!w) return <p className="text-sm text-bo-text-soft">{T.slot.nichtVerknuepft}</p>;
  const href = (o) => `/ablage?ordner=${encodeURIComponent(o)}`;
  const kinder = w.kinder || [];
  return (
    <div className="bo-abl-slot" data-testid="abl-slot">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-bo-text-soft">{T.slot.ordner}</p>
        <div className="flex gap-2">
          {daten.darfHochladen && kinder[0] && (
            <Knopf size="s" variant="secondary" icon="Plus" href={`${href(kinder[0].ordner)}&hochladen=1`}>
              {T.slot.hochladen}
            </Knopf>
          )}
          <Knopf size="s" variant="ghost" iconRechts="ArrowUpRight" href={href(w.ordner)}>
            {T.slot.oeffnen}
          </Knopf>
        </div>
      </div>
      <nav className="bo-abl-slot__ordner" aria-label={T.slot.ordner}>
        {kinder.map((o) => {
          const Ico = o.effektiver_modus === "leitung" ? FolderLock : Folder;
          return (
            <Link key={o.ordner} href={href(o.ordner)}>
              <Ico className="size-4 text-bo-text-soft" strokeWidth={1.75} aria-hidden="true" />
              {ordnerName(o)}
              {o.anzahl_dateien > 0 && <span className="text-xs text-bo-text-faint tabular-nums">{o.anzahl_dateien}</span>}
            </Link>
          );
        })}
      </nav>
      <p className="text-[13px] font-medium text-bo-text-soft">{T.slot.zuletzt}</p>
      {daten.zuletzt?.length ? (
        <ul className="bo-abl-slot__raster">
          {daten.zuletzt.map((d) => (
            <li key={d.datei}>
              <Link href={`/ablage/datei/${encodeURIComponent(d.datei)}`} className="bo-abl-slot__datei">
                <span className="bo-abl-slot__daumen">
                  <Vorschaubild datei={d} />
                </span>
                <span className="truncate text-[13px] font-semibold" title={d.dateiname}>
                  {d.dateiname}
                </span>
                <span className="text-xs text-bo-text-soft tabular-nums">
                  {(d.endung || "").toUpperCase()} · {d.groesse_text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-bo-text-soft">{T.slot.leer}</p>
      )}
    </div>
  );
}
