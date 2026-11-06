"use client";
// Vorlagen-Editor (10-konzept-marketing § 2.11, nur Leitung) und Einstellungen (§ 2.14): Schalter mit Außenwirkung
// (Automatik, Kanzlei-Freigaben) mit Bestätigung und Folgesatz, sofort gespeichert; übrige Felder mit Speicherleiste
// (Strg/⌘+S). Werbefenster als Wochentag-Chips, Sperrtage als Datums-Chips. Geheimnisse nur als Schlüssel-Namen.
import { useEffect, useState } from "react";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import { Bestaetigen } from "../Overlay";
import useAktion from "./useAktion";
import { MailVorschau } from "./Kleinteile";
import { Ampel } from "./Bausteine";
import { auftragsquelleAction, einstellungenSpeichernAction, schalterSetzenAction, vorlageAktionAction, vorlageSpeichernAction } from "@/lib/backoffice/marketing/actions";
import { platzhalterIn } from "@/lib/backoffice/marketing/vorschau";
import { BEREITSCHAFT, EINSTELLUNGEN, FUSSZEILE_TEXT, VORLAGEN, VORLAGE_ART, WOCHENTAGE_KURZ, ATTRIBUTION_TEXT } from "@/lib/backoffice/marketing/texte";
import { centAlsEingabe } from "@/lib/backoffice/format";

export function VorlagenEditor({ v, darf }) {
  const [w, setW] = useState({ betreff: v.betreff || "", preheader: v.preheader || "", art: v.art, sprache: v.sprache || "de", fusszeile: v.fusszeile || "S", html: v.html || "" });
  const [mod, setMod] = useState(v.modified);
  const [vorschau, setVorschau] = useState(null);
  const [geaendert, setGeaendert] = useState(false);
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const lade = () => vorlageAktionAction({ name: v.name, aktion: "vorschau" }).then((r) => setVorschau(r?.ok ? r : { fehler: r?.message }));
  useEffect(() => {
    lade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.name]);
  const speichern = async () => {
    const r = await sofort(() => vorlageSpeichernAction({ name: v.name, modified: mod, werte: w }), { ok: "Vorlage gespeichert" });
    if (r?.ok) {
      setMod(r.modified);
      setGeaendert(false);
      lade();
    } else setFehler(r?.fehler || {});
  };
  const set = (f) => { setW({ ...w, ...f }); setGeaendert(true); };
  const platzhalter = v.variablen_hinweis ? v.variablen_hinweis.split(",").map((s) => s.trim()) : platzhalterIn(w.html);
  return (
    <div className="bo-mar-stapel" data-testid="vorlagen-editor" onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (darf && geaendert) speichern(); } }}>
      {w.art === "System" && <p className="bo-mar-band" data-ton="info">{VORLAGEN.systemBand}</p>}
      <section className="bo-kachel" style={{ padding: 24 }}>
        <div className="bo-mar-felder">
          <label className="bo-mar-feld voll"><span>{VORLAGEN.felder.betreff}</span><input className="bo-mar-eingabe" value={w.betreff} disabled={!darf} onChange={(e) => set({ betreff: e.target.value })} aria-invalid={fehler.betreff ? "true" : undefined} /></label>
          <label className="bo-mar-feld voll"><span>{VORLAGEN.felder.preheader}</span><input className="bo-mar-eingabe" value={w.preheader} disabled={!darf} onChange={(e) => set({ preheader: e.target.value })} /></label>
          <label className="bo-mar-feld"><span>{VORLAGEN.felder.art}</span><select className="bo-mar-eingabe" value={w.art} disabled={!darf} onChange={(e) => set({ art: e.target.value })}>{VORLAGE_ART.map((a) => <option key={a}>{a}</option>)}</select></label>
          <label className="bo-mar-feld"><span>{VORLAGEN.felder.fusszeile}</span><select className="bo-mar-eingabe" value={w.fusszeile} disabled={!darf} onChange={(e) => set({ fusszeile: e.target.value })}>{Object.entries(FUSSZEILE_TEXT).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
        </div>
        <div className="bo-mar-feld mt-4">
          <span>{VORLAGEN.platzhalter}</span>
          <span className="bo-mar-chips">{platzhalter.map((p) => <button key={p} type="button" className="bo-mar-chip" disabled={!darf} aria-label={VORLAGEN.einfuegen(p)} onClick={() => set({ html: `${w.html}{{ ${p} }}` })}>{p}</button>)}</span>
        </div>
        <label className="bo-mar-feld mt-4"><span>{VORLAGEN.felder.html}</span><textarea className="bo-mar-code" spellCheck={false} value={w.html} disabled={!darf} onChange={(e) => set({ html: e.target.value })} aria-invalid={fehler.html ? "true" : undefined} />{fehler.html ? <span className="bo-mar-feld__fehler">{fehler.html}</span> : <span className="bo-mar-feld__hinweis">{VORLAGEN.werbungBrauchtLink}</span>}</label>
        <p className="bo-mar-klein mt-3">{VORLAGEN.testmailHinweis}</p>
      </section>
      <section className="bo-kachel" style={{ padding: 20 }}>
        <MailVorschau html={vorschau?.html} titel={`Mail-Vorschau Vorlage ${v.vorlage_id}`} fehler={vorschau?.fehler} laedt={!vorschau} hoehe={420} />
      </section>
      {darf && (
        <div className={`bo-mar-auswahl bo-material-stark ${geaendert ? "" : "opacity-70"}`}>
          <span className="bo-mar-auswahl__zahl">{geaendert ? "Ungespeichert" : "Keine Änderungen"}</span>
          <Knopf size="s" onClick={() => sofort(() => vorlageAktionAction({ name: v.name, aktion: "duplizieren" }), { ok: VORLAGEN.dupliziert(v.vorlage_id) })}>{VORLAGEN.duplizieren}</Knopf>
          <Knopf size="s" variant="primary" disabled={!geaendert || laeuft} laedt={laeuft} onClick={speichern} kuerzel="mod+s">Speichern</Knopf>
        </div>
      )}
    </div>
  );
}

