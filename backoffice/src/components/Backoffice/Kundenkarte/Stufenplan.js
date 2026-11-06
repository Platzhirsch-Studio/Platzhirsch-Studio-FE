"use client";
// Stufen & Vorteile (Konzept §3.7): Spalte je aktive Stufe, Zuordnung Vorteil → Stufe als einzige Wahrheit
// (gilt_ab_stufe folgt beim Speichern), Ziehen zwischen Spalten mit Alternative „Verschieben nach …“ (WCAG 2.5.7),
// Speicherleiste mit Vorschau „n Karten würden aufsteigen“, Live-Textprüfung, Stufen- und Vorteil-Sheet.
// Mitarbeitende lesen nur – ohne Schwellen-Beträge.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Leer from "../Leer";
import Schalter from "../Schalter";
import { Icon } from "../icons";
import { Menue, MenuePunkt, Sheet } from "../Overlay";
import { useToast } from "../Toast";
import Speicherleiste from "../Formular/Speicherleiste";
import BetragFeld from "../Eingabe/BetragFeld";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import StufenKennzeichen from "./StufenKennzeichen";
import MiniKarte from "./MiniKarte";
import { VorteilIcon } from "./VorteilIcon";
import { Textfeld } from "./Dialoge";
import { stammdatenAction, stufenplanSpeichernAction, stufenplanVorschauAction, vorteilSpeichernAction } from "@/lib/backoffice/kundenkarte/actions";
import { STATUS_FARBEN, STUFEN_VORSCHLAEGE, VORTEIL_ART, brauchtRing } from "@/lib/backoffice/kundenkarte/labels";
import { giltAbAusZuordnung, stufenplanFehler, vorschauSatz, widersprueche } from "@/lib/backoffice/kundenkarte/regeln";
import { pruefeKundentext } from "@/lib/backoffice/kundenkarte/textpruefung";
import { cent } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

function TextMitPruefung({ label, wert, onWert, nurLesen, testid }) {
  const p = pruefeKundentext(wert);
  return <Textfeld label={label} wert={wert} onWert={onWert} mehrzeilig max={1000} disabled={nurLesen} fehler={p.ok ? undefined : p.text} hilfe={T.stufen.textHinweis} testid={testid} />;
}

function StufeSheet({ stufe, karten, leitung, onAendern, onSchliessen, betraege }) {
  const s = stufe;
  const farbeStatus = STATUS_FARBEN.includes(String(s.farbe || "").toLowerCase());
  return (
    <Sheet offen onSchliessen={onSchliessen} titel={T.stufen.stufeSheet} unter={s.stufenname} groesse="md" testid="kk-stufe-sheet">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <MiniKarte nr="KK-······" stufe={s.stufenname} farbe={s.farbe} drehbar={false} />
          <StufenKennzeichen stufe={s.stufenname} farbe={s.farbe} groesse="l" />
        </div>
        <dl className="bo-kk-fakten">
          <div>
            <dt>Name</dt>
            <dd>{s.stufenname}</dd>
          </div>
          <div>
            <dt>Karten</dt>
            <dd>{karten}</dd>
          </div>
        </dl>
        <Textfeld label="Reihenfolge" type="number" wert={String(s.reihenfolge)} onWert={(w) => onAendern({ reihenfolge: Number(w) || 0 })} disabled={!leitung} />
        {betraege && (
          <div>
            <label className="bo-kk-label" htmlFor="kk-schwelle">
              Schwelle (Umsatz im Bewertungszeitraum)
            </label>
            <BetragFeld id="kk-schwelle" value={s.schwelle_jahresumsatz_cent} onChange={(c) => onAendern({ schwelle_jahresumsatz_cent: c ?? 0 })} disabled={!leitung} />
            <p className="bo-kk-hilfe">{T.stufen.schwelleSatz}</p>
          </div>
        )}
        <div>
          <span className="bo-kk-label">Farbe</span>
          <div className="flex flex-wrap items-center gap-2">
            <input type="color" aria-label="Farbe wählen" value={s.farbe || "#5b626a"} disabled={!leitung} onChange={(e) => onAendern({ farbe: e.target.value })} className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent" />
            {STUFEN_VORSCHLAEGE.map((f) => (
              <button key={f} type="button" disabled={!leitung} aria-label={`Farbe ${f}`} className="size-8 rounded-full shadow-(--bo-sh-btn)" style={{ background: f }} onClick={() => onAendern({ farbe: f })} />
            ))}
          </div>
          {farbeStatus && <p className="bo-kk-warn mt-2">{T.stufen.farbeStatus}</p>}
          {!farbeStatus && brauchtRing(s.farbe) && <p className="bo-kk-hilfe">{T.stufen.ring}</p>}
        </div>
        <TextMitPruefung label="Text für Kundinnen und Kunden" wert={s.beschreibung_kunde} onWert={(w) => onAendern({ beschreibung_kunde: w })} nurLesen={!leitung} testid="kk-stufe-text" />
        <Textfeld label="Interne Beschreibung" wert={s.beschreibung_intern} onWert={(w) => onAendern({ beschreibung_intern: w })} mehrzeilig max={1000} disabled={!leitung} />
        <Schalter label="Aktiv" an={Boolean(s.aktiv)} onWechsel={(an) => onAendern({ aktiv: an ? 1 : 0 })} deaktiviert={!leitung || (Boolean(s.aktiv) && karten > 0)} beschreibung={s.aktiv && karten > 0 ? T.stufen.deaktivierenGrund(karten) : undefined} />
      </div>
    </Sheet>
  );
}

