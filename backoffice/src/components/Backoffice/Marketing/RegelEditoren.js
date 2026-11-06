"use client";
// Regel-Editoren als Sätze (10-konzept-marketing § 2.5 Zielgruppen, § 2.6 Kundenreisen). Native select/input,
// Tab-Reihenfolge = Lesereihenfolge. Zielgruppe: Vorschau 600 ms nach der letzten Änderung (Abbruch laufender Anfragen),
// Treffer/anschreibbar/ausgeschlossen mit Gründen. Reise: Auslöser-Zeilen (Jährlich mit Tag/Monat, nie „MM-TT“),
// Rechtsgrundlage als drei Karten (Bestandskunde gesperrt bis S8), Regelprüfung live (Spiegel pruefe_reise).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import { Bestaetigen, Dialog } from "../Overlay";
import useAktion from "./useAktion";
import { MailVorschau } from "./Kleinteile";
import { Pruefzeile } from "./Bausteine";
import { TestmailDialog } from "./AusgabeAktionen";
import { reiseAktionAction, reiseDuplizierenAction, reiseNeuAction, reisePausierenAction, reiseSpeichernAction, segmentSpeichernAction, segmentStatusAction, segmentVorschauAction } from "@/lib/backoffice/marketing/actions";
import { ausloeserSatz, pruefeReise, segmentSatz } from "@/lib/backoffice/marketing/regeln";
import { AUSLOESER_TEXT, GRUNDLAGE_TEXT, KRITERIEN_LEITUNG, KRITERIUM_TEXT, OPERATOR_TEXT, REISEN, ZIELGRUPPEN, ZWECK_TEXT, regelSatz, MONATE } from "@/lib/backoffice/marketing/texte";

const SEG_ZWECKE = ["newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf"];

