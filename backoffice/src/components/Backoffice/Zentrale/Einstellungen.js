"use client";
// Einstellungs-Bausteine der Zentrale (10-konzept-zentrale § 3.9; Lounge: Felder als eingelassene Flächen,
// Etiketten 13/500 in Satzschreibung, Speicherleiste als Material-Kapsel, iOS-Schalter).
//   EinstellungenFormular  Felder + Speicherleiste (erscheint nach der ersten Änderung, Strg+S, Verlassen fragt)
//   SchalterMitWirkung     Testmodus / Website-API: eigene Aktion nach Rückfrage, nie Teil der Speicherleiste
//   Schliesstage           Betriebsruhe-Liste (Datum doppelt → Fehler am Feld)
//   KalkulationEditor      ph_projekte Kalkulation: Kostensätze, Ziel-DB, Gemeinkosten, Schwellen, Begründung
//   StandardFirmaKnopf     Rückfrage mit Rechtsträger-Satz, kein Undo

import { useCallback, useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import Bestaetigen from "../Bestaetigen";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { Icon } from "../icons";
import { EINSTELLUNGEN as T } from "@/lib/backoffice/zentrale/texte";
import { apiSchaltenAction, einstellungenSpeichernAction, firmaSpeichernAction, firmaStandardAction, kalkulationSpeichernAction, singleSpeichernAction, testmodusSchaltenAction } from "@/lib/backoffice/zentrale/actions";

/** Speichert je nach `ziel` über die passende Server Action. */
async function speichere(ziel, werte, modified) {
  if (ziel.art === "einstellungen") return einstellungenSpeichernAction({ reiter: ziel.reiter, werte, modified });
  if (ziel.art === "firma") return firmaSpeichernAction({ name: ziel.name, werte, modified });
  if (ziel.art === "single") return singleSpeichernAction({ doctype: ziel.doctype, werte, modified });
  return { ok: false, message: "Unbekanntes Ziel." };
}

function gleich(a, b) {
  return JSON.stringify(a ?? "") === JSON.stringify(b ?? "");
}

/**
 * @param {{abschnitte:Array<{titel?:string, text?:string, felder:Array<{name:string,label:string,typ?:string,optionen?:string[],hilfe?:string,voll?:boolean,nurLesen?:boolean}>}>,
 *   werte:object, ziel:object, modified?:string, nurLesen?:boolean, testid?:string}} p
 */
export function EinstellungenFormular({ abschnitte = [], werte: start = {}, ziel, modified, nurLesen = false, testid = "einstellungen-formular", kinder }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [werte, setWerte] = useState(start);
  const [basis, setBasis] = useState(start);
  const [stand, setStand] = useState(modified);
  const [fehler, setFehler] = useState({});
  const [laeuft, starte] = useTransition();
  const id = useId();
  const geaendert = useMemo(() => Object.keys(werte).filter((k) => !gleich(werte[k], basis[k])), [werte, basis]);
  const dirty = geaendert.length > 0;

  const speichern = useCallback(() => {
    if (!dirty || nurLesen) return;
    starte(async () => {
      const aenderung = Object.fromEntries(geaendert.map((k) => [k, werte[k]]));
      const r = await speichere(ziel, aenderung, stand);
      if (r?.ok) {
        setBasis(werte);
        setFehler({});
        if (r.modified) setStand(r.modified);
        zeige(T.gespeichert, { art: "ok" });
        router.refresh();
      } else {
        setFehler(r?.fehler || {});
        zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
      }
    });
  }, [dirty, nurLesen, geaendert, werte, ziel, stand, zeige, router]);

  useEffect(() => {
    const taste = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        speichern();
      }
    };
    const weg = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", taste);
    window.addEventListener("beforeunload", weg);
    return () => {
      window.removeEventListener("keydown", taste);
      window.removeEventListener("beforeunload", weg);
    };
  }, [speichern, dirty]);

  const setze = (k, v) => setWerte((w) => ({ ...w, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
      className="flex flex-col gap-6"
      data-testid={testid}
      noValidate
    >
      {abschnitte.map((a, ai) => (
        <section key={a.titel || ai} className="bo-kachel" aria-labelledby={a.titel ? `${id}-a${ai}` : undefined}>
          {(a.titel || a.text) && (
            <div className="bo-kachel__kopf">
              <div className="min-w-0">
                {a.titel && <h2 id={`${id}-a${ai}`} className="bo-kachel__titel">{a.titel}</h2>}
                {a.text && <p className="bo-kachel__unter max-w-[70ch]">{a.text}</p>}
              </div>
            </div>
          )}
          <div className="zb-form">
            {a.felder.map((f) => (
              <Feld key={f.name} f={f} wert={werte[f.name]} fehler={fehler[f.name]} nurLesen={nurLesen || f.nurLesen} onChange={(v) => setze(f.name, v)} id={`${id}-${f.name}`} />
            ))}
          </div>
        </section>
      ))}
      {kinder}
      {!nurLesen && dirty && (
        <div className="zb-speicher bo-rise" role="region" aria-label={T.ungespeichert} data-testid="speicherleiste">
          <span className="zb-speicher__text">
            {T.ungespeichert} · {geaendert.length}
          </span>
          <span className="flex gap-2">
            <Knopf variant="ghost" onClick={() => { setWerte(basis); setFehler({}); }}>
              {T.verwerfen}
            </Knopf>
            <Knopf variant="primary" type="submit" laedt={laeuft} kuerzel="Strg+S" data-testid="einstellungen-speichern">
              {T.speichern}
            </Knopf>
          </span>
        </div>
      )}
    </form>
  );
}

function Feld({ f, wert, fehler, nurLesen, onChange, id }) {
  const hilfeId = f.hilfe || fehler ? `${id}-h` : undefined;
  const klasse = f.voll ? "zb-feld zb-feld--voll" : "zb-feld";
  if (f.typ === "check") {
    return (
      <div className={klasse}>
        <div className="zb-schalterzeile">
          <span>
            <span className="zb-schalterzeile__titel block text-[14px]">{f.label}</span>
            {f.hilfe && <span className="zb-schalterzeile__text block">{f.hilfe}</span>}
          </span>
          <Schalter label={f.label} zeile={false} an={!!Number(wert)} onWechsel={(an) => onChange(an ? 1 : 0)} deaktiviert={nurLesen} />
        </div>
      </div>
    );
  }
  const gemeinsam = { id, className: "zb-eingabe", readOnly: nurLesen, disabled: nurLesen && f.typ === "select", "aria-invalid": fehler ? true : undefined, "aria-describedby": hilfeId };
  return (
    <div className={klasse}>
      <label htmlFor={id}>{f.label}</label>
      {f.typ === "select" ? (
        <select {...gemeinsam} value={wert ?? ""} onChange={(e) => onChange(e.target.value)}>
          {(f.optionen || []).map((o) => (
            <option key={o} value={o}>
              {f.anzeige?.[o] || o || "–"}
            </option>
          ))}
        </select>
      ) : f.typ === "text" ? (
        <textarea {...gemeinsam} value={wert ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...gemeinsam} type={f.typ === "email" ? "email" : f.typ === "zahl" ? "text" : "text"} inputMode={f.typ === "zahl" ? "numeric" : undefined} value={wert ?? ""} onChange={(e) => onChange(f.typ === "zahl" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value)} autoComplete="off" />
      )}
      {(fehler || f.hilfe) && (
        <p id={hilfeId} className={fehler ? "zb-feld__fehler" : "zb-feld__hilfe"}>
          {fehler || f.hilfe}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Schalter mit Wirkung

/** Testmodus oder Website-API (§ 3.9.1): Schalter → Rückfrage mit echter Wirkung → sofort gespeichert. */
export function SchalterMitWirkung({ art, an: start, nurLesen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [an, setAn] = useState(!!start);
  const [frage, setFrage] = useState(null);
  const [laeuft, starte] = useTransition();
  const test = art === "testmodus";
  const titel = test ? T.testmodus : T.api;
  const text = test ? (an ? T.testmodusAn : T.testmodusAus) : an ? T.apiAn : T.apiAus;
  const ziel = frage;
  const dialog = ziel === null ? null : test ? (ziel ? { t: T.testmodusEinFrage, x: T.testmodusEinText, k: T.einschalten } : { t: T.testmodusAusFrage, x: T.testmodusAusText, k: T.ausschalten }) : ziel ? { t: T.apiEinFrage, x: T.apiEinText, k: T.einschalten } : { t: T.apiAusFrage, x: T.apiAusText, k: T.ausschalten };
  return (
    <div className="zb-schalterzeile" data-testid={`schalter-${art}`}>
      <span>
        <span className="zb-schalterzeile__titel block">{titel}</span>
        <span className="zb-schalterzeile__text block">{text}</span>
      </span>
      <Schalter label={titel} zeile={false} an={an} onWechsel={(neu) => setFrage(neu)} deaktiviert={nurLesen} testid={`schalter-${art}-knopf`} />
      {dialog && (
        <Bestaetigen
          offen
          titel={dialog.t}
          text={dialog.x}
          bestaetigen={dialog.k}
          gefaehrlich={test ? !ziel : !ziel}
          laeuft={laeuft}
          onAbbrechen={() => setFrage(null)}
          onBestaetigen={() =>
            starte(async () => {
              const r = test ? await testmodusSchaltenAction({ an: ziel }) : await apiSchaltenAction({ an: ziel });
              setFrage(null);
              if (r?.ok) {
                setAn(ziel);
                zeige(test ? (ziel ? T.testmodusEin : T.testmodusAusToast) : ziel ? T.apiEin : T.apiAusToast, { art: "ok" });
                router.refresh();
              } else zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
            })
          }
          testid={`frage-${art}`}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Schließtage

export function Schliesstage({ zeilen: start = [], bundesland, laender = [], modified, nurLesen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [zeilen, setZeilen] = useState(start.map((z, i) => ({ k: `s${i}`, datum: String(z.datum || "").slice(0, 10), bezeichnung: z.bezeichnung || "Betriebsruhe" })));
  const [land, setLand] = useState(bundesland || "Vorarlberg");
  const [fehler, setFehler] = useState({});
  const [stand, setStand] = useState(modified);
  const [laeuft, starte] = useTransition();
  const basis = useMemo(() => JSON.stringify({ z: start.map((z) => [String(z.datum || "").slice(0, 10), z.bezeichnung || "Betriebsruhe"]), l: bundesland || "Vorarlberg" }), [start, bundesland]);
  const jetzt = JSON.stringify({ z: zeilen.map((z) => [z.datum, z.bezeichnung]), l: land });
  const dirty = basis !== jetzt;
  const doppelt = (i) => zeilen.some((z, j) => j !== i && z.datum && z.datum === zeilen[i].datum);

  const speichern = () =>
    starte(async () => {
      const r = await einstellungenSpeichernAction({ reiter: "kalender", werte: { feiertage_bundesland: land, betriebsruhe: zeilen.filter((z) => z.datum).map(({ datum, bezeichnung }) => ({ datum, bezeichnung })) }, modified: stand });
      if (r?.ok) {
        setFehler({});
        if (r.modified) setStand(r.modified);
        zeige(T.gespeichert, { art: "ok" });
        router.refresh();
      } else {
        setFehler(r?.fehler || {});
        zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
      }
    });

  return (
    <div className="flex flex-col gap-6" data-testid="schliesstage">
      <section className="bo-kachel" aria-labelledby="zb-fei-t">
        <div className="bo-kachel__kopf">
          <div>
            <h2 id="zb-fei-t" className="bo-kachel__titel">{T.feiertage}</h2>
            <p className="bo-kachel__unter">{T.feiertageText(land)}</p>
          </div>
        </div>
        <div className="zb-form">
          <div className="zb-feld">
            <label htmlFor="zb-land">Bundesland</label>
            <select id="zb-land" className="zb-eingabe" value={land} onChange={(e) => setLand(e.target.value)} disabled={nurLesen}>
              {laender.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <p className="zb-leise mt-4">{T.feiertageFehlt}</p>
      </section>
      <section className="bo-kachel" aria-labelledby="zb-ruhe-t">
        <div className="bo-kachel__kopf flex-wrap">
          <div>
            <h2 id="zb-ruhe-t" className="bo-kachel__titel">{T.betriebsruhe}</h2>
            <p className="bo-kachel__unter">{T.betriebsruheUnter}</p>
          </div>
          {!nurLesen && (
            <Knopf icon="Plus" size="s" onClick={() => setZeilen((z) => [...z, { k: `n${Date.now()}`, datum: "", bezeichnung: "Betriebsruhe" }])} data-testid="schliesstag-neu">
              {T.tagHinzu}
            </Knopf>
          )}
        </div>
        {zeilen.length === 0 ? (
          <p className="zb-leise">{T.betriebsruheLeer}</p>
        ) : (
          <ul className="zb-zeilen">
            {zeilen.map((z, i) => (
              <li key={z.k} className="zb-zeile grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)_auto]">
                <div className="zb-feld">
                  <span className="zb-feld__label" id={`zb-d-${z.k}`}>Datum</span>
                  <Datumsfeld value={z.datum} onChange={(iso) => setZeilen((a) => a.map((x) => (x.k === z.k ? { ...x, datum: iso } : x)))} disabled={nurLesen} invalid={doppelt(i) || !!fehler[`betriebsruhe.${i}`]} aria-label={`Datum Zeile ${i + 1}`} />
                  {(doppelt(i) || fehler[`betriebsruhe.${i}`]) && <p className="zb-feld__fehler">{doppelt(i) ? T.datumDoppelt : fehler[`betriebsruhe.${i}`]}</p>}
                </div>
                <div className="zb-feld">
                  <label htmlFor={`zb-b-${z.k}`}>Bezeichnung</label>
                  <input id={`zb-b-${z.k}`} className="zb-eingabe" value={z.bezeichnung} readOnly={nurLesen} onChange={(e) => setZeilen((a) => a.map((x) => (x.k === z.k ? { ...x, bezeichnung: e.target.value } : x)))} />
                </div>
                {!nurLesen && (
                  <Knopf variant="ghost" icon="Trash2" label={T.tagEntfernen(z.datum || i + 1)} onClick={() => setZeilen((a) => a.filter((x) => x.k !== z.k))} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {!nurLesen && dirty && (
        <div className="zb-speicher bo-rise" data-testid="speicherleiste">
          <span className="zb-speicher__text">{T.ungespeichert}</span>
          <Knopf variant="primary" laedt={laeuft} onClick={speichern} disabled={zeilen.some((_, i) => doppelt(i))}>
            {T.speichern}
          </Knopf>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Standardfirma

export function StandardFirmaKnopf({ name, titel }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const [laeuft, starte] = useTransition();
  return (
    <>
      <Knopf icon="BadgeCheck" onClick={() => setOffen(true)} data-testid="firma-standard">
        {T.alsStandard}
      </Knopf>
      <Bestaetigen
        offen={offen}
        titel={T.standardFrage(titel)}
        text={T.standardText(titel)}
        bestaetigen={T.alsStandard}
        laeuft={laeuft}
        onAbbrechen={() => setOffen(false)}
        onBestaetigen={() =>
          starte(async () => {
            const r = await firmaStandardAction({ name });
            setOffen(false);
            if (r?.ok) {
              zeige(T.standardGesetzt(titel), { art: "ok" });
              router.refresh();
            } else zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
          })
        }
      />
    </>
  );
}

// ------------------------------------------------------------------------------------------------ Kalkulation

const KALK_ANZEIGE = { Kueche: "Küche", Aufmass: "Aufmaß", Buero: "Büro", "Prozent auf Erloes": "Prozent auf Erlös" };

const TABELLEN = [
  {
    schluessel: "kostensaetze",
    titel: T.kostensaetze,
    leer: T.kostensaetzeLeer,
    spalten: [
      { name: "taetigkeit", label: "Tätigkeit", typ: "select", quelle: "taetigkeiten" },
      { name: "satz_cent", label: "Satz je Stunde (€)", typ: "euro" },
      { name: "gueltig_ab", label: "Gültig ab", typ: "datum" },
      { name: "notiz", label: "Notiz", typ: "text" },
    ],
    neu: () => ({ taetigkeit: "Montage", satz_cent: null, gueltig_ab: "", platzhalter: 0, notiz: "" }),
  },
  {
    schluessel: "ziel_db",
    titel: T.zieleDb,
    leer: T.zieleDbLeer,
    spalten: [
      { name: "projektart", label: "Projektart", typ: "select", quelle: "projektarten" },
      { name: "ziel_db1", label: "Ziel DB1 %", typ: "zahl" },
      { name: "ziel_db2", label: "Ziel DB2 %", typ: "zahl" },
      { name: "ziel_db3", label: "Ziel DB3 %", typ: "zahl" },
      { name: "gueltig_ab", label: "Gültig ab", typ: "datum" },
    ],
    neu: () => ({ projektart: "Alle", ziel_db1: null, ziel_db2: null, ziel_db3: null, gueltig_ab: "" }),
  },
  {
    schluessel: "gemeinkosten",
    titel: T.gemeinkosten,
    leer: T.gemeinkostenLeer,
    spalten: [
      { name: "projektart", label: "Projektart", typ: "select", quelle: "projektarten" },
      { name: "art", label: "Zuschlagsart", typ: "select", quelle: "zuschlag_arten" },
      { name: "prozent", label: "Prozent", typ: "zahl" },
      { name: "gueltig_ab", label: "Gültig ab", typ: "datum" },
    ],
    neu: () => ({ projektart: "Alle", art: "Prozent auf Erloes", prozent: null, gueltig_ab: "" }),
  },
];

function euro(cent) {
  return cent === null || cent === undefined || cent === "" ? "" : (Number(cent) / 100).toFixed(2).replace(".", ",");
}

export function KalkulationEditor({ daten, nurLesen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [stand, setStand] = useState(() => ({ kostensaetze: daten.kostensaetze || [], ziel_db: daten.ziel_db || [], gemeinkosten: daten.gemeinkosten || [], schwellen: daten.schwellen || {} }));
  const [basis, setBasis] = useState(stand);
  const [begruendung, setBegruendung] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const dirty = JSON.stringify(stand) !== JSON.stringify(basis);
  const listen = { taetigkeiten: daten.taetigkeiten || [], projektarten: daten.projektarten || [], zuschlag_arten: daten.zuschlag_arten || [] };

  const zeile = (tab, i, feld, wert) => setStand((s) => ({ ...s, [tab]: s[tab].map((z, j) => (j === i ? { ...z, [feld]: wert } : z)) }));

  const speichern = () =>
    starte(async () => {
      const r = await kalkulationSpeichernAction({ ...stand, begruendung });
      if (r?.ok) {
        const n = { kostensaetze: r.daten.kostensaetze, ziel_db: r.daten.ziel_db, gemeinkosten: r.daten.gemeinkosten, schwellen: r.daten.schwellen };
        setStand(n);
        setBasis(n);
        setBegruendung("");
        setFehler("");
        zeige(T.kalkulationGespeichert, { art: "ok" });
        router.refresh();
      } else {
        setFehler(r?.message || "Das hat nicht geklappt.");
      }
    });

  return (
    <div className="flex flex-col gap-6" data-testid="kalkulation">
      {TABELLEN.map((t) => (
        <section key={t.schluessel} className="bo-kachel" aria-labelledby={`zb-k-${t.schluessel}`}>
          <div className="bo-kachel__kopf flex-wrap">
            <h2 id={`zb-k-${t.schluessel}`} className="bo-kachel__titel">{t.titel}</h2>
            {!nurLesen && (
              <Knopf icon="Plus" size="s" onClick={() => setStand((s) => ({ ...s, [t.schluessel]: [...s[t.schluessel], t.neu()] }))}>
                {T.zeileHinzu}
              </Knopf>
            )}
          </div>
          {stand[t.schluessel].length === 0 ? (
            <p className="zb-leise">{t.leer}</p>
          ) : (
            <ul className="zb-zeilen">
              {stand[t.schluessel].map((z, i) => (
                <li key={i} className="zb-zeile zb-zeile--tab" style={{ "--spalten": `repeat(${t.spalten.length}, minmax(0, 1fr))${nurLesen ? "" : " auto"}` }}>
                  {t.spalten.map((s) => {
                    const fid = `zb-k-${t.schluessel}-${i}-${s.name}`;
                    return (
                      <div key={s.name} className="zb-feld">
                        {s.typ === "datum" ? <span className="zb-feld__label">{s.label}</span> : <label htmlFor={fid}>{s.label}</label>}
                        {s.typ === "select" ? (
                          <select id={fid} className="zb-eingabe" value={z[s.name] ?? ""} disabled={nurLesen} onChange={(e) => zeile(t.schluessel, i, s.name, e.target.value)}>
                            {listen[s.quelle].map((o) => <option key={o} value={o}>{KALK_ANZEIGE[o] || o}</option>)}
                          </select>
                        ) : s.typ === "datum" ? (
                          <Datumsfeld value={z[s.name] || ""} onChange={(iso) => zeile(t.schluessel, i, s.name, iso)} disabled={nurLesen} aria-label={`${s.label} Zeile ${i + 1}`} />
                        ) : s.typ === "euro" ? (
                          <input id={fid} className="zb-eingabe" inputMode="decimal" defaultValue={euro(z[s.name])} readOnly={nurLesen} onBlur={(e) => { const v = e.target.value.replace(/\./g, "").replace(",", "."); zeile(t.schluessel, i, s.name, v === "" ? null : Math.round(Number(v) * 100)); }} />
                        ) : (
                          <input id={fid} className="zb-eingabe" inputMode={s.typ === "zahl" ? "decimal" : undefined} value={z[s.name] ?? ""} readOnly={nurLesen} onChange={(e) => zeile(t.schluessel, i, s.name, s.typ === "zahl" ? (e.target.value === "" ? null : e.target.value.replace(",", ".")) : e.target.value)} />
                        )}
                      </div>
                    );
                  })}
                  {!nurLesen && <Knopf variant="ghost" icon="Trash2" label={T.zeileEntfernen} onClick={() => setStand((s) => ({ ...s, [t.schluessel]: s[t.schluessel].filter((_, j) => j !== i) }))} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <section className="bo-kachel" aria-labelledby="zb-k-schwellen">
        <div className="bo-kachel__kopf">
          <h2 id="zb-k-schwellen" className="bo-kachel__titel">{T.schwellen}</h2>
        </div>
        <div className="zb-form">
          {[
            ["budget_gelb_prozent", "Budget gelb ab %"],
            ["budget_rot_prozent", "Budget rot über %"],
            ["ampel_gelb_unter", "DB gelb ab x Punkte unter Ziel"],
            ["ampel_rot_unter", "DB rot ab y Punkte unter Ziel"],
            ["abweichung_kommentar_prozent", "Kommentarpflicht ab Abweichung %"],
          ].map(([k, l]) => (
            <div key={k} className="zb-feld">
              <label htmlFor={`zb-s-${k}`}>{l}</label>
              <input id={`zb-s-${k}`} className="zb-eingabe" inputMode="decimal" value={stand.schwellen[k] ?? ""} readOnly={nurLesen} onChange={(e) => setStand((s) => ({ ...s, schwellen: { ...s.schwellen, [k]: e.target.value.replace(",", ".") } }))} />
            </div>
          ))}
          {[
            ["kalkulation_warnung_aktiv", "Tägliche Warnung bei Rot (Aufgabe und Glocke)"],
            ["budget_bei_auftrag_vorbelegen", "Budget bei Phase Auftrag vorbelegen und einfrieren"],
          ].map(([k, l]) => (
            <div key={k} className="zb-feld">
              <div className="zb-schalterzeile">
                <span className="zb-schalterzeile__titel text-[14px]">{l}</span>
                <Schalter label={l} zeile={false} an={!!Number(stand.schwellen[k])} deaktiviert={nurLesen} onWechsel={(an) => setStand((s) => ({ ...s, schwellen: { ...s.schwellen, [k]: an ? 1 : 0 } }))} />
              </div>
            </div>
          ))}
        </div>
      </section>
      {fehler && (
        <p className="zb-band" data-ton="rot" role="alert">
          <Icon name="TriangleAlert" className="mt-0.5 size-4 shrink-0" />
          {fehler}
        </p>
      )}
      {!nurLesen && dirty && (
        <div className="zb-speicher bo-rise flex-col items-stretch !rounded-[28px] sm:flex-row sm:items-center" data-testid="speicherleiste">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="zb-speicher__text">{T.begruendung}</span>
            <input className="zb-eingabe" value={begruendung} onChange={(e) => setBegruendung(e.target.value)} placeholder={T.begruendungHilfe} maxLength={500} />
          </label>
          <span className="flex gap-2">
            <Knopf variant="ghost" onClick={() => setStand(basis)}>{T.verwerfen}</Knopf>
            <Knopf variant="primary" laedt={laeuft} onClick={speichern} data-testid="kalkulation-speichern">{T.speichern}</Knopf>
          </span>
        </div>
      )}
    </div>
  );
}
