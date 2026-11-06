"use client";
// Monatstabelle (Konzept § 5.2 „Meine Zeiten“, § 5.9 Personalakte › Zeiten) mit Inline-Zeitfeldern (↑/↓ ±5 min,
// Umschalt ±1 h, Schnellwahl 17:00 · 18:00 · wie gestern), Korrektur beantragen (Vergangenheit, Selbstservice),
// Korrektur prüfen (Leitung) und Buchung nachtragen. Speichern = Variante B: sofort, Toast mit „Rückgängig“
// (alter Wert). Selbstservice ändert nur Buchungen von heute (E7) – der Server prüft das erneut.

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import Datumsfeld from "../Formular/Datumsfeld";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { buchungKorrigierenAction, korrekturBeantragenAction, korrekturEntscheidenAction, buchungNachtragenAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { statusText, statusTon, artText, BUCHUNG_ART } from "@/lib/backoffice/personal/status";
import { hm, hmText, saldoText, zeitMin, minZeit, tagKurz, kurzDatum, istWochenende } from "@/lib/backoffice/personal/zeit";
import "../DataTable/datatable.css";
import "./personal.css";

/** Zeitfeld HH:MM mit ↑/↓ (±5 min) und Umschalt (±60 min); speichert bei Enter/Verlassen, wenn geändert. */
export function InlineZeit({ wert, label, onSpeichern, schnell = [], deaktiviert = false, testid }) {
  const [text, setText] = useState(wert || "");
  const [fehler, setFehler] = useState(false);
  const fertig = async () => {
    if (text === (wert || "")) return;
    if (text && zeitMin(text) == null) return setFehler(true);
    setFehler(false);
    const r = await onSpeichern(text);
    if (!r?.ok) {
      setFehler(true);
      setText(wert || "");
    }
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        className="bo-per-zeitfeld"
        value={text}
        aria-label={label}
        aria-invalid={fehler ? "true" : undefined}
        inputMode="numeric"
        placeholder="––:––"
        disabled={deaktiviert}
        data-testid={testid}
        onChange={(e) => setText(e.target.value.replace(/[^\d:]/g, "").slice(0, 5))}
        onBlur={fertig}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const m = zeitMin(text) ?? zeitMin(wert) ?? 8 * 60;
            const d = (e.shiftKey ? 60 : 5) * (e.key === "ArrowUp" ? 1 : -1);
            setText(minZeit(Math.max(0, Math.min(1439, m + d))));
          }
        }}
      />
      {!text &&
        schnell.map((s) => (
          <button key={s.titel} type="button" className="bo-per-chip bo-per-chip--s" onClick={async () => { setText(s.wert); const r = await onSpeichern(s.wert); if (!r?.ok) setText(""); }}>
            {s.titel}
          </button>
        ))}
    </span>
  );
}

function Kennzeichen({ b }) {
  const k = [];
  if (b.korrektur_status === "Beantragt") k.push({ t: T.zeiten.korrekturAngefragt, ton: "see" });
  if (b.gehen && !Number(b.pause_bestaetigt) && Number(b.pause_min) > 0) k.push({ t: T.zeiten.pauseVorgeschlagen, ton: "eiche" });
  if (Number(b.azg_verstoesse) || b.netto > 600) k.push({ t: T.zeiten.azg, ton: "eiche" });
  if (b.quelle === "Offline") k.push({ t: T.zeiten.offline });
  return k.map((x) => (
    <span key={x.t} className="bo-per-kennzeichen" data-ton={x.ton}>
      {x.t}
    </span>
  ));
}

/**
 * @param {{monat:{tage:object[], summe:object, leer:boolean}, heute:string, modus:"selbst"|"leitung"|"lesen",
 *   konto?:boolean, korrektur?:boolean, monatName:string, mitarbeiter?:string}} p
 */