export function SegmentEditor({ seg, leitung, darf, einladungenGesperrt }) {
  const router = useRouter();
  const [w, setW] = useState({ titel: seg?.titel || "", zweck: seg?.zweck || "newsletter", verknuepfung: seg?.verknuepfung || "UND", beschreibung: seg?.beschreibung || "", regeln: (seg?.regeln || []).map(({ kriterium, operator, wert, wert_bis, negieren, deaktiviert }) => ({ kriterium, operator, wert, wert_bis, negieren: !!Number(negieren), deaktiviert: !!Number(deaktiviert) })) });
  const [vorschau, setVorschau] = useState(null);
  const [fehler, setFehler] = useState({});
  const lauf = useRef(0);
  const { sofort, laeuft } = useAktion();
  const kriterien = Object.keys(KRITERIUM_TEXT).filter((k) => leitung || !KRITERIEN_LEITUNG.includes(k));

  useEffect(() => {
    const nr = ++lauf.current;
    const t = setTimeout(async () => {
      const r = await segmentVorschauAction({ name: seg?.name, regeln: w.regeln, verknuepfung: w.verknuepfung, zweck: w.zweck });
      if (nr === lauf.current) setVorschau(r?.ok ? r : { fehler: r?.message });
    }, 600);
    return () => clearTimeout(t);
  }, [w.regeln, w.verknuepfung, w.zweck, seg?.name]);

  const setRegel = (i, f) => setW({ ...w, regeln: w.regeln.map((r, j) => (j === i ? { ...r, ...f } : r)) });
  const speichern = async (stand) => {
    const r = await sofort(() => segmentSpeichernAction({ name: seg?.name, ...w, standSpeichern: stand }), { ok: stand ? ZIELGRUPPEN.gespeichert : seg ? "Zielgruppe gespeichert" : ZIELGRUPPEN.angelegt(w.titel), neuLaden: !!seg });
    if (r?.ok && !seg) router.push(`/marketing/zielgruppen/${encodeURIComponent(r.name)}`);
    if (!r?.ok) setFehler(r?.fehler || {});
  };
  return (
    <div className="bo-mar-akte">
      <div className="bo-mar-stapel">
        <section className="bo-kachel" style={{ padding: 24 }} data-testid="segment-editor">
          <div className="bo-mar-felder">
            <label className="bo-mar-feld voll"><span>Titel</span><input className="bo-mar-eingabe" value={w.titel} disabled={!darf} onChange={(e) => setW({ ...w, titel: e.target.value })} aria-invalid={fehler.titel ? "true" : undefined} /></label>
            <label className="bo-mar-feld"><span>Zweck</span><select className="bo-mar-eingabe" value={w.zweck} disabled={!darf} onChange={(e) => setW({ ...w, zweck: e.target.value })}>{SEG_ZWECKE.map((z) => <option key={z} value={z}>{ZWECK_TEXT[z]}</option>)}</select></label>
            <div className="bo-mar-feld"><span>Verknüpfung</span><Segment label="Verknüpfung" groesse="s" wert={w.verknuepfung} onWechsel={(v) => darf && setW({ ...w, verknuepfung: v })} optionen={[{ wert: "UND", titel: ZIELGRUPPEN.und }, { wert: "ODER", titel: ZIELGRUPPEN.oder }]} /></div>
          </div>
          <p className="bo-mar-unter mt-3">{ZIELGRUPPEN.zweckSatz(ZWECK_TEXT[w.zweck])}</p>
          {w.zweck === "einladungen" && einladungenGesperrt && <p className="bo-mar-warn mt-2 text-[14px]">{ZIELGRUPPEN.einladungenGesperrt}</p>}
          <ol className="mt-5 flex flex-col gap-2">
            {w.regeln.map((r, i) => (
              <li key={i} className="bo-mar-satz" data-testid="segment-regel">
                <span className="bo-mar-klein">{i === 0 ? "Wenn" : w.verknuepfung === "UND" ? "und" : "oder"}</span>
                <select aria-label="Kriterium" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={r.kriterium} disabled={!darf} onChange={(e) => setRegel(i, { kriterium: e.target.value })}>{kriterien.map((k) => <option key={k} value={k}>{KRITERIUM_TEXT[k]}</option>)}</select>
                <select aria-label="Operator" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={r.operator} disabled={!darf} onChange={(e) => setRegel(i, { operator: e.target.value })}>{Object.entries(OPERATOR_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                {!["vorhanden", "fehlt"].includes(r.operator) && <input aria-label="Wert" className="bo-mar-eingabe bo-mar-eingabe--klein w-40" value={r.wert} disabled={!darf} onChange={(e) => setRegel(i, { wert: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && i === w.regeln.length - 1) { e.preventDefault(); setW({ ...w, regeln: [...w.regeln, { kriterium: "interesse", operator: "ist", wert: "" }] }); } }} />}
                {r.operator === "zwischen" && <input aria-label="bis" className="bo-mar-eingabe bo-mar-eingabe--klein w-28" value={r.wert_bis || ""} disabled={!darf} onChange={(e) => setRegel(i, { wert_bis: e.target.value })} />}
                <label className="bo-mar-haken text-[13px]"><input type="checkbox" checked={r.negieren} disabled={!darf} onChange={(e) => setRegel(i, { negieren: e.target.checked })} />{ZIELGRUPPEN.nicht}</label>
                <label className="bo-mar-haken text-[13px]"><input type="checkbox" checked={r.deaktiviert} disabled={!darf} onChange={(e) => setRegel(i, { deaktiviert: e.target.checked })} />{ZIELGRUPPEN.aus}</label>
                {darf && <Knopf size="s" variant="ghost" icon="X" label="Bedingung entfernen" onClick={() => setW({ ...w, regeln: w.regeln.filter((_, j) => j !== i) })} />}
              </li>
            ))}
          </ol>
          {!w.regeln.length && <p className="bo-mar-unter mt-3">{ZIELGRUPPEN.keineRegel}</p>}
          {darf && <div className="mt-3"><Knopf size="s" icon="Plus" onClick={() => setW({ ...w, regeln: [...w.regeln, { kriterium: "interesse", operator: "ist", wert: "" }] })}>{ZIELGRUPPEN.bedingung}</Knopf></div>}
          <p className="mt-4 rounded-[16px] bg-(--color-bo-surface-2) px-4 py-3 text-[14px]" data-testid="segment-satz">{segmentSatz(w.regeln, w.verknuepfung, { kriterium: KRITERIUM_TEXT, operator: OPERATOR_TEXT }) || ZIELGRUPPEN.keineRegel}</p>
          {darf && (
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {seg && <Knopf onClick={() => sofort(() => segmentStatusAction({ name: seg.name, status: seg.status === "Archiviert" ? "Aktiv" : "Archiviert" }), { ok: seg.status === "Archiviert" ? "Wieder aktiv" : ZIELGRUPPEN.archiviert(seg.titel) })}>{seg.status === "Archiviert" ? "Wieder aktivieren" : ZIELGRUPPEN.archivieren}</Knopf>}
              {seg && <Knopf onClick={() => speichern(false)} laedt={laeuft}>Speichern</Knopf>}
              <Knopf variant="primary" onClick={() => speichern(!!seg)} laedt={laeuft} data-testid="stand-speichern">{seg ? ZIELGRUPPEN.standSpeichern : "Anlegen"}</Knopf>
            </div>
          )}
        </section>
      </div>
      <aside className="bo-mar-akte__rechts">
        <section className="bo-kachel" style={{ padding: 24 }} aria-live="polite" data-testid="segment-vorschau">
          <h2 className="bo-titel-kachel">{ZIELGRUPPEN.vorschau}</h2>
          {!vorschau ? <p className="bo-mar-unter mt-2">Lädt …</p> : vorschau.fehler ? <p className="bo-mar-gefahr mt-2">{vorschau.fehler}</p> : (
            <>
              <div className="bo-mar-kz mt-3">
                <div><b>{vorschau.treffer}</b><span>{ZIELGRUPPEN.treffer}</span></div>
                <div><b>{vorschau.empfaenger}</b><span>{ZIELGRUPPEN.anschreibbar}</span></div>
              </div>
              <p className="bo-mar-unter mt-3">{ZIELGRUPPEN.ausgeschlossen}: {Object.entries(vorschau.ausgeschlossen || {}).map(([k, n]) => `${ZIELGRUPPEN.ausschlussGruende[k] || k} ${n}`).join(" · ") || "keine"}</p>
              <p className="bo-mar-titel mt-4">{ZIELGRUPPEN.ersteZwanzig}</p>
              <ul className="mt-1 flex flex-col gap-1">{(vorschau.personen || []).map((p) => <li key={p.email} className="bo-mar-unter truncate">{p.name || p.email}</li>)}</ul>
            </>
          )}
        </section>
      </aside>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Kundenreisen

export function ReiseKopf({ r, leitung, fehler, automatik, testadresse }) {
  const [offen, setOffen] = useState(null);
  const { sofort, verzoegert, laeuft } = useAktion();
  const prim = r.status === "Aktiv" ? { t: REISEN.pausieren, f: () => verzoegert(() => reisePausierenAction({ namen: [r.name] }), { text: REISEN.pausiertToast(r.titel) }) } : r.status === "Pausiert" ? { t: REISEN.fortsetzen, f: () => setOffen("aktivieren") } : { t: REISEN.aktivieren, f: () => setOffen("aktivieren"), grund: fehler.length ? `${fehler.length} Hinweise der Regelprüfung` : null };
  return (
    <div className="bo-mar-aktionen">
      <Knopf icon="Mail" onClick={() => setOffen("testmail")}>Testmail …</Knopf>
      {leitung && <Knopf onClick={() => setOffen("heute")}>{REISEN.heutePlanen}</Knopf>}
      {leitung && <span className="inline-flex flex-col items-end"><Knopf variant="primary" onClick={prim.f} disabled={!!prim.grund} data-testid="reise-primaer">{prim.t}</Knopf>{prim.grund && <span className="bo-mar-klein bo-mar-warn mt-1">{prim.grund}</span>}</span>}
      <TestmailDialog offen={offen === "testmail"} onSchliessen={() => setOffen(null)} doctype="PH Kundenreise" name={r.name} vorbelegt={testadresse} />
      <Bestaetigen offen={offen === "aktivieren"} titel={REISEN.aktivierenTitel(r.titel)} fakten={[{ label: REISEN.aktivierenFakten.werbung, wert: Number(r.werbung) ? "ja" : "nein" }, { label: REISEN.aktivierenFakten.grundlage, wert: ["v", "b", "e"].filter((g) => Number(r[`grundlage_${g}`])).map((g) => GRUNDLAGE_TEXT[g.toUpperCase()]).join(", ") || "–" }, { label: REISEN.aktivierenFakten.ab, wert: REISEN.abMorgen(automatik) }]} bestaetigen={REISEN.aktivieren.replace(" …", "")} laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => reiseAktionAction({ name: r.name, aktion: "aktivieren" }), { ok: REISEN.aktiviert(r.titel) }); setOffen(null); }} />
      <Bestaetigen offen={offen === "heute"} titel={`${r.titel}: fällige heute planen?`} text="Legt Versand-Einträge für heute an, gesendet wird um 09:00." bestaetigen="Planen" laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => reiseAktionAction({ name: r.name, aktion: "heute" }), { ok: (x) => REISEN.geplant(x.anzahl) }); setOffen(null); }} />
    </div>
  );
}

