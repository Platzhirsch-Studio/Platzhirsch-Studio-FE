"use client";
// Beitrags-Akte (10-konzept-marketing § 2.9): Kopf mit Primäraktion je Status (Ausarbeiten · Zur Freigabe · Freigeben … ·
// Datum setzen … · Als veröffentlicht markieren … · Kennzahlen erfassen …), Text kopieren (Shift+C), `⋯`. Reiter Beitrag
// (Autosave), Bild & Bildrechte (Bildquelle als drei Karten, dreiteilige Prüfung), Veröffentlichung. D2 mit Bild, Text und
// den drei Prüfungen; ohne Sicht auf das Bild keine Freigabe. Zeichen-Zähler je Kanal (einmal aria-live beim Überschreiten).
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import { Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import { useAutosave } from "../Formular/useAutosave";
import { SpeicherAnzeige } from "../Formular/Speicherleiste";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import useAktion from "./useAktion";
import { Bild, Pruefzeile } from "./Bausteine";
import { ZurueckgebenDialog } from "./AusgabeAktionen";
import {
  bildFreigabePruefenAction, socialBildAction, socialDatumAction, socialFreigebenAction, socialKennzahlenAction, socialSpeichernAction, socialVeroeffentlichtAction, socialWorkflowAction, socialZurFreigabeAction,
} from "@/lib/backoffice/marketing/actions";
import { formatErlaubt, kurzDatum, socialKopiertext, socialPrimaer, socialPruefungen, stripHtml, TEXT_MAX } from "@/lib/backoffice/marketing/regeln";
import { BILDQUELLE_FOLGE, BILDQUELLE_TEXT, FREIGABE, KENNZEICHNUNG_TEXT, SOCIAL, SOCIAL_BOARDS, SOCIAL_FORMATE, SOCIAL_KANAELE } from "@/lib/backoffice/marketing/texte";

const textAus = (t) => String(t ?? "").replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();

export function SocialKopf({ doc, wartet, leitung, team, dialog }) {
  const router = useRouter();
  const [offen, setOffen] = useState(["freigeben", "veroeffentlicht", "datum", "kennzahlen"].includes(dialog) ? dialog : null);
  const { sofort, verzoegert, zeige, laeuft } = useAktion();
  const [pr, setPr] = useState({ kundenprojekt: false, einwilligungOk: false, kennzeichnung: doc.marke_name ? "kooperation" : "nein" });
  const p = socialPruefungen(doc, pr);
  const prim = socialPrimaer(doc.status, { leitung, wartet });
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(socialKopiertext(doc));
      zeige(SOCIAL.kopiert, { art: "ok" });
    } catch {
      zeige("Kopieren nicht möglich.", { art: "warnung" });
    }
  };
  useKuerzel("akte@marketing", { "marketing.text-kopieren": kopieren });
  const zurFreigabe = () => verzoegert(() => socialZurFreigabeAction({ name: doc.name, ...pr }), { text: SOCIAL.zurFreigabeToast(doc.titel), fehlerText: `Zur Freigabe ${doc.titel}` });
  const knopf = {
    ausarbeiten: { titel: SOCIAL.ausarbeiten, onClick: () => sofort(() => socialWorkflowAction({ namen: [doc.name], aktion: "Ausarbeiten" }), { ok: SOCIAL.ausarbeitenToast(doc.titel) }) },
    zurFreigabe: { titel: SOCIAL.zurFreigabe, onClick: zurFreigabe, grund: !p.ok ? p.gruende.map((g) => SOCIAL.gesperrtGrund[g]).join(" · ") : null },
    freigeben: { titel: SOCIAL.freigeben, onClick: () => setOffen("freigeben") },
    datumSetzen: { titel: SOCIAL.datumSetzen, onClick: () => setOffen("datum") },
    alsVeroeffentlicht: { titel: SOCIAL.alsVeroeffentlicht, onClick: () => setOffen("veroeffentlicht") },
    kennzahlen: { titel: SOCIAL.kennzahlen, onClick: () => setOffen("kennzahlen") },
    wiederherstellen: { titel: SOCIAL.wiederherstellen, onClick: () => sofort(() => socialWorkflowAction({ namen: [doc.name], aktion: "Zurück auf Entwurf" }), { ok: "Wiederhergestellt" }) },
  }[prim];
  return (
    <div className="bo-mar-aktionen">
      <Knopf icon="FileText" onClick={kopieren} kuerzel="shift+c">{SOCIAL.textKopieren}</Knopf>
      {(team || leitung) && (
        <Menue label="Weitere Aktionen" ausloeser={(x) => <Knopf {...x} icon="Ellipsis" label="Weitere Aktionen" />}>
          {doc.bild && <MenuePunkt icon="Download" href={doc.bild}>{SOCIAL.bildLaden}</MenuePunkt>}
          {!["Veroeffentlicht", "Verworfen"].includes(doc.status) && <MenuePunkt icon="Calendar" onWaehlen={() => setOffen("datum")}>{SOCIAL.datumSetzen}</MenuePunkt>}
          {leitung && (wartet || ["Freigegeben", "Geplant"].includes(doc.status)) && <MenuePunkt icon="Undo2" onWaehlen={() => setOffen("zurueck")}>{SOCIAL.zurueckgeben}</MenuePunkt>}
          {["Idee", "Entwurf"].includes(doc.status) && (
            <>
              <MenueTrenner />
              <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={() => verzoegert(() => socialWorkflowAction({ namen: [doc.name], aktion: "Verwerfen" }), { text: SOCIAL.verworfenToast(doc.titel) })}>{SOCIAL.verwerfen}</MenuePunkt>
            </>
          )}
        </Menue>
      )}
      {wartet && !leitung && <span className="bo-mar-klein bo-mar-warn">{SOCIAL.wartetChip}</span>}
      {knopf && (team || leitung) && (
        <span className="inline-flex flex-col items-end">
          <Knopf variant="primary" onClick={knopf.onClick} disabled={!!knopf.grund || laeuft} laedt={laeuft} data-testid={`primaer-${prim}`} kuerzel="mod+enter">{knopf.titel}</Knopf>
          {knopf.grund && <span className="bo-mar-klein bo-mar-warn mt-1">{knopf.grund}</span>}
        </span>
      )}
      {prim === "zurFreigabe" && <PruefFragen pr={pr} setPr={setPr} versteckt />}
      {offen === "freigeben" && <FreigabeSocial doc={doc} pr={pr} setPr={setPr} onSchliessen={() => setOffen(null)} onZurueck={() => setOffen("zurueck")} />}
      <ZurueckgebenDialog offen={offen === "zurueck"} onSchliessen={() => setOffen(null)} doctype="PH Social Beitrag" name={doc.name} titel={`„${doc.titel}“`} />
      {offen === "datum" && <DatumDialog doc={doc} onSchliessen={() => setOffen(null)} />}
      {offen === "veroeffentlicht" && <VeroeffentlichtDialog doc={doc} onSchliessen={() => { setOffen(null); router.refresh(); }} />}
      {offen === "kennzahlen" && <KennzahlenDialog doc={doc} onSchliessen={() => setOffen(null)} />}
    </div>
  );
}

