"use client";
// Gespräche (Konzept § 5.7, § 6.2): Sheet „Gespräch planen“ auf einem Bildschirm mit freien Zeiten (Gesprächsführung,
// Modus, Dauer, Woche), Wochenansicht mit Panel (Primär nach Zustand), Ergebnis erfassen, Termin absagen / Nicht
// erschienen (verzögerter Commit), Verschieben ohne Ziehen (Dialog). Belegte Zeiten sind nicht wählbar und als Text
// benannt. Kein freier Slot → drei Auswege.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Sheet from "../Overlay/Sheet";
import Dialog from "../Overlay/Dialog";
import Knopf, { RundKnopf } from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import StatusBadge from "../StatusBadge";
import Avatar from "../Avatar";
import Datumsfeld from "../Formular/Datumsfeld";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { slotDatenAction, gespraechAnlegenAction, gespraechAendernAction, gespraechStatusAction, gespraechErgebnisAction } from "@/lib/backoffice/personal/actions";
import { belegteZeiten, freieZeiten, hatFreieZeit, wochenTageMoSa } from "@/lib/backoffice/personal/slots";
import { T } from "@/lib/backoffice/personal/texte";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { kw, plusTage, tagKurz, kurzDatum, wochenStartIso, iso, relativTage } from "@/lib/backoffice/personal/zeit";
import { useCommitAktion } from "./Abwesenheit";
import "./personal.css";
import { useWechsel } from "./hooks";

/**
 * @param {{offen:boolean, onSchliessen:()=>void, bewerbung?:{name,person}|null, bewerbungen?:Array<{name,person}>,
 *   personen:Array<{wert,titel}>, standardFuehrung:string, heute:string, ort?:string}} p
 */