function VorteilSheet({ vorteil, stufen, nutzung, leitung, onSchliessen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const neu = !vorteil.name;
  const [v, setV] = useState({ aktiv: 1, art: "Persoenlich", einloesbar_pro_jahr: 0, reihenfolge: 10, titel: "", beschreibung_kunde: "", beschreibung_intern: "", ...vorteil });
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const zugeordnet = stufen.filter((s) => s.vorteile.some((z) => z.vorteil === v.name)).length;
  const giltAb = giltAbAusZuordnung(stufen)[v.name];
  const geaendert = JSON.stringify(v) !== JSON.stringify({ aktiv: 1, art: "Persoenlich", einloesbar_pro_jahr: 0, reihenfolge: 10, titel: "", beschreibung_kunde: "", beschreibung_intern: "", ...vorteil });
  const speichern = () =>
    starte(async () => {
      const r = await vorteilSpeichernAction({ vorteil: v });
      if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
      zeige(neu ? "Vorteil angelegt" : "Vorteil gespeichert", { art: "ok" });
      onSchliessen();
      router.refresh();
    });
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={neu ? T.stufen.vorteilAnlegen : T.stufen.vorteilSheet}
      unter={v.name || undefined}
      groesse="md"
      ungespeichert={geaendert}
      testid="kk-vorteil-sheet"
      fuss={
        leitung ? (
          <>
            <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={!geaendert || !v.titel.trim()} onClick={speichern}>
              {neu ? "Anlegen" : "Speichern"}
            </Knopf>
          </>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        <Textfeld label="Titel" wert={v.titel} onWert={(w) => setV({ ...v, titel: w })} disabled={!leitung} pflicht />
        <div>
          <label className="bo-kk-label" htmlFor="kk-v-art">
            Art
          </label>
          <select id="kk-v-art" className="bo-kk-feld" value={v.art} disabled={!leitung} onChange={(e) => setV({ ...v, art: e.target.value })}>
            {Object.entries(VORTEIL_ART).map(([w, a]) => (
              <option key={w} value={w}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="bo-kk-raster" data-spalten="2">
          <Textfeld label="Einlösbar je Kalenderjahr" type="number" min={0} wert={String(v.einloesbar_pro_jahr)} onWert={(w) => setV({ ...v, einloesbar_pro_jahr: Math.max(0, Number(w) || 0) })} disabled={!leitung} hilfe={Number(v.einloesbar_pro_jahr) ? undefined : "0 = unbegrenzt"} />
          <Textfeld label="Reihenfolge" type="number" wert={String(v.reihenfolge)} onWert={(w) => setV({ ...v, reihenfolge: Number(w) || 0 })} disabled={!leitung} />
        </div>
        <TextMitPruefung label="Text für Kundinnen und Kunden" wert={v.beschreibung_kunde} onWert={(w) => setV({ ...v, beschreibung_kunde: w })} nurLesen={!leitung} testid="kk-vorteil-text" />
        <Textfeld label="Interne Beschreibung" wert={v.beschreibung_intern} onWert={(w) => setV({ ...v, beschreibung_intern: w })} mehrzeilig max={1000} disabled={!leitung} />
        <Schalter label="Aktiv" an={Boolean(Number(v.aktiv))} onWechsel={(an) => setV({ ...v, aktiv: an ? 1 : 0 })} deaktiviert={!leitung} beschreibung="Deaktivieren statt Löschen – Nachweise bleiben." />
        {!neu && (
          <dl className="bo-kk-fakten rounded-2xl bg-bo-surface-2 p-4">
            <div>
              <dt>Gilt ab</dt>
              <dd>{giltAb ? T.stufen.giltAb(giltAb) : "keiner Stufe zugeordnet"}</dd>
            </div>
            <div>
              <dt>Nutzung</dt>
              <dd>{T.stufen.zaehler(zugeordnet, nutzung[v.name] || 0)}</dd>
            </div>
          </dl>
        )}
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Sheet>
  );
}

export default function Stufenplan({ stufen: start = [], vorteile = [], kartenJeStufe = {}, nutzung = {}, leitung = false, betraege = false, startPanel = "" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [stufen, setStufen] = useState(start);
  const [basis, setBasis] = useState(start);
  if (start !== basis) {
    setBasis(start);
    setStufen(start);
  }
  const [sheet, setSheet] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const [zieht, setZieht] = useState(null);
  const [ueber, setUeber] = useState(null);
  const [fehler, setFehler] = useState({});
  const [laeuft, starte] = useTransition();
  const [panel, setPanelRoh] = useState(startPanel || null);
  const setPanel = (w) => {
    setPanelRoh(w);
    try {
      const u = new URL(window.location.href);
      if (w) u.searchParams.set("panel", w);
      else u.searchParams.delete("panel");
      window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* URL nicht änderbar – Zustand bleibt lokal */
    }
  };
  const vt = useMemo(() => Object.fromEntries(vorteile.map((v) => [v.name, v])), [vorteile]);
  const aktive = stufen.filter((s) => s.aktiv).sort((a, b) => a.reihenfolge - b.reihenfolge);
  const geaendert = JSON.stringify(stufen) !== JSON.stringify(start);
  const anzahlGeaendert = stufen.filter((s, i) => JSON.stringify(s) !== JSON.stringify(start[i])).length;
  const lokaleFehler = stufenplanFehler(stufen);
  const kopf = useRef([]);

  useEffect(() => {
    if (!geaendert || !leitung || !betraege) return undefined;
    const h = setTimeout(async () => {
      const r = await stufenplanVorschauAction({ stufen });
      if (r?.ok) setVorschau(r.vorschau);
    }, 400);
    return () => clearTimeout(h);
  }, [stufen, geaendert, leitung, betraege]);

  const aendern = (name, w) => setStufen((ss) => ss.map((s) => (s.name === name ? { ...s, ...w } : s)));
  const verschieben = (vorteil, von, nach) =>
    setStufen((ss) =>
      ss.map((s) => {
        if (s.name === von) return { ...s, vorteile: s.vorteile.filter((z) => z.vorteil !== vorteil) };
        if (s.name === nach && !s.vorteile.some((z) => z.vorteil === vorteil)) return { ...s, vorteile: [...s.vorteile, { vorteil, hinweis: "" }] };
        return s;
      })
    );
  const zuordnen = (stufe, vorteil) => setStufen((ss) => ss.map((s) => (s.name === stufe && !s.vorteile.some((z) => z.vorteil === vorteil) ? { ...s, vorteile: [...s.vorteile, { vorteil, hinweis: "" }] } : s)));
  const entfernen = (stufe, vorteil) => setStufen((ss) => ss.map((s) => (s.name === stufe ? { ...s, vorteile: s.vorteile.filter((z) => z.vorteil !== vorteil) } : s)));
  const speichern = () =>
    starte(async () => {
      setFehler({});
      const r = await stufenplanSpeichernAction({ stufen });
      if (!r?.ok) {
        setFehler(r?.fehler || {});
        return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      }
      zeige(T.stufen.gespeichert, { art: "ok" });
      setVorschau(null);
      router.refresh();
    });
  useKuerzel("akte", { "akte.speichern": () => (geaendert && leitung ? speichern() : false) });

  const zugeordnetIrgendwo = new Set(stufen.flatMap((s) => s.vorteile.map((z) => z.vorteil)));
  const wid = widersprueche(stufen, vorteile);
  const offenesPanel = panel && panel.startsWith("vorteil:") ? vt[panel.slice(8)] : null;

  if (!stufen.length) {
    return (
      <Leer
        art="leer"
        titel={T.stufen.keineStufen}
        text=""
        icon="Layers"
        aktion={
          leitung ? (
            <Knopf
              variant="primary"
              onClick={() =>
                starte(async () => {
                  const r = await stammdatenAction();
                  zeige(r?.ok ? "Standardstufen angelegt" : r?.message || T.fehler.allgemein, { art: r?.ok ? "ok" : "fehler" });
                  router.refresh();
                })
              }
              laedt={laeuft}
            >
              {T.stufen.standard}
            </Knopf>
          ) : null
        }
        testid="kk-stufen-leer"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!leitung && <p className="bo-kk-satz">{T.stufen.nurLesen}</p>}
      <div className="bo-kk-plan" style={{ "--kk-spalten": aktive.length }} data-testid="kk-stufenplan">
        {aktive.map((s, i) => (
          <section
            key={s.name}
            className="bo-kachel bo-kk-plan__spalte bo-kk-plan__ziel"
            aria-labelledby={`kk-st-${i}`}
            data-ueber={ueber === s.name ? "" : undefined}
            onDragOver={(e) => {
              if (!zieht || !leitung) return;
              e.preventDefault();
              setUeber(s.name);
            }}
            onDragLeave={() => setUeber(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (zieht && zieht.von !== s.name) verschieben(zieht.vorteil, zieht.von, s.name);
              setZieht(null);
              setUeber(null);
            }}
            data-testid={`kk-stufe-${s.name}`}
          >
            <button
              type="button"
              ref={(el) => (kopf.current[i] = el)}
              className="bo-kk-plan__kopf"
              tabIndex={i === 0 ? 0 : -1}
              onClick={() => setSheet(s.name)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const n = (i + (e.key === "ArrowRight" ? 1 : -1) + aktive.length) % aktive.length;
                  kopf.current[n]?.focus();
                }
              }}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <StufenKennzeichen stufe={s.stufenname} farbe={s.farbe} groesse="l" />
                <span className="text-[13px] tabular-nums text-bo-text-faint">{s.reihenfolge}</span>
              </span>
              <span id={`kk-st-${i}`} className="text-[13px] text-bo-text-soft">
                {i === 0 ? T.stufen.start : betraege ? T.stufen.ab(cent(s.schwelle_jahresumsatz_cent).replace(",00", "")) : "höhere Stufe"} · {T.stufen.karten(kartenJeStufe[s.name] || 0)}
              </span>
              {fehler[s.stufenname] || lokaleFehler[s.stufenname] ? <span className="bo-kk-fehler">{fehler[s.stufenname] || lokaleFehler[s.stufenname]}</span> : null}
            </button>
            {s.beschreibung_kunde && <p className="text-[13px] leading-5 text-bo-text-soft">„{s.beschreibung_kunde}“</p>}
            <h3 className="mt-1 text-[13px] font-medium text-bo-text-soft">Vorteile</h3>
            <ul className="flex flex-col gap-2">
              {s.vorteile.map((z) => {
                const v = vt[z.vorteil];
                if (!v) return null;
                return (
                  <li
                    key={z.vorteil}
                    className="bo-kk-plan__zuordnung"
                    draggable={leitung}
                    data-zieht={zieht?.vorteil === z.vorteil && zieht?.von === s.name ? "" : undefined}
                    onDragStart={() => setZieht({ vorteil: z.vorteil, von: s.name })}
                    onDragEnd={() => (setZieht(null), setUeber(null))}
                  >
                    <VorteilIcon art={v.art} className="size-4 flex-none text-bo-text-soft" />
                    <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setPanel(`vorteil:${v.name}`)}>
                      {v.titel}
                      {!Number(v.aktiv) && <span className="ml-1 text-[12px] text-bo-text-faint">(inaktiv)</span>}
                    </button>
                    {leitung && (
                      <Menue label={`Zuordnung ${v.titel}`} platzierung="unten-ende" ausloeser={(p) => <Knopf {...p} size="s" variant="ghost" icon="Ellipsis" label={`Zuordnung ${v.titel}`} />}>
                        {aktive
                          .filter((x) => x.name !== s.name)
                          .map((x) => (
                            <MenuePunkt key={x.name} icon="ArrowRight" onWaehlen={() => verschieben(z.vorteil, s.name, x.name)}>
                              {T.stufen.verschieben.replace(" …", "")} {x.stufenname}
                            </MenuePunkt>
                          ))}
                        <MenuePunkt icon="X" gefaehrlich onWaehlen={() => entfernen(s.name, z.vorteil)}>
                          {T.stufen.entfernen}
                        </MenuePunkt>
                      </Menue>
                    )}
                  </li>
                );
              })}
              {s.vorteile.length === 0 && <li className="text-[13px] text-bo-text-soft">{T.vorteile.leer}</li>}
            </ul>
            {wid
              .filter((w) => w.stufe === s.name)
              .map((w) => (
                <p key={w.vorteil} className="bo-kk-warn">
                  {T.stufen.widerspruch(w.titel, w.giltAb)} · {T.stufen.angleichen} beim Speichern
                </p>
              ))}
            {leitung && (
              <select className="bo-kk-auswahl mt-1 w-full" aria-label={`${T.stufen.zuordnen} ${s.stufenname}`} value="" onChange={(e) => e.target.value && zuordnen(s.name, e.target.value)}>
                <option value="">+ {T.stufen.zuordnen}</option>
                {vorteile
                  .filter((v) => Number(v.aktiv) && !s.vorteile.some((z) => z.vorteil === v.name))
                  .map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.titel}
                    </option>
                  ))}
              </select>
            )}
            <p className="bo-kk-plan__erbt mt-auto pt-2">{T.stufen.enthaelt(i > 0 ? aktive[i - 1].stufenname : "")}</p>
          </section>
        ))}

        <section className="bo-kachel bo-kk-plan__spalte" aria-labelledby="kk-katalog">
          <div className="flex items-center justify-between">
            <h2 id="kk-katalog" className="bo-kachel__titel">
              {T.stufen.katalog}
            </h2>
            {leitung && (
              <Knopf size="s" icon="Plus" onClick={() => setSheet({ neu: true })}>
                {T.stufen.vorteilAnlegen}
              </Knopf>
            )}
          </div>
          {vorteile.length === 0 ? (
            <p className="text-[13px] text-bo-text-soft">{T.stufen.katalogLeer}</p>
          ) : (
            <ul className="bo-kk-zeilen -mx-3">
              {vorteile.map((v) => (
                <li key={v.name} className="bo-kk-zeile">
                  <span className="bo-kk-zeile__icon" aria-hidden="true">
                    <VorteilIcon art={v.art} className="size-4" />
                  </span>
                  <button type="button" className="bo-kk-zeile__text text-left" onClick={() => setPanel(`vorteil:${v.name}`)}>
                    <span className="bo-kk-zeile__titel block">{v.titel}</span>
                    <span className="bo-kk-zeile__unter block">
                      {VORTEIL_ART[v.art]?.label} · {Number(v.einloesbar_pro_jahr) ? `${v.einloesbar_pro_jahr}× je Jahr` : "unbegrenzt"}
                      {!Number(v.aktiv) ? " · inaktiv" : ""}
                      {!zugeordnetIrgendwo.has(v.name) ? " · nicht zugeordnet" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {leitung && (
        <Speicherleiste
          zuSpeichern={geaendert}
          geaendert={geaendert}
          laedt={laeuft}
          onSpeichern={speichern}
          onVerwerfen={() => (setStufen(start), setVorschau(null), setFehler({}))}
          speichernText="Speichern"
          stand={geaendert ? `${T.stufen.ungespeichert(anzahlGeaendert)}${vorschau ? ` · ${vorschauSatz(vorschau)}` : ""}` : undefined}
        />
      )}

      {typeof sheet === "string" && (
        <StufeSheet stufe={stufen.find((s) => s.name === sheet)} karten={kartenJeStufe[sheet] || 0} leitung={leitung} betraege={betraege} onAendern={(w) => aendern(sheet, w)} onSchliessen={() => setSheet(null)} />
      )}
      {sheet?.neu && <VorteilSheet vorteil={{}} stufen={stufen} nutzung={nutzung} leitung={leitung} onSchliessen={() => setSheet(null)} />}
      {offenesPanel && <VorteilSheet key={offenesPanel.name} vorteil={offenesPanel} stufen={stufen} nutzung={nutzung} leitung={leitung} onSchliessen={() => setPanel(null)} />}
    </div>
  );
}