function PruefFragen({ pr, setPr, versteckt = false }) {
  if (versteckt) return null;
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="bo-mar-feld">
        <legend className="mb-1 text-[13px] font-medium text-(--color-bo-text-soft)">{FREIGABE.kundenprojektFrage}</legend>
        <span className="flex flex-wrap gap-2">
          <button type="button" className="bo-mar-chip" aria-pressed={!pr.kundenprojekt} onClick={() => setPr({ ...pr, kundenprojekt: false })}>Nein</button>
          <button type="button" className="bo-mar-chip" aria-pressed={pr.kundenprojekt} onClick={() => setPr({ ...pr, kundenprojekt: true })}>Ja</button>
        </span>
        {pr.kundenprojekt && (
          <label className="bo-mar-haken mt-2">
            <input type="checkbox" checked={pr.einwilligungOk} onChange={(e) => setPr({ ...pr, einwilligungOk: e.target.checked })} />
            <span>{FREIGABE.kundenprojektHaken}</span>
          </label>
        )}
      </fieldset>
      <fieldset className="bo-mar-feld">
        <legend className="mb-1 text-[13px] font-medium text-(--color-bo-text-soft)">{FREIGABE.kennzeichnungFrage}</legend>
        <span className="flex flex-wrap gap-2">
          {Object.entries(KENNZEICHNUNG_TEXT).map(([k, t]) => (
            <button key={k} type="button" className="bo-mar-chip" aria-pressed={pr.kennzeichnung === k} onClick={() => setPr({ ...pr, kennzeichnung: k })}>{t}</button>
          ))}
        </span>
      </fieldset>
    </div>
  );
}

