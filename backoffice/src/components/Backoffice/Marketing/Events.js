"use client";
// Events (10-konzept-marketing § 2.8): Kopf-Aktionen je Status (Veröffentlichen … · Anmeldung erfassen · Check-in öffnen ·
// Teilnehmerliste), `⋯` mit Erinnerung, Als ausgebucht (verzögert), Wieder öffnen, Verschieben (gesperrt bis Backend),
// Absagen und informieren (rot), Einladung an Zielgruppe (gesperrt bis P0-1), Druck. Anmeldung D5 ohne Werbe-Einwilligung
// (R1). Anmeldungen mit Status-Chips und Zeilenmenü, Warteliste mit Nachrücken. Eckdaten-Formular, Neues Event.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import Schalter from "../Schalter";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import useAktion from "./useAktion";
import { Status } from "./Bausteine";
import {
  erinnerungAction, eventAbsagenAction, eventAnlegenAction, eventAnmeldungAction, eventSpeichernAction, eventWorkflowAction, nachrueckenAction, teilnehmerStatusAction,
} from "@/lib/backoffice/marketing/actions";
import { anmeldungPruefen, checkinListe, nachruecker, personenVon, uhrzeit } from "@/lib/backoffice/marketing/regeln";
import { ANMELDUNG_EVENT, EVENTS, EVENT_ART, QUELLE_TEXT, STATUS_TEXT } from "@/lib/backoffice/marketing/texte";

const druck = (name, format) => `/druck/ph-event/${encodeURIComponent(name)}?format=${encodeURIComponent(format)}`;