const SCHALTER = [
  { feld: "automatik_aktiv", text: EINSTELLUNGEN.ampeln.automatik, folge: EINSTELLUNGEN.schalterFolge.automatik },
  { feld: "kanzlei_fusszeilen_freigegeben", text: EINSTELLUNGEN.ampeln.fusszeilen, folge: EINSTELLUNGEN.schalterFolge.fusszeilen },
  { feld: "kanzlei_b_einladung_bestaetigt", text: EINSTELLUNGEN.ampeln.bEinladung, folge: EINSTELLUNGEN.schalterFolge.bEinladung },
];

const TABS_FELDER = {
  allgemein: ["test_empfaenger", "absender_name", "absender_gastgeberin_name", "absender_gastgeberin", "antwort_an", "website_url", "einwilligung_textversion", "ecg_abgleich_gueltig_bis"],
  versand: ["doi_gueltig_stunden", "doi_erinnerung_nach_stunden", "unbestaetigt_loeschen_tage", "werbung_pro_30_tage", "werbung_wochentage", "sperrtage", "versand_stapel", "bestaetigen_pfad", "abmelden_pfad", "resend_webhook_aktiv", "soft_bounce_grenze", "mail_ereignis_aufbewahren_tage", "ip_hash_speichern"],
  auftrag: ["auftrags_doctype", "feld_kontakt", "feld_name", "feld_lieferdatum", "feld_berater", "feld_produkt", "feld_storniert", "wert_storniert", "positionen_tabelle", "feld_pflegekategorie", "feld_outdoor"],
  empfehlung: ["empfehlung_gutschein_cent", "empfehlung_ruecktritt_tage", "empfehlung_bedingungen_url", "event_erinnerung_tage", "event_loeschfrist_monate", "attribution_modell", "attribution_fenster_tage", "kampagne_nachlauf_tage"],
};
const CHECKS = new Set(["resend_webhook_aktiv", "ip_hash_speichern"]);