/** D2 – Social freigeben: Bild im Kanal-Format, Text, drei Prüfungen, Plandatum; ohne Bild keine Freigabe. */
function FreigabeSocial({ doc, pr, setPr, onSchliessen, onZurueck }) {
  const { sofort, laeuft } = useAktion();
  const p = socialPruefungen(doc, pr);
  const gruende = p.gruende.map((g) => (g === "kennzeichnung" ? FREIGABE.kennzeichnungFehlt : SOCIAL.gesperrtGrund[g]));
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={FREIGABE.titelSocial(doc.titel)}
      groesse="md"
      testid="social-freigabe"
      fuss={
        <>
          <Knopf onClick={onZurueck}>{FREIGABE.zurueckgeben}</Knopf>
          <span className="inline-flex flex-col items-end">
            <Knopf variant="primary" disabled={!p.ok || laeuft} laedt={laeuft} data-testid="social-freigeben" onClick={async () => { const r = await sofort(() => socialFreigebenAction({ name: doc.name, ...pr }), { ok: SOCIAL.freigegebenToast(doc.titel) }); if (r?.ok) onSchliessen(); }}>
              {FREIGABE.freigebenKnopf}
            </Knopf>
            {!p.ok && <span className="bo-mar-klein bo-mar-warn mt-1">{gruende[0]}</span>}
          </span>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div>
          {doc.bild ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.bild} alt={doc.alt_text || ""} className="w-full rounded-[16px] object-cover" style={{ aspectRatio: doc.kanal === "Pinterest" ? "2 / 3" : doc.format === "Story" || doc.format === "Reel" ? "9 / 16" : "4 / 5" }} />
          ) : (
            <p className="bo-mar-warn rounded-[16px] bg-(--color-bo-surface-2) p-4 text-[14px]">{FREIGABE.bildFehlt}</p>
          )}
          <p className="bo-mar-klein mt-2">{doc.kanal} · {doc.format} · {kurzDatum(doc.datum_geplant)}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="whitespace-pre-line text-[14px] leading-6">{textAus(doc.text) || "–"}</p>
          {doc.hashtags && <p className="bo-mar-unter">{doc.hashtags}</p>}
          <ul className="bo-mar-check">
            <Pruefzeile ok={p.pruefungen[0].ok} text={`${FREIGABE.pruefungen.quelle}: ${BILDQUELLE_TEXT[doc.bildquelle_freigabe] || "offen"}`} />
            <Pruefzeile ok={p.pruefungen[1].ok} text={`${FREIGABE.pruefungen.kundenprojekt}: ${pr.kundenprojekt ? (pr.einwilligungOk ? "Einwilligung liegt vor" : "Einwilligung fehlt") : "nein"}`} />
            <Pruefzeile ok={p.pruefungen[2].ok} text={`${FREIGABE.pruefungen.kennzeichnung}: ${KENNZEICHNUNG_TEXT[pr.kennzeichnung]}`} unter={!p.pruefungen[2].ok ? FREIGABE.kennzeichnungFehlt : undefined} />
            <Pruefzeile ok={p.altOk} text={p.altOk ? "Bildbeschreibung vorhanden" : FREIGABE.altFehlt} />
          </ul>
          <PruefFragen pr={pr} setPr={setPr} />
        </div>
      </div>
    </Dialog>
  );
}