export function EventAktionen({ ev, primaer, leitung, team, faehig, dialog }) {
  const router = useRouter();
  const [offen, setOffen] = useState(dialog === "anmeldung" ? "anmeldung" : null);
  const [grund, setGrund] = useState("");
  const [auchErinnerte, setAuchErinnerte] = useState(false);
  const { sofort, verzoegert, laeuft } = useAktion();
  const offeneErinnerung = (ev.anmeldungen || []).filter((a) => ["angemeldet", "bestaetigt"].includes(a.status) && a.email && !a.erinnerung_gesendet_am).length;
  const erinnerte = (ev.anmeldungen || []).filter((a) => a.erinnerung_gesendet_am && ["angemeldet", "bestaetigt"].includes(a.status)).length;
  const mitMail = (ev.anmeldungen || []).filter((a) => a.status !== "abgesagt" && a.email).length;
  const ohneMail = (ev.anmeldungen || []).filter((a) => a.status !== "abgesagt" && !a.email).length;
  useKuerzel("akte@marketing", { "marketing.akte-anmeldung": () => team && ["Offen", "Ausgebucht"].includes(ev.status) && setOffen("anmeldung") });

  const prim = (() => {
    if (!primaer) return null;
    if (primaer.id === "veroeffentlichen" && leitung) return <span className="inline-flex flex-col items-end"><Knopf variant="primary" disabled={primaer.gesperrt} onClick={() => setOffen("veroeffentlichen")} data-testid="primaer-veroeffentlichen">{EVENTS.veroeffentlichen}</Knopf>{primaer.gesperrt && <span className="bo-mar-klein bo-mar-warn mt-1">{EVENTS.zuerstUhrzeit}</span>}</span>;
    if (primaer.id === "anmeldung" && team) return <Knopf variant="primary" icon="UserPlus" onClick={() => setOffen("anmeldung")} data-testid="primaer-anmeldung">{EVENTS.anmeldungErfassen}</Knopf>;
    if (primaer.id === "checkin") return <Knopf variant="primary" icon="ScanLine" href={`/checkin/${encodeURIComponent(ev.name)}`} data-testid="primaer-checkin">{EVENTS.checkinOeffnen}</Knopf>;
    if (primaer.id === "teilnehmerliste") return <Knopf variant="primary" icon="Printer" href={druck(ev.name, "PH Event Teilnehmerliste")}>{EVENTS.teilnehmerliste}</Knopf>;
    return null;
  })();

  return (
    <div className="bo-mar-aktionen">
      {primaer?.id === "checkin" && team && <Knopf icon="UserPlus" onClick={() => setOffen("anmeldung")}>{EVENTS.anmeldungErfassen}</Knopf>}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" data-testid="event-menue" />}>
        {team && ["Offen", "Ausgebucht"].includes(ev.status) && <MenuePunkt icon="Bell" onWaehlen={() => setOffen("erinnerung")}>{EVENTS.erinnerungSenden}</MenuePunkt>}
        {team && ev.status === "Offen" && <MenuePunkt icon="Lock" onWaehlen={() => verzoegert(() => eventWorkflowAction({ name: ev.name, aktion: "Als ausgebucht markieren" }), { text: EVENTS.ausgebuchtToast(ev.titel) })}>{EVENTS.ausgebucht}</MenuePunkt>}
        {ev.status === "Ausgebucht" && <MenuePunkt icon="RotateCcw" deaktiviert={!leitung} grund={!leitung ? "Nur Leitung Marketing" : undefined} onWaehlen={() => sofort(() => eventWorkflowAction({ name: ev.name, aktion: "Wieder öffnen" }), { ok: "Event wieder geöffnet" })}>{EVENTS.wiederOeffnen}</MenuePunkt>}
        {["Geplant", "Offen", "Ausgebucht"].includes(ev.status) && <MenuePunkt icon="Calendar" deaktiviert grund={leitung ? (faehig.verschieben ? undefined : "Noch nicht verfügbar – Teilnehmerliste drucken und informieren") : "Nur Leitung Marketing"}>{EVENTS.verschieben}</MenuePunkt>}
        {["Geplant", "Offen"].includes(ev.status) && <MenuePunkt icon="Users" deaktiviert grund={faehig.einladungen ? "Nur Leitung Marketing" : EVENTS.einladungGesperrt}>{EVENTS.einladung}</MenuePunkt>}
        <MenueTrenner />
        <MenuePunkt icon="Printer" href={druck(ev.name, "PH Event Teilnehmerliste")}>{EVENTS.teilnehmerliste}</MenuePunkt>
        <MenuePunkt icon="Ticket" href={druck(ev.name, "PH Event Namensschilder")}>{EVENTS.namensschilder}</MenuePunkt>
        {["Geplant", "Offen", "Ausgebucht"].includes(ev.status) && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="CircleX" gefaehrlich deaktiviert={!leitung} grund={!leitung ? "Nur Leitung Marketing" : undefined} onWaehlen={() => setOffen("absagen")}>{EVENTS.absagen}</MenuePunkt>
          </>
        )}
      </Menue>
      {prim}
      {offen === "anmeldung" && <AnmeldungDialog ev={ev} faehig={faehig} onSchliessen={() => { setOffen(null); router.replace(`/marketing/events/${encodeURIComponent(ev.name)}`, { scroll: false }); }} />}
      <Bestaetigen offen={offen === "veroeffentlichen"} titel={EVENTS.veroeffentlichenTitel(ev.titel)} text="Danach ist die Anmeldung auf der Website offen." bestaetigen="Veröffentlichen" laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => eventWorkflowAction({ name: ev.name, aktion: "Veröffentlichen" }), { ok: EVENTS.veroeffentlicht(ev.titel) }); setOffen(null); }} />
      <Dialog
        offen={offen === "erinnerung"}
        onSchliessen={() => setOffen(null)}
        titel={EVENTS.erinnerungTitel(offeneErinnerung + (auchErinnerte ? erinnerte : 0))}
        groesse="sm"
        fuss={<><Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} disabled={laeuft || offeneErinnerung + (auchErinnerte ? erinnerte : 0) === 0} onClick={async () => { const r = await sofort(() => erinnerungAction({ event: ev.name, alle: auchErinnerte }), { ok: (x) => EVENTS.erinnerungGesendet(x.anzahl) }); if (r?.ok) setOffen(null); }}>Senden</Knopf></>}
      >
        {erinnerte > 0 ? <Schalter label={EVENTS.erinnerungAuch(erinnerte)} an={auchErinnerte} onWechsel={setAuchErinnerte} /> : <p className="bo-mar-unter">Die Erinnerung geht an alle Angemeldeten mit E-Mail.</p>}
      </Dialog>
      <Dialog
        offen={offen === "absagen"}
        onSchliessen={() => setOffen(null)}
        titel={EVENTS.absagenTitel(ev.titel)}
        text={faehig.absage ? EVENTS.absagenFakten(mitMail, ohneMail) : EVENTS.absagenOhneMail}
        groesse="sm"
        art="bestaetigen"
        rolle="alertdialog"
        fuss={<><Knopf onClick={() => setOffen(null)} autoFocus>Abbrechen</Knopf><Knopf variant="danger-solid" laedt={laeuft} disabled={laeuft || grund.trim().length < 3} onClick={async () => { const r = await sofort(() => eventAbsagenAction({ event: ev.name, grund }), { ok: EVENTS.abgesagt(ev.titel) }); if (r?.ok) setOffen(null); }}>{EVENTS.absagenKnopf}</Knopf></>}
      >
        <label className="bo-mar-feld">
          <span>Grund (geht an die Gäste)</span>
          <input className="bo-mar-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} />
        </label>
        {ohneMail > 0 && <p className="bo-mar-klein mt-3"><Link className="underline" href={druck(ev.name, "PH Event Teilnehmerliste")}>Telefonliste drucken</Link></p>}
      </Dialog>
    </div>
  );
}

