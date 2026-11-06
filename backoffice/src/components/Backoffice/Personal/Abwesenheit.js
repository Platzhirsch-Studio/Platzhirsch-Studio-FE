"use client";
// Abwesenheiten (Konzept § 5.2, § 5.8, E5): Sheet „Urlaub beantragen“ (auch „für eine Person“ durch die Leitung),
// Sheet „Krank melden“, Liste „Meine Abwesenheiten“ mit Stornieren, Antrag-Aktionen (Genehmigen · Ablehnen …)
// mit Kontext. Entscheidungen laufen als verzögerter Commit (8 s Rückgängig, Variante A). Krankmeldung: kein
// Genehmigen/Ablehnen – nur „Bestätigung erhalten“, „Gesund melden“, „Verlängern“.

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import Sheet from "../Overlay/Sheet";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import StatusBadge from "../StatusBadge";
import Datumsfeld from "../Formular/Datumsfeld";
import LeitungBitten from "../LeitungBitten";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { abwesenheitBeantragenAction, krankMeldenAction, antragAction, krankSchrittAction } from "@/lib/backoffice/personal/actions";
import { pruefeAbwesenheit } from "@/lib/backoffice/personal/methoden";
import { T } from "@/lib/backoffice/personal/texte";
import { artText, statusText, statusTon } from "@/lib/backoffice/personal/status";
import { arbeitstage, zeitraumText, kurzDatum, tageZahl, plusTage } from "@/lib/backoffice/personal/zeit";
import "./personal.css";
import { useWechsel } from "./hooks";

const HAUPT = ["Urlaub", "Zeitausgleich", "Fortbildung"];
const WEITERE = ["Pflegefreistellung", "Sonderurlaub", "Unbezahlt", "Berufsschule"];

function Feld({ label, fehler, hilfe, children, id }) {
  return (
    <div className="bo-per-feld">
      <label htmlFor={id}>{label}</label>
      {children}
      {hilfe && !fehler && <span className="bo-per-feld__hilfe">{hilfe}</span>}
      {fehler && (
        <span className="bo-per-feld__fehler" role="alert">
          {fehler}
        </span>
      )}
    </div>
  );
}

/**
 * Urlaub beantragen bzw. Abwesenheit für eine Person anlegen (§ 5.2 / § 5.8).
 * @param {{offen:boolean, onSchliessen:()=>void, heute:string, fuerPerson?:boolean, personen?:Array<{name,titel}>,
 *   vertretungen?:Array<{name,titel}>, darfVertretung?:boolean, konto?:{rest:number}|null, eigener?:string, bestehende?:object[]}} p
 */
