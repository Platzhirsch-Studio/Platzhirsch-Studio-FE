"use client";
// Abnahme mit Kunde (10-konzept-projekte.md § 6.5, E3/E11) – Kiosk 390 px und iPad identisch, 5 Schritte:
// 1 Leistungen · 2 Positionen („Alles in Ordnung“ oder einzeln Mangel/Nacharbeit mit Pflichttext, Frist-Chips)
// 3 Unterschrift Kunde unter EINEM Erklärungstext · 4 Unterschrift Studio („Als … unterschreiben“) · 5 Zusammenfassung,
// Kopie an Kunde (Portal + E-Mail oder Papier), „Abschließen“ → gezeichnetes Häkchen. Ohne Mängel ≤ 5 Tipps.
// Variante „Nur Leistungsnachweis“ (Kunde abwesend): Unterschrift unter dem Nachweis-Text oder Grund.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Unterschrift from "../Eingabe/Unterschrift";
import Knopf from "../Knopf";
import { Haken } from "../motion";
import { useToast } from "../Toast";
import { abnahmeMitKundeAction, leistungAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const A = TEXTE.abnahme;
const FRISTEN = [3, 7, 14];

function plusTage(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {{montage:{name:string, titel:string}, leistungen:Array<{name:string,beschreibung:string,erledigt:number}>, positionen:Array<{bezeichnung:string}>,
 *   kunde:string, email?:string, studioName:string, datum:string, onFertig?:(r:object)=>void, kiosk?:boolean}} p
 */
export default function AbnahmeMitKunde({ montage, leistungen = [], positionen = [], kunde, email, studioName, datum, kiosk = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [schritt, setSchritt] = useState(0);
  const [nurNachweis, setNurNachweis] = useState(false);
  const [l, setL] = useState(leistungen);
  const [pos, setPos] = useState(positionen.map((p) => ({ bezeichnung: p.bezeichnung, zustand: "ok", beschreibung: "", frist: "", verantwortlich: "Studio" })));
  const [sigKunde, setSigKunde] = useState(null);
  const [nameKunde, setNameKunde] = useState(kunde || "");
  const [sigStudio, setSigStudio] = useState(null);
  const [kopie, setKopie] = useState(email ? "portal" : "papier");
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState("");
  const [pending, start] = useTransition();
  const maengel = pos.filter((p) => p.zustand !== "ok");
  const offeneLeistungen = l.filter((x) => !Number(x.erledigt)).length;
  const schritte = nurNachweis ? [A.schritte[0], A.schritte[2]] : A.schritte;
  const erklaerung = nurNachweis ? A.erklaerungNachweis : A.erklaerung(datum, maengel.length);
  const fehltText = maengel.some((p) => !p.beschreibung.trim());

  const setze = (i, w) => setPos((a) => a.map((p, k) => (k === i ? { ...p, ...w } : p)));
  const haken = (x) =>
    start(async () => {
      const neu = Number(x.erledigt) ? 0 : 1;
      setL((a) => a.map((y) => (y.name === x.name ? { ...y, erledigt: neu } : y)));
      const r = await leistungAction({ montage: montage.name, zeile: x.name, erledigt: neu });
      if (!r?.ok) zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
    });
  const abschliessen = () =>
    start(async () => {
      setFehler("");
      const r = await abnahmeMitKundeAction({ montageauftrag: montage.name, positionen: pos, nameKunde, unterschriftKunde: sigKunde, unterschriftStudio: sigStudio, kopieKanal: kopie, vorbehalte: maengel.map((m) => `${m.bezeichnung}: ${m.beschreibung}`).join("; "), nurNachweis });
      if (!r?.ok) return setFehler(r?.message || TEXTE.fehler.unbekannt);
      setErgebnis(r);
      router.refresh();
    });

  if (ergebnis) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status" data-testid="abnahme-fertig">
        <Haken groesse={72} titel={A.fertig} />
        <p className="bo-titel">{ergebnis.nachweis ? A.leistungsnachweis : A.fertig}</p>
        <p className="max-w-[46ch] text-[15px] text-bo-text-soft">{ergebnis.nachweis ? "Montage bleibt „Fertig“ – Abnahme terminieren." : `${A.zusammenfassung(ergebnis.offen || 0, "")} ${A.kopie(kunde, kopie === "papier" ? A.papier : A.portalMail)}`}</p>
        <div className="flex gap-2">
          {ergebnis.href && <Knopf variant="primary" href={ergebnis.href}>{A.titel} öffnen</Knopf>}
          <Knopf href={kiosk ? "/montage" : `/projekte/montagen/${encodeURIComponent(montage.name)}`}>{kiosk ? TEXTE.kiosk.zurueck : "Zur Montage"}</Knopf>
        </div>
      </div>
    );
  }

  const weiter = () => setSchritt((s) => s + 1);
  const letzter = schritt === schritte.length - 1;
  let inhalt = null;
  const name = schritte[schritt];
  if (name === A.schritte[0]) {
    inhalt = (
      <div className="flex flex-col gap-3">
        {offeneLeistungen > 0 && <p className="text-[15px] text-bo-warning-text">{A.leistungenOffen(offeneLeistungen)}</p>}
        <div className="flex flex-col gap-2" role="group" aria-label="Leistungen">
          {l.map((x) => (
            <button key={x.name} type="button" role="checkbox" aria-checked={!!Number(x.erledigt)} className="bo-prj-check" onClick={() => haken(x)}>
              <span className="bo-prj-check__box" aria-hidden="true">{Number(x.erledigt) ? "✓" : ""}</span>
              <span className="bo-prj-check__text">{x.beschreibung}</span>
            </button>
          ))}
          {!l.length && <p className="text-[15px] text-bo-text-soft">{TEXTE.montage.leistungenLeer}</p>}
        </div>
        <label className="mt-2 flex items-center gap-3 text-[15px]">
          <input type="checkbox" className="size-5" checked={nurNachweis} onChange={(e) => (setNurNachweis(e.target.checked), setSchritt(0))} />
          Kunde abwesend – nur Leistungsnachweis
        </label>
      </div>
    );
  } else if (name === A.schritte[1]) {
    inhalt = (
      <div className="flex flex-col gap-4">
        <Knopf variant={maengel.length ? "secondary" : "primary"} size="kiosk" icon="CheckCheck" onClick={() => (setPos((a) => a.map((p) => ({ ...p, zustand: "ok", beschreibung: "" }))), weiter())} data-testid="alles-ok">
          {A.allesOk}
        </Knopf>
        <p className="text-[13px] font-medium text-bo-text-soft">{A.einzeln}</p>
        <ul className="flex flex-col gap-3">
          {pos.map((p, i) => (
            <li key={i} className="rounded-[20px] bg-bo-surface-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="bo-prj-titel min-w-0">{p.bezeichnung}</span>
                <span className="bo-prj-zustand" role="group" aria-label={`Zustand ${p.bezeichnung}`}>
                  {["ok", "Mangel", "Nacharbeit"].map((z) => (
                    <button key={z} type="button" aria-pressed={p.zustand === z} data-w={z} onClick={() => setze(i, { zustand: z, frist: z === "ok" ? "" : p.frist || plusTage(7) })}>
                      {A.zustand[z]}
                    </button>
                  ))}
                </span>
              </div>
              {p.zustand !== "ok" && (
                <div className="mt-3 flex flex-col gap-2">
                  <input className="bo-input w-full" placeholder={TEXTE.kiosk.beschreibung} value={p.beschreibung} onChange={(e) => setze(i, { beschreibung: e.target.value })} aria-invalid={!p.beschreibung.trim()} aria-label={`Beschreibung ${p.bezeichnung}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-bo-text-soft">{A.frist}</span>
                    {FRISTEN.map((n) => (
                      <button key={n} type="button" aria-pressed={p.frist === plusTage(n)} onClick={() => setze(i, { frist: plusTage(n) })} className={`h-9 rounded-full px-3 text-[13px] font-medium ${p.frist === plusTage(n) ? "bg-bo-ink text-bo-surface" : "bg-bo-fill"}`}>
                        +{n} Tage
                      </button>
                    ))}
                    <select className="bo-input ml-auto h-9" value={p.verantwortlich} onChange={(e) => setze(i, { verantwortlich: e.target.value })} aria-label={A.verantwortlich}>
                      {["Studio", "Lieferant", "Fremdgewerk"].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {fehltText && <p className="text-[13px] text-bo-danger-text">{A.beschreibungPflicht}</p>}
      </div>
    );
  } else if (name === A.schritte[2]) {
    inhalt = (
      <div className="flex flex-col gap-4">
        <p className="bo-prj-erklaerung" data-testid="erklaerung">{erklaerung}</p>
        <div className="bo-prj-signatur-hell">
          <Unterschrift erklaerung={erklaerung} name={nameKunde} onUebernommen={(e) => setSigKunde(e.png)} testid="unterschrift-kunde" />
        </div>
        <label className="block">
          <span className="text-[13px] font-medium text-bo-text-soft">{A.nameKunde}</span>
          <input className="bo-input mt-1 w-full" value={nameKunde} onChange={(e) => setNameKunde(e.target.value)} data-testid="name-kunde" />
        </label>
        <p className="text-[12px] text-bo-text-soft">Mehr Platz im Querformat.</p>
      </div>
    );
  } else if (name === A.schritte[3]) {
    inhalt = (
      <div className="flex flex-col gap-4">
        <Knopf variant="secondary" size="kiosk" icon="PenTool" onClick={() => (setSigStudio(`studio:${studioName}`), weiter())} data-testid="studio-unterschrift">
          {A.studioAls(studioName)}
        </Knopf>
        <div className="bo-prj-signatur-hell">
          <Unterschrift erklaerung="Unterschrift Studio" name={studioName} onUebernommen={(e) => setSigStudio(e.png)} testid="unterschrift-studio" />
        </div>
      </div>
    );
  } else {
    inhalt = (
      <div className="flex flex-col gap-4">
        <p className="text-[17px] leading-[26px]" data-testid="zusammenfassung">{A.zusammenfassung(maengel.length, maengel[0]?.frist ? `${maengel[0].frist.slice(8, 10)}.${maengel[0].frist.slice(5, 7)}.` : "")}</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-medium text-bo-text-soft">Kopie an {kunde}</legend>
          {[["portal", A.portalMail, !email], ["papier", A.papier, false]].map(([w, t, aus]) => (
            <label key={w} className={`flex items-center gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3 text-[15px] ${aus ? "opacity-50" : ""}`}>
              <input type="radio" name="kopie" value={w} checked={kopie === w} disabled={aus} onChange={() => setKopie(w)} className="size-5" />
              {t}{aus ? " – Kunde ohne E-Mail" : ""}
            </label>
          ))}
        </fieldset>
      </div>
    );
  }

  const sperre = (name === A.schritte[1] && fehltText) || (name === A.schritte[2] && !nurNachweis && (!sigKunde || !nameKunde.trim())) || (name === A.schritte[3] && !sigStudio);
  return (
    <div className="flex flex-col gap-5" data-testid="abnahme-mit-kunde">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-bo-text-soft" aria-live="polite">{A.schritt(schritt + 1, schritte.length)} · {name}</p>
        {schritt > 0 && <Knopf size="s" variant="ghost" icon="ChevronLeft" onClick={() => setSchritt((s) => s - 1)}>{A.zurueck}</Knopf>}
      </div>
      <div className="bo-prj-schritte" aria-hidden="true">{schritte.map((_, i) => <span key={i} data-fertig={i <= schritt ? "" : undefined} />)}</div>
      <div key={schritt} className="bo-erscheinen">{inhalt}</div>
      {fehler && <p role="alert" className="text-[14px] text-bo-danger-text">{fehler}</p>}
      <Knopf variant="primary" size="kiosk" laedt={pending} disabled={sperre} onClick={letzter ? abschliessen : weiter} data-testid="abnahme-weiter">
        {letzter ? (nurNachweis ? A.leistungsnachweis : A.abschliessen) : A.weiter}
      </Knopf>
    </div>
  );
}