/** D5 – Anmeldung erfassen: speichert nur die Teilnahme; Einladungs-Schalter erst mit S3 (bis dahin ausgeblendet + Satz). */
export function AnmeldungDialog({ ev, faehig, onSchliessen }) {
  const [w, setW] = useState({ name_person: "", email: "", telefon: "", personen: 1, quelle: "telefon", nachricht: "", einladungenOk: false });
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const max = Number(ev.max_personen_je_anmeldung || 10);
  const vor = anmeldungPruefen(ev, { email: w.email, personen: w.personen });
  const senden = async () => {
    const r = await sofort(() => eventAnmeldungAction({ event: ev.name, ...w }), { ok: (x) => (x.status === "warteliste" ? ANMELDUNG_EVENT.warteliste : x.email ? ANMELDUNG_EVENT.ok(x.email.replace(/^(.).*@/, "$1…@")) : ANMELDUNG_EVENT.okOhneMail) });
    if (r?.ok) onSchliessen();
    else setFehler(r?.fehler || {});
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={ANMELDUNG_EVENT.titel(ev.titel)}
      groesse="md"
      testid="event-anmeldung"
      fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" onClick={senden} laedt={laeuft} disabled={laeuft || vor.art === "nicht_offen"} data-testid="anmeldung-anmelden">{vor.art === "warteliste" ? "Auf Warteliste setzen" : ANMELDUNG_EVENT.knopf}</Knopf></>}
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); senden(); }}>
        {vor.art === "nicht_offen" && <p className="bo-mar-warn text-[14px]">{ANMELDUNG_EVENT.nichtOffen}</p>}
        <div className="bo-mar-felder">
          <label className="bo-mar-feld voll">
            <span>{ANMELDUNG_EVENT.name}</span>
            <input className="bo-mar-eingabe" autoFocus value={w.name_person} onChange={(e) => setW({ ...w, name_person: e.target.value })} aria-invalid={fehler.name_person ? "true" : undefined} data-testid="anmeldung-name" />
            {fehler.name_person && <span className="bo-mar-feld__fehler">{fehler.name_person}</span>}
          </label>
          <label className="bo-mar-feld">
            <span>{ANMELDUNG_EVENT.email}</span>
            <input className="bo-mar-eingabe" type="email" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} aria-invalid={fehler.email ? "true" : undefined} data-testid="anmeldung-email" />
            {fehler.email ? <span className="bo-mar-feld__fehler">{fehler.email}</span> : vor.art === "doppelt" ? <span className="bo-mar-feld__hinweis bo-mar-warn">{ANMELDUNG_EVENT.schon(vor.personen)}</span> : <span className="bo-mar-feld__hinweis">{faehig.ohneEmail ? "" : ANMELDUNG_EVENT.nurDieserAbend}</span>}
          </label>
          <label className="bo-mar-feld">
            <span>{ANMELDUNG_EVENT.telefon}</span>
            <input className="bo-mar-eingabe" type="tel" value={w.telefon} onChange={(e) => setW({ ...w, telefon: e.target.value })} />
          </label>
          <div className="bo-mar-feld">
            <span id="anm-p">{ANMELDUNG_EVENT.personen}</span>
            <span className="inline-flex items-center gap-2" role="group" aria-labelledby="anm-p">
              <Knopf size="s" icon="Minus" label="Weniger" onClick={() => setW({ ...w, personen: Math.max(1, w.personen - 1) })} />
              <span className="min-w-8 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">{w.personen}</span>
              <Knopf size="s" icon="Plus" label="Mehr" disabled={w.personen >= max} onClick={() => setW({ ...w, personen: Math.min(max, w.personen + 1) })} />
            </span>
            {(fehler.personen || vor.art === "ausgebucht") && <span className="bo-mar-feld__fehler">{fehler.personen || ANMELDUNG_EVENT.ausgebucht}</span>}
            {vor.art === "warteliste" && <span className="bo-mar-feld__hinweis bo-mar-warn">Kein Platz frei – die Anmeldung kommt auf die Warteliste.</span>}
          </div>
          <label className="bo-mar-feld">
            <span>{ANMELDUNG_EVENT.quelle}</span>
            <select className="bo-mar-eingabe" value={w.quelle} onChange={(e) => setW({ ...w, quelle: e.target.value })}>
              {Object.entries(ANMELDUNG_EVENT.quellen).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="bo-mar-feld voll">
            <span>{ANMELDUNG_EVENT.nachricht}</span>
            <input className="bo-mar-eingabe" value={w.nachricht} onChange={(e) => setW({ ...w, nachricht: e.target.value })} />
          </label>
        </div>
        {faehig.einladungen ? (
          <div>
            <Schalter label={ANMELDUNG_EVENT.einladungenJa} an={w.einladungenOk} onWechsel={(v) => setW({ ...w, einladungenOk: v })} />
            {w.einladungenOk && <p className="bo-mar-klein mt-1">{ANMELDUNG_EVENT.einladungenSatz}</p>}
          </div>
        ) : (
          <p className="bo-mar-unter" data-testid="nur-dieser-abend">{ANMELDUNG_EVENT.nurDieserAbend}{!faehig.ohneEmail ? ` ${ANMELDUNG_EVENT.emailPflicht}` : ""}</p>
        )}
      </form>
    </Dialog>
  );
}

