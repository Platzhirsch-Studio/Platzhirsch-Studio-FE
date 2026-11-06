"use client";
// Aktionen für Regress (§2.8), Pflege-/Wartungsverträge (§2.9) und Serviceaufträge (§2.10).
// Geld- oder rechtswirksam → Dialog mit Folgen-Satz, kein Rückgängig (Ausbuchen, Widerruf, Kündigen).
import { useState } from "react";
import Knopf from "../Knopf";
import Bestaetigen from "../Bestaetigen";
import BetragFeld from "../Eingabe/BetragFeld";
import Datumsfeld from "../Formular/Datumsfeld";
import Schalter from "../Schalter";
import { Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { useAktion } from "./useAktion";
import { auftragAction, pflegeAction, regressAction } from "@/lib/backoffice/service/actions";
import { REGRESS_ABLEHNUNG, REGRESS_FORMEN } from "@/lib/backoffice/service/labels";
import { euro } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

function Feld({ label, fehler, children }) {
  return (
    <label className="bo-svc-feld text-left" data-fehler={fehler ? "" : undefined}>
      <span>{label}</span>
      {children}
      {fehler && <span className="bo-svc-fehler">{fehler}</span>}
    </label>
  );
}

// ------------------------------------------------------------- Regress --

/** @param {{regress:object, leitung:boolean, darf:boolean, toleranzCent:number}} p */
export function RegressAktionen({ regress: r, leitung, darf, toleranzCent = 100 }) {
  const { ausfuehren, laeuft } = useAktion();
  const [dialog, setDialog] = useState(null);
  const erwartet = Math.max(0, (Number(r.betrag_anerkannt_cent) || Number(r.betrag_gefordert_cent) || 0) - (Number(r.betrag_erhalten_cent) || 0));
  const [g, setG] = useState({ betrag: erwartet || null, nummer: "", datum: "" });
  const [an, setAn] = useState({ betrag: Number(r.betrag_gefordert_cent) || null, form: r.form || "Gutschrift", antwort: "" });
  const [ab, setAb] = useState({ grund: "", antwort: "" });
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState({});
  if (!darf) return null;
  const zu = () => setDialog(null);
  const run = (args, ok) => ausfuehren(regressAction, { name: r.name, ...args }, { ok, onOk: zu, onFehler: (x) => x.fehler && setFehler(x.fehler) });
  const gutschriftMoeglich = ["Gemeldet", "Anerkannt"].includes(r.status) && r.abgleich_status !== "Ausgeglichen";
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="regress-aktionen">
      {r.status === "Offen" && (
        <Knopf variant="primary" href={`/service/faelle/${encodeURIComponent(r.servicefall)}?aktion=forderung`}>
          {T.aktionen.forderung}
        </Knopf>
      )}
      {r.status === "Gemeldet" && (
        <>
          <Knopf variant="secondary" onClick={() => setDialog("anerkannt")}>
            {T.regress.anerkannt}
          </Knopf>
          <Knopf variant="secondary" onClick={() => setDialog("abgelehnt")}>
            {T.regress.abgelehnt}
          </Knopf>
        </>
      )}
      {gutschriftMoeglich && (
        <Knopf variant="primary" icon="Banknote" onClick={() => setDialog("gutschrift")} data-testid="regress-gutschrift">
          {T.regress.gutschrift}
        </Knopf>
      )}
      {r.status === "Anerkannt" && ["Ersatzlieferung kostenlos", "Reparatur durch Hersteller"].includes(r.form) && leitung && (
        <Knopf variant="secondary" onClick={() => run({ art: "Regress verrechnet" }, "Regress verrechnet")}>
          {T.regress.verrechnet}
        </Knopf>
      )}
      <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
        {["Offen", "Gemeldet"].includes(r.status) && <MenuePunkt icon="Mail" onWaehlen={() => run({ art: "erinnern" }, "Lieferant erinnert")}>{T.regress.erinnern}</MenuePunkt>}
        <MenuePunkt icon="ScrollText" href={`/service/faelle/${encodeURIComponent(r.servicefall)}`}>Fall öffnen</MenuePunkt>
        {leitung && r.abgleich_status === "Unterdeckung" && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => setDialog("ausbuchen")}>
              {T.regress.ausbuchen}
            </MenuePunkt>
          </>
        )}
        {leitung && r.status === "Abgelehnt" && <MenuePunkt icon="RotateCcw" onWaehlen={() => run({ art: "Wieder öffnen" }, "Regress wieder geöffnet")}>Wieder öffnen</MenuePunkt>}
      </Menue>

      {dialog === "gutschrift" && (
        <Dialog offen onSchliessen={zu} titel={T.regress.gutschriftTitel} text={T.regress.erwartet(euro(erwartet), euro(toleranzCent))} groesse="md" testid="dialog-regress-gutschrift" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run({ art: "gutschrift", betrag_cent: g.betrag, nummer: g.nummer, datum: g.datum }, "Gutschrift erfasst")} data-testid="regress-gutschrift-ok">{T.aktionen.erfassen}</Knopf></>}>
          <div className="grid gap-4">
            <div className="bo-svc-feld" data-fehler={fehler.betrag ? "" : undefined}>
              <span>Betrag netto</span>
              <BetragFeld value={g.betrag} onChange={(c) => setG({ ...g, betrag: c })} aria-label="Betrag netto" />
              {fehler.betrag && <span className="bo-svc-fehler">{fehler.betrag}</span>}
            </div>
            <Feld label="Gutschriftnummer des Lieferanten">
              <input value={g.nummer} onChange={(x) => setG({ ...g, nummer: x.target.value })} />
            </Feld>
            <div className="bo-svc-feld">
              <span>Datum</span>
              <Datumsfeld value={g.datum} onChange={(v) => setG({ ...g, datum: v })} aria-label="Datum der Gutschrift" />
            </div>
            <p className="bo-svc-hinweis">{T.regress.waehrung}</p>
          </div>
        </Dialog>
      )}
      {dialog === "anerkannt" && (
        <Dialog offen onSchliessen={zu} titel={T.regress.anerkannt} groesse="md" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run({ art: "Regress anerkannt", werte: { betrag_anerkannt_cent: an.betrag, form: an.form, antwort_lieferant: an.antwort } }, "Regress anerkannt")}>{T.aktionen.erfassen}</Knopf></>}>
          <div className="grid gap-4">
            <div className="bo-svc-feld" data-fehler={fehler.betrag ? "" : undefined}>
              <span>Anerkannter Betrag netto</span>
              <BetragFeld value={an.betrag} onChange={(c) => setAn({ ...an, betrag: c })} aria-label="Anerkannter Betrag" />
              {fehler.betrag && <span className="bo-svc-fehler">{fehler.betrag}</span>}
            </div>
            <Feld label="Form">
              <select value={an.form} onChange={(x) => setAn({ ...an, form: x.target.value })}>
                {REGRESS_FORMEN.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Feld>
            <Feld label="Antwort des Lieferanten">
              <textarea rows={2} value={an.antwort} onChange={(x) => setAn({ ...an, antwort: x.target.value })} />
            </Feld>
          </div>
        </Dialog>
      )}
      {dialog === "abgelehnt" && (
        <Bestaetigen offen titel="Regress abgelehnt erfassen?" text="Der Lieferant lehnt die Forderung ab; die Leitung kann den Regress wieder öffnen." bestaetigen={T.aktionen.erfassen} gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run({ art: "Regress abgelehnt", werte: { ablehnungsgrund: ab.grund, antwort_lieferant: ab.antwort } }, "Ablehnung erfasst")}>
          <div className="grid gap-3">
            <Feld label="Grund" fehler={fehler.ablehnungsgrund}>
              <select value={ab.grund} onChange={(x) => setAb({ ...ab, grund: x.target.value })}>
                <option value="">–</option>
                {REGRESS_ABLEHNUNG.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Feld>
            <Feld label="Antwort des Lieferanten">
              <input value={ab.antwort} onChange={(x) => setAb({ ...ab, antwort: x.target.value })} />
            </Feld>
          </div>
        </Bestaetigen>
      )}
      {dialog === "ausbuchen" && (
        <Bestaetigen offen titel={T.regress.ausbuchenTitel} text={T.regress.ausbuchenFolge} fakten={[{ label: "Differenz", wert: euro(Math.abs(Number(r.differenz_cent) || 0)) }]} bestaetigen={T.regress.ausbuchen} gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run({ art: "ausbuchen", grund }, "Differenz ausgebucht")}>
          <Feld label="Grund" fehler={fehler.grund}>
            <input value={grund} onChange={(x) => setGrund(x.target.value)} />
          </Feld>
        </Bestaetigen>
      )}
    </div>
  );
}