const FELD_OPT = [["lieferdatum", "Lieferung"], ["kaufdatum", "Kauf"], ["montage", "Montage"]];

export function ReiseEditor({ r, tab, leitung, vorlagen = [], events = [], vorlageHtml, faehig }) {
  const [w, setW] = useState({ titel: r.titel, ziel: r.ziel || "", vorlage: r.vorlage, absender: r.absender, werbung: !!Number(r.werbung), grundlage_v: !!Number(r.grundlage_v), grundlage_b: !!Number(r.grundlage_b), grundlage_e: !!Number(r.grundlage_e), zweck: r.zweck || "", aehnliche_produkte: r.aehnliche_produkte || "", segment_outdoor: !!Number(r.segment_outdoor), segment_pflege: !!Number(r.segment_pflege), einmalig: !!Number(r.einmalig), max_je_kontakt: r.max_je_kontakt || 0, trigger: (r.trigger || []).map(({ ausloeser_typ, feld, versatz_tage, tag_monat, event, zwecke }) => ({ ausloeser_typ, feld, versatz_tage, event, zwecke, tag: tag_monat ? String(Number(tag_monat.slice(3, 5))) : "", monat: tag_monat ? String(Number(tag_monat.slice(0, 2))) : "" })) });
  const [geaendert, setGeaendert] = useState(false);
  const [trocken, setTrocken] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const { sofort, laeuft, zeige } = useAktion();
  const html = vorlagen.find((v) => v.name === w.vorlage)?.html || vorlageHtml;
  const fehler = pruefeReise({ ...r, ...Object.fromEntries(Object.entries(w).map(([k, v]) => [k, typeof v === "boolean" ? (v ? 1 : 0) : v])), trigger: w.trigger }, html);
  const set = (f) => { setW({ ...w, ...f }); setGeaendert(true); };
  const setT = (i, f) => set({ trigger: w.trigger.map((t, j) => (j === i ? { ...t, ...f } : t)) });
  const nurLesen = !leitung;
  useEffect(() => {
    if (tab !== "vorlage") return;
    reiseAktionAction({ name: r.name, aktion: "vorschau" }).then((x) => setVorschau(x?.ok ? x : { fehler: x?.message }));
  }, [tab, r.name, r.vorlage]);
  const speichern = async () => {
    const x = await sofort(() => reiseSpeichernAction({ name: r.name, werte: { ...w, trigger: w.trigger } }), { ok: "Reise gespeichert" });
    if (x?.ok) {
      setGeaendert(false);
      if (x.neueFreigabe) zeige(REISEN.regelGeaendert, { art: "info" });
    }
  };
  const grundKarte = (g) => {
    const gesperrt = g === "B" && !faehig.bestandskunde;
    const key = `grundlage_${g.toLowerCase()}`;
    return (
      <label key={g}>
        <input type="checkbox" checked={w[key]} disabled={nurLesen || gesperrt} onChange={(e) => set({ [key]: e.target.checked })} />
        <b>{GRUNDLAGE_TEXT[g]}</b>
        <span>{REISEN.karten[g]}</span>
        {gesperrt && <span className="bo-mar-warn">{REISEN.bGesperrt}</span>}
      </label>
    );
  };
  return (
    <div className="bo-mar-akte">
      <div className="bo-mar-stapel">
        {tab === "regel" && (
          <section className="bo-kachel" style={{ padding: 24 }} data-testid="regel-editor">
            <ol className="flex flex-col gap-2">
              {w.trigger.map((t, i) => (
                <li key={i} className="bo-mar-satz">
                  <span className="bo-mar-klein">{i === 0 ? REISEN.wenn : "oder"}</span>
                  <select aria-label="Auslöser" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={t.ausloeser_typ} disabled={nurLesen} onChange={(e) => setT(i, { ausloeser_typ: e.target.value })}>{Object.entries(AUSLOESER_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  {["datum", "jahrestag"].includes(t.ausloeser_typ) && <select aria-label="Feld" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={t.feld} disabled={nurLesen} onChange={(e) => setT(i, { feld: e.target.value })}>{FELD_OPT.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
                  {t.ausloeser_typ === "jaehrlich" && (<><input aria-label="Tag" className="bo-mar-eingabe bo-mar-eingabe--klein w-16" inputMode="numeric" value={t.tag} disabled={nurLesen} onChange={(e) => setT(i, { tag: e.target.value })} /><select aria-label="Monat" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={t.monat} disabled={nurLesen} onChange={(e) => setT(i, { monat: e.target.value })}>{MONATE.map((m, j) => <option key={m} value={String(j + 1)}>{m}</option>)}</select></>)}
                  {t.ausloeser_typ === "event" && <select aria-label="Event" className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" value={t.event} disabled={nurLesen} onChange={(e) => setT(i, { event: e.target.value })}><option value="">Event wählen …</option>{events.map((e) => <option key={e.name} value={e.name}>{e.titel}</option>)}</select>}
                  {t.ausloeser_typ === "einwilligung" && <input aria-label="Zwecke" className="bo-mar-eingabe bo-mar-eingabe--klein w-64" value={t.zwecke} disabled={nurLesen} onChange={(e) => setT(i, { zwecke: e.target.value })} />}
                  {t.ausloeser_typ !== "jaehrlich" && (<><span className="bo-mar-klein">±</span><input aria-label="Tage" className="bo-mar-eingabe bo-mar-eingabe--klein w-20" inputMode="numeric" value={t.versatz_tage ?? 0} disabled={nurLesen} onChange={(e) => setT(i, { versatz_tage: e.target.value })} /><span className="bo-mar-klein">{REISEN.plusTage}</span></>)}
                  <span className="bo-mar-klein">→ {ausloeserSatz(t, { feldText: Object.fromEntries(FELD_OPT), eventTitel: events.find((e) => e.name === t.event)?.titel })}</span>
                  {!nurLesen && <Knopf size="s" variant="ghost" icon="X" label="Auslöser entfernen" onClick={() => set({ trigger: w.trigger.filter((_, j) => j !== i) })} />}
                </li>
              ))}
            </ol>
            {!nurLesen && <div className="mt-3"><Knopf size="s" icon="Plus" onClick={() => set({ trigger: [...w.trigger, { ausloeser_typ: "datum", feld: "lieferdatum", versatz_tage: 7 }] })}>Weiterer Auslöser</Knopf></div>}
            {w.trigger.some((t) => t.feld === "lieferdatum") && <p className="bo-mar-klein mt-3">{REISEN.lieferHinweis}</p>}
            <div className="mt-5 flex flex-col gap-3">
              <p className="bo-mar-titel">{REISEN.dann} <select aria-label="Vorlage" className="bo-mar-eingabe bo-mar-eingabe--klein ml-2 inline-block w-auto" value={w.vorlage} disabled={nurLesen} onChange={(e) => set({ vorlage: e.target.value })}>{vorlagen.map((v) => <option key={v.name} value={v.name}>{v.betreff}</option>)}</select></p>
              <p className="bo-mar-unter">{REISEN.nurFuer}:</p>
              <Schalter label={REISEN.outdoor} an={w.segment_outdoor} onWechsel={(v) => set({ segment_outdoor: v })} deaktiviert={nurLesen} />
              <Schalter label={REISEN.pflege} an={w.segment_pflege} onWechsel={(v) => set({ segment_pflege: v })} deaktiviert={nurLesen} />
              <Schalter label={REISEN.einmalig} an={w.einmalig} onWechsel={(v) => set({ einmalig: v })} deaktiviert={nurLesen} />
              <label className="bo-mar-feld w-48"><span>{REISEN.hoechstzahl}</span><input className="bo-mar-eingabe" inputMode="numeric" value={w.max_je_kontakt} disabled={nurLesen} onChange={(e) => set({ max_je_kontakt: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[16px] bg-(--color-bo-surface-2) p-4">
              <span className="bo-mar-titel">{REISEN.trockenlauf}</span>
              <Knopf size="s" disabled={!faehig.trockenlauf} grund={!faehig.trockenlauf ? "Noch nicht verfügbar – Kommt mit dem nächsten Backend-Stand" : undefined} onClick={async () => { const x = await reiseAktionAction({ name: r.name, aktion: "trockenlauf" }); setTrocken(x); }}>{REISEN.trockenlaufKnopf}</Knopf>
              {trocken?.ok && <span className="bo-mar-unter" data-testid="trockenlauf">{REISEN.trockenlaufErgebnis(trocken.faellig)}{Object.keys(trocken.gesperrt || {}).length ? ` · gesperrt: ${Object.entries(trocken.gesperrt).map(([k, n]) => `${k.replace(/_/g, " ")} ${n}`).join(", ")}` : ""}</span>}
            </div>
          </section>
        )}
        {tab === "grundlage" && (
          <section className="bo-kachel" style={{ padding: 24 }} data-testid="rechtsgrundlage">
            <Schalter label={REISEN.wirbt} an={w.werbung} onWechsel={(v) => set({ werbung: v })} deaktiviert={nurLesen} />
            <div className="bo-mar-wahl mt-5">{["V", "B", "E"].map(grundKarte)}</div>
            <div className="bo-mar-felder mt-5">
              {w.grundlage_e && <label className="bo-mar-feld"><span>Zweck der Einwilligung</span><select className="bo-mar-eingabe" value={w.zweck} disabled={nurLesen} onChange={(e) => set({ zweck: e.target.value })}><option value="">Wählen …</option>{Object.keys(ZWECK_TEXT).filter((z) => z !== "teilnahme").map((z) => <option key={z} value={z}>{ZWECK_TEXT[z]}</option>)}</select></label>}
              {w.grundlage_b && <label className="bo-mar-feld voll"><span>{REISEN.aehnlich}</span><input className="bo-mar-eingabe" value={w.aehnliche_produkte} disabled={nurLesen} onChange={(e) => set({ aehnliche_produkte: e.target.value })} /></label>}
            </div>
            <h3 className="bo-mar-titel mt-6">{REISEN.laufzeit}</h3>
            <ul className="mt-2 flex flex-col gap-1">
              {REISEN.laufzeitZeilen.map((z) => <li key={z} className="bo-mar-unter">· {z.replace("{n}", "2")}</li>)}
              {REISEN.laufzeitNeu.map((z) => <li key={z} className="bo-mar-unter">· {z} <span className="bo-mar-klein">({REISEN.kommt})</span></li>)}
            </ul>
          </section>
        )}
        {tab === "vorlage" && (
          <section className="bo-kachel" style={{ padding: 24 }}>
            <div className="bo-mar-felder mb-4">
              <label className="bo-mar-feld"><span>{REISEN.vorlage}</span><select className="bo-mar-eingabe" value={w.vorlage} disabled={nurLesen} onChange={(e) => set({ vorlage: e.target.value })}>{vorlagen.map((v) => <option key={v.name} value={v.name}>{v.betreff}</option>)}</select></label>
              <label className="bo-mar-feld"><span>{REISEN.absender}</span><select className="bo-mar-eingabe" value={w.absender} disabled={nurLesen} onChange={(e) => set({ absender: e.target.value })}>{Object.entries(REISEN.absenderText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            <MailVorschau html={vorschau?.html} titel={`Mail-Vorschau Kundenreise ${r.titel}`} fehler={vorschau?.fehler} laedt={!vorschau} hoehe={420} werkzeuge={leitung ? <a className="bo-mar-link text-[13px]" href={`/marketing/vorlagen?vorlage=${encodeURIComponent(w.vorlage)}`}>{REISEN.vorlageBearbeiten}</a> : null} />
          </section>
        )}
        {!nurLesen && geaendert && tab !== "protokoll" && (
          <div className="bo-mar-auswahl bo-material-stark">
            <span className="bo-mar-auswahl__zahl">Ungespeichert</span>
            <Knopf size="s" onClick={() => location.reload()}>Verwerfen</Knopf>
            <Knopf size="s" variant="primary" onClick={speichern} laedt={laeuft} data-testid="reise-speichern">Speichern</Knopf>
          </div>
        )}
      </div>
      <aside className="bo-mar-akte__rechts">
        <section className="bo-kachel" style={{ padding: 24 }} data-testid="regelpruefung">
          <h2 className="bo-titel-kachel">{REISEN.regelpruefung}</h2>
          <ul className="bo-mar-check mt-3">{fehler.length ? fehler.map((f) => <Pruefzeile key={f} ok={false} text={regelSatz(f)} />) : <Pruefzeile ok text={REISEN.regelOk} />}</ul>
          <h3 className="bo-mar-titel mt-5">{REISEN.darf}</h3>
          <p className="bo-mar-unter mt-1">{w.werbung ? (w.grundlage_e ? REISEN.karten.E : REISEN.karten.B) : REISEN.karten.V}</p>
        </section>
      </aside>
    </div>
  );
}

export function ReiseDuplizierenKnopf({ reisen = [], leitung, vorlagen = [] }) {
  const router = useRouter();
  const [offen, setOffen] = useState(null);
  const [w, setW] = useState({ quelle: reisen[0]?.name || "", titel: "" });
  const [a, setA] = useState({ schritt: 0, titel: "", ziel: "", zweck: "newsletter", werbung: false, grundlage: "V", vorlage: vorlagen[0]?.name || "", trigger: [{ ausloeser_typ: "datum", feld: "lieferdatum", versatz_tage: 7 }] });
  const { sofort, laeuft } = useAktion();
  if (!leitung) return null;
  const pruef = pruefeReise({ werbung: a.werbung ? 1 : 0, grundlage_v: a.grundlage === "V" ? 1 : 0, grundlage_b: a.grundlage === "B" ? 1 : 0, grundlage_e: a.grundlage === "E" ? 1 : 0, zweck: a.zweck, trigger: a.trigger }, vorlagen.find((v) => v.name === a.vorlage)?.html || "");
  return (
    <span className="inline-flex gap-1">
      <Knopf variant="primary" icon="Layers" onClick={() => setOffen("dup")} data-testid="reise-duplizieren">{REISEN.duplizieren}</Knopf>
      <Knopf variant="primary" icon="Plus" label={REISEN.leerBeginnen} onClick={() => setOffen("neu")} />
      {offen === "dup" && (
        <Dialog offen onSchliessen={() => setOffen(null)} titel={REISEN.dupTitel} groesse="sm" fuss={<><Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} onClick={async () => { const r = await sofort(() => reiseDuplizierenAction(w), { ok: REISEN.dupOk(w.titel), neuLaden: false }); if (r?.ok) router.push(`/marketing/kundenreisen/${encodeURIComponent(r.name)}`); }}>{REISEN.dupKnopf}</Knopf></>}>
          <div className="flex flex-col gap-4">
            <label className="bo-mar-feld"><span>{REISEN.dupQuelle}</span><select className="bo-mar-eingabe" value={w.quelle} onChange={(e) => setW({ ...w, quelle: e.target.value })}>{reisen.map((r) => <option key={r.name} value={r.name}>{r.titel}</option>)}</select></label>
            <label className="bo-mar-feld"><span>{REISEN.dupTitelFeld}</span><input className="bo-mar-eingabe" autoFocus value={w.titel} onChange={(e) => setW({ ...w, titel: e.target.value })} /></label>
          </div>
        </Dialog>
      )}
      {offen === "neu" && (
        <Dialog offen onSchliessen={() => setOffen(null)} titel={`${REISEN.assistent} · ${a.schritt + 1}/6 ${REISEN.assistentSchritte[a.schritt]}`} groesse="md" fuss={<><Knopf onClick={() => (a.schritt ? setA({ ...a, schritt: a.schritt - 1 }) : setOffen(null))}>{a.schritt ? REISEN.zurueck : "Abbrechen"}</Knopf>{a.schritt < 5 ? <Knopf variant="primary" onClick={() => setA({ ...a, schritt: a.schritt + 1 })} disabled={a.schritt === 0 && a.titel.length < 3}>{REISEN.weiter}</Knopf> : <Knopf variant="primary" laedt={laeuft} disabled={pruef.length > 0} onClick={async () => { const r = await sofort(() => reiseNeuAction(a), { ok: REISEN.dupOk(a.titel), neuLaden: false }); if (r?.ok) router.push(`/marketing/kundenreisen/${encodeURIComponent(r.name)}`); }}>{REISEN.anlegen}</Knopf>}</>}>
          {a.schritt === 0 && <div className="flex flex-col gap-4"><label className="bo-mar-feld"><span>Titel</span><input className="bo-mar-eingabe" autoFocus value={a.titel} onChange={(e) => setA({ ...a, titel: e.target.value })} /></label><label className="bo-mar-feld"><span>Ziel</span><input className="bo-mar-eingabe" value={a.ziel} onChange={(e) => setA({ ...a, ziel: e.target.value })} /></label></div>}
          {a.schritt === 1 && <div className="bo-mar-satz"><span className="bo-mar-klein">Wenn</span><select className="bo-mar-eingabe bo-mar-eingabe--klein w-auto" aria-label="Auslöser" value={a.trigger[0].ausloeser_typ} onChange={(e) => setA({ ...a, trigger: [{ ...a.trigger[0], ausloeser_typ: e.target.value }] })}>{Object.entries(AUSLOESER_TEXT).filter(([k]) => k !== "jaehrlich").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input aria-label="Tage" className="bo-mar-eingabe bo-mar-eingabe--klein w-20" value={a.trigger[0].versatz_tage} onChange={(e) => setA({ ...a, trigger: [{ ...a.trigger[0], versatz_tage: e.target.value }] })} /><span className="bo-mar-klein">Tage</span></div>}
          {a.schritt === 2 && <Schalter label={REISEN.wirbt} an={a.werbung} onWechsel={(v) => setA({ ...a, werbung: v, grundlage: v ? "E" : "V" })} />}
          {a.schritt === 3 && <div className="bo-mar-wahl">{["V", "B", "E"].map((g) => <label key={g}><input type="radio" name="g" checked={a.grundlage === g} disabled={g === "B"} onChange={() => setA({ ...a, grundlage: g })} /><b>{GRUNDLAGE_TEXT[g]}</b><span>{g === "B" ? REISEN.bGesperrt : REISEN.karten[g]}</span></label>)}</div>}
          {a.schritt === 4 && <label className="bo-mar-feld"><span>{REISEN.vorlage}</span><select className="bo-mar-eingabe" value={a.vorlage} onChange={(e) => setA({ ...a, vorlage: e.target.value })}>{vorlagen.map((v) => <option key={v.name} value={v.name}>{v.betreff}</option>)}</select></label>}
          {a.schritt === 5 && <ul className="bo-mar-check">{pruef.length ? pruef.map((f) => <Pruefzeile key={f} ok={false} text={regelSatz(f)} />) : <Pruefzeile ok text={REISEN.regelOk} />}</ul>}
        </Dialog>
      )}
    </span>
  );
}