const STATUS_WAHL = ["bestaetigt", "erschienen", "nicht erschienen", "abgesagt", "angemeldet"];

export function AnmeldungenTabelle({ ev, team, faehig, statusFilter }) {
  const { sofort, laeuft } = useAktion();
  const [nachr, setNachr] = useState(null);
  const [q, setQ] = useState("");
  const zeilen = (ev.anmeldungen || []).filter((a) => a.status !== "warteliste");
  const warte = (ev.anmeldungen || []).filter((a) => a.status === "warteliste").sort((a, b) => String(a.angemeldet_am).localeCompare(String(b.angemeldet_am)));
  const zaehler = {};
  for (const a of zeilen) zaehler[a.status] = (zaehler[a.status] || 0) + 1;
  const passend = new Set(nachruecker(ev).map((a) => a.name));
  const sicht = zeilen.filter((a) => (!statusFilter || a.status === statusFilter) && (!q || `${a.name_person} ${a.email} ${a.telefon}`.toLowerCase().includes(q.toLowerCase())));
  const personen = zeilen.filter((a) => a.status !== "abgesagt").reduce((s, a) => s + personenVon(a), 0);
  const setze = (zeile, status) => sofort(() => teilnehmerStatusAction({ event: ev.name, zeilen: [zeile.name], status }), { ok: EVENTS.statusGesetzt(zeile.name_person, STATUS_TEXT.anmeldung[status]) });
  useKuerzel("akte@marketing", { "marketing.akte-nachruecken": () => team && warte[0] && setNachr(warte[0]) });
  return (
    <div className="flex flex-col gap-(--bo-bento-gap)">
      <section className="bo-kachel bo-mar-liste" aria-label="Anmeldungen" data-testid="anmeldungen">
        <div className="bo-mar-liste__kopf flex-wrap">
          <span className="flex flex-wrap gap-2">
            <Link className="bo-mar-chip" aria-pressed={!statusFilter} href={`?tab=anmeldungen`}>Alle {zeilen.length}</Link>
            {["angemeldet", "bestaetigt", "erschienen", "nicht erschienen", "abgesagt"].filter((s) => zaehler[s]).map((s) => (
              <Link key={s} className="bo-mar-chip" aria-pressed={statusFilter === s} href={`?tab=anmeldungen&status=${encodeURIComponent(s)}`}>{STATUS_TEXT.anmeldung[s]} {zaehler[s]}</Link>
            ))}
          </span>
          <label className="bo-suche bo-mar-suche">
            <span className="sr-only">Suche</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, E-Mail, Telefon" />
          </label>
        </div>
        {zeilen.length === 0 ? (
          <p className="bo-mar-unter px-3 py-6">{EVENTS.anmeldungenLeer}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="bo-mar-tabelle">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="r">Personen</th>
                  <th scope="col" className="max-md:hidden">Quelle</th>
                  <th scope="col" className="max-md:hidden">Angemeldet</th>
                  <th scope="col" className="max-lg:hidden">Bestätigung</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Aktionen</span></th>
                </tr>
              </thead>
              <tbody>
                {sicht.map((a) => (
                  <tr key={a.name} data-gedimmt={a.status === "abgesagt" ? "true" : undefined} data-testid="anmeldung-zeile">
                    <td>
                      <span className="bo-mar-titel">{a.name_person}</span>
                      <p className="bo-mar-unter">{[a.email, a.telefon, a.nachricht ? `„${a.nachricht}“` : ""].filter(Boolean).join(" · ") || "–"}</p>
                    </td>
                    <td className="r bo-mar-zahl">{personenVon(a)}</td>
                    <td className="max-md:hidden bo-mar-unter">{QUELLE_TEXT[a.quelle] || a.quelle}</td>
                    <td className="max-md:hidden bo-mar-unter whitespace-nowrap">{String(a.angemeldet_am || "").slice(8, 10)}.{String(a.angemeldet_am || "").slice(5, 7)}.</td>
                    <td className="max-lg:hidden bo-mar-unter">{a.email ? (a.bestaetigung_gesendet_am ? "gesendet" : "–") : EVENTS.keineEmail}</td>
                    <td><Status gruppe="anmeldung" wert={a.status} /></td>
                    <td className="w-12">
                      {team && (
                        <Menue label={`Aktionen ${a.name_person}`} ausloeser={(p) => <Knopf {...p} size="s" variant="ghost" icon="Ellipsis" label={`Aktionen ${a.name_person}`} />}>
                          {STATUS_WAHL.filter((s) => s !== a.status).map((s) => <MenuePunkt key={s} onWaehlen={() => setze(a, s)}>{STATUS_TEXT.anmeldung[s]}</MenuePunkt>)}
                          <MenueTrenner />
                          <MenuePunkt icon="Users" deaktiviert grund={faehig.personenAendern ? undefined : "Noch nicht verfügbar – am Eingang über „Personen …“"}>{EVENTS.personenAendern}</MenuePunkt>
                          {a.kontakt && <MenuePunkt icon="Contact" href={`/kunden/${encodeURIComponent(a.kontakt)}`}>Kundenakte</MenuePunkt>}
                          <MenuePunkt icon="Ticket" href={druck(ev.name, "PH Event Ticket")}>Ticket mit Code</MenuePunkt>
                        </Menue>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={7}>{EVENTS.summe(zeilen.filter((a) => a.status !== "abgesagt").length, personen)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
      <section className="bo-kachel" style={{ padding: 24 }} aria-labelledby="ws-t" data-testid="warteliste">
        <h2 id="ws-t" className="bo-titel-kachel">{EVENTS.wartelisteTitel} <span className="bo-mar-unter">{warte.length}</span></h2>
        {Number(ev.nachruecken_automatisch || 0) ? <p className="bo-mar-unter mt-1">{EVENTS.automatischNachruecken}</p> : null}
        {warte.length === 0 ? (
          <p className="bo-mar-unter mt-3">{EVENTS.wartelisteLeer}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {warte.map((a, i) => (
              <li key={a.name} className="flex flex-wrap items-center gap-3 rounded-[16px] bg-(--color-bo-surface-2) px-4 py-3">
                <span className="bo-mar-zahl bo-mar-unter">{i + 1}.</span>
                <span className="min-w-0 flex-1"><span className="font-medium">{a.name_person}</span> <span className="bo-mar-unter">· {personenVon(a)} {personenVon(a) === 1 ? "Person" : "Personen"}</span></span>
                {team && !Number(ev.nachruecken_automatisch || 0) && (
                  faehig.nachruecken ? (
                    <Knopf size="s" disabled={!passend.has(a.name)} grund={!passend.has(a.name) ? "Nicht genug Plätze frei" : undefined} onClick={() => setNachr(a)}>{EVENTS.nachruecken}</Knopf>
                  ) : (
                    <Knopf size="s" onClick={() => setze(a, "angemeldet")}>Auf „angemeldet“ setzen</Knopf>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Bestaetigen
        offen={!!nachr}
        titel={nachr ? EVENTS.nachrueckenTitel(nachr.name_person, personenVon(nachr)) : ""}
        bestaetigen={EVENTS.nachrueckenKnopf}
        laeuft={laeuft}
        onAbbrechen={() => setNachr(null)}
        onBestaetigen={async () => { await sofort(() => nachrueckenAction({ event: ev.name }), { ok: EVENTS.nachgerueckt(nachr.name_person) }); setNachr(null); }}
      />
    </div>
  );
}

export function EventEckdaten({ ev, darf, kampagnen = [] }) {
  const [w, setW] = useState({ titel: ev.titel || "", art: ev.art || "", datum: ev.datum || "", uhrzeit_von: uhrzeit(ev.uhrzeit_von), uhrzeit_bis: uhrzeit(ev.uhrzeit_bis), ort: ev.ort || "", url: ev.url || "", kapazitaet: ev.kapazitaet || "", warteliste: !!Number(ev.warteliste || 0), max_personen_je_anmeldung: ev.max_personen_je_anmeldung || 10, nachruecken_automatisch: !!Number(ev.nachruecken_automatisch || 0), programm: (ev.programm || "").replace(/<[^>]*>/g, ""), beschreibung: ev.beschreibung || "", kampagne: ev.kampagne || "", loeschfrist_monate: ev.loeschfrist_monate || 3, einwilligung_textversion: ev.einwilligung_textversion || "", fotos_hinweis: ev.fotos_hinweis || "", erinnerung_tage_vorher: ev.erinnerung_tage_vorher || 2 });
  const [geaendert, setGeaendert] = useState(false);
  const { sofort, laeuft } = useAktion();
  const set = (k, v) => { setW({ ...w, [k]: v }); setGeaendert(true); };
  const F = EVENTS.felder;
  const feld = (k, typ = "text", extra = {}) => (
    <label className={`bo-mar-feld ${extra.voll ? "voll" : ""}`}>
      <span>{F[k]}</span>
      {typ === "textarea" ? <textarea className="bo-mar-eingabe" value={w[k]} disabled={!darf} onChange={(e) => set(k, e.target.value)} rows={3} /> : <input className="bo-mar-eingabe" type={typ} inputMode={typ === "number" ? "numeric" : undefined} value={w[k]} disabled={!darf} onChange={(e) => set(k, e.target.value)} placeholder={extra.platzhalter} />}
      {extra.hinweis && <span className="bo-mar-feld__hinweis">{extra.hinweis}</span>}
    </label>
  );
  return (
    <form className="bo-mar-stapel" onSubmit={(e) => { e.preventDefault(); sofort(() => eventSpeichernAction({ name: ev.name, werte: { ...w, programm: w.programm ? `<p>${w.programm}</p>` : "" } }), { ok: "Eckdaten gespeichert", onOk: () => setGeaendert(false) }); }} data-testid="eckdaten">
      {ev.status === "Geplant" && <p className="bo-mar-band" data-ton="info">{EVENTS.eckdatenHinweis}</p>}
      <section className="bo-kachel" style={{ padding: 24 }}>
        <div className="bo-mar-felder">
          {feld("titel", "text", { voll: true })}
          <label className="bo-mar-feld"><span>{F.art}</span><select className="bo-mar-eingabe" value={w.art} disabled={!darf} onChange={(e) => set("art", e.target.value)}>{EVENT_ART.map((a) => <option key={a}>{a}</option>)}</select></label>
          <div className="bo-mar-feld"><span id="ev-d">{F.datum}</span><Datumsfeld value={w.datum} onChange={(v) => set("datum", v)} disabled={!darf} aria-label={F.datum} /></div>
          {feld("uhrzeit_von", "time")}
          {feld("uhrzeit_bis", "time")}
          {feld("ort", "text", { voll: true })}
          {feld("url", "url")}
          {feld("kapazitaet", "number", { hinweis: EVENTS.plaetzeHinweis })}
          {feld("max_personen_je_anmeldung", "number")}
          {feld("erinnerung_tage_vorher", "number")}
          <div className="bo-mar-feld voll flex-row! flex-wrap gap-6!">
            <Schalter label={F.warteliste} an={w.warteliste} onWechsel={(v) => set("warteliste", v)} deaktiviert={!darf} />
            <Schalter label={F.nachruecken_automatisch} an={w.nachruecken_automatisch} onWechsel={(v) => set("nachruecken_automatisch", v)} deaktiviert={!darf} />
            <Schalter label={EVENTS.kostenlos} an deaktiviert beschreibung={EVENTS.kostenbeitragSpaeter} />
          </div>
          {feld("programm", "textarea", { voll: true, hinweis: EVENTS.programmHinweis })}
          {feld("beschreibung", "textarea", { voll: true })}
          <label className="bo-mar-feld"><span>{F.kampagne}</span><select className="bo-mar-eingabe" value={w.kampagne} disabled={!darf} onChange={(e) => set("kampagne", e.target.value)}><option value="">Keine</option>{kampagnen.map((k) => <option key={k.name} value={k.name}>{k.titel}</option>)}</select></label>
        </div>
      </section>
      <section className="bo-kachel" style={{ padding: 24 }}>
        <h2 className="bo-titel-kachel">{EVENTS.datenschutz}</h2>
        <div className="bo-mar-felder mt-4">
          {feld("einwilligung_textversion")}
          {feld("loeschfrist_monate", "number", { hinweis: EVENTS.loeschfrist(w.loeschfrist_monate) })}
          {feld("fotos_hinweis", "text", { voll: true })}
        </div>
        <p className="bo-mar-klein mt-3">{EVENTS.nachweisSatzVorher}</p>
      </section>
      {darf && (
        <div className={`bo-mar-auswahl bo-material-stark ${geaendert ? "" : "opacity-70"}`}>
          <span className="bo-mar-auswahl__zahl">{geaendert ? "Ungespeichert" : "Keine Änderungen"}</span>
          <Knopf type="submit" variant="primary" size="s" laedt={laeuft} disabled={!geaendert || laeuft} data-testid="eckdaten-speichern">Speichern</Knopf>
        </div>
      )}
    </form>
  );
}

export function EventAnlegenDialog({ onSchliessen }) {
  const router = useRouter();
  const [w, setW] = useState({ titel: "", art: "Abend im Showroom", datum: "", uhrzeit_von: "", kapazitaet: "", warteliste: false, max_personen_je_anmeldung: 10, nachruecken_automatisch: true, erinnerung_tage_vorher: 2, einwilligung_textversion: "event-2026-10", loeschfrist_monate: 3, fotos_hinweis: "" });
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const los = async () => {
    const r = await sofort(() => eventAnlegenAction(w), { ok: EVENTS.angelegt(w.titel), neuLaden: false });
    if (r?.ok) router.push(`/marketing/events/${encodeURIComponent(r.name)}?tab=eckdaten`);
    else setFehler(r?.fehler || {});
  };
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={EVENTS.neu} groesse="lg" testid="event-anlegen" fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" onClick={los} laedt={laeuft} disabled={laeuft}>{EVENTS.anlegenFuss}</Knopf></>}>
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="bo-mar-titel mb-3">Eckdaten</h3>
          <div className="bo-mar-felder">
            <label className="bo-mar-feld voll"><span>Titel</span><input className="bo-mar-eingabe" autoFocus value={w.titel} onChange={(e) => setW({ ...w, titel: e.target.value })} aria-invalid={fehler.titel ? "true" : undefined} />{fehler.titel && <span className="bo-mar-feld__fehler">{fehler.titel}</span>}</label>
            <label className="bo-mar-feld"><span>Art</span><select className="bo-mar-eingabe" value={w.art} onChange={(e) => setW({ ...w, art: e.target.value })}>{EVENT_ART.map((a) => <option key={a}>{a}</option>)}</select></label>
            <div className="bo-mar-feld"><span>Datum</span><Datumsfeld value={w.datum} onChange={(v) => setW({ ...w, datum: v })} invalid={!!fehler.datum} aria-label="Datum" />{fehler.datum && <span className="bo-mar-feld__fehler">{fehler.datum}</span>}</div>
            <label className="bo-mar-feld"><span>Uhrzeit (optional)</span><input className="bo-mar-eingabe" type="time" value={w.uhrzeit_von} onChange={(e) => setW({ ...w, uhrzeit_von: e.target.value })} /></label>
            <label className="bo-mar-feld"><span>Plätze</span><input className="bo-mar-eingabe" inputMode="numeric" value={w.kapazitaet} onChange={(e) => setW({ ...w, kapazitaet: e.target.value })} /><span className="bo-mar-feld__hinweis">{EVENTS.plaetzeHinweis}</span></label>
            <div className="bo-mar-feld voll flex-row! flex-wrap gap-6!">
              <Schalter label="Warteliste erlauben" an={w.warteliste} onWechsel={(v) => setW({ ...w, warteliste: v })} />
              <Schalter label="Automatisch nachrücken" an={w.nachruecken_automatisch} onWechsel={(v) => setW({ ...w, nachruecken_automatisch: v })} />
              <Schalter label={EVENTS.kostenlos} an deaktiviert beschreibung={EVENTS.kostenbeitragSpaeter} />
            </div>
          </div>
        </section>
        <section>
          <h3 className="bo-mar-titel mb-1">Mails</h3>
          <p className="bo-mar-unter">Bestätigung, Erinnerung ({w.erinnerung_tage_vorher} Tage vorher), Platz frei geworden und Absage nutzen die Event-Vorlagen.</p>
        </section>
        <section>
          <h3 className="bo-mar-titel mb-3">Datenschutz</h3>
          <div className="bo-mar-felder">
            <label className="bo-mar-feld"><span>Textversion</span><input className="bo-mar-eingabe" value={w.einwilligung_textversion} onChange={(e) => setW({ ...w, einwilligung_textversion: e.target.value })} /></label>
            <label className="bo-mar-feld"><span>Löschfrist (Monate)</span><input className="bo-mar-eingabe" inputMode="numeric" value={w.loeschfrist_monate} onChange={(e) => setW({ ...w, loeschfrist_monate: e.target.value })} /></label>
            <label className="bo-mar-feld voll"><span>Foto-Hinweis (Aushang)</span><input className="bo-mar-eingabe" value={w.fotos_hinweis} onChange={(e) => setW({ ...w, fotos_hinweis: e.target.value })} /></label>
          </div>
        </section>
      </div>
    </Dialog>
  );
}

/** „+ Neues Event“ als Knopf mit Dialog (Leitung), öffnet sich auch über ?neu=event. */
export function NeuesEventKnopf({ auto = false }) {
  const [offen, setOffen] = useState(auto);
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} data-testid="neues-event">{EVENTS.neu}</Knopf>
      {offen && <EventAnlegenDialog onSchliessen={() => setOffen(false)} />}
    </>
  );
}

export function useGaeste(ev) {
  return useMemo(() => checkinListe(ev?.anmeldungen || []), [ev]);
}
