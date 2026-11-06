// Serviceauftrag (10-konzept-service §2.10): Winterlager, Reinigung, Aufarbeitung – Übernahmeliste, Übernahme/Rückgabe.
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { AUFTRAG_PHASEN, AUFTRAG_STATUS } from "@/lib/backoffice/service/labels";
import { datumLang, euro, zeitpunkt } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { Fakten, Status } from "@/components/Backoffice/Service/Teile";
import { AuftragAktionen } from "@/components/Backoffice/Service/VertragAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Serviceauftrag` };
}

export default async function AuftragAkte({ params }) {
  const name = decodeURIComponent((await params).name);
  const session = await requireRecht("service", "read", `/service/vertraege/auftraege/${encodeURIComponent(name)}`);
  const client = serviceClient(session);
  const s = sicht(session);
  let a;
  try {
    a = await client.getDoc("PH Serviceauftrag", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const phase = AUFTRAG_PHASEN.indexOf(a.status);
  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/vertraege?art=auftraege", titel: "Serviceaufträge" }}
          krumen={[{ titel: "Verträge", href: "/service/vertraege" }, { titel: "Serviceaufträge", href: "/service/vertraege?art=auftraege" }, { titel: name }]}
          titel={a.kunde_name}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span>
                {name} · {a.art}
              </span>
              <Status wert={a.status} map={AUFTRAG_STATUS} />
            </span>
          }
          aktionen={<AuftragAktionen auftrag={a} leitung={s.leitung} darf={s.schreiben} />}
        />
        <Kachel dicht>
          <ol className="bo-svc-phasen" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }} aria-label="Phasen">
            {AUFTRAG_PHASEN.map((ph, i) => {
              const z = phase < 0 ? "offen" : i < phase ? "erledigt" : i === phase ? "aktuell" : "offen";
              return (
                <li key={ph} className="bo-svc-phase" data-zustand={z} aria-current={z === "aktuell" ? "step" : undefined}>
                  <span className="bo-svc-phase__linie" aria-hidden="true" />
                  <span className="bo-svc-phase__punkt" aria-hidden="true" />
                  <span className="bo-svc-phase__text">{AUFTRAG_STATUS[ph].text}</span>
                </li>
              );
            })}
          </ol>
        </Kachel>
        <div className="grid gap-(--bo-bento-gap) xl:grid-cols-[minmax(0,1fr)_360px]">
          <Kachel titel={T.vertraege.atabs.stuecke} unter={`${(a.positionen || []).length} Stücke`}>
            {(a.positionen || []).length ? (
              <ul className="bo-svc-zeilen -mx-3">
                {a.positionen.map((x, i) => (
                  <li key={i} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                    <span className="min-w-0">
                      <span className="bo-svc-zeile__titel">{x.bezeichnung}</span>
                      <span className="bo-svc-zeile__unter">Zustand: {x.zustand || "–"}</span>
                    </span>
                    <span className="bo-svc-zeile__zeit">{x.menge || 1} ×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-bo-text-soft">{T.vertraege.leerStuecke}</p>
            )}
          </Kachel>
          <aside className="grid content-start gap-(--bo-bento-gap)">
            <Kachel titel="Auftrag">
              <Fakten spalten={1} eintraege={[{ label: "Leistungen", wert: a.leistungen }, { label: "Preis", wert: Number(a.preis_cent) ? euro(a.preis_cent) : T.vertraege.aufAnfrage }, { label: "Abholung", wert: datumLang(a.abholung_am) }, { label: "Rückgabe", wert: datumLang(a.rueckgabe_am) }, { label: "Lagerort", wert: a.lagerort }, { label: "Übernommen", wert: a.uebernahme_am ? zeitpunkt(a.uebernahme_am) : null }]} />
            </Kachel>
            {a.art === "Winterlager" && <p className="bo-svc-hinweis px-2">{T.vertraege.verwahrung}</p>}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
