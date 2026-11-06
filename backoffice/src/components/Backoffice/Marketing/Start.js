// Bereich Marketing – Bausteine der Übersicht (10-konzept-marketing § 2.1): Zu tun, Erste Schritte, Karten
// Nächste Ausgabe · Diese Woche · Nächstes Event, Mehr Zahlen. Server-Komponenten im Lounge-Bento.
import Link from "next/link";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { Haken } from "../motion";
import { Balken as ChartBalken } from "../Charts";
import { Balken, Bild, Pruefzeile, Status } from "./Bausteine";
import { START, ZWECK_TEXT, QUELLE_TEXT, WOCHENTAGE_KURZ, STATUS_TEXT } from "@/lib/backoffice/marketing/texte";
import { kurzDatum, monatAusSlug, uhrzeit, alsDatum } from "@/lib/backoffice/marketing/regeln";

export function ZuTunKachel({ zeilen = [], leitung, className }) {
  return (
    <Kachel className={className} titel={START.zuTun} unter={leitung ? START.zuTunUnter.leitung : START.zuTunUnter.mitarbeiter} testid="zutun">
      {zeilen.length === 0 ? (
        <div className="flex items-center gap-3 py-6" data-testid="zutun-leer">
          <span className="grid size-8 place-items-center rounded-full bg-(--color-bo-travertin-soft) text-(--color-bo-travertin-text)">
            <Haken groesse={18} />
          </span>
          <p className="bo-mar-unter">{START.nichtsWartet}</p>
        </div>
      ) : (
        <ul className="bo-mar-zutun mt-1">
          {zeilen.slice(0, 7).map((z) => (
            <li key={z.id} className="bo-mar-zutun__zeile" data-ton={z.ton} data-testid={`zutun-${z.id}`}>
              <span className="bo-mar-zutun__ico" aria-hidden="true">
                <Icon name={z.icon || "Info"} className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-5">{z.satz}</span>
                {z.zeit && <span className="bo-mar-klein">{kurzDatum(z.zeit, { zeit: true })}</span>}
              </span>
              <span className="bo-mar-zutun__knoepfe">
                {(z.knoepfe || []).slice(0, 2).map((k) => (
                  <Knopf key={k.titel} size="s" variant="secondary" href={k.href}>
                    {k.titel}
                  </Knopf>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export function ErsteSchritteKachel({ stand, className }) {
  return (
    <Kachel className={className} titel={START.ersteSchritte} unter={START.ersteSchritteUnter} testid="erste-schritte">
      <ul className="bo-mar-check mt-2">
        <Pruefzeile ok={stand.ausgabe} text={START.schritte.ausgabe} href="/marketing/newsletter?neu=ausgabe" />
        <Pruefzeile ok={stand.event} text={START.schritte.event} href="/marketing/events?neu=event" />
        <Pruefzeile ok={stand.beitrag} text={START.schritte.beitrag} href="/marketing/social?neu=beitrag" />
      </ul>
    </Kachel>
  );
}

export function NaechsteAusgabeKarte({ ausgabe, naechsterMonat, darfAnlegen, className }) {
  if (!ausgabe) {
    return (
      <Kachel className={className} titel={START.naechsteAusgabe} testid="karte-ausgabe">
        <p className="bo-mar-unter mt-2">{START.keineAusgabe(naechsterMonat)}</p>
        {darfAnlegen && (
          <div className="mt-4">
            <Knopf href="/marketing/newsletter?neu=ausgabe" icon="Plus">
              {START.ausgabeAnlegen}
            </Knopf>
          </div>
        )}
      </Kachel>
    );
  }
  const b = ausgabe.bereit;
  return (
    <Kachel className={className} titel={START.naechsteAusgabe} unter={monatAusSlug(ausgabe.slug)} href={`/marketing/newsletter/${encodeURIComponent(ausgabe.name)}`} oeffnenLabel={`Ausgabe ${monatAusSlug(ausgabe.slug)} öffnen`} lift testid="karte-ausgabe">
      <p className="mt-1 text-[22px] font-semibold leading-7 tracking-[-0.015em]">{ausgabe.betreff && ausgabe.betreff !== "(ohne Betreff)" ? `„${ausgabe.betreff}“` : "Betreff fehlt"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Status gruppe="ausgabe" wert={ausgabe.status} />
        <span className={b.bereit ? "bo-mar-ok text-[13px] font-medium" : "bo-mar-warn text-[13px] font-medium"}>{b.bereit ? `${START.bereit} · ${b.ok} von ${b.gesamt}` : START.nichtBereit(b.fehlt)}</span>
      </div>
      <p className="bo-mar-unter mt-3">
        {ausgabe.versand_geplant ? `Versand ${kurzDatum(ausgabe.versand_geplant, { zeit: true })}` : "Versand noch nicht geplant"}
        {ausgabe.empfaenger_anzahl ? ` · ${START.empfaenger(ausgabe.empfaenger_anzahl)}` : ""}
      </p>
    </Kachel>
  );
}

export function DieseWocheKarte({ eintraege = [], className }) {
  return (
    <Kachel className={className} titel={START.dieseWoche} unter={START.dieseWocheUnter} href="/marketing/social" oeffnenLabel={START.kalenderOeffnen} testid="karte-woche">
      {eintraege.length === 0 ? (
        <p className="bo-mar-unter mt-2">{START.dieseWocheLeer}</p>
      ) : (
        <ul className="bo-mar-agenda mt-1">
          {eintraege.slice(0, 5).map((e) => {
            const d = alsDatum(e.datum);
            return (
              <li key={`${e.art}-${e.name}`}>
                <Link href={e.art === "event" ? `/marketing/events/${encodeURIComponent(e.name)}` : `/marketing/social/${encodeURIComponent(e.name)}`}>
                  <span className="bo-mar-agenda__tag">
                    {d ? `${WOCHENTAGE_KURZ[d.getDay()]} ${d.getDate()}.` : "–"}
                    <small>{uhrzeit(e.zeit) || (e.art === "event" ? "Event" : e.kanal)}</small>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{e.titel}</span>
                    <span className="bo-mar-klein">{e.art === "event" ? "Event" : `${e.kanal}${e.wartet ? " · wartet auf Freigabe" : ""}`}</span>
                  </span>
                  <Status gruppe={e.art === "event" ? "event" : "social"} wert={e.wartet ? "Wartet" : e.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Kachel>
  );
}

export function NaechstesEventKarte({ event, darfAnlegen, className }) {
  if (!event) {
    return (
      <Kachel className={className} titel={START.naechstesEvent} testid="karte-event">
        <p className="bo-mar-unter mt-2">{START.keinEvent}</p>
        {darfAnlegen && (
          <div className="mt-4">
            <Knopf href="/marketing/events?neu=event" icon="Plus">
              {START.eventAnlegen}
            </Knopf>
          </div>
        )}
      </Kachel>
    );
  }
  const p = event.plaetze;
  return (
    <Kachel className={className} titel={START.naechstesEvent} unter={`${kurzDatum(event.datum)}${event.uhrzeit_von ? ` · ${uhrzeit(event.uhrzeit_von)}` : ""}`} testid="karte-event">
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-semibold leading-7 tracking-[-0.015em]">{event.titel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Status gruppe="event" wert={event.status} />
            <span className="bo-mar-unter tabular-nums">{START.plaetze(p.belegt, p.kapazitaet)}</span>
          </div>
          {p.kapazitaet ? <Balken className="mt-3 max-w-[360px]" anteil={p.anteil} ton={p.anteil >= 1 ? "warn" : undefined} label={START.plaetze(p.belegt, p.kapazitaet)} /> : null}
        </div>
        {event.heute ? (
          <Knopf icon="ScanLine" href={`/checkin/${encodeURIComponent(event.name)}`}>
            {START.checkinOeffnen}
          </Knopf>
        ) : ["Offen", "Ausgebucht"].includes(event.status) ? (
          <Knopf icon="UserPlus" href={`/marketing/events/${encodeURIComponent(event.name)}?dialog=anmeldung`}>
            {START.anmeldungErfassen}
          </Knopf>
        ) : (
          <Knopf href={`/marketing/events/${encodeURIComponent(event.name)}`}>Öffnen</Knopf>
        )}
      </div>
    </Kachel>
  );
}

/** „Mehr Zahlen“ – Abos je Woche (Balken), Abos nach Quelle (horizontal, Top 4 + Sonstige), Einwilligungen nach Zweck. */
export function MehrZahlenInhalt({ daten }) {
  if (!daten) return <p className="bo-mar-unter">Nicht geladen – Seite neu laden.</p>;
  const maxQ = Math.max(1, ...daten.quellen.map((q) => q.wert));
  const maxZ = Math.max(1, ...daten.zwecke.map((q) => q.wert));
  return (
    <div className="grid grid-cols-1 gap-(--bo-bento-gap) lg:grid-cols-3" data-testid="mehr-zahlen">
      <ChartBalken titel={START.abosJeWoche} untertitel="Anmeldungen, letzte 12 Wochen" punkte={daten.wochen} hervorheben={daten.wochen.length - 2} laufend="letzter" hoehe={160} />
      <Kachel titel={START.abosNachQuelle} unter="Aktive Abos">
        <ul className="mt-2 flex flex-col gap-3">
          {daten.quellen.map((q) => (
            <li key={q.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="text-[14px]">{QUELLE_TEXT[q.label] || q.label}</span>
              <span className="bo-mar-zahl text-[14px] font-medium">{q.wert}</span>
              <Balken className="col-span-2" anteil={q.wert / maxQ} label={`${QUELLE_TEXT[q.label] || q.label}: ${q.wert}`} />
            </li>
          ))}
        </ul>
      </Kachel>
      <Kachel titel={START.einwilligungenNachZweck} unter={daten.quote != null ? `${START.bestaetigungsquote}: ${daten.quote} %` : "Bestätigte Einwilligungen"}>
        <ul className="mt-2 flex flex-col gap-3">
          {daten.zwecke.slice(0, 6).map((q) => (
            <li key={q.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <Link className="bo-mar-link text-[14px]" href={`/marketing/empfaenger?ansicht=einwilligungen&zweck=${encodeURIComponent(q.label)}`}>
                {ZWECK_TEXT[q.label] || q.label}
              </Link>
              <span className="bo-mar-zahl text-[14px] font-medium">{q.wert}</span>
              <Balken className="col-span-2" anteil={q.wert / maxZ} label={`${ZWECK_TEXT[q.label] || q.label}: ${q.wert}`} />
            </li>
          ))}
        </ul>
      </Kachel>
    </div>
  );
}

export function AusgabeBild({ src }) {
  return <Bild src={src} groesse={48} />;
}

export const STATUS_AUSGABE = STATUS_TEXT.ausgabe;