export function UrlaubSheet({ offen, onSchliessen, heute, fuerPerson = false, personen = [], vertretungen = [], darfVertretung = false, konto = null, eigener = null, bestehende = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const [art, setArt] = useState("Urlaub");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [halbtags, setHalbtags] = useState(false);
  const [vertretung, setVertretung] = useState("");
  const [anmerkung, setAnmerkung] = useState("");
  const [person, setPerson] = useState("");
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => {
    if (!o) return;
    setArt("Urlaub");
    setVon("");
    setBis("");
    setHalbtags(false);
    setVertretung("");
    setAnmerkung("");
    setPerson("");
    setFehler({});
  });
  const ma = fuerPerson ? person : eigener;
  const einTag = von && bis && von === bis;
  const tage = von && bis && bis >= von ? (halbtags && einTag ? 0.5 : arbeitstage(von, bis)) : 0;
  const lokal = useMemo(() => (von && bis ? pruefeAbwesenheit({ mitarbeiter: ma, von, bis, halbtags: halbtags ? 1 : 0, vertretung }, bestehende) : null), [ma, von, bis, halbtags, vertretung, bestehende]);
  const zeile = von && bis && bis >= von ? (konto && art === "Urlaub" ? T.antrag.konto(tageZahl(tage), tageZahl(konto.rest - tage)) : T.antrag.keinKonto(zeitraumText(von, bis))) : null;
  const geaendert = Boolean(von || bis || anmerkung || person);
  const senden = () =>
    start(async () => {
      setFehler({});
      if (fuerPerson && !person) return setFehler({ person: T.urlaub.person });
      const r = await abwesenheitBeantragenAction({ mitarbeiter: fuerPerson ? person : undefined, art, von, bis, halbtags, vertretung, anmerkung });
      if (!r.ok) {
        setFehler(r.fehler || { von: r.message });
        return;
      }
      zeige(fuerPerson ? T.urlaub.angelegt : T.urlaub.gestellt, { art: "ok" });
      onSchliessen();
      router.refresh();
    });
  const arten = fuerPerson || WEITERE.includes(art) ? [...HAUPT, ...WEITERE] : HAUPT;
  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={fuerPerson ? T.urlaub.titelFuer : T.urlaub.titel}
      groesse="md"
      ungespeichert={geaendert && !laeuft}
      testid="per-urlaub-sheet"
      fuss={
        <div className="flex w-full items-center justify-end gap-2">
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} kuerzel="Strg+Enter" data-testid="per-urlaub-senden">
            {fuerPerson ? T.urlaub.anlegen : T.urlaub.beantragen}
          </Knopf>
        </div>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            senden();
          }
        }}
      >
        {fuerPerson && (
          <Feld label={T.urlaub.person} id={`${id}-p`} fehler={fehler.person || fehler.mitarbeiter}>
            <select id={`${id}-p`} className="bo-per-auswahl" value={person} onChange={(e) => setPerson(e.target.value)} data-testid="per-urlaub-person">
              <option value="">–</option>
              {personen.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.titel}
                </option>
              ))}
            </select>
          </Feld>
        )}
        <div className="bo-per-feld">
          <span>{T.urlaub.art}</span>
          {fuerPerson ? (
            <select className="bo-per-auswahl" value={art} onChange={(e) => setArt(e.target.value)} aria-label={T.urlaub.art}>
              {arten.map((a) => (
                <option key={a} value={a}>
                  {artText(a)}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Segment label={T.urlaub.art} optionen={HAUPT.map((a) => ({ wert: a, titel: artText(a) }))} wert={HAUPT.includes(art) ? art : ""} onWechsel={setArt} />
              <select className="bo-per-auswahl w-auto" value={WEITERE.includes(art) ? art : ""} onChange={(e) => e.target.value && setArt(e.target.value)} aria-label={T.urlaub.weitere}>
                <option value="">{T.urlaub.weitere}</option>
                {WEITERE.map((a) => (
                  <option key={a} value={a}>
                    {artText(a)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fehler.art && <span className="bo-per-feld__fehler">{fehler.art}</span>}
        </div>
        <div className="bo-per-raster2">
          <Feld label={T.urlaub.von} id={`${id}-von`} fehler={fehler.von}>
            <Datumsfeld id={`${id}-von`} value={von} onChange={(v) => { setVon(v); if (!bis || bis < v) setBis(v); }} invalid={Boolean(fehler.von)} aria-label={T.urlaub.von} />
          </Feld>
          <Feld label={T.urlaub.bis} id={`${id}-bis`} fehler={fehler.bis}>
            <Datumsfeld id={`${id}-bis`} value={bis} onChange={setBis} invalid={Boolean(fehler.bis)} aria-label={T.urlaub.bis} />
          </Feld>
        </div>
        {zeile && (
          <p className="text-[14px] text-bo-text-soft" aria-live="polite" data-testid="per-urlaub-zeile">
            {zeile}
          </p>
        )}
        {lokal && !fehler.von && <p className="bo-per-feld__fehler">{lokal.text}</p>}
        {einTag && <Schalter label={T.urlaub.halbtags} an={halbtags} onWechsel={setHalbtags} testid="per-urlaub-halbtags" />}
        {darfVertretung && (
          <Feld label={T.urlaub.vertretung} id={`${id}-v`} fehler={fehler.vertretung}>
            <select id={`${id}-v`} className="bo-per-auswahl" value={vertretung} onChange={(e) => setVertretung(e.target.value)}>
              <option value="">–</option>
              {vertretungen.filter((v) => v.name !== ma).map((v) => (
                <option key={v.name} value={v.name}>
                  {v.titel}
                </option>
              ))}
            </select>
          </Feld>
        )}
        <details className="group">
          <summary className="cursor-pointer text-[14px] font-medium text-bo-text-soft">{T.urlaub.anmerkung}</summary>
          <div className="mt-3">
            <textarea className="bo-per-auswahl bo-per-text" value={anmerkung} onChange={(e) => setAnmerkung(e.target.value)} aria-label={T.urlaub.anmerkung} maxLength={500} />
            <span className="bo-per-feld__hilfe">{T.urlaub.anmerkungHilfe}</span>
          </div>
        </details>
        {fuerPerson && <p className="bo-per-band-hinweis">{T.urlaub.nichtSelbst}</p>}
      </form>
    </Sheet>
  );
}

/** Krank melden (E5): Ab (heute), voraussichtlich bis (optional), Hinweis, Primär „Melden“. */
export function KrankSheet({ offen, onSchliessen, heute, fuerPerson = false, personen = [], vorbelegt = null }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const [ab, setAb] = useState(heute);
  const [bis, setBis] = useState("");
  const [person, setPerson] = useState("");
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => {
    if (!o) return;
    setAb(vorbelegt?.ab || heute);
    setBis("");
    setFehler({});
  });
  const senden = () =>
    start(async () => {
      if (fuerPerson && !person) return setFehler({ person: T.urlaub.person });
      const r = await krankMeldenAction({ mitarbeiter: fuerPerson ? person : undefined, ab, bis });
      if (!r.ok) return setFehler(r.fehler || { ab: r.message });
      zeige(T.krank.gemeldet, { art: "ok", unter: r.imUrlaub ? T.krank.imUrlaub : undefined });
      onSchliessen();
      router.refresh();
    });
  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={fuerPerson ? T.krank.titelFuer : T.krank.titel}
      groesse="sm"
      testid="per-krank-sheet"
      fuss={
        <div className="flex w-full items-center justify-end gap-2">
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} kuerzel="Strg+Enter" data-testid="per-krank-senden">
            {T.krank.melden}
          </Knopf>
        </div>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
      >
        {fuerPerson && (
          <Feld label={T.urlaub.person} id={`${id}-p`} fehler={fehler.person}>
            <select id={`${id}-p`} className="bo-per-auswahl" value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">–</option>
              {personen.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.titel}
                </option>
              ))}
            </select>
          </Feld>
        )}
        <Feld label={T.krank.ab} id={`${id}-ab`} fehler={fehler.ab}>
          <Datumsfeld id={`${id}-ab`} value={ab} onChange={setAb} aria-label={T.krank.ab} />
        </Feld>
        <Feld label={T.krank.bis} id={`${id}-bis`} fehler={fehler.bis} hilfe={T.krank.bisHilfe}>
          <Datumsfeld id={`${id}-bis`} value={bis} onChange={setBis} aria-label={T.krank.bis} />
        </Feld>
        <p className="bo-per-band-hinweis">
          <Icon name="Info" className="mt-0.5 size-4 flex-none" />
          {T.krank.hinweis}
        </p>
      </form>
    </Sheet>
  );
}

/** Kleiner Datums-Dialog (Gesund melden, Verlängern). */
function DatumDialog({ offen, titel, label, start: startWert, onSchliessen, onOk }) {
  const [wert, setWert] = useState(startWert || "");
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => o && setWert(startWert || ""));
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={titel}
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            onClick={() =>
              start(async () => {
                const r = await onOk(wert);
                if (r && !r.ok) setFehler(r.message);
              })
            }
          >
            {T.speichern}
          </Knopf>
        </>
      }
    >
      <div className="bo-per-feld">
        <span>{label}</span>
        <Datumsfeld value={wert} onChange={setWert} aria-label={label} invalid={Boolean(fehler)} />
        {fehler && <span className="bo-per-feld__fehler">{fehler}</span>}
      </div>
    </Dialog>
  );
}