export function GespraechSheet({ offen, onSchliessen, bewerbung = null, bewerbungen = [], personen = [], standardFuehrung, heute, ort: standardOrt = "Showroom Lochau", onAngelegt }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [bew, setBew] = useState(bewerbung?.name || "");
  const [fuehrung, setFuehrung] = useState(standardFuehrung);
  const [modus, setModus] = useState("Vor Ort");
  const [dauer, setDauer] = useState("60");
  const [montag, setMontag] = useState(wochenStartIso(plusTage(heute, 1)));
  const [daten, setDaten] = useState({ gespraeche: [], abwesenheiten: [] });
  const [wahl, setWahl] = useState(null);
  const [frei, setFrei] = useState(false);
  const [freiWert, setFreiWert] = useState({ datum: heute, zeit: "" });
  const [ort, setOrt] = useState(standardOrt);
  const [weitere, setWeitere] = useState("");
  const [kalender, setKalender] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  const tage = useMemo(() => wochenTageMoSa(montag), [montag]);

  useWechsel(offen, (o) => {
    if (!o) return;
    setBew(bewerbung?.name || "");
    setWahl(null);
    setFehler(null);
  });
  useEffect(() => {
    if (!offen) return;
    let ab = false;
    slotDatenAction({ von: tage[0], bis: tage[5] }).then((r) => !ab && r.ok && setDaten({ gespraeche: r.gespraeche, abwesenheiten: r.abwesenheiten }));
    return () => {
      ab = true;
    };
  }, [offen, tage]);

  const belegt = belegteZeiten({ verantwortlich: fuehrung, gespraeche: daten.gespraeche, abwesenheiten: daten.abwesenheiten.filter((a) => a.user === fuehrung), tage });
  const liste = freieZeiten({ tage, belegt, dauer: Number(dauer), jetzt: new Date() });
  const keine = !hatFreieZeit(liste);
  const fuehrungName = personen.find((p) => p.wert === fuehrung)?.titel || fuehrung;
  const startWert = frei ? (freiWert.datum && freiWert.zeit ? `${freiWert.datum} ${freiWert.zeit}` : null) : wahl;

  const anlegen = () =>
    start(async () => {
      setFehler(null);
      if (!bew) return setFehler(T.gespraech.bewerbung);
      if (!startWert) return setFehler("Bitte eine Zeit wählen.");
      const r = await gespraechAnlegenAction({ bewerbung: bew, start: startWert, dauer: Number(dauer), modus, ort, verantwortlich: fuehrung, kalender, weitere });
      if (!r.ok) return setFehler(r.message);
      const wann = `${tagKurz(startWert.slice(0, 10))} ${startWert.slice(11, 16)}`;
      zeige(T.gespraech.angelegt(wann), { art: "ok", aktion: { titel: T.oeffnen, onClick: () => router.push(`/personal/bewerbungen/${encodeURIComponent(bew)}?tab=gespraeche`) } });
      onAngelegt?.(r.name);
      onSchliessen();
      router.refresh();
    });

  const person = bewerbung?.person || bewerbungen.find((b) => b.name === bew)?.person || "";
  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={person ? T.gespraech.planenMit(person) : T.gespraech.planen}
      groesse="lg"
      testid="per-gespraech-sheet"
      fuss={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-bo-text-soft">{startWert ? `${tagKurz(startWert.slice(0, 10))} ${kurzDatum(startWert.slice(0, 10))} · ${startWert.slice(11, 16)} · ${dauer} min` : " "}</span>
          <span className="flex gap-2">
            <Knopf variant="ghost" onClick={onSchliessen}>
              {T.abbrechen}
            </Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={!startWert || !bew} onClick={anlegen} kuerzel="Strg+Enter" data-testid="per-gespraech-anlegen">
              {T.gespraech.anlegen}
            </Knopf>
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {!bewerbung && (
          <label className="bo-per-feld">
            <span>{T.gespraech.bewerbung}</span>
            <select className="bo-per-auswahl" value={bew} onChange={(e) => setBew(e.target.value)} data-testid="per-gespraech-bewerbung">
              <option value="">–</option>
              {bewerbungen.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.person}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="bo-per-feld">
            <span>{T.gespraech.fuehrung}</span>
            <select className="bo-per-auswahl" value={fuehrung} onChange={(e) => { setFuehrung(e.target.value); setWahl(null); }}>
              {personen.map((p) => (
                <option key={p.wert} value={p.wert}>
                  {p.titel}
                </option>
              ))}
            </select>
          </label>
          <div className="bo-per-feld">
            <span>{T.gespraech.modus}</span>
            <Segment label={T.gespraech.modus} wert={modus} onWechsel={setModus} optionen={T.gespraech.modi.map((m) => ({ wert: m, titel: m }))} groesse="s" />
          </div>
          <div className="bo-per-feld">
            <span>{T.gespraech.dauer}</span>
            <Segment label={T.gespraech.dauer} wert={dauer} onWechsel={(d) => { setDauer(d); setWahl(null); }} optionen={T.gespraech.dauern.map((d) => ({ wert: String(d), titel: `${d}` }))} groesse="s" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <RundKnopf icon="ChevronLeft" label="Vorige Woche" groesse="s" onClick={() => setMontag(plusTage(montag, -7))} />
          <span className="text-[14px] font-semibold">KW {kw(montag)} · {kurzDatum(tage[0])}–{kurzDatum(tage[5])}</span>
          <RundKnopf icon="ChevronRight" label={T.gespraech.naechsteWoche} groesse="s" onClick={() => setMontag(plusTage(montag, 7))} />
        </div>
        {keine && !frei ? (
          <div className="bo-per-band-hinweis flex-col" data-testid="per-keine-zeit">
            <span className="font-medium text-bo-text">{T.gespraech.keineZeit(fuehrungName, kw(montag))}</span>
            <span className="flex flex-wrap gap-2">
              <Knopf size="s" variant="secondary" onClick={() => setMontag(plusTage(montag, 7))}>{T.gespraech.naechsteWoche}</Knopf>
              <Knopf size="s" variant="ghost" onClick={() => setFuehrung(personen.find((p) => p.wert !== fuehrung)?.wert || fuehrung)}>{T.gespraech.andere}</Knopf>
              <Knopf size="s" variant="ghost" onClick={() => setFrei(true)}>{T.gespraech.frei}</Knopf>
            </span>
          </div>
        ) : !frei ? (
          <div role="radiogroup" aria-label="Freie Zeiten" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="per-slots">
            {liste.map((t) => (
              <div key={t.tag} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-bo-text-soft">
                  {tagKurz(t.tag)} {kurzDatum(t.tag)}
                </span>
                {t.zeiten.length === 0 ? (
                  <span className="text-[12px] text-bo-text-faint">{t.tag < heute ? "vorbei" : belegt.some((b) => b.ganztag && b.start.startsWith(t.tag)) ? "abwesend" : "belegt"}</span>
                ) : (
                  [...t.zeiten.slice(0, 8).map((z) => {
                    const w = `${t.tag} ${z}`;
                    return (
                      <button key={z} type="button" role="radio" aria-checked={wahl === w} className="bo-per-chip bo-per-chip--s justify-center bo-per-zahl" onClick={() => setWahl(w)}>
                        {z}
                      </button>
                    );
                  }), t.zeiten.length > 8 ? <span key="mehr" className="text-[12px] text-bo-text-faint">{`+ ${t.zeiten.length - 8} weitere`}</span> : null]
                )}
              </div>
            ))}
          </div>
        ) : null}
        {!keine && !frei && (
          <button type="button" className="bo-per-link self-start text-[13px]" onClick={() => setFrei(true)}>
            {T.gespraech.frei}
          </button>
        )}
        {frei && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bo-per-feld">
                <span>Datum</span>
                <Datumsfeld value={freiWert.datum} onChange={(v) => setFreiWert((x) => ({ ...x, datum: v }))} aria-label="Datum" />
              </div>
              <label className="bo-per-feld">
                <span>Uhrzeit</span>
                <input className="bo-per-zeitfeld bo-per-zeitfeld--voll" inputMode="numeric" placeholder="––:––" value={freiWert.zeit} onChange={(e) => setFreiWert((x) => ({ ...x, zeit: e.target.value.slice(0, 5) }))} />
              </label>
            </div>
            <span className="bo-per-feld__hilfe">{T.gespraech.freiHinweis}</span>
          </div>
        )}
        <div className="bo-per-raster2">
          <label className="bo-per-feld">
            <span>{T.gespraech.ort}</span>
            <input className="bo-per-auswahl" value={ort} onChange={(e) => setOrt(e.target.value)} />
          </label>
          <label className="bo-per-feld">
            <span>{T.gespraech.weitere}</span>
            <input className="bo-per-auswahl" value={weitere} onChange={(e) => setWeitere(e.target.value)} />
          </label>
        </div>
        <Schalter label={T.gespraech.kalender} an={kalender} onWechsel={setKalender} />
        {fehler && <p className="bo-per-feld__fehler" role="alert">{fehler}</p>}
      </div>
    </Sheet>
  );
}

/** Knopf „Gespräch planen“ + Sheet. */
export function GespraechPlanenKnopf({ bewerbung, bewerbungen, personen, standardFuehrung, heute, variant = "primary", startOffen = false, label }) {
  const [offen, setOffen] = useState(startOffen);
  return (
    <>
      <Knopf variant={variant} icon="CalendarPlus" onClick={() => setOffen(true)} data-testid="per-gespraech-planen">
        {label || T.gespraech.planen}
      </Knopf>
      <GespraechSheet offen={offen} onSchliessen={() => setOffen(false)} bewerbung={bewerbung} bewerbungen={bewerbungen} personen={personen} standardFuehrung={standardFuehrung} heute={heute} />
    </>
  );
}

/** Ergebnis erfassen (Weiter im Verfahren · Angebot · Absage · Offen + nächster Schritt). */
export function ErgebnisDialog({ offen, onSchliessen, gespraech, leitung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [e, setE] = useState("Weiter im Verfahren");
  const [n, setN] = useState("");
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.gespraech.ergebnis}
      text={gespraech ? `${gespraech.bewerber} · ${kurzDatum(String(gespraech.start).slice(0, 10))} ${String(gespraech.start).slice(11, 16)}` : ""}
      groesse="md"
      testid="per-ergebnis-dialog"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>{T.abbrechen}</Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            data-testid="per-ergebnis-senden"
            onClick={() =>
              start(async () => {
                const r = await gespraechErgebnisAction({ name: gespraech.name, ergebnis: e, naechster: n });
                if (!r.ok) return setFehler(r.message);
                zeige(T.gespraech.ergebnisToast(e), { art: "ok", unter: e === "Absage" ? T.absage.senden : undefined });
                onSchliessen();
                router.refresh();
              })
            }
          >
            {T.speichern}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bo-per-chips" role="radiogroup" aria-label={T.gespraech.ergebnis}>
          {T.gespraech.ergebnisse.map((x) => (
            <button key={x} type="button" role="radio" aria-checked={e === x} className="bo-per-chip" disabled={x === "Angebot" && !leitung} title={x === "Angebot" && !leitung ? T.bewerbung.nurLeitung : undefined} onClick={() => setE(x)}>
              {x}
            </button>
          ))}
        </div>
        <label className="bo-per-feld">
          <span>{T.gespraech.naechster}</span>
          <input className="bo-per-auswahl" value={n} onChange={(x) => setN(x.target.value)} maxLength={140} />
        </label>
        {fehler && <p className="bo-per-feld__fehler">{fehler}</p>}
      </div>
    </Dialog>
  );
}

