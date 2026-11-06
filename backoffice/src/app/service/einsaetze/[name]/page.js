// Einsatz-Akte (T5, 10-konzept-service §2.5): Kopf mit Phasen Geplant → Erledigt, Primär je Status, Reiter
// Einsatz · Durchführung · Abschluss, rechte Spalte mit Fall/Vertrag und Verlauf des Falls.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { personen, serviceClient, sicht, technikerListe } from "@/lib/backoffice/service/daten";
import { EINSATZ_PHASEN, EINSATZ_STATUS } from "@/lib/backoffice/service/labels";
import { datumLang, dauerText, personName, spanne, tagKurz, zeitpunkt } from "@/lib/backoffice/service/anzeige";
import { fallTitel } from "@/lib/backoffice/service/zeilen";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Avatar from "@/components/Backoffice/Avatar";
import { AkteKopf, AkteTabs } from "@/components/Backoffice/Akte";
import { Fakten, FallStatus, Status } from "@/components/Backoffice/Service/Teile";
import EinsatzAktionen from "@/components/Backoffice/Service/EinsatzAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Einsatz` };
}

export default async function EinsatzAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = await searchParams;
  const session = await requireRecht("service", "read", `/service/einsaetze/${encodeURIComponent(name)}`);
  const client = serviceClient(session);
  const s = sicht(session);
  let e;
  try {
    e = await client.getDoc("PH Serviceeinsatz", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const [p, techniker, fall] = await Promise.all([personen(client), technikerListe(client), e.servicefall ? client.getDoc("PH Servicefall", e.servicefall).catch(() => null) : null]);
  const tab = ["einsatz", "durchfuehrung", "abschluss"].includes(sp.tab) ? sp.tab : "einsatz";
  const phase = EINSATZ_PHASEN.indexOf(e.status);
  const tName = personName(e.techniker, p);
  const gestartet = !!e.ankunft || ["Unterwegs", "In Arbeit", "Erledigt", "Nicht angetroffen"].includes(e.status);

  const inhalt =
    tab === "einsatz" ? (
      <Kachel titel="Termin" unter={`${tagKurz(e.datum)} · ${spanne(e.zeit_von, e.zeit_bis)}`}>
        <Fakten eintraege={[{ label: "Techniker", wert: tName }, { label: "Zweiter Techniker", wert: e.techniker_2 ? personName(e.techniker_2, p) : null }, { label: "Adresse", wert: [e.strasse, [e.plz, e.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") }, { label: "Anfahrt", wert: e.anfahrt_km ? `${e.anfahrt_km} km · ${e.anfahrt_min} min` : null }, { label: "Bestätigt vom Kunden", wert: e.bestaetigt_kunde_am ? zeitpunkt(e.bestaetigt_kunde_am) : "noch nicht" }, { label: "Umgeplant", wert: e.umgeplant_am ? zeitpunkt(e.umgeplant_am) : null }]} />
        {(e.hinweis_intern || e.mitzubringen) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="bo-svc-karte">
              <p className="bo-svc-label">Hinweis für den Techniker</p>
              <p className="mt-1 text-[14px]">{e.hinweis_intern || "–"}</p>
            </div>
            <div className="bo-svc-karte">
              <p className="bo-svc-label">{T.einsaetze.a14.mitnehmen}</p>
              <p className="mt-1 text-[14px]">{e.mitzubringen || "–"}</p>
            </div>
          </div>
        )}
      </Kachel>
    ) : tab === "durchfuehrung" ? (
      <Kachel titel={T.einsaetze.tabs.durchfuehrung}>
        {gestartet ? (
          <>
            <Fakten eintraege={[{ label: "Ankunft", wert: e.ankunft ? zeitpunkt(e.ankunft) : null }, { label: "Abfahrt", wert: e.abfahrt ? zeitpunkt(e.abfahrt) : null }, { label: "Arbeitszeit", wert: e.zeit_arbeit_min ? dauerText(e.zeit_arbeit_min) : null }, { label: "Pause", wert: e.zeit_pause_min ? dauerText(e.zeit_pause_min) : "keine" }, { label: "Abgerechnet", wert: e.zeit_abrechenbar_min ? `${dauerText(e.zeit_abrechenbar_min)} (Takt laut Einstellungen)` : null }, { label: "Ergebnis", wert: e.ergebnis }]} />
            {e.bericht && <p className="bo-svc-zitat mt-5">{e.bericht}</p>}
          </>
        ) : (
          <p className="text-[14px] text-bo-text-soft">{T.einsaetze.vorStart}</p>
        )}
      </Kachel>
    ) : (
      <Kachel titel={T.einsaetze.tabs.abschluss}>
        {e.status === "Erledigt" ? <Fakten eintraege={[{ label: "Bestätigung", wert: e.unterschrift_art }, { label: "Name", wert: e.unterschrift_name }, { label: "Zeitpunkt", wert: e.unterschrift_am ? zeitpunkt(e.unterschrift_am) : null }, { label: "Bericht gesendet", wert: e.bericht_gesendet_am ? zeitpunkt(e.bericht_gesendet_am) : "nein" }]} /> : <p className="text-[14px] text-bo-text-soft">{T.einsaetze.vorStart}</p>}
      </Kachel>
    );

  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/einsaetze", titel: "Einsätze" }}
          krumen={[{ titel: "Service", href: "/service" }, { titel: "Einsätze", href: "/service/einsaetze" }, { titel: name }]}
          titel={e.titel || e.kunde_name || name}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {name} · {e.art} · {tagKurz(e.datum)} {spanne(e.zeit_von, e.zeit_bis)}
              </span>
              <Status wert={e.status} map={EINSATZ_STATUS} />
              {e.umgeplant_am && !e.bestaetigt_kunde_am && <span className="bo-svc-einsatz__kennz">{T.einsaetze.neuInformieren}</span>}
            </span>
          }
          aktionen={<EinsatzAktionen einsatz={e} techniker={techniker} technikerName={tName} darf={s.schreiben} fallEmail={fall?.kunde_email || ""} />}
          testid="einsatz-kopf"
        />
        <Kachel dicht>
          <ol className="bo-svc-phasen" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }} aria-label="Phasen">
            {EINSATZ_PHASEN.map((ph, i) => {
              const z = phase < 0 ? "offen" : i < phase ? "erledigt" : i === phase ? "aktuell" : "offen";
              return (
                <li key={ph} className="bo-svc-phase" data-zustand={z} aria-current={z === "aktuell" ? "step" : undefined}>
                  <span className="bo-svc-phase__linie" aria-hidden="true" />
                  <span className="bo-svc-phase__punkt" aria-hidden="true" />
                  <span className="bo-svc-phase__text">{EINSATZ_STATUS[ph].text}</span>
                </li>
              );
            })}
          </ol>
          {phase < 0 && <p className="mt-3 text-[13px] text-bo-text-soft">Status: {EINSATZ_STATUS[e.status]?.text}{e.abbruch_grund ? ` · ${e.abbruch_grund}` : ""}</p>}
        </Kachel>
        <AkteTabs tabs={[{ id: "einsatz", titel: T.einsaetze.tabs.einsatz }, { id: "durchfuehrung", titel: T.einsaetze.tabs.durchfuehrung }, { id: "abschluss", titel: T.einsaetze.tabs.abschluss }]} aktiv={tab} basis={`/service/einsaetze/${encodeURIComponent(name)}`} />
        <div className="grid gap-(--bo-bento-gap) xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">{inhalt}</div>
          <aside className="grid content-start gap-(--bo-bento-gap)">
            <Kachel titel="Techniker">
              <div className="flex items-center gap-3">
                <Avatar name={tName} groesse={40} />
                <span className="text-[15px] font-medium">{tName}</span>
              </div>
            </Kachel>
            {fall && (
              <Kachel titel="Servicefall" unter={fall.name} href={`/service/faelle/${encodeURIComponent(fall.name)}`}>
                <p className="text-[15px] font-semibold">{fallTitel(fall)}</p>
                <div className="mt-2">
                  <FallStatus fall={fall} groesse="sm" />
                </div>
                <p className="mt-3 text-[13px] text-bo-text-soft">{fall.fehlercode ? `${fall.fehlercode} ${fall.fehlercode_bezeichnung}` : fall.art}</p>
              </Kachel>
            )}
            {e.pflege_abo && (
              <Kachel titel="Pflegevertrag" unter={e.pflege_abo}>
                <Knopf size="s" href={`/service/vertraege/pflege/${encodeURIComponent(e.pflege_abo)}`} iconRechts="ArrowRight">
                  Vertrag öffnen
                </Knopf>
              </Kachel>
            )}
            <p className="px-2 text-[13px] text-bo-text-soft">
              Angelegt {datumLang(e.creation)} · <Link className="underline" href="/technik">Technik mobil</Link>
            </p>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
