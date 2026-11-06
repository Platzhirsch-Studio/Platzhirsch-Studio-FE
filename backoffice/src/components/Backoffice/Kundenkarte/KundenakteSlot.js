import Link from "next/link";
import Knopf from "../Knopf";
import StufenKennzeichen from "./StufenKennzeichen";
import { VorteilIcon } from "./VorteilIcon";

// Abschnitt „Kundenkarte“ in der Kundenakte (Slot-API v1, Konzept §3.11): Stufe + Nummer → Karten-Akte,
// zustehende Leistungen; ohne Karte ruhig „Kundenkarte ausstellen“ (nur mit Recht). Nie Beträge.

export default function KundenakteSlot({ daten }) {
  if (!daten?.karte) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-bo-text-soft">{daten?.geschaeft ? "Kundenkarten gibt es nur für Privatpersonen." : "Noch keine Kundenkarte."}</p>
        {daten?.darfAusstellen && !daten?.geschaeft && (
          <Knopf size="s" variant="ghost" icon="CreditCard" href={`/kundenkarte/karten/neu?kontakt=${encodeURIComponent(daten.kontakt)}`}>
            Kundenkarte ausstellen
          </Knopf>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <StufenKennzeichen stufe={daten.stufe} farbe={daten.farbe} />
        {daten.darfOeffnen ? (
          <Link href={`/kundenkarte/karten/${daten.karte}`} className="bo-kk-mono text-[14px] underline decoration-bo-line-strong underline-offset-4">
            {daten.karte}
          </Link>
        ) : (
          <span className="bo-kk-mono text-[14px]">{daten.karte}</span>
        )}
        {daten.status && daten.status !== "Aktiv" && <span className="text-[13px] text-bo-text-soft">{daten.status}</span>}
      </div>
      {daten.vorteile?.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {daten.vorteile.map((v) => (
            <li key={v.titel} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bo-surface-2 px-3 text-[13px] text-bo-text-soft">
              <VorteilIcon art={v.art} className="size-4" />
              {v.titel}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
