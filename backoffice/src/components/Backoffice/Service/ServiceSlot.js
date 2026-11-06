// Slot „Servicefälle“ in der Kundenakte (Slot-API v1): Fälle mit Status und Pflegeverträge – ohne Sitzung.
import Link from "next/link";
import { FallStatus, Status } from "./Teile";
import { PFLEGE_STATUS } from "@/lib/backoffice/service/labels";
import { datumLang } from "@/lib/backoffice/service/anzeige";
import "./service.css";

export default function ServiceSlot({ daten }) {
  return (
    <div className="grid gap-4">
      {daten.faelle.length > 0 && (
        <ul className="bo-svc-zeilen -mx-3">
          {daten.faelle.map((f) => (
            <li key={f.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
              <span className="min-w-0">
                <Link href={`/service/faelle/${encodeURIComponent(f.name)}`} className="bo-svc-zeile__link">
                  <span className="bo-svc-zeile__titel">{f.produkt_name || f.art}</span>
                </Link>
                <span className="bo-svc-zeile__unter">
                  {f.name} · gemeldet {datumLang(f.gemeldet_am)}
                </span>
              </span>
              <span className="bo-svc-zeile__rechts">
                <FallStatus fall={f} groesse="sm" />
              </span>
            </li>
          ))}
        </ul>
      )}
      {daten.pflege.length > 0 && (
        <ul className="bo-svc-zeilen -mx-3">
          {daten.pflege.map((p) => (
            <li key={p.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
              <span className="min-w-0">
                <Link href={`/service/vertraege/pflege/${encodeURIComponent(p.name)}`} className="bo-svc-zeile__link">
                  <span className="bo-svc-zeile__titel">
                    {p.art} · {p.bereich}
                  </span>
                </Link>
                <span className="bo-svc-zeile__unter">nächster Termin {datumLang(p.naechster_termin)}</span>
              </span>
              <span className="bo-svc-zeile__rechts">
                <Status wert={p.status} map={PFLEGE_STATUS} groesse="sm" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
