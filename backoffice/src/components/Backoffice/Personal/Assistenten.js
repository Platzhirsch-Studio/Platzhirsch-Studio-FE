"use client";
// Assistenten (Konzept § 6.3/§ 6.4): Einstellen in drei Schritten mit Teilschritt-Ergebnis (kein Rollback der
// Personalakte, „Erneut“ legt keine zweite an – ph_personal.einstellen ist idempotent), Austritt in zwei Schritten mit
// echten Aufgaben am Stichtag. Fortschritt oben, Enter weiter, Esc schließt (Rückfrage ab Schritt 2). Kein Undo.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import Datumsfeld from "../Formular/Datumsfeld";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { einstellenAction, austrittAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { ROLLE_INTERN, AUSMASS } from "@/lib/backoffice/personal/status";
import { AUSTRITT } from "@/lib/backoffice/personal/onboarding";
import { langDatum } from "@/lib/backoffice/personal/zeit";
import "./personal.css";

function Schritte({ liste, aktiv }) {
  return (
    <ol className="bo-per-schritte">
      {liste.map((s, i) => (
        <li key={s} data-erreicht={i <= aktiv ? "" : undefined} aria-current={i === aktiv ? "step" : undefined}>
          {s}
        </li>
      ))}
    </ol>
  );
}

function Teile({ teile }) {
  return (
    <ul className="bo-per-teile">
      {teile.map((t) => (
        <li key={t.id}>
          <span className="bo-per-teile__symbol" data-ok={t.neutral ? "neutral" : t.ok ? "ja" : "nein"} aria-hidden="true">
            <Icon name={t.neutral ? "Minus" : t.ok ? "Check" : "X"} className="size-3.5" />
          </span>
          {t.text}
        </li>
      ))}
    </ul>
  );
}

/**
 * @param {{offen:boolean, onSchliessen:()=>void, bewerbung:object, uebrige:number, standardStunden:number, standardUrlaub:number}} p
 */