function DatumDialog({ doc, onSchliessen }) {
  const [datum, setDatum] = useState(doc.datum_geplant || "");
  const { verzoegert, laeuft } = useAktion();
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={SOCIAL.datumSetzen} groesse="sm" fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} onClick={async () => { const r = await verzoegert(() => socialDatumAction({ ziele: [{ name: doc.name, datum }] }), { text: SOCIAL.datumGesetzt(doc.titel, kurzDatum(datum)) }); if (r?.ok) onSchliessen(); }}>Setzen</Knopf></>}>
      <div className="bo-mar-feld"><span>{SOCIAL.felder.datum_geplant}</span><Datumsfeld value={datum} onChange={setDatum} aria-label="Datum" /></div>
      {doc.status === "Freigegeben" && <p className="bo-mar-klein mt-2">Nach dem Setzen wird der Beitrag automatisch geplant.</p>}
    </Dialog>
  );
}

function VeroeffentlichtDialog({ doc, onSchliessen }) {
  const [url, setUrl] = useState("");
  const [fehler, setFehler] = useState(null);
  const { sofort, laeuft } = useAktion();
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={SOCIAL.alsVeroeffentlicht.replace(" …", "")} groesse="sm" testid="veroeffentlicht-dialog" fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} onClick={async () => { const r = await sofort(() => socialVeroeffentlichtAction({ name: doc.name, url }), { ok: SOCIAL.veroeffentlichtToast(doc.titel) }); if (r?.ok) onSchliessen(); else setFehler(r?.fehler?.url || r?.message); }}>Markieren</Knopf></>}>
      <label className="bo-mar-feld">
        <span>{SOCIAL.url}</span>
        <input className="bo-mar-eingabe" type="url" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={fehler ? "true" : undefined} placeholder="https://" />
        {fehler && <span className="bo-mar-feld__fehler">{fehler}</span>}
      </label>
    </Dialog>
  );
}

function KennzahlenDialog({ doc, onSchliessen }) {
  const [w, setW] = useState({ reichweite: doc.reichweite || "", likes: doc.likes || "", saves: doc.saves || "", klicks: doc.klicks || "", kommentare: doc.kommentare || "" });
  const { sofort, laeuft } = useAktion();
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={SOCIAL.kennzahlen.replace(" …", "")} groesse="sm" fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" laedt={laeuft} onClick={async () => { const r = await sofort(() => socialKennzahlenAction({ name: doc.name, werte: w }), { ok: SOCIAL.kennzahlenGespeichert }); if (r?.ok) onSchliessen(); }}>Speichern</Knopf></>}>
      <div className="bo-mar-felder">
        {Object.keys(w).map((k) => (
          <label key={k} className="bo-mar-feld"><span>{SOCIAL.felder[k]}</span><input className="bo-mar-eingabe" inputMode="numeric" value={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.value })} /></label>
        ))}
      </div>
    </Dialog>
  );
}