/** Hook für einen verzögerten Commit mit optimistischem Status. */
export function useCommitAktion() {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [, startT] = useTransition();
  return async (aufruf, text, { onVerworfen, gruppe, sammel } = {}) => {
    const r = await aufruf();
    if (!r.ok) {
      zeige(r.message || T.fehler.allgemein, { art: "fehler" });
      return r;
    }
    starte(text, { token: r.token, ms: r.ms, objekt: r.objekt, gruppe, sammel, fehlerText: text, onVerworfen, onFehler: onVerworfen, onErfolg: () => startT(() => router.refresh()) });
    return r;
  };
}

/**
 * Entscheiden über einen Antrag (Zeile in „Zu erledigen“, Team › Anträge): Genehmigen (A), Ablehnen … (Dialog mit
 * Pflichtgrund, dann A). Eigener/angelegter Antrag → kein Knopf, sichtbarer Satz.
 */
export function AntragKnoepfe({ antrag, entscheidbar, onErledigt, kompakt = false }) {
  const commit = useCommitAktion();
  const [ablehnen, setAblehnen] = useState(false);
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState(null);
  const [weg, setWeg] = useState(false);
  if (weg) return <span className="bo-per-zeile__hinweis">{statusText("abwesenheit", "Genehmigt")}</span>;
  if (!entscheidbar?.darf) {
    const satz = entscheidbar?.grund === "eigen" ? T.antrag.eigen : entscheidbar?.grund === "angelegt" ? T.antrag.angelegt : null;
    return satz ? <span className="bo-per-zeile__hinweis">{satz}</span> : null;
  }
  const genehmigen = async () => {
    setWeg(true);
    onErledigt?.(true);
    await commit(() => antragAction({ name: antrag.name, aktion: "Genehmigen" }), T.antrag.genehmigt(antrag.mitarbeiter_name), {
      gruppe: "personal.genehmigen",
      sammel: (n) => `${n} Anträge genehmigt`,
      onVerworfen: () => {
        setWeg(false);
        onErledigt?.(false);
      },
    });
  };
  const absenden = async () => {
    if (grund.trim().length < 3) return setFehler(T.antrag.grund);
    const r = await commit(() => antragAction({ name: antrag.name, aktion: "Ablehnen", grund }), T.antrag.abgelehnt(antrag.mitarbeiter_name), {
      onVerworfen: () => {
        setWeg(false);
        onErledigt?.(false);
      },
    });
    if (r.ok) {
      setAblehnen(false);
      setWeg(true);
      onErledigt?.(true);
    } else setFehler(r.message);
  };
  return (
    <>
      <Knopf size={kompakt ? "s" : "m"} variant="secondary" icon="Check" onClick={genehmigen} data-testid={`per-genehmigen-${antrag.name}`}>
        {T.zeilen.knopf.genehmigen}
      </Knopf>
      <Knopf size={kompakt ? "s" : "m"} variant="ghost" onClick={() => setAblehnen(true)} data-testid={`per-ablehnen-${antrag.name}`}>
        {T.zeilen.knopf.ablehnen}
      </Knopf>
      <Dialog
        offen={ablehnen}
        onSchliessen={() => setAblehnen(false)}
        titel={T.antrag.ablehnenTitel(antrag.mitarbeiter_name)}
        text={`${artText(antrag.art)} ${zeitraumText(antrag.von, antrag.bis)}`}
        fuss={
          <>
            <Knopf variant="ghost" onClick={() => setAblehnen(false)}>
              {T.abbrechen}
            </Knopf>
            <Knopf variant="danger" onClick={absenden} disabled={grund.trim().length < 3} data-testid="per-ablehnen-senden">
              {T.zeilen.knopf.ablehnen.replace(" …", "")}
            </Knopf>
          </>
        }
      >
        <div className="bo-per-feld">
          <label htmlFor={`grund-${antrag.name}`}>{T.antrag.grund}</label>
          <textarea id={`grund-${antrag.name}`} className="bo-per-auswahl bo-per-text" value={grund} onChange={(e) => setGrund(e.target.value)} maxLength={500} autoFocus />
          <span className="bo-per-feld__hilfe">{T.antrag.grundHilfe}</span>
          {fehler && <span className="bo-per-feld__fehler">{fehler}</span>}
        </div>
      </Dialog>
    </>
  );
}

