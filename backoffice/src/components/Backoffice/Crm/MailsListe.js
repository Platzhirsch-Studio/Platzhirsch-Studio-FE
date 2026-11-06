"use client";
// Nicht zugeordnete E-Mails (Entscheidung Nr. 52): Live-Liste aus Outlook links, Zuordnung rechts als schwebende
// Karte. Zuordnen zu Vorschlag oder gesuchtem Kunden (optional Adresse merken), Kontakt aus der Mail anlegen oder
// Adresse sperren (Rückfrage). Erledigte Mails verschwinden sofort aus der Liste (nichts wird gespeichert, bis
// zugeordnet ist). Fehlende Backend-Fähigkeit → Knopf deaktiviert mit Grund (Fähigkeiten-Register).

import { useEffect, useMemo, useState } from "react";
import Kachel from "../Kachel";
import Knopf, { RundKnopf } from "../Knopf";
import Avatar from "../Avatar";
import Leer from "../Leer";
import Segment from "../Segment";
import Schalter from "../Schalter";
import { Pille } from "../StatusBadge";
import Bestaetigen from "../Bestaetigen";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { filtereMails } from "@/lib/backoffice/crm/mails";
import { adresseSperrenAction, kontaktAusMailAction, kontaktSuchenAction, mailZuordnenAction } from "@/lib/backoffice/crm/actions";
import "./crm.css";

const M = T.mails;
const GRUND_MATERIAL = { unbekannt: "stein", mehrdeutig: "eiche", vertraulich: "nuss" };