/** Verschieben ohne Ziehen (Datum + Zeit), Variante B mit Rückgängig. */
function VerschiebenDialog({ offen, onSchliessen, gespraech }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [d, setD] = useState("");
  const [z, setZ] = useState("");
  useWechsel(offen && gespraech ? gespraech.name : null, (n) => {
    if (!n) return;
    setD(String(gespraech.start).slice(0, 10));
    setZ(String(gespraech.start).slice(11, 16));
  });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.gespraech.verschieben.replace(" …", "")}
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>{T.abbrechen}</Knopf>
          <Knopf
            variant="primary"
            onClick={async () => {
              const r = await gespraechAendernAction({ name: gespraech.name, start: `${d} ${z}` });
              if (!r.ok) return zeige(r.message, { art: "fehler" });
              zeige(T.gespraech.verschoben(`${kurzDatum(d)} ${z}`), { art: "ok", aktion: { titel: T.zeiten.rueck, onClick: async () => { await gespraechAendernAction({ name: gespraech.name, start: r.alt.start }); router.refresh(); } } });
              onSchliessen();
              router.refresh();
            }}
          >
            {T.speichern}
          </Knopf>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="bo-per-feld">
          <span>Datum</span>
          <Datumsfeld value={d} onChange={setD} aria-label="Datum" />
        </div>
        <label className="bo-per-feld">
          <span>Uhrzeit</span>
          <input className="bo-per-zeitfeld bo-per-zeitfeld--voll" value={z} onChange={(e) => setZ(e.target.value.slice(0, 5))} inputMode="numeric" />
        </label>
      </div>
    </Dialog>
  );
}

