"use client";
// Gesprächsprotokoll (§ 3.8) – eine Scrollseite für das iPad vor dem Kunden: Abschnittsleiste links (Räume ·
// Rahmen · Fragen · Ergebnis), Raum-Chips (≥ 44 px) legen Raumkarten an, Budget je Raum (Kundenangabe, brutto),
// Summe live, Autosave 1 s mit Speicheranzeige (§ 2.7), Konflikt über `modified`. „Gespräch abschließen“ öffnet
// „Wie geht es weiter?“ (§ 5.6). „Kundenansicht“ blendet alles Interne aus (data-intern) und beendet sich per
// Langdruck 600 ms.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf, { RundKnopf } from "../Knopf";
import Kachel from "../Kachel";
import Dialog from "../Overlay/Dialog";
import Datumsfeld from "../Formular/Datumsfeld";
import Segment from "../Segment";
import { Feld } from "./Teile";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { gespraechSpeichernAction, wieWeiterAction } from "@/lib/backoffice/crm/actions";
import { cent, centAlsEingabe, euroZuCent } from "@/lib/backoffice/format";

const HAEUFIG = ["Kueche", "Wohnen", "Essen", "Schlafen", "Bad", "Outdoor"];
const WEITERE = ["Kind", "Buero", "Flur", "Pool", "Licht", "Gesamt", "Sonstiges"];
const G = T.gespraeche;