export function EinstellenAssistent({ offen, onSchliessen, bewerbung: b, uebrige = 0, standardStunden = 38.5, standardUrlaub = 25 }) {
  const router = useRouter();
  const [schritt, setSchritt] = useState(0);
  const [w, setW] = useState({ eintritt: b.verfuegbar_ab || "", rolle: "", ausmass: "Vollzeit", wochenstunden: String(standardStunden).replace(".", ","), urlaub: String(standardUrlaub), benutzerMail: "", rollen: [], stelleSchliessen: uebrige === 0 && Boolean(b.stelle) });
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  const person = `${b.vorname} ${b.nachname}`;
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const weiter = () => {
    setFehler(null);
    if (schritt === 0 && (!w.eintritt || !w.rolle)) return setFehler(!w.eintritt ? "Bitte das Eintrittsdatum angeben." : "Bitte eine Rolle wählen.");
    if (schritt < 2) return setSchritt(schritt + 1);
    start(async () => {
      const r = await einstellenAction({ bewerbung: b.name, ...w, wochenstunden: Number(String(w.wochenstunden).replace(",", ".")), urlaub: Number(w.urlaub) });
      if (!r.ok && !r.teile?.length) return setFehler(r.message);
      setErgebnis(r);
      router.refresh();
    });
  };
  const schliessen = () => {
    setSchritt(0);
    setErgebnis(null);
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={schliessen}
      titel={T.einstellen.titel(person)}
      groesse="md"
      sperren={laeuft}
      testid="per-einstellen"
      fuss={
        ergebnis ? null : (
          <>
            {schritt > 0 && <Knopf variant="ghost" onClick={() => setSchritt(schritt - 1)}>{T.einstellen.zurueck}</Knopf>}
            <Knopf variant="primary" laedt={laeuft} onClick={weiter} data-testid="per-einstellen-weiter">{schritt < 2 ? T.einstellen.weiter : T.einstellen.ausfuehren}</Knopf>
          </>
        )
      }
    >
      {ergebnis ? (
        <div className="flex flex-col gap-4">
        <ErgebnisKarte
          titel={ergebnis.ok ? T.einstellen.ergebnisTitel : T.fehler.allgemein}
          unter={person}
          ohneKachel
          weiter={ergebnis.mitarbeiter ? { titel: T.einstellen.oeffnen, href: `/personal/mitarbeiter/${encodeURIComponent(ergebnis.mitarbeiter)}` } : undefined}
          aktionen={uebrige > 0 ? [{ titel: T.einstellen.absagenUebrige(uebrige), href: `/personal/bewerbungen?stelle=${encodeURIComponent(b.stelle)}` }] : []}
          testid="per-einstellen-ergebnis"
        />
        <Teile teile={ergebnis.teile || []} />
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); weiter(); }} className="flex flex-col gap-4">
          <Schritte liste={T.einstellen.schritte} aktiv={schritt} />
          {schritt === 0 && (
            <>
              <div className="bo-per-raster2">
                <div className="bo-per-feld"><span>{T.einstellen.eintritt}</span><Datumsfeld value={w.eintritt} onChange={(v) => setze("eintritt", v)} aria-label={T.einstellen.eintritt} /></div>
                <label className="bo-per-feld"><span>{T.einstellen.rolle}</span><select className="bo-per-auswahl" value={w.rolle} onChange={(e) => setze("rolle", e.target.value)} data-testid="per-einstellen-rolle"><option value="">–</option>{Object.entries(ROLLE_INTERN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="bo-per-feld"><span>{T.einstellen.ausmass}</span><select className="bo-per-auswahl" value={w.ausmass} onChange={(e) => setze("ausmass", e.target.value)}>{["Vollzeit", "Teilzeit", "Geringfuegig", "Lehre", "Praktikum"].map((k) => <option key={k} value={k}>{AUSMASS[k]}</option>)}</select></label>
                <label className="bo-per-feld"><span>{T.einstellen.wochenstunden}</span><input className="bo-per-auswahl" inputMode="decimal" value={w.wochenstunden} onChange={(e) => setze("wochenstunden", e.target.value)} /></label>
                <label className="bo-per-feld"><span>{T.einstellen.urlaub}</span><input className="bo-per-auswahl" inputMode="numeric" value={w.urlaub} onChange={(e) => setze("urlaub", e.target.value)} /></label>
              </div>
              <div className="bo-per-band-hinweis flex-col"><span className="font-medium text-bo-text">{T.einstellen.pflichten}</span>{T.einstellen.pflichtenListe.map((p) => <span key={p}>· {p}</span>)}</div>
            </>
          )}
          {schritt === 1 && (
            <>
              <label className="bo-per-feld"><span>{T.einstellen.benutzerMail}</span><input type="email" className="bo-per-auswahl" value={w.benutzerMail} onChange={(e) => setze("benutzerMail", e.target.value)} placeholder="vorname.nachname@…" /><span className="bo-per-feld__hilfe">{w.benutzerMail ? T.einstellen.benutzerAufgabe : T.einstellen.benutzerHinweis}</span></label>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-[13px] font-medium text-bo-text-soft">{T.einstellen.rollen}</legend>
                <label className="bo-per-check"><input type="checkbox" checked disabled /><span>Selbstservice (Zeiten, Urlaub)</span></label>
                {["PH Kassa Mitarbeiter", "PH CRM Mitarbeiter", "PH Projekte Mitarbeiter", "PH Logistik Mitarbeiter"].map((r) => (
                  <label key={r} className="bo-per-check"><input type="checkbox" checked={w.rollen.includes(r)} onChange={(e) => setze("rollen", e.target.checked ? [...w.rollen, r] : w.rollen.filter((x) => x !== r))} /><span>{r.replace(/^PH /, "")}</span></label>
                ))}
              </fieldset>
            </>
          )}
          {schritt === 2 && (
            <>
              {b.stelle && <label className="bo-per-check"><input type="checkbox" checked={w.stelleSchliessen} onChange={(e) => setze("stelleSchliessen", e.target.checked)} /><span>{T.einstellen.stelleSchliessen} ({b.stelle_titel})</span></label>}
              {uebrige > 0 && <p className="bo-per-band-hinweis" data-ton="eiche">{T.einstellen.uebrige(uebrige)}</p>}
              <dl className="bo-per-fakten rounded-2xl bg-bo-surface-2 p-4">
                <div><dt>{T.einstellen.eintritt}</dt><dd>{langDatum(w.eintritt)}</dd></div>
                <div><dt>{T.einstellen.rolle}</dt><dd>{ROLLE_INTERN[w.rolle]}</dd></div>
                <div><dt>{T.einstellen.ausmass}</dt><dd>{AUSMASS[w.ausmass]} · {w.wochenstunden} h</dd></div>
                <div><dt>{T.einstellen.urlaub}</dt><dd>{w.urlaub}</dd></div>
              </dl>
            </>
          )}
          {fehler && <p className="bo-per-feld__fehler" role="alert">{fehler}</p>}
        </form>
      )}
    </Dialog>
  );
}