/** Panel eines Gesprächs (Sheet 480): Primär nach Zustand, ⋯ Termin absagen / Nicht erschienen / Verschieben. */
export function GespraechPanel({ gespraech: g, offen, onSchliessen, jetzt, leitung, darf, vertraulich }) {
  const router = useRouter();
  const { zeige } = useToast();
  const commit = useCommitAktion();
  const [ergebnis, setErgebnis] = useState(false);
  const [verschieben, setVerschieben] = useState(false);
  const [, start] = useTransition();
  if (!g) return null;
  const vorbei = String(g.start) < jetzt;
  let primaer = null;
  if (g.status === "Geplant" && vorbei) primaer = <Knopf variant="primary" onClick={() => setErgebnis(true)} data-testid="per-panel-ergebnis">{T.gespraech.ergebnis}</Knopf>;
  else if (g.status === "Geplant" && !g.kalender_event) primaer = <Knopf variant="primary" icon="CalendarPlus" onClick={async () => { const r = await gespraechAendernAction({ name: g.name, kalender: true }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige(T.gespraech.imKalender, { art: "ok" }); start(() => router.refresh()); }}>{T.gespraech.inKalender}</Knopf>;
  else if (g.status === "Durchgefuehrt") primaer = <Knopf variant="primary" href={`/personal/bewerbungen/${encodeURIComponent(g.bewerbung)}`}>{T.gespraech.bewerbungOeffnen}</Knopf>;
  const status = (s) => commit(() => gespraechStatusAction({ name: g.name, status: s }), s === "Abgesagt" ? T.gespraech.terminAbsagen : T.gespraech.nichtErschienen);
  return (
    <>
      <Sheet
        offen={offen}
        onSchliessen={onSchliessen}
        titel={`Gespräch ${g.bewerber}`}
        unter={`${tagKurz(String(g.start).slice(0, 10))} ${kurzDatum(String(g.start).slice(0, 10))} · ${String(g.start).slice(11, 16)} · ${g.modus}`}
        panel={g.name}
        groesse="md"
        testid="per-gespraech-panel"
        fuss={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {darf && g.status === "Geplant" && (
              <>
                <Knopf variant="ghost" onClick={() => setVerschieben(true)}>{T.gespraech.verschieben}</Knopf>
                <Knopf variant="ghost" onClick={() => status("Abgesagt")}>{T.gespraech.terminAbsagen}</Knopf>
                {vorbei && <Knopf variant="ghost" onClick={() => status("Nicht erschienen")}>{T.gespraech.nichtErschienen}</Knopf>}
              </>
            )}
            {darf && primaer}
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <StatusBadge wert={g.status} text={statusText("gespraech", g.status)} ton={statusTon("gespraech", g.status)} groesse="m" />
          {g.status === "Geplant" && !vorbei && (
            <p className="text-[14px] text-bo-text-soft">
              {`${relativTage(String(g.start).slice(0, 10), jetzt.slice(0, 10))} ${String(g.start).slice(11, 16)} · ${g.modus} · ${g.bestaetigt_am ? T.gespraech.bestaetigt : T.gespraech.bestaetigungOffen}`}
              {!g.bestaetigt_am && darf && (
                <button type="button" className="bo-per-link ml-2" onClick={async () => { await gespraechAendernAction({ name: g.name, bestaetigt: true }); router.refresh(); }}>
                  {T.gespraech.bestaetigt}
                </button>
              )}
            </p>
          )}
          <dl className="bo-per-fakten">
            <div><dt>{T.gespraech.spalten.stelle}</dt><dd>{g.stelleTitel || "–"}</dd></div>
            <div><dt>{T.gespraech.spalten.ort}</dt><dd>{g.ort || "–"}</dd></div>
            <div><dt>{T.gespraech.fuehrung}</dt><dd className="flex items-center gap-2"><Avatar name={g.verantwortlichName} groesse={24} />{g.verantwortlichName}</dd></div>
            <div><dt>{T.gespraech.weitere}</dt><dd>{g.weitere_teilnehmer || T.gespraech.nurFuehrung}</dd></div>
            {g.ergebnis && <div><dt>{T.gespraech.spalten.ergebnis}</dt><dd>{g.ergebnis}{g.naechster_schritt ? ` · ${g.naechster_schritt}` : ""}</dd></div>}
            {g.kalender_event && <div><dt>Kalender</dt><dd>{T.gespraech.imKalender}</dd></div>}
          </dl>
          {vertraulich && g.notiz && (
            <div className="bo-per-vorschau" dangerouslySetInnerHTML={{ __html: String(g.notiz).replace(/<(?!\/?p>|br\s*\/?>)[^>]*>/g, "") }} />
          )}
          <Link href={`/personal/bewerbungen/${encodeURIComponent(g.bewerbung)}`} className="bo-per-link inline-flex items-center gap-1 text-[14px]">
            {T.gespraech.bewerbungOeffnen}
            <Icon name="ArrowRight" className="size-4" />
          </Link>
        </div>
      </Sheet>
      <ErgebnisDialog offen={ergebnis} onSchliessen={() => setErgebnis(false)} gespraech={g} leitung={leitung} />
      <VerschiebenDialog offen={verschieben} onSchliessen={() => setVerschieben(false)} gespraech={g} />
    </>
  );
}

/**
 * Woche Mo–Sa mit Gesprächen je Tag (Karten statt Stundenraster – ruhiger, ohne Leerfläche), Abwesenheiten der
 * Gesprächsführung als Text am Tagesanfang. Panel über ?panel=<name>.
 */
export function GespraechsWoche({ montag, gespraeche, abwesend, jetzt, leitung, darf, vertraulich, startPanel }) {
  const [panel, setPanel] = useState(startPanel || null);
  const tage = wochenTageMoSa(montag);
  const g = gespraeche.find((x) => x.name === panel) || null;
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="per-gespraechswoche">
        {tage.map((t) => {
          const liste = gespraeche.filter((x) => String(x.start).startsWith(t));
          const weg = abwesend.filter((a) => a.von <= t && a.bis >= t);
          const heute = t === jetzt.slice(0, 10);
          return (
            <section key={t} className="bo-per-spalte min-h-48" aria-label={`${tagKurz(t)} ${kurzDatum(t)}`}>
              <div className="bo-per-spalte__kopf">
                <h3 className="bo-per-spalte__titel">
                  {heute ? <span className="rounded-full bg-bo-ink px-2 text-bo-ink-inverse">{tagKurz(t)} {kurzDatum(t)}</span> : `${tagKurz(t)} ${kurzDatum(t)}`}
                </h3>
              </div>
              {weg.map((a) => (
                <p key={a.name} className="bo-per-kennzeichen self-start">{T.gespraech.abwesend(a.mitarbeiter_name)}</p>
              ))}
              {liste.map((x) => (
                <button key={x.name} type="button" className="bo-per-karte text-left" onClick={() => setPanel(x.name)} data-testid={`per-gespraech-${x.name}`}>
                  <span className="bo-per-zahl text-[13px] font-semibold text-bo-text-soft">{String(x.start).slice(11, 16)} · {x.modus}</span>
                  <span className="bo-per-karte__name">{x.bewerber || "–"}</span>
                  <span className="bo-per-karte__zeile line-clamp-1">{x.stelleTitel}</span>
                  <span className="bo-per-karte__fuss">
                    <StatusBadge wert={x.status} text={statusText("gespraech", x.status)} ton={statusTon("gespraech", x.status)} groesse="xs" />
                    <Avatar name={x.verantwortlichName} groesse={24} />
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
      <GespraechPanel gespraech={g} offen={Boolean(g)} onSchliessen={() => setPanel(null)} jetzt={jetzt} leitung={leitung} darf={darf} vertraulich={vertraulich} />
    </>
  );
}

export { iso };