function zeitText(s, jetzt) {
  const d = new Date(String(s).replace(" ", "T"));
  const h = Math.round((jetzt - d) / 3600000);
  if (h < 24) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (h < 48) return "gestern";
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export default function MailsListe({ mails = [], zaehler = {}, faehig = {}, jetzt: jetztIso }) {
  const { fuehre, laeuft } = useCrmAktion();
  const jetzt = useMemo(() => (jetztIso ? new Date(jetztIso) : new Date()), [jetztIso]);
  const [grund, setGrund] = useState("alle");
  const [weg, setWeg] = useState(() => new Set());
  const sicht = filtereMails(mails, { grund }).filter((m) => !weg.has(m.id));
  const [aktivId, setAktivId] = useState(sicht[0]?.id || null);
  const aktiv = sicht.find((m) => m.id === aktivId) || sicht[0] || null;
  const [merken, setMerken] = useState(false);
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [sperren, setSperren] = useState(false);
  const [vorschlaegeKonflikt, setVorschlaegeKonflikt] = useState([]);

  const [vorherId, setVorherId] = useState(aktiv?.id);
  if (vorherId !== aktiv?.id) {
    setVorherId(aktiv?.id);
    setMerken(false);
    setSuche("");
    setTreffer([]);
    setVorschlaegeKonflikt([]);
  }
  useEffect(() => {
    if (!suche.trim()) return;
    const t = setTimeout(async () => {
      const r = await kontaktSuchenAction({ q: suche });
      setTreffer(r?.ok ? r.treffer : []);
    }, 250);
    return () => clearTimeout(t);
  }, [suche]);

  const fertig = (m) => {
    setWeg((w) => new Set(w).add(m.id));
    const rest = sicht.filter((x) => x.id !== m.id);
    setAktivId(rest[0]?.id || null);
  };
  const zuordnen = async (ziel) => {
    const m = aktiv;
    const r = await fuehre(() => mailZuordnenAction({ messageId: m.id, postfach: m.postfach, doctype: ziel.doctype || "PH Kontakt", name: ziel.name, merken, adresse: m.gegenadresse, betreff: m.betreff }), { text: M.zugeordnet(ziel.titel), fehlerText: M.zuordnenZu });
    if (r?.ok) fertig(m);
  };
  const kontaktNeu = async () => {
    const m = aktiv;
    const r = await kontaktAusMailAction({ messageId: m.id, postfach: m.postfach, adresse: m.gegenadresse, name: m.absenderName });
    if (r?.ok) {
      fertig(m);
      fuehre(async () => r, { text: M.kontaktAngelegt(m.absenderName || m.gegenadresse) });
    } else if (r?.code === "conflict") setVorschlaegeKonflikt(r.vorschlaege || []);
    else fuehre(async () => r, { fehlerText: T.knopf.kontaktAusMail });
  };

  if (!mails.length) return <Kachel><Leer art="erledigt" text={M.leer} groesse="seite" testid="crm-mails-leer" /></Kachel>;

  const vorschlaege = [...(aktiv?.vorschlaege || []), ...vorschlaegeKonflikt.filter((v) => !(aktiv?.vorschlaege || []).some((x) => x.name === v.name))];

  return (
    <div className="grid gap-5">
      <Segment label="Grund" wert={grund} onWechsel={setGrund} optionen={[{ wert: "alle", titel: "Alle", anzahl: mails.length - weg.size }, ...["unbekannt", "mehrdeutig", "vertraulich"].map((g) => ({ wert: g, titel: M.gruende[g], anzahl: zaehler[g] || 0 }))]} />
      <div className="bo-crm-raster" data-mit-vorschau={aktiv ? "true" : "false"}>
        <Kachel testid="crm-mails-liste" titel={M.ueber} unter={M.unter}>
          {sicht.length === 0 ? <Leer art="erledigt" groesse="karte" text={M.leer} /> : (
            <ul className="grid gap-1">
              {sicht.map((m) => (
                <li key={m.id}>
                  <button type="button" className="bo-crm-mail w-full text-left" data-aktiv={aktiv?.id === m.id ? "true" : undefined} onClick={() => setAktivId(m.id)} data-testid="crm-mail-zeile">
                    <Avatar name={m.absenderName || m.gegenadresse} groesse={40} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-bo-text-soft">{m.richtung === "ausgehend" ? `${M.richtung.ausgehend} an ${m.gegenadresse}` : `${m.absenderName || m.absender}`}</span>
                      <span className="bo-crm-mail__betreff block">{m.betreff}</span>
                    </span>
                    <span className="grid justify-items-end gap-1"><span className="text-[13px] tabular-nums text-bo-text-soft">{zeitText(m.datum, jetzt)}</span><Pille material={GRUND_MATERIAL[m.grund]}>{m.grundText}</Pille></span>
                    <span className="bo-crm-mail__vorschau">{m.vertraulich ? "Als vertraulich markiert – Inhalt wird hier nicht angezeigt." : m.vorschau}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
        {aktiv && (
          <div className="bo-crm-vorschau-spalte min-w-0">
            <aside className="bo-crm-vorschau bo-panel grid min-w-0 grid-cols-1 gap-5 p-6" aria-label={`${M.zuordnenZu}: ${aktiv.betreff}`} data-testid="crm-mail-zuordnen">
              <div className="flex items-start gap-3">
                <Avatar name={aktiv.absenderName || aktiv.gegenadresse} groesse={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold">{aktiv.absenderName || aktiv.gegenadresse}</p>
                  <p className="truncate text-[13px] text-bo-text-soft">{aktiv.gegenadresse} · {M.postfach} {aktiv.postfach}</p>
                </div>
                <RundKnopf icon="X" label={T.knopf.schliessen} groesse="s" onClick={() => setAktivId(null)} />
              </div>
              <div className="bo-crm-zitat">
                <p className="mb-1 font-semibold">{aktiv.betreff}</p>
                <p className="text-[14px] text-bo-text-soft">{M.grundText[aktiv.grund]}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-[13px] font-medium text-bo-text-soft">{M.vorschlaege}</p>
                {vorschlaege.length === 0 ? <p className="text-[14px] text-bo-text-faint">Keine Vorschläge.</p> : vorschlaege.map((v) => (
                  <div key={v.name} className="flex items-center justify-between gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-2.5">
                    <span className="min-w-0 truncate text-[15px] font-semibold">{v.titel}</span>
                    <Knopf size="s" variant="secondary" laedt={laeuft} disabled={!faehig.zuordnen?.an} onClick={() => zuordnen(v)} data-testid="crm-mail-vorschlag">{T.knopf.mailZuordnen}</Knopf>
                  </div>
                ))}
              </div>
              <label className="bo-suche flex h-10 items-center gap-2 px-4">
                <span className="sr-only">{M.suchen}</span>
                <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder={M.suchen} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" data-testid="crm-mail-suche" />
              </label>
              {suche && treffer.length > 0 && (
                <ul className="grid gap-1">
                  {treffer.slice(0, 5).map((t) => (
                    <li key={t.name}><button type="button" className="flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-left hover:bg-bo-surface-2" onClick={() => zuordnen({ doctype: "PH Kontakt", name: t.name, titel: t.titel })} disabled={!faehig.zuordnen?.an}><span className="truncate">{t.titel}</span><span className="text-[13px] text-bo-text-soft">{T.knopf.mailZuordnen}</span></button></li>
                  ))}
                </ul>
              )}
              <Schalter label={M.merken} beschreibung={M.merkenHinweis} an={merken} onWechsel={setMerken} deaktiviert={aktiv.vertraulich} />
              <div className="flex flex-wrap gap-2">
                <Knopf variant="secondary" icon="UserPlus" laedt={laeuft} disabled={!faehig.kontaktNeu?.an} grund={faehig.kontaktNeu?.an ? undefined : faehig.kontaktNeu?.grund} onClick={kontaktNeu} data-testid="crm-mail-kontakt">{T.knopf.kontaktAusMail}</Knopf>
                <Knopf variant="ghost" icon="ShieldAlert" disabled={!faehig.sperren?.an} grund={faehig.sperren?.an ? undefined : faehig.sperren?.grund} onClick={() => setSperren(true)} data-testid="crm-mail-sperren">{T.knopf.adresseSperren}</Knopf>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Bestaetigen offen={sperren} titel={M.sperrenTitel(aktiv?.gegenadresse || "")} text={M.sperrenText} bestaetigen={T.knopf.adresseSperren} gefaehrlich laeuft={laeuft}
        onAbbrechen={() => setSperren(false)}
        onBestaetigen={async () => {
          const m = aktiv;
          const r = await fuehre(() => adresseSperrenAction({ adresse: m.gegenadresse }), { text: M.gesperrt(m.gegenadresse), fehlerText: T.knopf.adresseSperren });
          setSperren(false);
          if (r?.ok) {
            setWeg((w) => {
              const n = new Set(w);
              for (const x of mails) if (x.gegenadresse === m.gegenadresse) n.add(x.id);
              return n;
            });
            setAktivId(null);
          }
        }} />
    </div>
  );
}
