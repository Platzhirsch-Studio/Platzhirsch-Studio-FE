"use client";
// Empfehlungen „Unter Freunden“ (10-konzept-marketing § 2.10): Liste mit Auswahl (Code senden – verzögert; Ablehnen …),
// Empfehlungscode-Dialog (Empfehler + eigener Auftrag als Nachweis), Akte mit Auftrag zuordnen, Ablehnen, Gutschein …
// (D6, geldwirksam, gesperrt bis S7 und solange eine Prüfampel nicht grün ist; Code wird nie abgetippt).
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Menue, MenuePunkt } from "../Overlay";
import useAktion from "./useAktion";
import { Ampel, Status } from "./Bausteine";
import { auftragZuordnenAction, codeSendenAction, empfehlungAblehnenAction, empfehlungAnlegenAction, gutscheinSendenAction } from "@/lib/backoffice/marketing/actions";
import { kurzDatum } from "@/lib/backoffice/marketing/regeln";
import { EMPFEHLUNGEN, STATUS_TEXT } from "@/lib/backoffice/marketing/texte";
import { cent } from "@/lib/backoffice/format";

export function EmpfehlungenListe({ zeilen = [], darf }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [ablehnen, setAblehnen] = useState(false);
  const { verzoegert } = useAktion();
  const auswahl = zeilen.filter((z) => gewaehlt.has(z.name));
  const sendbar = auswahl.filter((z) => !z.code_gesendet_am && !["Abgelehnt", "Verfallen"].includes(z.status));
  return (
    <>
      <div className="bo-mar-tabelle-huelle overflow-x-auto">
        <table className="bo-mar-tabelle" data-testid="empfehlungen-liste">
          <thead><tr>{darf && <th className="w-8"><span className="sr-only">Auswahl</span></th>}<th scope="col">{EMPFEHLUNGEN.spalten.empfehlung}</th><th scope="col">{EMPFEHLUNGEN.spalten.empfohlen}</th><th scope="col">{EMPFEHLUNGEN.spalten.auftrag}</th><th scope="col">{EMPFEHLUNGEN.spalten.status}</th></tr></thead>
          <tbody>
            {zeilen.map((z) => {
              const ab = z.fakten?.ab;
              const letzte = (z.fakten?.lieferscheine || []).map((l) => l.zugestellt_am).filter(Boolean).sort().pop();
              return (
                <tr key={z.name} data-gewaehlt={gewaehlt.has(z.name) ? "true" : undefined} data-warn={z.status === "Gutschein faellig" ? "true" : undefined}>
                  {darf && <td><input type="checkbox" className="size-4 accent-current" checked={gewaehlt.has(z.name)} onChange={() => setGewaehlt((a) => { const n = new Set(a); if (n.has(z.name)) n.delete(z.name); else n.add(z.name); return n; })} aria-label={`${z.code} auswählen`} /></td>}
                  <td>
                    <Link href={`/marketing/empfehlungen/${encodeURIComponent(z.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{z.empfehler_name} · <span className="bo-mar-mono">{z.code}</span></Link>
                    <p className={z.code_gesendet_am ? "bo-mar-unter" : "bo-mar-unter bo-mar-warn"}>{z.code_gesendet_am ? EMPFEHLUNGEN.codeGesendet(kurzDatum(z.code_gesendet_am)) : EMPFEHLUNGEN.codeNichtGesendet}</p>
                  </td>
                  <td>{z.empfohlen_name || "–"}</td>
                  <td>
                    {z.auftrag ? (
                      <>
                        <span className="bo-mar-mono">{z.auftrag}</span> {ab && <span className="bo-mar-klein">· {ab.status}</span>}
                        {ab && <p className="bo-mar-klein">{EMPFEHLUNGEN.offen(cent(ab.offen_cent || 0))}{letzte ? ` · ${EMPFEHLUNGEN.zugestellt(kurzDatum(letzte))}` : ""}</p>}
                      </>
                    ) : "–"}
                  </td>
                  <td><Status gruppe="empfehlung" wert={z.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="bo-mar-karten">
        {zeilen.map((z) => (
          <li key={z.name} className="bo-mar-karte-zeile"><div className="min-w-0 flex-1"><Link href={`/marketing/empfehlungen/${encodeURIComponent(z.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{z.empfehler_name}</Link><p className="bo-mar-klein">{z.code}</p></div><Status gruppe="empfehlung" wert={z.status} /></li>
        ))}
      </ul>
      {darf && auswahl.length > 0 && (
        <div className="bo-mar-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen">
          <span className="bo-mar-auswahl__zahl">{auswahl.length} ausgewählt</span>
          <Knopf size="s" disabled={!sendbar.length} grund={!sendbar.length ? "Codes schon gesendet" : undefined} onClick={() => { verzoegert(() => codeSendenAction({ codes: sendbar.map((z) => z.name) }), { text: `${sendbar.length} ${sendbar.length === 1 ? "Code" : "Codes"} gesendet` }); setGewaehlt(new Set()); }}>{EMPFEHLUNGEN.codeSenden} ({sendbar.length})</Knopf>
          <Knopf size="s" onClick={() => setAblehnen(true)}>{EMPFEHLUNGEN.ablehnen}</Knopf>
        </div>
      )}
      {ablehnen && <AblehnenDialog codes={auswahl.map((z) => z.name)} onSchliessen={() => { setAblehnen(false); setGewaehlt(new Set()); }} />}
    </>
  );
}

export function AblehnenDialog({ codes, vorbelegt = "", onSchliessen }) {
  const [grund, setGrund] = useState(vorbelegt);
  const { sofort, laeuft } = useAktion();
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={codes.length === 1 ? EMPFEHLUNGEN.ablehnenTitel(codes[0]) : `${codes.length} Empfehlungen ablehnen?`} groesse="sm" fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" disabled={grund.trim().length < 3 || laeuft} laedt={laeuft} onClick={async () => { const r = await sofort(() => empfehlungAblehnenAction({ codes, grund }), { ok: codes.length === 1 ? EMPFEHLUNGEN.abgelehnt(codes[0]) : "Abgelehnt" }); if (r?.ok) onSchliessen(); }}>Ablehnen</Knopf></>}>
      <label className="bo-mar-feld"><span>{EMPFEHLUNGEN.ablehnenGrund}</span><input className="bo-mar-eingabe" autoFocus value={grund} onChange={(e) => setGrund(e.target.value)} /></label>
    </Dialog>
  );
}

export function EmpfehlungscodeKnopf({ auto = false }) {
  const [offen, setOffen] = useState(auto);
  const router = useRouter();
  const [w, setW] = useState({ empfehler_name: "", empfehler_email: "", empfehler_auftrag: "" });
  const [fehler, setFehler] = useState({});
  const { verzoegert, laeuft } = useAktion();
  const los = async () => {
    const r = await verzoegert(() => empfehlungAnlegenAction(w), { text: "Code gesendet" });
    if (r?.ok) {
      setOffen(false);
      router.push(`/marketing/empfehlungen/${encodeURIComponent(r.name)}`);
    } else setFehler(r?.fehler || {});
  };
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} data-testid="empfehlungscode">{EMPFEHLUNGEN.neu}</Knopf>
      {offen && (
        <Dialog offen onSchliessen={() => setOffen(false)} titel={EMPFEHLUNGEN.neu} groesse="md" fuss={<><Knopf onClick={() => setOffen(false)}>Abbrechen</Knopf><Knopf variant="primary" onClick={los} laedt={laeuft} disabled={laeuft}>{EMPFEHLUNGEN.anlegenKnopf}</Knopf></>}>
          <div className="bo-mar-felder">
            {["empfehler_name", "empfehler_email", "empfehler_auftrag"].map((f) => (
              <label key={f} className={`bo-mar-feld ${f === "empfehler_auftrag" ? "voll" : ""}`}><span>{EMPFEHLUNGEN.felder[f]}</span><input className="bo-mar-eingabe" value={w[f]} onChange={(e) => setW({ ...w, [f]: e.target.value })} aria-invalid={fehler[f] ? "true" : undefined} />{fehler[f] && <span className="bo-mar-feld__fehler">{fehler[f]}</span>}</label>
            ))}
            <p className="bo-mar-unter voll">{EMPFEHLUNGEN.mailVorschau}: „Ihr persönlicher Empfehlungscode“ – Code und Link zum Weitergeben. Gesendet wird nach dem Rückgängig-Fenster.</p>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function EmpfehlungAktionen({ e, ampeln, faehig, leitung, team, auftraege = [], wert }) {
  const [offen, setOffen] = useState(null);
  const [auftrag, setAuftrag] = useState(e.auftrag || "");
  const [fehler, setFehler] = useState(null);
  const { sofort, verzoegert, laeuft } = useAktion();
  const gesperrt = !faehig.gutschein ? EMPFEHLUNGEN.gutscheinGesperrt : !ampeln.alleGruen ? EMPFEHLUNGEN.gesperrt(ampeln.sperrgrund || "") : null;
  return (
    <div className="bo-mar-aktionen">
      {team && (
        <Menue label="Weitere Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" />}>
          <MenuePunkt icon="Mail" deaktiviert={!!e.code_gesendet_am} grund={e.code_gesendet_am ? EMPFEHLUNGEN.codeGesendet(kurzDatum(e.code_gesendet_am)) : undefined} onWaehlen={() => verzoegert(() => codeSendenAction({ codes: [e.name] }), { text: EMPFEHLUNGEN.codeGesendetToast(e.code) })}>{EMPFEHLUNGEN.codeSenden}</MenuePunkt>
          <MenuePunkt icon="FileText" onWaehlen={() => setOffen("auftrag")}>Auftrag zuordnen …</MenuePunkt>
          {!["Abgelehnt", "Gutschein ausgegeben"].includes(e.status) && <MenuePunkt icon="CircleX" onWaehlen={() => setOffen("ablehnen")}>{EMPFEHLUNGEN.ablehnen}</MenuePunkt>}
        </Menue>
      )}
      {leitung && e.status === "Gutschein faellig" && (
        <span className="inline-flex flex-col items-end">
          <Knopf variant="primary" icon="Gift" disabled={!!gesperrt} onClick={() => setOffen("gutschein")} data-testid="gutschein">{EMPFEHLUNGEN.gutschein}</Knopf>
          {gesperrt && <span className="bo-mar-klein bo-mar-warn mt-1 max-w-[320px] text-right" data-testid="gutschein-grund">Noch nicht verfügbar – {gesperrt}</span>}
        </span>
      )}
      {offen === "ablehnen" && <AblehnenDialog codes={[e.name]} vorbelegt={ampeln.storniert ? "Auftrag storniert" : ""} onSchliessen={() => setOffen(null)} />}
      {offen === "auftrag" && (
        <Dialog offen onSchliessen={() => setOffen(null)} titel="Auftrag zuordnen" groesse="sm" fuss={<><Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} onClick={async () => { const r = await sofort(() => auftragZuordnenAction({ code: e.name, auftrag }), { ok: "Auftrag zugeordnet" }); if (r?.ok) setOffen(null); else setFehler(r?.fehler?.auftrag || r?.message); }}>Zuordnen</Knopf></>}>
          <label className="bo-mar-feld"><span>{EMPFEHLUNGEN.auftrag}</span><select className="bo-mar-eingabe" value={auftrag} onChange={(x) => setAuftrag(x.target.value)}><option value="">Wählen …</option>{auftraege.map((a) => <option key={a.name} value={a.name}>{a.name} · {a.kunde_name} · {a.status}</option>)}</select>{fehler && <span className="bo-mar-feld__fehler">{fehler}</span>}</label>
        </Dialog>
      )}
      <Bestaetigen offen={offen === "gutschein"} titel={EMPFEHLUNGEN.gutscheinTitel} text={`${e.empfehler_name} bekommt einen Gutschein. Der Code geht per Mail und wird nicht angezeigt.`} fakten={[{ label: "Empfehlerin", wert: e.empfehler_name }, { label: "Auftrag", wert: e.auftrag }, { label: "Prüfung", wert: "Storno · Lieferung · Zahlung · Frist erfüllt" }]} bestaetigen={EMPFEHLUNGEN.gutscheinKnopf(cent(wert || 0))} laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => gutscheinSendenAction({ code: e.name }), { ok: "Gutschein gesendet" }); setOffen(null); }} />
    </div>
  );
}

export function Ampeln({ ampeln }) {
  return (
    <div className="bo-mar-ampeln" data-testid="ampeln">
      {["storno", "lieferung", "zahlung", "frist"].map((k) => <Ampel key={k} titel={EMPFEHLUNGEN.ampeln[k]} ok={ampeln[k].ok} text={ampeln[k].text} />)}
    </div>
  );
}

export const EMPF_STATUS = STATUS_TEXT.empfehlung;