function useAutosave(name, modifiedStart) {
  const [status, setStatus] = useState({ art: "ruhe", zeit: "" });
  const modified = useRef(modifiedStart);
  const offen = useRef({});
  const timer = useRef(null);
  const laeuft = useRef(false);
  const selbst = useRef(null);
  const speichern = useCallback(async () => {
    if (laeuft.current) return;
    const werte = offen.current;
    if (!Object.keys(werte).length) return;
    offen.current = {};
    laeuft.current = true;
    setStatus({ art: "speichert" });
    const r = await gespraechSpeichernAction({ name, werte, modified: modified.current }).catch(() => ({ ok: false, code: "unavailable" }));
    laeuft.current = false;
    if (r?.ok) {
      modified.current = r.modified;
      const d = new Date();
      setStatus({ art: "gespeichert", zeit: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`, aufgabe: r.aufgabe });
    } else {
      offen.current = { ...werte, ...offen.current };
      setStatus({ art: r?.code === "conflict" ? "konflikt" : "fehler", text: r?.message });
    }
    if (Object.keys(offen.current).length) timer.current = setTimeout(() => selbst.current?.(), 1000);
  }, [name]);
  useEffect(() => {
    selbst.current = speichern;
  }, [speichern]);
  const aendern = useCallback((werte) => {
    offen.current = { ...offen.current, ...werte };
    clearTimeout(timer.current);
    timer.current = setTimeout(speichern, 1000);
  }, [speichern]);
  useEffect(() => {
    const weg = () => speichern();
    window.addEventListener("pagehide", weg);
    return () => {
      window.removeEventListener("pagehide", weg);
      clearTimeout(timer.current);
    };
  }, [speichern]);
  return { status, aendern, jetzt: speichern };
}

function Speicheranzeige({ status }) {
  const text = status.art === "speichert" ? G.speichert : status.art === "gespeichert" ? `${G.gespeichert(status.zeit)}${status.aufgabe ? " · Aufgabe angelegt" : ""}` : status.art === "fehler" ? `${G.nichtGespeichert} – ${status.text || T.fehler.unavailable}` : status.art === "konflikt" ? T.fehler.conflict : "";
  if (!text) return null;
  return <span role="status" className={`text-[13px] ${status.art === "fehler" || status.art === "konflikt" ? "text-bo-danger-text" : "text-bo-text-soft"}`} data-testid="crm-speicheranzeige">{text}</span>;
}

function WieWeiter({ offen, onSchliessen, gespraech, berater = [], ort, kontakt }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const [wahl, setWahl] = useState("planung");
  const [kosten, setKosten] = useState("");
  const [planer, setPlaner] = useState(berater[0]?.wert || "");
  const vorschlag = ort === "Vor Ort" ? "Beim Kunden" : ort === "Video" || ort === "Telefon" ? "Fernabsatz" : "Showroom";
  const [vertragsort, setVertragsort] = useState(vorschlag);
  const [fehler, setFehler] = useState("");
  const primaer = { planung: G.knopfPlanung || T.knopf.planungBeauftragen, angebot: T.knopf.angebotErstellen, nur: T.knopf.nurAbschliessen }[wahl];
  const los = async () => {
    if (wahl === "planung" && !kosten) return setFehler(G.kostenFehlt);
    const r = await fuehre(() => wieWeiterAction({ gespraech, wahl, planer, kosten, vertragsort }), { text: wahl === "nur" ? T.toast.gespraechAbgeschlossen : wahl === "planung" ? T.toast.planung : undefined, fehlerText: primaer, objekt: { doctype: "PH Beratungsgespraech", name: gespraech } });
    if (!r?.ok) return setFehler(r?.fehler?.kosten || "");
    onSchliessen();
    if (r.weiter === "angebot") router.push(`/d/ph-angebot/neu?kontakt=${encodeURIComponent(kontakt || "")}&vertragsort=${encodeURIComponent(vertragsort)}`);
  };
  const karte = (id, nr, titel, text) => (
    <button type="button" className="bo-crm-wahlkarte bo-druck-flaeche" aria-pressed={wahl === id} onClick={() => setWahl(id)} data-testid={`crm-wahl-${id}`}>
      <span className="bo-crm-wahlkarte__nr">{nr}</span>
      <span className="text-[15px] font-semibold">{titel}</span>
      <span className="text-[13px] text-bo-text-soft">{text}</span>
    </button>
  );
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={G.wieWeiter} groesse="lg" testid="crm-wie-weiter"
      fuss={<><Knopf variant="ghost" onClick={onSchliessen}>{T.knopf.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={los} data-testid="crm-wie-weiter-los">{primaer}</Knopf></>}>
      <div className="grid gap-5" onKeyDown={(e) => ({ 1: "planung", 2: "angebot", 3: "nur" })[e.key] && !e.target.closest("input, textarea, select") && setWahl({ 1: "planung", 2: "angebot", 3: "nur" }[e.key])}>
        <div className="bo-crm-wahl">
          {karte("planung", 1, T.knopf.planungBeauftragen, G.wahl.planung)}
          {karte("angebot", 2, T.knopf.angebotErstellen, G.wahl.angebot)}
          {karte("nur", 3, T.knopf.nurAbschliessen, G.wahl.nur)}
        </div>
        {wahl === "planung" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Feld label={G.planer} eingelassen><select value={planer} onChange={(e) => setPlaner(e.target.value)}>{berater.map((b) => <option key={b.wert} value={b.wert}>{b.titel}</option>)}</select></Feld>
              <Feld label={G.vertragsort} eingelassen hinweis={`Vorschlag aus Ort: ${vorschlag}`}><select value={vertragsort} onChange={(e) => setVertragsort(e.target.value)}>{G.vertragsorte.map((v) => <option key={v}>{v}</option>)}</select></Feld>
            </div>
            <div className="bo-crm-feld">
              <span>{G.kosten} *</span>
              <Segment label={G.kosten} wert={kosten} onWechsel={(v) => (setKosten(v), setFehler(""))} optionen={Object.entries(G.kostenOptionen).map(([wert, titel]) => ({ wert, titel }))} groesse="s" />
              {fehler && <em className="bo-crm-feld__fehler not-italic" role="alert">{fehler}</em>}
            </div>
            {vertragsort !== "Showroom" && <p className="rounded-[16px] bg-bo-eiche-soft px-4 py-3 text-[14px] text-bo-eiche-text">{G.faggHinweis}</p>}
          </div>
        )}
        {wahl === "angebot" && <Feld label={G.vertragsort} eingelassen hinweis={`Vorschlag aus Ort: ${vorschlag}`}><select value={vertragsort} onChange={(e) => setVertragsort(e.target.value)}>{G.vertragsorte.map((v) => <option key={v}>{v}</option>)}</select></Feld>}
      </div>
    </Dialog>
  );
}

/** Langdruck 600 ms beendet die Kundenansicht (Fortschrittsring). */
function LangdruckKnopf({ onFertig }) {
  const [p, setP] = useState(0);
  const t = useRef(null);
  const start = () => {
    const s = performance.now();
    const f = () => {
      const x = Math.min(1, (performance.now() - s) / 600);
      setP(x);
      if (x >= 1) return onFertig();
      t.current = requestAnimationFrame(f);
    };
    t.current = requestAnimationFrame(f);
  };
  const stopp = () => {
    cancelAnimationFrame(t.current);
    setP(0);
  };
  return (
    <button type="button" className="bo-knopf bo-knopf--secondary relative inline-flex h-10 items-center gap-2 rounded-pill px-4 text-[14px] font-medium" onPointerDown={start} onPointerUp={stopp} onPointerLeave={stopp} onKeyDown={(e) => e.key === "Enter" && onFertig()} data-testid="crm-kundenansicht-ende">
      <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" /><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={50.3} strokeDashoffset={50.3 * (1 - p)} /></svg>
      {T.knopf.kundenansichtBeenden}
    </button>
  );
}

export default function Protokoll({ doc, kontaktTitel, berater = [], leitung, nurLesen }) {
  const { status, aendern, jetzt } = useAutosave(doc.name, doc.modified);
  const [raeume, setRaeume] = useState(() => (doc.raeume || []).map((r, i) => ({ ...r, _id: r.name || `r${i}` })));
  const [w, setW] = useState({ stil: doc.stil || "", zeitrahmen: doc.zeitrahmen || "", objektart: doc.objektart || "", adresse_objekt: doc.adresse_objekt || "", entscheider: doc.entscheider || "", zusammenfassung: String(doc.zusammenfassung || "").replace(/<[^>]*>/g, ""), naechster_schritt: doc.naechster_schritt || "", naechster_schritt_bis: doc.naechster_schritt_bis || "", notiz_intern: String(doc.notiz_intern || "").replace(/<[^>]*>/g, "") });
  const [weitere, setWeitere] = useState(false);
  const [wieWeiter, setWieWeiter] = useState(false);
  const [kundenansicht, setKundenansicht] = useState(false);
  const { zeige } = useCrmAktion();
  const summe = useMemo(() => raeume.reduce((s, r) => s + (Number(r.budget_cent) || 0), 0), [raeume]);
  const gesperrt = nurLesen || doc.status === "Abgeschlossen";

  useEffect(() => {
    if (kundenansicht) document.documentElement.setAttribute("data-crm-kundenansicht", "an");
    else document.documentElement.removeAttribute("data-crm-kundenansicht");
    return () => document.documentElement.removeAttribute("data-crm-kundenansicht");
  }, [kundenansicht]);

  const raeumeSpeichern = (liste) => {
    setRaeume(liste);
    aendern({ raeume: liste.map(({ _id, ...r }) => r) });
  };
  const zaehler = useRef(0);
  const raumDazu = (raum) => raeumeSpeichern([...raeume, { _id: `n${(zaehler.current += 1)}-${raum}`, raum, wunsch: "", budget_cent: 0, prioritaet: raeume.length ? "Normal" : "Hoch", marken: "", masse: "" }]);
  const raumSetzen = (id, feld, wert) => raeumeSpeichern(raeume.map((r) => (r._id === id ? { ...r, [feld]: wert } : r)));
  const raumWeg = (id) => {
    const alt = raeume;
    raeumeSpeichern(raeume.filter((r) => r._id !== id));
    zeige("Raum entfernt", { art: "ok", dauer: 8000, aktion: { titel: "Rückgängig", onClick: () => raeumeSpeichern(alt) } });
  };
  const setze = (feld) => (e) => {
    const wert = e?.target ? e.target.value : e;
    setW((x) => ({ ...x, [feld]: wert }));
    aendern({ [feld]: wert });
  };

  return (
    <div data-testid="crm-protokoll">
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        <Speicheranzeige status={status} />
        {kundenansicht ? <LangdruckKnopf onFertig={() => setKundenansicht(false)} /> : <Knopf variant="secondary" icon="Monitor" onClick={() => setKundenansicht(true)} data-testid="crm-kundenansicht">{T.knopf.kundenansicht}</Knopf>}
        <span data-intern="">
          {doc.status === "Offen" && <Knopf variant="primary" icon="ArrowRight" onClick={async () => (await jetzt(), setWieWeiter(true))} data-testid="crm-gespraech-abschliessen">{T.knopf.gespraechAbschliessen}</Knopf>}
          {doc.status === "Planung beauftragt" && <Knopf variant="primary" href={`/d/ph-angebot/neu?kontakt=${encodeURIComponent(doc.kontakt || "")}`}>{T.knopf.angebotErstellen}</Knopf>}
        </span>
      </div>
      {kundenansicht && <p className="mb-4 rounded-[16px] bg-bo-fill px-4 py-3 text-[14px] text-bo-text-soft" role="status">{G.kundenansichtAktiv}</p>}
      <div className="bo-crm-protokoll">
        <nav className="bo-crm-abschnitte" aria-label="Abschnitte">
          {Object.entries(G.abschnitte).map(([id, titel]) => <a key={id} href={`#${id}`}>{titel}</a>)}
        </nav>
        <div className="grid min-w-0 gap-6">
          <Kachel titel={G.abschnitte.raeume} unter={raeume.length ? `${G.summe}: ${cent(summe)}` : undefined} id="raeume" testid="crm-raeume">
            {!gesperrt && (
              <div className="bo-crm-chips mb-5" role="group" aria-label="Raum hinzufügen">
                {HAEUFIG.map((r) => <button key={r} type="button" className="bo-crm-chip" onClick={() => raumDazu(r)} data-testid={`crm-raum-${r}`}>+ {T.raum[r]}</button>)}
                <button type="button" className="bo-crm-chip" aria-expanded={weitere} onClick={() => setWeitere((x) => !x)}>{G.weitere}</button>
                {weitere && WEITERE.map((r) => <button key={r} type="button" className="bo-crm-chip" onClick={() => (raumDazu(r), setWeitere(false))}>+ {T.raum[r]}</button>)}
              </div>
            )}
            {raeume.length === 0 ? <p className="text-[15px] text-bo-text-soft">{G.raeumeLeer}</p> : (
              <div className="grid gap-3">
                {raeume.map((r) => (
                  <div key={r._id} className="bo-crm-raumkarte bo-erscheinen" data-testid="crm-raumkarte">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[17px] font-semibold">{T.raum[r.raum] || r.raum}</p>
                      {!gesperrt && <RundKnopf icon="Trash2" label={`${T.raum[r.raum]} ${G.entfernen}`} groesse="s" flach onClick={() => raumWeg(r._id)} />}
                    </div>
                    <Feld label={G.wunsch}><textarea rows={2} value={r.wunsch || ""} disabled={gesperrt} onChange={(e) => raumSetzen(r._id, "wunsch", e.target.value)} /></Feld>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <Feld label={G.prio}><select value={r.prioritaet || "Normal"} disabled={gesperrt} onChange={(e) => raumSetzen(r._id, "prioritaet", e.target.value)}>{["Hoch", "Normal", "Niedrig"].map((p) => <option key={p}>{p}</option>)}</select></Feld>
                      <span data-intern="" className="contents">
                        <Feld label={G.budget}><input inputMode="decimal" defaultValue={centAlsEingabe(r.budget_cent)} disabled={gesperrt} onBlur={(e) => raumSetzen(r._id, "budget_cent", euroZuCent(e.target.value) || 0)} /></Feld>
                      </span>
                      <Feld label={G.marken}><input value={r.marken || ""} disabled={gesperrt} onChange={(e) => raumSetzen(r._id, "marken", e.target.value)} /></Feld>
                      <Feld label={G.masse}><input value={r.masse || ""} disabled={gesperrt} onChange={(e) => raumSetzen(r._id, "masse", e.target.value)} /></Feld>
                    </div>
                  </div>
                ))}
                <p className="text-[15px] font-semibold tabular-nums" data-intern="">{G.summe}: {cent(summe)}</p>
              </div>
            )}
          </Kachel>
          <Kachel titel={G.abschnitte.rahmen} id="rahmen">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Feld label={G.stil} eingelassen><input value={w.stil} disabled={gesperrt} onChange={setze("stil")} /></Feld>
              <Feld label={G.zeitrahmen} eingelassen><select value={w.zeitrahmen} disabled={gesperrt} onChange={setze("zeitrahmen")}>{["", "Sofort", "1-3 Monate", "3-6 Monate", "6-12 Monate", "Spaeter", "Offen"].map((z) => <option key={z} value={z}>{z.replace("Spaeter", "Später") || "–"}</option>)}</select></Feld>
              <Feld label={G.objekt} eingelassen><select value={w.objektart} disabled={gesperrt} onChange={setze("objektart")}>{["", "Einfamilienhaus", "Wohnung", "Ferienhaus", "Gewerbe", "Hotel", "Yacht", "Sonstiges"].map((z) => <option key={z} value={z}>{z || "–"}</option>)}</select></Feld>
              <Feld label={G.entscheider} eingelassen><input value={w.entscheider} disabled={gesperrt} onChange={setze("entscheider")} /></Feld>
              <Feld label={G.adresse} eingelassen className="sm:col-span-2"><textarea rows={2} value={w.adresse_objekt} disabled={gesperrt} onChange={setze("adresse_objekt")} /></Feld>
            </div>
          </Kachel>
          <Kachel titel={G.abschnitte.fragen} id="fragen">
            {(doc.fragen || []).length === 0 ? <p className="text-[15px] text-bo-text-soft">{G.fragenLeer}</p> : (
              <ul className="grid gap-2">{doc.fragen.map((f, i) => <li key={f.name || i} className="rounded-[14px] bg-bo-surface-2 px-4 py-3 text-[15px]">{f.frage || f.titel}{f.antwort ? ` – ${f.antwort}` : ""}</li>)}</ul>
            )}
          </Kachel>
          <Kachel titel={G.abschnitte.ergebnis} id="ergebnis">
            <div className="grid gap-4">
              <Feld label={G.zusammenfassung} eingelassen><textarea rows={4} value={w.zusammenfassung} disabled={gesperrt} onChange={setze("zusammenfassung")} data-testid="crm-zusammenfassung" /></Feld>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                <Feld label={G.vereinbart} eingelassen><input value={w.naechster_schritt} disabled={gesperrt} onChange={setze("naechster_schritt")} placeholder="z. B. Rendering vorlegen" /></Feld>
                <div className="bo-crm-feld"><span id="crm-bis">{G.bis}</span><Datumsfeld value={w.naechster_schritt_bis} onChange={setze("naechster_schritt_bis")} disabled={gesperrt} gruppeLabelId="crm-bis" aria-label={G.bis} /></div>
              </div>
              {leitung && <div data-intern=""><Feld label={T.akte.intern} eingelassen hinweis={T.akte.internHinweis}><textarea rows={2} value={w.notiz_intern} onChange={setze("notiz_intern")} /></Feld></div>}
            </div>
          </Kachel>
        </div>
      </div>
      {wieWeiter && <WieWeiter offen onSchliessen={() => setWieWeiter(false)} gespraech={doc.name} berater={berater} ort={doc.ort} kontakt={doc.kontakt} kontaktTitel={kontaktTitel} />}
    </div>
  );
}