export function EinstellungenFormular({ einst, tab, bereitschaft, p0Offen }) {
  const start = { ...einst, empfehlung_gutschein_cent: centAlsEingabe(einst.empfehlung_gutschein_cent) };
  const [w, setW] = useState(start);
  const [mod, setMod] = useState(einst.modified);
  const [geaendert, setGeaendert] = useState(false);
  const [fehler, setFehler] = useState({});
  const [frage, setFrage] = useState(null);
  const [quelle, setQuelle] = useState(null);
  const { sofort, laeuft } = useAktion();
  const set = (k, v) => { setW({ ...w, [k]: v }); setGeaendert(true); };
  const speichern = async () => {
    const werte = Object.fromEntries(TABS_FELDER[tab].map((k) => [k, w[k]]));
    const r = await sofort(() => einstellungenSpeichernAction({ werte, modified: mod }), { ok: EINSTELLUNGEN.gespeichert });
    if (r?.ok) {
      setMod(r.modified);
      setGeaendert(false);
      setFehler({});
    } else setFehler(r?.fehler || {});
  };
  const wochentage = String(w.werbung_wochentage || "").split(",").filter(Boolean);
  const feld = (k) => {
    if (CHECKS.has(k)) return <div key={k} className="bo-mar-feld"><Schalter label={EINSTELLUNGEN.felder[k]} an={!!Number(w[k])} onWechsel={(v) => set(k, v ? 1 : 0)} /></div>;
    if (k === "werbung_wochentage")
      return (
        <div key={k} className="bo-mar-feld voll">
          <span>{EINSTELLUNGEN.felder[k]}</span>
          <span className="bo-mar-chips">{[1, 2, 3, 4, 5, 6, 7].map((d) => { const an = wochentage.includes(String(d)); return <button key={d} type="button" className="bo-mar-chip" aria-pressed={an} onClick={() => set(k, (an ? wochentage.filter((x) => x !== String(d)) : [...wochentage, String(d)]).sort().join(","))}>{WOCHENTAGE_KURZ[d % 7]}</button>; })}</span>
          {fehler[k] && <span className="bo-mar-feld__fehler">{fehler[k]}</span>}
        </div>
      );
    if (k === "sperrtage")
      return (
        <div key={k} className="bo-mar-feld voll">
          <span>{EINSTELLUNGEN.felder[k]}</span>
          <span className="bo-mar-chips">{String(w[k] || "").split(",").filter(Boolean).map((t) => <span key={t} className="bo-mar-chip">{t.slice(3, 5)}.{t.slice(0, 2)}.<button type="button" aria-label={`Sperrtag ${t} entfernen`} onClick={() => set(k, String(w[k]).split(",").filter((x) => x !== t).join(","))}>×</button></span>)}</span>
          <input className="bo-mar-eingabe bo-mar-eingabe--klein w-40" placeholder="TT.MM. + Enter" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const m = /^(\d{1,2})\.(\d{1,2})\.?$/.exec(e.currentTarget.value.trim()); if (m) { set(k, [...String(w[k] || "").split(",").filter(Boolean), `${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`].join(",")); e.currentTarget.value = ""; } } }} />
        </div>
      );
    if (k === "attribution_modell") return <label key={k} className="bo-mar-feld"><span>{EINSTELLUNGEN.felder[k]}</span><select className="bo-mar-eingabe" value={w[k]} onChange={(e) => set(k, e.target.value)}>{Object.entries(ATTRIBUTION_TEXT).map(([a, t]) => <option key={a} value={a}>{t}</option>)}</select></label>;
    return (
      <label key={k} className="bo-mar-feld">
        <span>{EINSTELLUNGEN.felder[k] || k}{k === "empfehlung_gutschein_cent" ? " (€)" : ""}</span>
        <input className="bo-mar-eingabe" value={w[k] ?? ""} inputMode={/tage|stunden|grenze|stapel|monate|30/.test(k) ? "numeric" : undefined} onChange={(e) => set(k, e.target.value)} aria-invalid={fehler[k] ? "true" : undefined} placeholder={k === "ecg_abgleich_gueltig_bis" ? "JJJJ-MM-TT" : undefined} />
        {fehler[k] && <span className="bo-mar-feld__fehler">{fehler[k]}</span>}
      </label>
    );
  };
  return (
    <div className="bo-mar-stapel" onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (geaendert) speichern(); } }}>
      <section className="bo-kachel" style={{ padding: 24 }} data-testid="zustandsleiste">
        <div className="bo-mar-ampeln">
          {SCHALTER.map((s) => <Ampel key={s.feld} titel={s.text} ok={!!Number(einst[s.feld])} text={Number(einst[s.feld]) ? (s.feld === "automatik_aktiv" ? EINSTELLUNGEN.an : EINSTELLUNGEN.freigegeben) : s.feld === "automatik_aktiv" ? EINSTELLUNGEN.aus : EINSTELLUNGEN.offen} />)}
          <Ampel titel={EINSTELLUNGEN.ampeln.robinson} ok={!!einst.ecg_abgleich_gueltig_bis} text={einst.ecg_abgleich_gueltig_bis || "–"} />
          <Ampel titel={EINSTELLUNGEN.ampeln.versandweg} ok={null} text={einst.versandweg === "Resend" ? "Versand über Mail-Dienst" : "Versand über das System"} />
          <Ampel titel={EINSTELLUNGEN.ampeln.avv} ok={null} text={EINSTELLUNGEN.avvFolgt} />
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] font-semibold">{EINSTELLUNGEN.bereitschaft(bereitschaft.offen)}</summary>
          <ul className="bo-mar-check mt-2" data-testid="bereitschaft-liste">{bereitschaft.punkte.map((p) => <li key={p.id} data-ok={String(p.ok)}><span className="bo-mar-check__ico" aria-hidden="true">{p.ok ? "✓" : "·"}</span><span>{BEREITSCHAFT.punkte[p.id]} – {p.ok ? BEREITSCHAFT.erledigt : BEREITSCHAFT.offen}</span></li>)}</ul>
        </details>
        <div className="mt-5 flex flex-col gap-3">
          {SCHALTER.map((s) => {
            const gesperrt = s.feld === "automatik_aktiv" && !Number(einst[s.feld]) && p0Offen > 0;
            return (
              <div key={s.feld}>
                <Schalter label={s.text} an={!!Number(einst[s.feld])} deaktiviert={gesperrt} beschreibung={gesperrt ? EINSTELLUNGEN.automatikGesperrt(p0Offen) : Number(einst[s.feld]) ? s.folge.an : s.folge.aus} onWechsel={(v) => setFrage({ ...s, wert: v })} />
              </div>
            );
          })}
        </div>
      </section>
      <section className="bo-kachel" style={{ padding: 24 }} data-testid={`einstellungen-${tab}`}>
        <div className="bo-mar-felder">{TABS_FELDER[tab].map(feld)}</div>
        {tab === "auftrag" && (
          <div className="mt-5">
            <Knopf size="s" onClick={async () => { const r = await auftragsquelleAction(); setQuelle(r); }}>{EINSTELLUNGEN.pruefen}</Knopf>
            {quelle?.ok !== undefined && (
              <ul className="bo-mar-check mt-3">{(quelle.felder || []).map((f) => <li key={f.einstellung} data-ok={String(f.vorhanden)}><span className="bo-mar-check__ico" aria-hidden="true">{f.vorhanden ? "✓" : "!"}</span><span>{f.vorhanden ? EINSTELLUNGEN.feldVorhanden(f.feld) : EINSTELLUNGEN.feldFehlt(f.feld)}</span></li>)}</ul>
            )}
          </div>
        )}
        {tab === "versand" && <p className="bo-mar-klein mt-4">{EINSTELLUNGEN.geheimnis} RESEND_API_KEY, RESEND_WEBHOOK_SECRET · {EINSTELLUNGEN.versandwegHinweis}</p>}
      </section>
      <div className={`bo-mar-auswahl bo-material-stark ${geaendert ? "" : "opacity-70"}`} data-testid="speicherleiste">
        <span className="bo-mar-auswahl__zahl">{geaendert ? "Ungespeichert" : "Keine Änderungen"}</span>
        <Knopf size="s" disabled={!geaendert} onClick={() => { setW(start); setGeaendert(false); }}>Verwerfen</Knopf>
        <Knopf size="s" variant="primary" disabled={!geaendert || laeuft} laedt={laeuft} onClick={speichern} kuerzel="mod+s">Speichern</Knopf>
      </div>
      <Bestaetigen offen={!!frage} titel={frage ? EINSTELLUNGEN.schalterTitel(frage.text, frage.wert) : ""} text={frage ? (frage.wert ? frage.folge.an : frage.folge.aus) : ""} bestaetigen={frage?.wert ? "Einschalten" : "Ausschalten"} laeuft={laeuft} onAbbrechen={() => setFrage(null)} onBestaetigen={async () => { await sofort(() => schalterSetzenAction({ feld: frage.feld, wert: frage.wert }), { ok: EINSTELLUNGEN.eingetragen(frage.text) }); setFrage(null); }} />
    </div>
  );
}