// ---------------------------------------------------------- Pflege-Abo --

/** @param {{abo:object, leitung:boolean, darf:boolean, verbraucher:boolean}} p */
export function PflegeAktionen({ abo: a, leitung, darf, verbraucher = true }) {
  const { ausfuehren, laeuft } = useAktion();
  const [dialog, setDialog] = useState(null);
  const [akt, setAkt] = useState({ abschlussweg: "Geschäftsraum", belehrung: false, vorzeitig: false });
  const [prot, setProt] = useState({ datum: "", leistungen: a.leistungen || "", im_portal: true });
  const [kuendigung, setKuendigung] = useState("");
  const [fehler, setFehler] = useState({});
  if (!darf) return null;
  const zu = () => setDialog(null);
  const run = (art, werte, ok) => ausfuehren(pflegeAction, { name: a.name, art, werte }, { ok, onOk: zu, onFehler: (x) => x.fehler && setFehler(x.fehler) });
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="pflege-aktionen">
      {a.status === "Angefragt" && (
        <Knopf variant="primary" onClick={() => run("Anbieten", {}, "Als angeboten markiert")}>
          Angebot gesendet
        </Knopf>
      )}
      {a.status === "Angeboten" && (
        <Knopf variant="primary" onClick={() => (verbraucher ? setDialog("aktivieren") : run("aktivieren", { abschlussweg: "Geschäftsraum" }, "Vertrag aktiv"))} disabled={!a.intervall_monate || !a.bedingungen_version} grund={!a.intervall_monate || !a.bedingungen_version ? "Aktivieren erst mit Intervall und Bedingungsversion" : undefined}>
          {T.vertraege.aktivieren}
        </Knopf>
      )}
      {a.status === "Aktiv" && (
        <Knopf variant="primary" icon="CalendarPlus" href={`/service/einsaetze/neu?pflege=${encodeURIComponent(a.name)}`} data-testid="pflege-primaer">
          {T.vertraege.terminPlanen}
        </Knopf>
      )}
      {a.status === "Pausiert" && (
        <Knopf variant="primary" onClick={() => run("Fortsetzen", {}, "Vertrag fortgesetzt")}>
          Fortsetzen
        </Knopf>
      )}
      <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
        <MenuePunkt icon="Mail" onWaehlen={() => run("erinnerung", {}, "Erinnerung gesendet")} deaktiviert={!a.kontakt_email} grund={!a.kontakt_email ? T.vertraege.ohneEmail : undefined}>
          {T.vertraege.erinnerung}
        </MenuePunkt>
        <MenuePunkt icon="FileText" onWaehlen={() => setDialog("protokoll")}>{T.vertraege.protokoll}</MenuePunkt>
        <MenuePunkt icon="Printer" href={`/druck/ph-pflege-abo/${encodeURIComponent(a.name)}`}>Pflegeprotokoll drucken</MenuePunkt>
        {Number(a.nachkauf_einwilligung) ? <MenuePunkt icon="Shield" onWaehlen={() => setDialog("widerruf")}>{T.vertraege.widerruf}</MenuePunkt> : null}
        {a.status === "Aktiv" && <MenuePunkt icon="Clock" onWaehlen={() => run("Pausieren", {}, "Vertrag pausiert")}>Pausieren</MenuePunkt>}
        {leitung && ["Aktiv", "Pausiert"].includes(a.status) && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => setDialog("kuendigen")}>Kündigung erfassen</MenuePunkt>
          </>
        )}
      </Menue>

      {dialog === "widerruf" && (
        <Bestaetigen offen titel={T.vertraege.widerrufTitel} text={T.vertraege.widerrufFolge(a.kunde_name)} bestaetigen={T.vertraege.widerruf} laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run("widerruf", {}, "Widerruf erfasst")} />
      )}
      {dialog === "aktivieren" && (
        <Dialog offen onSchliessen={zu} titel={T.vertraege.aktivieren} groesse="md" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run("aktivieren", akt, "Vertrag aktiv")}>{T.vertraege.aktivieren}</Knopf></>}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <span className="bo-svc-label">{T.vertraege.abschlussweg}</span>
              <div className="bo-svc-chips" role="radiogroup" aria-label={T.vertraege.abschlussweg}>
                {["Geschäftsraum", "Fernabsatz", "Außerhalb Geschäftsraum"].map((w) => (
                  <button key={w} type="button" role="radio" aria-checked={akt.abschlussweg === w} className="bo-svc-wahl" onClick={() => setAkt({ ...akt, abschlussweg: w })}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
            {akt.abschlussweg !== "Geschäftsraum" && (
              <>
                <Schalter label={T.vertraege.belehrung} an={akt.belehrung} onWechsel={(v) => setAkt({ ...akt, belehrung: v })} />
                <Schalter label="Kunde verlangt Beginn vor Ablauf der Rücktrittsfrist" an={akt.vorzeitig} onWechsel={(v) => setAkt({ ...akt, vorzeitig: v })} />
                {fehler.belehrung && <p className="bo-svc-fehler">Bitte die Belehrung bestätigen.</p>}
              </>
            )}
            <p className="bo-svc-hinweis">Wird bis zu eigenen Feldern (Anfrage A-S17) als Vermerk am Vertrag gespeichert.</p>
          </div>
        </Dialog>
      )}
      {dialog === "protokoll" && (
        <Dialog offen onSchliessen={zu} titel={T.vertraege.protokoll} groesse="md" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run("protokoll", prot, "Protokoll gespeichert")}>{T.aktionen.speichern}</Knopf></>}>
          <div className="grid gap-4">
            <div className="bo-svc-feld">
              <span>Datum</span>
              <Datumsfeld value={prot.datum} onChange={(v) => setProt({ ...prot, datum: v })} aria-label="Datum" />
            </div>
            <Feld label="Leistungen" fehler={fehler.leistungen}>
              <textarea rows={3} value={prot.leistungen} onChange={(x) => setProt({ ...prot, leistungen: x.target.value })} />
            </Feld>
            <Schalter label="Im Kundenportal zeigen" an={prot.im_portal} onWechsel={(v) => setProt({ ...prot, im_portal: v })} />
          </div>
        </Dialog>
      )}
      {dialog === "kuendigen" && (
        <Bestaetigen offen titel="Kündigung erfassen?" text="Der Vertrag endet zum angegebenen Datum; Wartungen danach werden nicht mehr geplant." bestaetigen="Kündigung erfassen" gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run("Kündigen", { kuendigung_zum: kuendigung }, "Kündigung erfasst")}>
          <div className="bo-svc-feld text-left">
            <span>Gekündigt zum</span>
            <Datumsfeld value={kuendigung} onChange={setKuendigung} aria-label="Gekündigt zum" />
            {fehler.kuendigung_zum && <span className="bo-svc-fehler">{fehler.kuendigung_zum}</span>}
          </div>
        </Bestaetigen>
      )}
    </div>
  );
}