/** Krankmeldung (Leitung): Bestätigung erhalten (A) · Gesund melden (A, Datum) – nie Ablehnen. */
export function KrankKnoepfe({ krank, heute, eigen = false, leitung = false, kompakt = false }) {
  const commit = useCommitAktion();
  const [dialog, setDialog] = useState(null);
  const [weg, setWeg] = useState(false);
  if (weg) return null;
  return (
    <>
      {leitung && krank.status === "Gemeldet" && (
        <Knopf size={kompakt ? "s" : "m"} variant="secondary" onClick={async () => { setWeg(true); await commit(() => krankSchrittAction({ name: krank.name, schritt: "bestaetigung" }), T.krank.bestaetigung, { onVerworfen: () => setWeg(false) }); }}>
          {T.krank.bestaetigung}
        </Knopf>
      )}
      {(leitung || eigen) && (
        <Knopf size={kompakt ? "s" : "m"} variant="ghost" onClick={() => setDialog("gesund")}>
          {T.krank.gesund}
        </Knopf>
      )}
      {eigen && (
        <Knopf size={kompakt ? "s" : "m"} variant="ghost" onClick={() => setDialog("verlaengern")}>
          {T.krank.verlaengern}
        </Knopf>
      )}
      <DatumDialog
        offen={Boolean(dialog)}
        titel={dialog === "gesund" ? T.krank.gesund : T.krank.verlaengern}
        label={dialog === "gesund" ? T.krank.letzterTag : T.krank.verlaengertBis}
        start={dialog === "gesund" ? plusTage(heute, -1) : plusTage(heute, 2)}
        onSchliessen={() => setDialog(null)}
        onOk={async (datum) => {
          const r = await commit(() => krankSchrittAction({ name: krank.name, schritt: dialog, datum }), dialog === "gesund" ? T.krank.gesund : T.krank.verlaengern);
          if (r.ok) setDialog(null);
          return r;
        }}
      />
    </>
  );
}