export function MonatsTabelle({ monat, heute, modus = "selbst", konto = false, korrektur = true, monatName, mitarbeiter }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [, start] = useTransition();
  const [korrekturFuer, setKorrekturFuer] = useState(null);
  const [nachtrag, setNachtrag] = useState(false);
  const gestern = (() => {
    const t = monat.tage.filter((d) => d.datum < heute && d.buchungen.some((b) => b.gehen)).at(-1);
    return t?.buchungen.find((b) => b.gehen)?.gehen || null;
  })();

  const speichere = async (b, feld, wert) => {
    const r = await buchungKorrigierenAction({ buchung: b.name, [feld === "pause" ? "pause" : feld]: feld === "pause" ? Number(wert) : wert });
    if (!r.ok) {
      zeige(r.message || T.fehler.nichtGespeichert, { art: "fehler" });
      return r;
    }
    const titel = { kommen: T.zeiten.spalten.kommen, gehen: T.zeiten.spalten.gehen, pause: T.zeiten.spalten.pause }[feld];
    zeige(T.zeiten.gespeichert(titel), {
      art: "ok",
      unter: r.neu?.dauer > 600 ? T.zeiten.azg : undefined,
      aktion: {
        titel: T.zeiten.rueck,
        onClick: async () => {
          const z = await buchungKorrigierenAction({ buchung: b.name, [feld]: feld === "pause" ? r.alt.pause : r.alt[feld] });
          if (!z.ok) zeige(z.message, { art: "fehler" });
          start(() => router.refresh());
        },
      },
    });
    start(() => router.refresh());
    return r;
  };

  const zeilen = [];
  for (const t of monat.tage) {
    const we = istWochenende(t.datum);
    if (!t.buchungen.length) {
      zeilen.push({ t, b: null, we });
      continue;
    }
    for (const b of t.buchungen) zeilen.push({ t, b, we });
  }

  return (
    <div className="bo-dt" data-testid="per-monatstabelle">
      <div className="overflow-x-auto">
        <table className="bo-dt__tabelle bo-per-monat" data-dicht>
          <thead>
            <tr>
              <th scope="col">{T.zeiten.spalten.tag}</th>
              <th scope="col">{T.zeiten.spalten.kommen}</th>
              <th scope="col">{T.zeiten.spalten.gehen}</th>
              <th scope="col" data-rechts>{T.zeiten.spalten.pause}</th>
              <th scope="col" data-rechts>{T.zeiten.spalten.netto}</th>
              <th scope="col">{T.zeiten.spalten.art}</th>
              <th scope="col">{T.zeiten.spalten.status}</th>
              <th scope="col"><span className="bo-per-sr">Aktionen</span></th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map(({ t, b, we }, i) => {
              const heuteZeile = t.datum === heute;
              const darf = modus === "leitung" || (modus === "selbst" && heuteZeile);
              const abw = t.abwesenheit;
              return (
                <tr key={b?.name || `${t.datum}-${i}`} data-wochenende={we ? "" : undefined} data-heute={heuteZeile ? "" : undefined} data-testid={b ? `per-buchung-${b.name}` : undefined}>
                  <td>
                    <span className="font-medium">{tagKurz(t.datum)}</span> <span className="text-bo-text-soft">{kurzDatum(t.datum)}</span>
                  </td>
                  {b ? (
                    <>
                      <td>{darf ? <InlineZeit wert={b.kommen} label={`${T.zeiten.spalten.kommen} ${kurzDatum(t.datum)}`} onSpeichern={(w) => speichere(b, "kommen", w)} testid={`per-kommen-${b.name}`} /> : b.kommen}</td>
                      <td>
                        {darf ? (
                          <InlineZeit wert={b.gehen} label={`${T.zeiten.spalten.gehen} ${kurzDatum(t.datum)}`} onSpeichern={(w) => speichere(b, "gehen", w)} schnell={heuteZeile ? [{ titel: T.zeiten.schnell.siebzehn, wert: "17:00" }, { titel: T.zeiten.schnell.achtzehn, wert: "18:00" }, ...(gestern ? [{ titel: T.zeiten.schnell.gestern, wert: gestern }] : [])] : []} testid={`per-gehen-${b.name}`} />
                        ) : b.gehen ? (
                          b.gehen
                        ) : (
                          <span className="bo-per-zelle__offen">{T.team.offen}</span>
                        )}
                      </td>
                      <td data-rechts>{b.gehen ? `${Number(b.pause_min) || 0} min` : "–"}</td>
                      <td data-rechts className="font-medium">{b.gehen || heuteZeile ? hm(b.netto) : "–"}</td>
                      <td>{BUCHUNG_ART[b.art] || artText(b.art)}</td>
                      <td>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span title={b.status === "Korrigiert" && b.korrigiertVon ? T.zeiten.korrigiert(b.korrigiertVon, kurzDatum(String(b.korrigiert_am).slice(0, 10))) : undefined}>
                            <StatusBadge wert={b.status} text={statusText("buchung", b.status)} ton={statusTon("buchung", b.status)} groesse="xs" />
                          </span>
                          <Kennzeichen b={b} />
                        </span>
                      </td>
                      <td data-rechts>
                        {modus === "selbst" && !heuteZeile && korrektur && b.korrektur_status !== "Beantragt" && (
                          <Knopf size="s" variant="ghost" onClick={() => setKorrekturFuer(b)} data-testid={`per-korrektur-${b.name}`}>
                            {T.zeiten.korrektur}
                          </Knopf>
                        )}
                        {modus === "leitung" && b.korrektur_status === "Beantragt" && <KorrekturEntscheiden b={b} />}
                      </td>
                    </>
                  ) : (
                    <td colSpan={7} className="text-bo-text-faint">
                      {abw ? (
                        <span className="bo-per-kennzeichen" data-ton="salbei">
                          {abw.maskiert ? T.zeiten.abwesend : artText(abw.art)}
                          {abw.status === "Beantragt" ? ` · ${T.team.beantragt}` : ""}
                        </span>
                      ) : we ? (
                        T.zeiten.wochenende
                      ) : (
                        "–"
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {monat.leer && (
        <div className="flex flex-col items-start gap-3 px-3 py-6">
          <p className="text-[15px] text-bo-text-soft">{T.zeiten.leer(monatName)}</p>
        </div>
      )}
      <div className="bo-per-summen" data-testid="per-summen">
        <div className="bo-per-summe">
          <span>{T.zeiten.ist}</span>
          <strong>{hmText(monat.summe.ist)}</strong>
        </div>
        {konto && monat.summe.soll != null && (
          <>
            <div className="bo-per-summe">
              <span>{T.zeiten.soll}</span>
              <strong>{hmText(monat.summe.soll)}</strong>
            </div>
            <div className="bo-per-summe">
              <span title={T.zeiten.angerechnetHilfe}>{T.zeiten.angerechnet}</span>
              <strong>{hmText(monat.summe.angerechnet)}</strong>
            </div>
            <div className="bo-per-summe" data-testid="per-saldo">
              <span>{T.zeiten.saldo}</span>
              <strong>{saldoText(monat.summe.saldo)}</strong>
            </div>
          </>
        )}
        {(modus === "leitung" || modus === "selbst") && (
          <div className="ml-auto self-end">
            <Knopf size="s" variant="secondary" icon="Plus" onClick={() => setNachtrag(true)} data-testid="per-nachtragen">
              {modus === "selbst" ? T.zeiten.nachtragen : T.team.nachtragen}
            </Knopf>
          </div>
        )}
      </div>
      <KorrekturDialog buchung={korrekturFuer} onSchliessen={() => setKorrekturFuer(null)} />
      <NachtragDialog offen={nachtrag} onSchliessen={() => setNachtrag(false)} heute={heute} mitarbeiter={mitarbeiter} nurHeute={modus === "selbst"} leitung={modus === "leitung"} />
    </div>
  );
}

function KorrekturEntscheiden({ b }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [laeuft, start] = useTransition();
  const tun = (ok) =>
    start(async () => {
      const r = await korrekturEntscheidenAction({ buchung: b.name, bestaetigen: ok });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige(ok ? T.zeiten.korrekturBestaetigt : T.zeiten.korrekturAbgelehnt, { art: "ok" });
      router.refresh();
    });
  return (
    <span className="inline-flex gap-1.5">
      <Knopf size="s" variant="secondary" laedt={laeuft} onClick={() => tun(true)}>
        {T.zeilen.knopf.uebernehmen}
      </Knopf>
      <Knopf size="s" variant="ghost" onClick={() => tun(false)}>
        {T.zeilen.knopf.ablehnen.replace(" …", "")}
      </Knopf>
    </span>
  );
}

/** Korrektur beantragen (Vergangenheit): Kommen, Gehen, Pause, Grund (Pflicht) → App korrektur_beantragen. */
export function KorrekturDialog({ buchung, onSchliessen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const [werte, setWerte] = useState({});
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  const offen = Boolean(buchung);
  const w = { kommen: buchung?.kommen || "", gehen: buchung?.gehen || "", pause: String(buchung?.pause_min ?? ""), grund: "", ...werte };
  const senden = () =>
    start(async () => {
      if (!w.grund.trim()) return setFehler({ grund: T.zeiten.grundPflicht });
      const r = await korrekturBeantragenAction({ buchung: buchung.name, kommen: w.kommen, gehen: w.gehen, pause: w.pause, grund: w.grund });
      if (!r.ok) return setFehler(r.fehler || { grund: r.message });
      zeige(T.zeiten.korrekturGesendet, { art: "ok" });
      setWerte({});
      onSchliessen();
      router.refresh();
    });
  return (
    <Dialog
      offen={offen}
      onSchliessen={() => {
        setWerte({});
        setFehler({});
        onSchliessen();
      }}
      titel={buchung ? T.zeiten.korrekturTitel(`${tagKurz(buchung.datum)} ${kurzDatum(buchung.datum)}`) : ""}
      groesse="md"
      testid="per-korrektur-dialog"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={senden} data-testid="per-korrektur-senden">
            {T.zeiten.korrektur}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {["kommen", "gehen", "pause"].map((f) => (
            <label key={f} className="bo-per-feld">
              <span>{T.zeiten.spalten[f]}</span>
              <input className="bo-per-zeitfeld bo-per-zeitfeld--voll" inputMode="numeric" value={w[f]} onChange={(e) => setWerte((x) => ({ ...x, [f]: e.target.value }))} aria-invalid={fehler[f] ? "true" : undefined} />
            </label>
          ))}
        </div>
        <div className="bo-per-feld">
          <label htmlFor={`${id}-g`}>{T.zeiten.grund}</label>
          <textarea id={`${id}-g`} className="bo-per-auswahl bo-per-text" value={w.grund} onChange={(e) => setWerte((x) => ({ ...x, grund: e.target.value }))} maxLength={500} aria-invalid={fehler.grund ? "true" : undefined} />
          {fehler.grund && <span className="bo-per-feld__fehler">{fehler.grund}</span>}
        </div>
      </div>
    </Dialog>
  );
}

/** Buchung nachtragen (Leitung: Datum ≤ heute, Notiz Pflicht; Selbstservice: nur heute). */
export function NachtragDialog({ offen, onSchliessen, heute, mitarbeiter, nurHeute = false, leitung = false, datum: startDatum, personen = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const leer = { datum: startDatum || heute, kommen: "", gehen: "", pause: "", art: "Arbeit", notiz: "", person: mitarbeiter || "" };
  const [w, setW] = useState(leer);
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const senden = () =>
    start(async () => {
      setFehler({});
      const r = await buchungNachtragenAction({ mitarbeiter: w.person || undefined, datum: nurHeute ? heute : w.datum, kommen: w.kommen, gehen: w.gehen, pause: w.pause, art: w.art, notiz: w.notiz });
      if (!r.ok) return setFehler(r.fehler || { kommen: r.message });
      zeige(T.team.gespeichert, { art: r.warnung ? "warnung" : "ok", unter: r.warnung || undefined });
      setW(leer);
      onSchliessen();
      router.refresh();
    });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.team.nachtragen}
      groesse="md"
      testid="per-nachtrag-dialog"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={senden} data-testid="per-nachtrag-senden">
            {T.speichern}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {personen.length > 0 && (
          <label className="bo-per-feld">
            <span>{T.urlaub.person}</span>
            <select className="bo-per-auswahl" value={w.person} onChange={(e) => setze("person", e.target.value)}>
              <option value="">–</option>
              {personen.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.titel}
                </option>
              ))}
            </select>
          </label>
        )}
        {!nurHeute && (
          <div className="bo-per-feld">
            <label htmlFor={`${id}-d`}>{T.team.spaltenB.datum}</label>
            <Datumsfeld id={`${id}-d`} value={w.datum} onChange={(v) => setze("datum", v)} aria-label={T.team.spaltenB.datum} invalid={Boolean(fehler.datum)} />
            {fehler.datum && <span className="bo-per-feld__fehler">{fehler.datum}</span>}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {["kommen", "gehen", "pause"].map((f) => (
            <label key={f} className="bo-per-feld">
              <span>{T.zeiten.spalten[f]}</span>
              <input className="bo-per-zeitfeld bo-per-zeitfeld--voll" inputMode="numeric" placeholder={f === "pause" ? "min" : "––:––"} value={w[f]} onChange={(e) => setze(f, e.target.value)} aria-invalid={fehler[f] ? "true" : undefined} data-testid={`per-nachtrag-${f}`} />
              {fehler[f] && <span className="bo-per-feld__fehler">{fehler[f]}</span>}
            </label>
          ))}
        </div>
        <label className="bo-per-feld">
          <span>{T.zeiten.spalten.art}</span>
          <select className="bo-per-auswahl" value={w.art} onChange={(e) => setze("art", e.target.value)}>
            {Object.entries(BUCHUNG_ART).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {leitung && (
          <label className="bo-per-feld">
            <span>{T.team.notizPflicht}</span>
            <textarea className="bo-per-auswahl bo-per-text" value={w.notiz} onChange={(e) => setze("notiz", e.target.value)} aria-invalid={fehler.notiz ? "true" : undefined} />
            {fehler.notiz && <span className="bo-per-feld__fehler">{fehler.notiz}</span>}
          </label>
        )}
        <p className="flex items-center gap-2 text-[12px] text-bo-text-faint">
          <Icon name="Info" className="size-3.5" />
          {T.fehler.zukunft}
        </p>
      </div>
    </Dialog>
  );
}
