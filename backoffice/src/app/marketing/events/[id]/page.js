// /marketing/events/[id] – Event-Akte (10-konzept-marketing § 2.8, T5, 4 Reiter): Anmeldungen · Eckdaten · Mails · Verlauf.
// Primär je Status: Veröffentlichen … (nur mit Uhrzeit) · Anmeldung erfassen · am Eventtag Check-in öffnen · danach
// Teilnehmerliste. Kein Knopf „Als durchgeführt“ (E12, der Scheduler schließt am Folgetag).
import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Balken, Fakten, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { AnmeldungenTabelle, EventAktionen, EventEckdaten } from "@/components/Backoffice/Marketing/Events";
import { eventAkte, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { eventPrimaer, kurzDatum, plusTage, uhrzeit } from "@/lib/backoffice/marketing/regeln";
import { EVENTS, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Event") };

export default async function EventSeite({ params, searchParams }) {
  const { id: roh } = await params;
  const id = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/events/${roh}`, doctype: "PH Event" });
  const akte = await eventAkte(ctx.client, id).catch((e) => (e?.code === "not_found" ? null : Promise.reject(e)));
  if (!akte) notFound();
  const { doc: ev, docinfo, plaetze: p } = akte;
  const tabs = [
    { id: "anmeldungen", titel: EVENTS.tabs.anmeldungen, anzahl: (ev.anmeldungen || []).length || undefined },
    { id: "eckdaten", titel: EVENTS.tabs.eckdaten },
    { id: "mails", titel: EVENTS.tabs.mails },
    { id: "verlauf", titel: EVENTS.tabs.verlauf },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const primaer = eventPrimaer(ev);
  const erinnerung = ev.erinnerung_tage_vorher && ev.datum ? plusTage(ev.datum, -Number(ev.erinnerung_tage_vorher)) : null;
  const band = ev.status === "Abgesagt" ? <Band ton="neutral" titel={EVENTS.abgesagtBand} /> : ev.status === "Durchgefuehrt" ? <Band ton="neutral" icon="Check" titel={EVENTS.durchgefuehrtBand} /> : null;

  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/events", titel: "Events" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Events", href: "/marketing/events" }, { titel: ev.titel }]}
        titel={ev.titel}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <span>
              {kurzDatum(ev.datum, { jahr: true })}
              {ev.uhrzeit_von ? ` · ${uhrzeit(ev.uhrzeit_von)}${ev.uhrzeit_bis ? `–${uhrzeit(ev.uhrzeit_bis)}` : ""}` : ` · ${EVENTS.uhrzeitOffen}`}
            </span>
            <span>{ev.ort?.split(",")[0]}</span>
            <Status gruppe="event" wert={ev.status} mitTeilnehmern={p.anmeldungen > 0} testid="event-status" />
          </span>
        }
        aktionen={<EventAktionen ev={{ name: ev.name, titel: ev.titel, status: ev.status, datum: ev.datum, anmeldungen: ev.anmeldungen, max_personen_je_anmeldung: ev.max_personen_je_anmeldung, kapazitaet: ev.kapazitaet, warteliste: ev.warteliste, einwilligung_textversion: ev.einwilligung_textversion }} primaer={primaer} leitung={ctx.leitung} team={ctx.team} faehig={ctx.an} dialog={sp.dialog} />}
      />
      <div className="mb-6 flex flex-wrap items-center gap-4" data-testid="plaetze">
        {p.kapazitaet ? <Balken className="w-56" anteil={p.anteil} ton={p.anteil >= 1 ? "warn" : undefined} label={EVENTS.personen(p.belegt, p.kapazitaet)} /> : null}
        <span className="bo-mar-unter tabular-nums">
          {p.kapazitaet ? `${p.belegt} von ${p.kapazitaet} · ${EVENTS.frei(p.frei)}` : `${p.belegt} Personen`} · {EVENTS.warteliste(p.warteliste)}
          {erinnerung && ["Offen", "Ausgebucht", "Geplant"].includes(ev.status) ? ` · Erinnerung ${ev.erinnerung_gesendet_am ? `gesendet ${kurzDatum(ev.erinnerung_gesendet_am, { zeit: true })}` : `geht ${kurzDatum(erinnerung)} 08:00`}` : ""}
        </span>
      </div>
      {band && <div className="mb-6">{band}</div>}
      <div className="mb-6">
        <AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/events/${roh}`} params={{}} />
      </div>
      {tab === "anmeldungen" && <AnmeldungenTabelle ev={ev} team={ctx.team} faehig={ctx.an} statusFilter={sp.status} />}
      {tab === "eckdaten" && <EventEckdaten ev={ev} darf={ctx.leitung || (ctx.team && ev.status === "Geplant")} kampagnen={akte.kampagnen} />}
      {tab === "mails" && (
        <Kachel titel="Mails zu diesem Event" unter="Vorlagen der Art Event">
          <div className="mt-3">
            <Fakten
              eintraege={[
                { label: EVENTS.mails.bestaetigung, wert: <VorlageLink v={ev.bestaetigung_vorlage} /> },
                { label: EVENTS.mails.erinnerung, wert: <><VorlageLink v={ev.erinnerung_vorlage} /> · {EVENTS.erinnerungTage(Number(ev.erinnerung_tage_vorher || 0))}</> },
                { label: EVENTS.mails.nachrueck, wert: <VorlageLink v={ev.nachrueck_vorlage} /> },
                { label: EVENTS.mails.absage, wert: <VorlageLink v={ev.absage_vorlage} /> },
                { label: EVENTS.mails.einladung, wert: <VorlageLink v={ev.einladung_vorlage} /> },
                { label: "Erinnerung gesendet", wert: ev.erinnerung_gesendet_am ? kurzDatum(ev.erinnerung_gesendet_am, { zeit: true }) : "–" },
              ]}
            />
          </div>
        </Kachel>
      )}
      {tab === "verlauf" && <Zeitleiste doctype="PH Event" name={ev.name} docinfo={docinfo} darfSchreiben={ctx.team} />}
    </Rahmen>
  );
}

function VorlageLink({ v }) {
  if (!v) return "–";
  return (
    <Link className="bo-mar-link" href={`/marketing/vorlagen?vorlage=${encodeURIComponent(v)}`}>
      {v}
    </Link>
  );
}