/**
 * Liste eigener Abwesenheiten (Mein Bereich, Meine Abwesenheiten): Art, Zeitraum, Status, entschieden von/am,
 * Ablehnungsgrund; Stornieren bei „Beantragt“ (A); genehmigt ohne Fähigkeit → Satz + „Leitung bitten“.
 */
export function MeineAbwesenheiten({ liste = [], heute, stornoGenehmigt = false, leitungBitten = false, testid = "per-meine-abwesenheiten" }) {
  const commit = useCommitAktion();
  const [weg, setWeg] = useState(() => new Set());
  return (
    <ul className="bo-per-zeilen" data-testid={testid}>
      {liste.map((a) => {
        const krank = a.quelle === "krank";
        const objekt = krank ? "krank" : "abwesenheit";
        const status = weg.has(a.name) ? "Storniert" : a.status;
        const vorBeginn = a.von > heute;
        return (
          <li key={a.name} className="bo-per-zeile">
            <span className="bo-per-zeile__icon" data-ton={krank ? "stein" : a.art === "Urlaub" ? "salbei" : "see"} aria-hidden="true">
              <Icon name={krank ? "Info" : "CalendarDays"} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="bo-per-zeile__titel">
                {krank ? (a.bis_offen ? T.krank.zeile(kurzDatum(a.von)) : `${artText("Krankenstand")} ${zeitraumText(a.von, a.bis)}`) : `${artText(a.art)} ${zeitraumText(a.von, a.bis)}`}
              </span>
              <span className="bo-per-zeile__unter">
                {[a.halbtags ? T.urlaub.halbtags : null, a.entschiedenVon && a.status !== "Beantragt" ? `${a.entschiedenVon}, ${kurzDatum(String(a.genehmigt_am).slice(0, 10))}` : null, a.ablehnungsgrund || null, krank && a.bis_offen ? T.krank.bisHilfe : null].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="bo-per-zeile__aktionen">
              <StatusBadge wert={status} text={statusText(objekt, status)} ton={statusTon(objekt, status)} groesse="m" />
              {!krank && status === "Beantragt" && (
                <Knopf
                  size="s"
                  variant="ghost"
                  onClick={async () => {
                    setWeg((s) => new Set(s).add(a.name));
                    await commit(() => antragAction({ name: a.name, aktion: "Stornieren" }), T.antrag.storniert, {
                      onVerworfen: () =>
                        setWeg((s) => {
                          const n = new Set(s);
                          n.delete(a.name);
                          return n;
                        }),
                    });
                  }}
                  data-testid={`per-stornieren-${a.name}`}
                >
                  {T.meins.stornieren}
                </Knopf>
              )}
              {!krank && status === "Genehmigt" && vorBeginn && !stornoGenehmigt && leitungBitten && (
                <span className="flex flex-col items-end gap-1">
                  <span className="bo-per-zeile__hinweis">{T.antrag.stornoGenehmigt}</span>
                  <LeitungBitten erlaubt bereich="personal" bereichTitel="Personal" aktion="stornieren" aktionTitel={`${artText(a.art)} ${zeitraumText(a.von, a.bis)} stornieren`} objekt={{ doctype: "PH Abwesenheit", name: a.name }} />
                </span>
              )}
              {krank && ["Gemeldet", "Bestaetigt"].includes(a.status) && <KrankKnoepfe krank={a} heute={heute} eigen kompakt />}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