/** Reiter Beitrag und Bild & Bildrechte – Autosave (1,5 s) mit Konflikt über `modified`. */
export function SocialFormular({ doc, tab, kampagnen = [], nurLesen }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { zeige } = useAktion();
  const [w, setW] = useState({ titel: doc.titel || "", overline: doc.overline || "", text: textAus(doc.text), hashtags: doc.hashtags || "", link: doc.link || "", sprache: doc.sprache || "de", alt_text: doc.alt_text || "", kanal: doc.kanal, format: doc.format, board: doc.board || "", kampagne: doc.kampagne || "", produkt_slug: doc.produkt_slug || "", bildquelle_freigabe: doc.bildquelle_freigabe || "offen", marke_name: doc.marke_name || "", bild_credit: doc.bild_credit || "", bild_bearbeitung: doc.bild_bearbeitung || "", bild_layout: doc.bild_layout || "", uhrzeit_geplant: String(doc.uhrzeit_geplant || "").slice(0, 5) });
  const [mod, setMod] = useState(doc.modified);
  const [bildFehler, setBildFehler] = useState(null);
  const [freigabe, setFreigabe] = useState(doc.bildfreigabe_status || "");
  const max = TEXT_MAX[w.kanal] || 2200;
  const laenge = w.text.length;
  const ueber = laenge > max;
  void sp;
  const autosave = useAutosave({
    speichern: async (felder) => {
      const r = await socialSpeichernAction({ name: doc.name, modified: mod, felder: { ...felder, text: felder.text ? `<p>${felder.text.split(/\n{2,}/).join("</p><p>")}</p>` : "" } });
      if (r?.ok) {
        setMod(r.modified);
        if (r.zurueck) zeige("Zurück auf Entwurf – erneute Freigabe nötig", { art: "info" });
        router.refresh();
      }
      return r;
    },
    verzoegerung: 1500,
    aktiv: !nurLesen,
    startZeit: String(doc.modified || "").slice(11, 16),
  });
  const set = (k, v) => {
    const neu = { ...w, [k]: v };
    if (k === "kanal" && !formatErlaubt(v, neu.format)) neu.format = SOCIAL_FORMATE[v][0];
    if (k === "bildquelle_freigabe" && v === "eigen") neu.bild_credit = "Platzhirsch Home Living";
    setW(neu);
    autosave.aendern(neu);
  };
  const feld = (k, extra = {}) => (
    <label className={`bo-mar-feld ${extra.voll ? "voll" : ""}`}>
      <span>{SOCIAL.felder[k]}</span>
      {extra.textarea ? <textarea className="bo-mar-eingabe" rows={6} value={w[k]} disabled={nurLesen} onChange={(e) => set(k, e.target.value)} onBlur={() => autosave.jetzt()} /> : <input className="bo-mar-eingabe" type={extra.typ || "text"} value={w[k]} disabled={nurLesen} onChange={(e) => set(k, e.target.value)} onBlur={() => autosave.jetzt()} aria-invalid={extra.pflicht && !w[k] ? "true" : undefined} />}
      {extra.hinweis}
    </label>
  );
  const bildHoch = async (datei) => {
    if (!datei) return;
    const fd = new FormData();
    fd.set("name", doc.name);
    fd.set("datei", datei);
    const r = await socialBildAction(fd);
    if (!r?.ok) setBildFehler(r?.fehler?.datei || r?.message);
    else {
      setBildFehler(null);
      router.refresh();
    }
  };
  const verhaeltnis = w.kanal === "Pinterest" ? "2 / 3" : ["Story", "Reel"].includes(w.format) ? "9 / 16" : "4 / 5";

  return (
    <div className="bo-mar-akte">
      <div className="bo-mar-stapel">
        {tab === "beitrag" && (
          <section className="bo-kachel" style={{ padding: 24 }} data-testid="social-formular">
            <div className="mb-4 flex justify-end"><SpeicherAnzeige autosave={autosave} /></div>
            <div className="bo-mar-felder">
              {feld("titel", { voll: true })}
              {feld("overline")}
              <label className="bo-mar-feld">
                <span>{SOCIAL.felder.kanal}</span>
                <select className="bo-mar-eingabe" value={w.kanal} disabled={nurLesen} onChange={(e) => set("kanal", e.target.value)}>{SOCIAL_KANAELE.map((k) => <option key={k}>{k}</option>)}</select>
              </label>
              <label className="bo-mar-feld">
                <span>{SOCIAL.felder.format}</span>
                <select className="bo-mar-eingabe" value={w.format} disabled={nurLesen} onChange={(e) => set("format", e.target.value)} data-testid="social-format">
                  {["Pin", "Board", "Post", "Reel", "Story", "Karussell", "Video"].map((f) => <option key={f} value={f} disabled={!formatErlaubt(w.kanal, f)}>{f}</option>)}
                </select>
              </label>
              {w.kanal === "Pinterest" && (
                <label className="bo-mar-feld">
                  <span>{SOCIAL.felder.board}</span>
                  <input className="bo-mar-eingabe" list="boards" value={w.board} disabled={nurLesen} onChange={(e) => set("board", e.target.value)} />
                  <datalist id="boards">{SOCIAL_BOARDS.map((b) => <option key={b} value={b} />)}</datalist>
                </label>
              )}
              <label className="bo-mar-feld voll">
                <span>{SOCIAL.felder.text}</span>
                <textarea className="bo-mar-eingabe" rows={7} value={w.text} disabled={nurLesen} onChange={(e) => set("text", e.target.value)} onBlur={() => autosave.jetzt()} aria-invalid={laenge > max ? "true" : undefined} data-testid="social-text" />
                <span className={laenge > max ? "bo-mar-feld__fehler" : "bo-mar-feld__hinweis"}>{SOCIAL.zaehler(laenge, max)}</span>
                {ueber && <span className="sr-only" aria-live="polite">{SOCIAL.zuLang}</span>}
              </label>
              {feld("hashtags", { voll: true })}
              {feld("link", { typ: "url" })}
              <label className="bo-mar-feld"><span>{SOCIAL.felder.sprache}</span><select className="bo-mar-eingabe" value={w.sprache} disabled={nurLesen} onChange={(e) => set("sprache", e.target.value)}><option value="de">Deutsch</option><option value="en">Englisch</option></select></label>
              <label className="bo-mar-feld"><span>{SOCIAL.felder.kampagne}</span><select className="bo-mar-eingabe" value={w.kampagne} disabled={nurLesen} onChange={(e) => set("kampagne", e.target.value)}><option value="">Keine</option>{kampagnen.map((k) => <option key={k.name} value={k.name}>{k.titel}</option>)}</select></label>
              {feld("produkt_slug")}
              {feld("uhrzeit_geplant", { typ: "time" })}
            </div>
          </section>
        )}
        {tab === "bild" && (
          <>
            <section className="bo-kachel" style={{ padding: 24 }} data-testid="social-bild">
              <div className="mb-4 flex justify-end"><SpeicherAnzeige autosave={autosave} /></div>
              <div className="flex flex-wrap items-start gap-5">
                <div className="w-[200px] shrink-0 overflow-hidden rounded-[18px] bg-(--color-bo-surface-2)" style={{ aspectRatio: verhaeltnis }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {doc.bild ? <img src={doc.bild} alt={w.alt_text} className="size-full object-cover" /> : <span className="grid size-full place-items-center bo-mar-klein">Kein Bild</span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  {!nurLesen && (
                    <label className="bo-knopf bo-knopf--secondary inline-flex w-fit cursor-pointer items-center gap-2">
                      <span>{doc.bild ? "Bild ersetzen" : "Bild wählen"}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => bildHoch(e.target.files?.[0])} />
                    </label>
                  )}
                  {bildFehler && <span className="bo-mar-feld__fehler" role="alert">{bildFehler}</span>}
                  <p className="bo-mar-klein">Format {verhaeltnis.replace(/ /g, "")} für {w.kanal} · {w.format}</p>
                  {feld("alt_text", { voll: true, pflicht: true, hinweis: !w.alt_text ? <span className="bo-mar-feld__fehler">{SOCIAL.gesperrtGrund.alt}</span> : null })}
                </div>
              </div>
            </section>
            <section className="bo-kachel" style={{ padding: 24 }}>
              <h2 className="bo-titel-kachel mb-4">Bildquelle</h2>
              <div className="bo-mar-wahl" role="radiogroup" aria-label="Bildquelle">
                {["offen", "eigen", "Hersteller freigegeben"].map((q) => (
                  <label key={q}>
                    <input type="radio" name="bildquelle" checked={w.bildquelle_freigabe === q} disabled={nurLesen} onChange={() => set("bildquelle_freigabe", q)} />
                    <b>{BILDQUELLE_TEXT[q]}</b>
                    <span>{BILDQUELLE_FOLGE[q]}</span>
                  </label>
                ))}
              </div>
              {w.bildquelle_freigabe === "Hersteller freigegeben" && (
                <div className="bo-mar-felder mt-5">
                  {feld("marke_name", { pflicht: true })}
                  {feld("bild_credit", { pflicht: true })}
                  {feld("bild_bearbeitung")}
                  <div className="bo-mar-feld">
                    <span>Bild-Freigabe</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Knopf size="s" disabled={nurLesen} onClick={async () => { const r = await bildFreigabePruefenAction({ name: doc.name }); setFreigabe(r?.status || ""); }}>{SOCIAL.freigabePruefen}</Knopf>
                      {freigabe && <span className={freigabe.includes("erteilt") ? "bo-mar-ok text-[13px] font-medium" : "bo-mar-warn text-[13px] font-medium"}>{freigabe}</span>}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <aside className="bo-mar-akte__rechts">
        <section className="bo-kachel" style={{ padding: 20 }} aria-label="Kanal-Vorschau">
          <p className="bo-mar-klein mb-2">So wirkt es in {w.kanal}</p>
          <div className="overflow-hidden rounded-[18px] bg-(--color-bo-surface-2)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {doc.bild ? <img src={doc.bild} alt="" className="w-full object-cover" style={{ aspectRatio: verhaeltnis }} /> : <div style={{ aspectRatio: verhaeltnis }} className="grid place-items-center bo-mar-klein">Kein Bild</div>}
            <div className="p-3">
              {w.overline && <p className="bo-mar-klein">{w.overline}</p>}
              <p className="text-[14px] font-semibold">{w.titel}</p>
              <p className="bo-mar-unter line-clamp-4 whitespace-pre-line">{stripHtml(w.text)}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

export function VeroeffentlichungKachel({ doc }) {
  const zahlen = useMemo(() => ["reichweite", "likes", "saves", "klicks", "kommentare"].map((k) => ({ k, v: doc[k] })), [doc]);
  return (
    <section className="bo-kachel" style={{ padding: 24 }}>
      <h2 className="bo-titel-kachel">Veröffentlichung</h2>
      <dl className="bo-mar-fakten mt-4">
        <div><dt>Geplant</dt><dd>{kurzDatum(doc.datum_geplant, { jahr: true })}{doc.uhrzeit_geplant ? ` · ${String(doc.uhrzeit_geplant).slice(0, 5)}` : ""}</dd></div>
        <div><dt>Veröffentlicht</dt><dd>{doc.veroeffentlicht_am ? kurzDatum(doc.veroeffentlicht_am, { zeit: true }) : "–"}</dd></div>
        <div className="col-span-2"><dt>Adresse</dt><dd>{doc.veroeffentlicht_url ? <a className="bo-mar-link" href={doc.veroeffentlicht_url} target="_blank" rel="noreferrer">{doc.veroeffentlicht_url}</a> : "–"}</dd></div>
        {zahlen.map(({ k, v }) => <div key={k}><dt>{SOCIAL.felder[k]}</dt><dd className="tabular-nums">{v ?? "–"}</dd></div>)}
      </dl>
      <p className="bo-mar-klein mt-4">{SOCIAL.hinweisKein}</p>
    </section>
  );
}

export { Bild };
