// /marketing/events – Events (10-konzept-marketing § 2.8, T2, nur Liste): Datum groß links, Titel + Uhrzeit/Erinnerung,
// Plätze-Balken, Status; Zeit-Signale „Uhrzeit offen“, Event heute mit „Check-in öffnen“. Endzustände unten.
import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { Balken, DatumGross, ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { NeuesEventKnopf } from "@/components/Backoffice/Marketing/Events";
import { eventsListe, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { ERSTBESUCH, EVENTS, EVENT_ART, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { kurzDatum, uhrzeit } from "@/lib/backoffice/marketing/regeln";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Events") };


export default async function EventsSeite({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/events", doctype: "PH Event" });
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const { zeilen, zaehler, gesamt, jahre } = await eventsListe(ctx.client, { status, art: params.art, jahr: params.jahr, q: params.q });
  const link = (s) => `/marketing/events?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(params.jahr ? { jahr: params.jahr } : {}) })}`;
  const heute = zeilen.find((e) => e.heute && ["Offen", "Ausgebucht"].includes(e.status));

  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.events, route: "/marketing/events" }}>
      <Seitenkopf
        titel={EVENTS.titel}
        untertitel={EVENTS.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: EVENTS.titel }]}
        kennzahlen={[{ wert: (zaehler.Offen || 0) + (zaehler.Ausgebucht || 0), text: "Offen für Anmeldungen" }, { wert: zaehler.Geplant || 0, text: "Geplant" }]}
        aktionen={ctx.leitung ? <NeuesEventKnopf auto={params.neu === "event"} /> : null}
      />
      {heute && (
        <section className="bo-kachel mb-(--bo-bento-gap) flex flex-wrap items-center gap-4" style={{ padding: 20 }} data-testid="event-heute">
          <DatumGross datum={heute.datum} heute />
          <div className="min-w-0 flex-1">
            <p className="bo-mar-klein">{EVENTS.heute}</p>
            <p className="bo-titel-kachel">{heute.titel}</p>
            <p className="bo-mar-unter">{uhrzeit(heute.uhrzeit_von)} · {EVENTS.personen(heute.plaetze.belegt, heute.plaetze.kapazitaet)} · Da {heute.plaetze.da}</p>
          </div>
          <Knopf icon="ScanLine" href={`/checkin/${encodeURIComponent(heute.name)}`} data-testid="checkin-oeffnen">
            {EVENTS.checkinOeffnen}
          </Knopf>
        </section>
      )}
      <div className="bo-mar-werkzeuge">
        <StatusChips aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"} optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: link("") }, ...CHIP_REIHE.event.map((s) => ({ wert: s, titel: STATUS_TEXT.event[s], anzahl: zaehler[s] || 0, href: link(s) }))]} />
        <FilterForm
          basis="/marketing/events"
          params={params}
          behalten={["status"]}
          suche={{ name: "q", platzhalter: "Titel" }}
          auswahl={[
            { name: "art", label: "Art", alle: "Alle Arten", optionen: EVENT_ART.map((a) => ({ wert: a, titel: a })) },
            { name: "jahr", label: "Jahr", alle: "Alle Jahre", optionen: jahre.map((j) => ({ wert: j, titel: j })) },
          ]}
          zuruecksetzen="/marketing/events"
        />
      </div>
      {gesamt === 0 ? (
        <Leer titel="Noch kein Event" text={EVENTS.leer} aktion={ctx.leitung ? <Knopf variant="primary" icon="Plus" href="/marketing/events?neu=event">{EVENTS.neu}</Knopf> : undefined} />
      ) : zeilen.length === 0 ? (
        <Leer art="gefiltert" text={EVENTS.gefiltert} zuruecksetzenHref="/marketing/events" />
      ) : (
        <ListeKachel label={EVENTS.titel} testid="events-liste">
          <ul className="flex flex-col">
            {zeilen.map((e) => {
              const p = e.plaetze;
              const uhrOffen = e.status === "Geplant" && !e.uhrzeit_von;
              return (
                <li key={e.name} className="bo-mar-karte-zeile" data-testid="event-zeile">
                  <DatumGross datum={e.datum} heute={e.heute} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/marketing/events/${encodeURIComponent(e.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">
                      {e.titel}
                    </Link>
                    <p className="bo-mar-unter">
                      {kurzDatum(e.datum)}
                      {e.uhrzeit_von ? ` · ${uhrzeit(e.uhrzeit_von)}` : ""} · {e.art}
                      {e.erinnerung_gesendet_am ? ` · ${EVENTS.erinnerung(kurzDatum(e.erinnerung_gesendet_am, { zeit: true }))}` : ""}
                    </p>
                  </div>
                  <div className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
                    <span className="bo-mar-klein tabular-nums">
                      {p.kapazitaet || p.belegt ? EVENTS.personen(p.belegt, p.kapazitaet) : "– / –"}
                      {p.warteliste ? ` · ${EVENTS.warteliste(p.warteliste)}` : ""}
                    </span>
                    {p.kapazitaet ? <Balken anteil={p.anteil} ton={p.anteil >= 1 ? "warn" : undefined} label={EVENTS.personen(p.belegt, p.kapazitaet)} /> : null}
                  </div>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Status gruppe="event" wert={e.status} mitTeilnehmern={p.anmeldungen > 0} />
                    {uhrOffen && <Pille material="eiche" groesse="sm">{EVENTS.uhrzeitOffen}</Pille>}
                  </span>
                </li>
              );
            })}
          </ul>
        </ListeKachel>
      )}
    </Rahmen>
  );
}
