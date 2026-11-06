// Kundenakte – Abschnitt „Marketing“ (10-konzept-marketing § 3.2, Slot-API v1): Newsletter-Status, Einwilligungen als
// Zweck-Chips mit Status, Event-Anmeldungen, Empfehlungen. Bei Kontaktsperre ein Satz statt Aktionen. Server-tauglich,
// bekommt { daten } (nie die Sitzung). Die Aktionen (Keine Werbung mehr …) liegen in der Personen-Akte.
import Link from "next/link";
import { Status } from "./Bausteine";
import { PERSON, ZWECK_TEXT } from "@/lib/backoffice/marketing/texte";

export default function SlotMarketing({ daten }) {
  if (!daten) return null;
  const { email, abo, einwilligungen = [], events = [], empfehlungen = [], gesperrt } = daten;
  return (
    <div className="flex flex-col gap-3 text-[14px]" data-testid="slot-marketing">
      {gesperrt && <p className="bo-mar-gefahr">{PERSON.sperreKontakt}</p>}
      <p className="flex flex-wrap items-center gap-2">
        <span className="bo-mar-unter">Newsletter</span>
        {abo ? <Status gruppe="abo" wert={abo.status} /> : <span className="bo-mar-unter">kein Abo</span>}
      </p>
      {einwilligungen.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {einwilligungen.map((w) => (
            <li key={w.name} className="bo-mar-chip">
              {ZWECK_TEXT[w.zweck] || w.zweck} · <Status gruppe="einwilligung" wert={w.status} />
            </li>
          ))}
        </ul>
      )}
      {events.length > 0 && <p className="bo-mar-unter">Events: {events.map((e) => e.titel).join(", ")}</p>}
      {empfehlungen.length > 0 && <p className="bo-mar-unter">Empfehlungen: {empfehlungen.map((e) => e.code).join(", ")}</p>}
      {email && (
        <Link className="bo-mar-link font-medium" href={`/marketing/empfaenger/${encodeURIComponent(email)}`}>
          Zur Personen-Akte (Keine Werbung mehr, Einwilligung erfassen)
        </Link>
      )}
    </div>
  );
}