// -------------------------------------------------------- Serviceauftrag --

const AUFTRAG_WEITER = { Angefragt: "Anbieten", Angeboten: "Beauftragen", Eingelagert: "In Arbeit nehmen", Abgeholt: "Einlagern" };

/** @param {{auftrag:object, leitung:boolean, darf:boolean}} p */
export function AuftragAktionen({ auftrag: a, leitung, darf }) {
  const { ausfuehren, laeuft } = useAktion();
  const [dialog, setDialog] = useState(null);
  const [w, setW] = useState({ name: a.kunde_name || "", lagerort: a.lagerort || "", preis: Number(a.preis_cent) || null });
  if (!darf) return null;
  const zu = () => setDialog(null);
  const run = (art, werte, ok) => ausfuehren(auftragAction, { name: a.name, art, werte }, { ok, onOk: zu });
  const weiter = AUFTRAG_WEITER[a.status];
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="auftrag-aktionen">
      {a.status === "Beauftragt" && (
        <Knopf variant="primary" onClick={() => setDialog("uebernahme")} data-testid="auftrag-primaer">
          {T.vertraege.uebernahme}
        </Knopf>
      )}
      {["Eingelagert", "In Arbeit"].includes(a.status) && (
        <Knopf variant={a.status === "In Arbeit" ? "primary" : "secondary"} onClick={() => setDialog("rueckgabe")}>
          {T.vertraege.rueckgabe}
        </Knopf>
      )}
      {weiter && (
        <Knopf variant={a.status === "Beauftragt" || a.status === "In Arbeit" ? "secondary" : "primary"} laedt={laeuft} onClick={() => (weiter === "Beauftragen" ? setDialog("beauftragen") : run(weiter, {}, `${weiter} erledigt`))}>
          {weiter === "Anbieten" ? "Angebot gesendet" : weiter}
        </Knopf>
      )}
      {a.status === "Zurueckgebracht" && <Knopf variant="secondary" href="/faktura">{T.vertraege.rechnungFaktura}</Knopf>}
      {leitung && ["Angefragt", "Angeboten", "Beauftragt"].includes(a.status) && (
        <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
          <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => setDialog("storno")}>Stornieren</MenuePunkt>
        </Menue>
      )}
      {(dialog === "uebernahme" || dialog === "rueckgabe") && (
        <Dialog offen onSchliessen={zu} titel={dialog === "uebernahme" ? T.vertraege.uebernahme : T.vertraege.rueckgabe} text={`${(a.positionen || []).length} Stücke laut Übernahmeliste`} groesse="md" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run(dialog, w, dialog === "uebernahme" ? "Übernahme erfasst" : "Rückgabe erfasst")}>{T.aktionen.erfassen}</Knopf></>}>
          <div className="grid gap-4">
            <Feld label="Name bestätigt (Kunde)">
              <input value={w.name} onChange={(x) => setW({ ...w, name: x.target.value })} />
            </Feld>
            {dialog === "uebernahme" && (
              <Feld label="Lagerort">
                <input value={w.lagerort} onChange={(x) => setW({ ...w, lagerort: x.target.value })} />
              </Feld>
            )}
            <p className="bo-svc-hinweis">Unterschrift und Fotos je Stück erfasst die Technik am iPad (Übernahmeliste).</p>
          </div>
        </Dialog>
      )}
      {dialog === "beauftragen" && (
        <Dialog offen onSchliessen={zu} titel="Beauftragen" groesse="sm" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run("Beauftragen", { preis_cent: w.preis }, "Beauftragt")}>Beauftragen</Knopf></>}>
          <div className="bo-svc-feld">
            <span>Preis brutto</span>
            <BetragFeld value={w.preis} onChange={(c) => setW({ ...w, preis: c })} aria-label="Preis" />
          </div>
        </Dialog>
      )}
      {dialog === "storno" && <Bestaetigen offen titel={`${a.name} stornieren?`} bestaetigen="Stornieren" gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run("Stornieren", {}, "Storniert")} />}
    </div>
  );
}