export function EinstellenKnopf({ bewerbung, uebrige, startOffen = false }) {
  const [offen, setOffen] = useState(startOffen);
  return (
    <>
      <Knopf variant="primary" icon="UserPlus" onClick={() => setOffen(true)} kuerzel="Strg+Enter" data-testid="per-einstellen-oeffnen">{T.akte.primaer.einstellen}</Knopf>
      <EinstellenAssistent offen={offen} onSchliessen={() => setOffen(false)} bewerbung={bewerbung} uebrige={uebrige} />
    </>
  );
}

/** Austritt erfassen (§ 6.4). */
export function AustrittAssistent({ offen, onSchliessen, mitarbeiter: m, offeneBuchungen = 0, heute }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [schritt, setSchritt] = useState(0);
  const [datum, setDatum] = useState("");
  const [grund, setGrund] = useState("");
  const [aufgaben, setAufgaben] = useState(AUSTRITT.map((a) => a.id));
  const [fehler, setFehler] = useState(null);
  const [fertig, setFertig] = useState(null);
  const [laeuft, start] = useTransition();
  const weiter = () => {
    setFehler(null);
    if (schritt === 0) {
      if (!datum) return setFehler("Bitte das Austrittsdatum eintragen.");
      if (m.eintritt && datum < m.eintritt) return setFehler("Austritt liegt vor dem Eintritt.");
      return setSchritt(1);
    }
    start(async () => {
      const r = await austrittAction({ mitarbeiter: m.name, datum, grund, aufgaben });
      if (!r.ok) return setFehler(r.message);
      setFertig(r);
      zeige(T.austritt.ergebnis(langDatum(datum)), { art: "ok" });
      router.refresh();
    });
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={() => { setSchritt(0); setFertig(null); onSchliessen(); }}
      titel={T.austritt.titel(m.titel)}
      groesse="md"
      testid="per-austritt"
      fuss={fertig ? null : (<>{schritt > 0 && <Knopf variant="ghost" onClick={() => setSchritt(0)}>{T.einstellen.zurueck}</Knopf>}<Knopf variant="primary" laedt={laeuft} onClick={weiter} data-testid="per-austritt-weiter">{schritt === 0 ? T.einstellen.weiter : T.austritt.erfassen}</Knopf></>)}
    >
      {fertig ? (
        <ErgebnisKarte titel={T.austritt.ergebnis(langDatum(datum))} unter={T.austritt.ergebnisUnter(langDatum(datum))} ohneKachel testid="per-austritt-ergebnis" />
      ) : (
        <div className="flex flex-col gap-4">
          <Schritte liste={T.austritt.schritte} aktiv={schritt} />
          {schritt === 0 ? (
            <>
              <div className="bo-per-feld"><span>{T.austritt.datum}</span><Datumsfeld value={datum} onChange={setDatum} aria-label={T.austritt.datum} invalid={Boolean(fehler)} /></div>
              <label className="bo-per-feld"><span>{T.austritt.grund}</span><textarea className="bo-per-auswahl bo-per-text" value={grund} onChange={(e) => setGrund(e.target.value)} /></label>
              <p className="text-[13px] text-bo-text-soft">{offeneBuchungen ? T.austritt.offeneBuchungen(offeneBuchungen) : T.austritt.keineOffenen}</p>
              {datum > heute && <p className="bo-per-band-hinweis">{T.austritt.zukunft}</p>}
            </>
          ) : (
            <fieldset className="flex flex-col gap-2">
              {AUSTRITT.map((a) => (
                <label key={a.id} className="bo-per-check">
                  <input type="checkbox" checked={aufgaben.includes(a.id)} onChange={(e) => setAufgaben(e.target.checked ? [...aufgaben, a.id] : aufgaben.filter((x) => x !== a.id))} />
                  <span>{a.titel}{a.grundlage ? <span className="text-bo-text-faint"> · {a.grundlage}</span> : null}</span>
                </label>
              ))}
            </fieldset>
          )}
          {fehler && <p className="bo-per-feld__fehler" role="alert">{fehler}</p>}
        </div>
      )}
    </Dialog>
  );
}

export function AustrittKnopf({ mitarbeiter, offeneBuchungen, heute }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <Knopf variant="ghost" onClick={() => setOffen(true)} data-testid="per-austritt-oeffnen">{T.akteMa.austritt}</Knopf>
      <AustrittAssistent offen={offen} onSchliessen={() => setOffen(false)} mitarbeiter={mitarbeiter} offeneBuchungen={offeneBuchungen} heute={heute} />
    </>
  );
}
