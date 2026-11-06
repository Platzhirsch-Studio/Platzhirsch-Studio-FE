"use client";
// G-17 `DruckPanel` (Team P0-5c) im Lounge-Stil: Sheet 800 px mit Leuchttisch und Papier-Vorschau, Formatwahl,
// Sammeldruck mehrerer Formate, Ausgabe (Gerät/Drucker), PDF, Per E-Mail, Link kopieren, Warteschlange und
// Fehlerband „Drucker nicht erreichbar“ mit Ersatz „Als PDF öffnen“. Nie Browserdruck der Seite selbst:
// gedruckt wird die Druckansicht /druck/[doctype]/[name] (Mock: HTML aus Beispieldaten) bzw. das Frappe-PDF.
//
//   const [offen, setOffen] = useDruckTaste();                      // Strg/⌘+P öffnet (Kontext „akte“)
//   <Knopf icon="Printer" onClick={() => setOffen(true)}>Drucken</Knopf>
//   <DruckPanel offen={offen} onSchliessen={() => setOffen(false)} doctype="PH Rechnung" name="RE-2026-00042"
//     titel="Rechnung RE-2026-00042" pdf={modus === "frappe"} perEmail={() => setInformieren(true)} />
//
// Oder kurz: <DruckKnopf doctype="PH Rechnung" name="RE-2026-00042" titel="…" pdf={…} />

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Knopf, { RundKnopf } from "../Knopf";
import Segment from "../Segment";
import { Icon } from "../icons";
import { Pille } from "../StatusBadge";
import { Sheet } from "../Overlay";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { druckHref, formateFuer, formatSchluessel, pdfHref, PAPIER, vorschauMassstab, waehleFormat, ZOOM } from "@/lib/backoffice/druck";
import { useDruckWarteschlange } from "./warteschlange";
import { DRUCK_TEXTE as T } from "./texte";
import "./druck.css";

const AUFTRAG_MATERIAL = { wartet: "stein", druckt: "see", gedruckt: "salbei", fehler: "eiche", pdf: "travertin" };
const EINBETTUNG_CSS = ".bo-no-print{display:none!important}html,body{background:white!important}main{margin:0 auto!important}";

function lies(schluessel) {
  try {
    return window.localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}
function merke(schluessel, wert) {
  try {
    window.localStorage.setItem(schluessel, wert);
  } catch {
    // ohne Speicher gilt die Wahl nur bis zum Schließen
  }
}

/**
 * Druckdokument laden. Die App sendet `X-Frame-Options: DENY`, deshalb wird nichts direkt eingerahmt: die HTML-
 * Druckansicht kommt per fetch als `srcdoc` (ohne Skripte, mit <base>), das Frappe-PDF als blob-URL.
 * @returns {Promise<{art:"html", html:string} | {art:"pdf", url:string} | {art:"fehler", code:string}>}
 */
export async function ladeDruckDokument({ doctype, name, format, pdf = false, signal }) {
  try {
    const r = await fetch(pdf ? pdfHref(doctype, name, format) : druckHref(doctype, name, format), { credentials: "same-origin", signal, cache: "no-store" });
    const typ = r.headers.get("content-type") || "";
    if (!r.ok) return { art: "fehler", code: r.status === 403 ? "forbidden" : r.status === 404 ? "not_found" : "unavailable" };
    if (pdf) {
      if (!typ.includes("pdf")) return { art: "fehler", code: "unavailable" };
      return { art: "pdf", url: URL.createObjectURL(await r.blob()) };
    }
    return { art: "html", html: einbettungsHtml(await r.text()) };
  } catch (e) {
    return { art: "fehler", code: e?.name === "AbortError" ? "abbruch" : "unavailable" };
  }
}

/**
 * Gestreamte Seite ohne Skripte fertigstellen: React legt Inhalte hinter Suspense-Grenzen als
 * <div hidden id="S:n"> ans Ende und tauscht sie per Skript gegen den Platzhalter (Segment <template id="P:n"> bzw.
 * Grenze <template id="B:n"> … <!--/$-->).
 * Das übernehmen wir hier im DOM, dann werden Skripte entfernt, <base> und die Einbettungs-Stile gesetzt.
 */
function einbettungsHtml(roh) {
  const doc = new DOMParser().parseFromString(roh, "text/html");
  for (let runde = 0; runde < 20; runde++) {
    const teile = [...doc.querySelectorAll("div[hidden][id^='S:']")];
    if (!teile.length) break;
    for (const teil of teile) {
      const n = teil.id.slice(2);
      const segment = doc.getElementById(`P:${n}`);
      const grenze = doc.getElementById(`B:${n}`);
      if (segment) segment.replaceWith(...teil.childNodes);
      else if (grenze) {
        let x = grenze.nextSibling;
        while (x && !(x.nodeType === 8 && x.data === "/$")) {
          const weiter = x.nextSibling;
          x.remove();
          x = weiter;
        }
        grenze.replaceWith(...teil.childNodes);
      }
      teil.remove();
    }
  }
  doc.querySelectorAll("script, link[rel='preload'], link[rel='modulepreload'], link[rel='prefetch'], next-route-announcer, nextjs-portal").forEach((e) => e.remove());
  const base = doc.createElement("base");
  base.href = `${window.location.origin}/`;
  const stil = doc.createElement("style");
  stil.id = "bo-druck-einbettung";
  stil.textContent = EINBETTUNG_CSS;
  doc.head.prepend(base);
  doc.head.append(stil);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

/** Rahmen fürs Drucken: sandbox ohne Skripte, aber gleiche Herkunft (Höhe messen) und Druckfenster erlaubt. */
const SANDBOX = "allow-same-origin allow-modals";

/**
 * Ein Format drucken (unsichtbarer Rahmen → Druckfenster des Systems). Liefert true, wenn das Druckfenster kam.
 * @param {{doctype:string, name:string, format:string, pdf?:boolean}} p
 */
export async function druckeFormat({ doctype, name, format, pdf = false }) {
  if (typeof document === "undefined") return false;
  const d = await ladeDruckDokument({ doctype, name, format, pdf });
  if (d.art === "fehler") return false;
  return new Promise((ok) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    if (d.art === "html") f.setAttribute("sandbox", SANDBOX);
    f.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none";
    let fertig = false;
    const ende = (r) => {
      if (fertig) return;
      fertig = true;
      clearTimeout(uhr);
      setTimeout(() => {
        f.remove();
        if (d.art === "pdf") URL.revokeObjectURL(d.url);
      }, 60000);
      ok(r);
    };
    const uhr = setTimeout(() => ende(false), 20000);
    f.onload = () => {
      // Stylesheets brauchen nach dem Laden des Rahmens einen Moment.
      setTimeout(() => {
        try {
          f.contentWindow.focus();
          f.contentWindow.print();
          ende(true);
        } catch {
          ende(false);
        }
      }, 250);
    };
    if (d.art === "html") f.srcdoc = d.html;
    else f.src = d.url;
    document.body.appendChild(f);
  });
}

/**
 * Strg/⌘+P öffnet das Druckpanel statt des Browserdrucks (Q-F4, Kürzel `akte.drucken` bzw. `kiosk.drucken`).
 * @param {{kontext?:"akte"|"kiosk", aktiv?:boolean}} [o]
 * @returns {[boolean, (offen:boolean)=>void]}
 */
export function useDruckTaste({ kontext = "akte", aktiv = true } = {}) {
  const [offen, setOffen] = useState(false);
  useKuerzel(kontext, { [`${kontext}.drucken`]: () => setOffen(true) }, { aktiv });
  return [offen, setOffen];
}

function Vorschau({ doctype, name, format, pdf, papier, zoom, titel, onPdfFehler }) {
  const tisch = useRef(null);
  const rahmen = useRef(null);
  const [flaeche, setFlaeche] = useState({ breite: 700, hoehe: 800 });
  const [hoehe, setHoehe] = useState(PAPIER[papier]?.hoehe || 1123);
  const [versuch, setVersuch] = useState(0);
  const schluessel = `${pdf ? "pdf" : "html"}|${doctype}|${name}|${format}|${versuch}`;
  const [dok, setDok] = useState({ schluessel: null, art: "laedt" });
  const [bereit, setBereit] = useState(null);
  const aktuell = dok.schluessel === schluessel ? dok : { art: "laedt" };
  const zustand = aktuell.art === "fehler" ? "fehler" : aktuell.art === "laedt" || bereit !== schluessel ? "laedt" : "bereit";

  useEffect(() => {
    const el = tisch.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => setFlaeche({ breite: e.contentRect.width, hoehe: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ab = new AbortController();
    let url = null;
    ladeDruckDokument({ doctype, name, format, pdf, signal: ab.signal }).then((d) => {
      if (ab.signal.aborted) {
        if (d.art === "pdf") URL.revokeObjectURL(d.url);
        return;
      }
      if (d.art === "pdf") url = d.url;
      setDok({ schluessel, ...d });
      if (d.art === "fehler" && pdf) onPdfFehler?.();
    });
    return () => {
      ab.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [schluessel]); // eslint-disable-line react-hooks/exhaustive-deps

  const seite = PAPIER[papier] || PAPIER.a4;
  const massstab = vorschauMassstab(zoom, flaeche, papier);
  const onLoad = () => {
    if (aktuell.art === "html") {
      try {
        const doc = rahmen.current?.contentDocument;
        if (doc) setHoehe(Math.max(seite.hoehe, doc.documentElement.scrollHeight || 0));
      } catch {
        // ohne Zugriff bleibt die Seitenhöhe
      }
    }
    setBereit(schluessel);
  };

  return (
    <div ref={tisch} className="bo-druck-tisch" tabIndex={0} aria-label={T.vorschau(titel)} aria-busy={zustand === "laedt"} data-testid="druck-vorschau" data-zustand={zustand}>
      {zustand === "fehler" ? (
        <div className="grid min-h-[320px] place-items-center text-center">
          <div className="grid justify-items-center gap-3">
            <span className="grid size-12 place-items-center rounded-pill bg-bo-surface text-bo-text-soft shadow-(--bo-sh-btn)">
              <Icon name="CloudOff" className="size-5" />
            </span>
            <p className="text-[15px] font-medium">{pdf ? T.pdfFehler : T.vorschauFehler}</p>
            <Knopf size="s" icon="RefreshCw" onClick={() => setVersuch((v) => v + 1)}>
              {T.erneut}
            </Knopf>
          </div>
        </div>
      ) : (
        <div className="bo-druck-papier" data-pdf={pdf ? "true" : undefined} style={pdf ? undefined : { width: Math.round(seite.breite * massstab), height: Math.round(hoehe * massstab) }}>
          {aktuell.art === "html" || aktuell.art === "pdf" ? (
            <iframe
              key={schluessel}
              ref={rahmen}
              title={T.vorschau(titel)}
              onLoad={onLoad}
              sandbox={aktuell.art === "html" ? SANDBOX : undefined}
              srcDoc={aktuell.art === "html" ? aktuell.html : undefined}
              src={aktuell.art === "pdf" ? aktuell.url : undefined}
              style={pdf ? undefined : { width: seite.breite, height: hoehe, transform: `scale(${massstab})` }}
              tabIndex={-1}
            />
          ) : null}
          {zustand === "laedt" && (
            <div className="bo-druck-skelett" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          )}
          {zustand === "laedt" && <span className="sr-only" role="status">{T.vorschauLaedt}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {string} p.doctype                 Frappe-DocType („PH Rechnung“)
 * @param {string} p.name                    Dokumentname
 * @param {string} [p.titel]                 Anzeige („Rechnung RE-2026-00042“)
 * @param {Array<string>} [p.formate]        weitere Formate (zusätzlich zum Register lib/backoffice/druck)
 * @param {string} [p.format]                Startformat (sonst gemerktes bzw. erstes)
 * @param {boolean} [p.pdf]                  PDF verfügbar (Frappe-Modus) – sonst Knopf gesperrt mit Grund
 * @param {() => void} [p.perEmail]          Sende-Weg des Bereichs (öffnet z. B. <Informieren>); ohne → Knopf fehlt
 * @param {string} [p.emailGrund]            gesetzt → „Per E-Mail“ gesperrt mit diesem Satz (z. B. keine Adresse)
 * @param {{name:string, erreichbar:boolean}} [p.drucker]  Gerätedrucker (Kiosk); erreichbar=false → Fehlerband
 * @param {boolean} [p.testdaten]            Mock: Hinweis „Vorschau aus Beispieldaten“
 */
export default function DruckPanel({ offen, onSchliessen, doctype, name, titel, formate: zusatz, format: startFormat, pdf = false, perEmail, emailGrund, drucker, testdaten = false, testid = "druck-panel" }) {
  const formate = useMemo(() => formateFuer(doctype, zusatz), [doctype, zusatz]);
  const [format, setFormat] = useState(() => startFormat || formate[0].name);
  const [zoom, setZoom] = useState("breite");
  const [sammel, setSammel] = useState(null); // null = nur aktuelles Format, sonst Set
  const [laeuft, setLaeuft] = useState(false);
  const [pdfKaputt, setPdfKaputt] = useState(false); // PDF scheiterte → HTML-Vorschau drucken (Zentrale § 3.14)
  const { auftraege, hinzu, setze } = useDruckWarteschlange();
  const { zeige } = useToast();

  // Gemerktes Format je DocType nach dem Öffnen übernehmen (Server kennt es nicht).
  useEffect(() => {
    if (!offen || startFormat) return;
    const g = lies(formatSchluessel(doctype));
    if (g) setFormat(waehleFormat(formate, g)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [offen, doctype, formate, startFormat]);

  const aktuell = formate.find((f) => f.name === format) || formate[0];
  const anzeigeTitel = titel || name;
  const auswahl = useMemo(() => (sammel ? formate.filter((f) => sammel.has(f.name)) : [aktuell]), [sammel, formate, aktuell]);
  const offline = drucker && drucker.erreichbar === false;
  const eigene = auftraege.filter((a) => a.doctype === doctype && a.name === name).slice(0, 3);

  const waehle = (wert) => {
    setFormat(wert);
    merke(formatSchluessel(doctype), wert);
  };

  const drucke = useCallback(async () => {
    if (laeuft || !auswahl.length) return;
    setLaeuft(true);
    const liste = auswahl.map((f) => hinzu({ doctype, name, titel: `${anzeigeTitel} · ${f.titel}`, format: f.name, gruppe: auswahl.length > 1 ? "sammel" : null }));
    zeige(liste.length > 1 ? T.sammelGestartet(liste.length) : T.auftragGestartet(anzeigeTitel), { art: "info" });
    for (const a of liste) {
      setze(a.id, "druckt");
      const ok = await druckeFormat({ doctype, name, format: a.format, pdf: pdf && !pdfKaputt });
      setze(a.id, ok ? "gedruckt" : "fehler");
    }
    setLaeuft(false);
  }, [laeuft, auswahl, hinzu, setze, zeige, doctype, name, anzeigeTitel, pdf, pdfKaputt]);

  // Strg/⌘+Enter = Drucken (Primär des Sheets)
  useKuerzel("akte", { "akte.primaer": () => drucke() }, { aktiv: offen });

  const linkKopieren = async () => {
    try {
      await navigator.clipboard.writeText(new URL(druckHref(doctype, name, aktuell.name), window.location.href).href);
      zeige(T.linkKopiert, { art: "ok" });
    } catch {
      zeige(T.linkKopiert, { art: "info", unter: druckHref(doctype, name, aktuell.name) });
    }
  };

  const umschalten = (n) =>
    setSammel((s) => {
      const neu = new Set(s || [aktuell.name]);
      if (neu.has(n) && neu.size > 1) neu.delete(n);
      else neu.add(n);
      return neu;
    });

  const fuss = (
    <div className="flex w-full flex-wrap items-center gap-2">
      <RundKnopf icon="Share2" label={T.linkKopieren} groesse="s" onClick={linkKopieren} testid="druck-link" />
      {pdf ? (
        <Knopf variant="secondary" icon="Download" href={pdfHref(doctype, name, aktuell.name)} target="_blank" rel="noopener" data-testid="druck-pdf">
          {T.pdf}
        </Knopf>
      ) : null}
      {perEmail ? (
        <Knopf variant="secondary" icon="Mail" onClick={perEmail} disabled={!!emailGrund} data-testid="druck-email">
          {T.perEmail}
        </Knopf>
      ) : null}
      <span className="flex-1" />
      <Knopf variant="primary" size="l" icon="Printer" kuerzel="Strg+Enter" laedt={laeuft} disabled={!auswahl.length} onClick={drucke} data-testid="druck-drucken">
        {auswahl.length > 1 ? T.druckenN(T.sammel(auswahl.length)) : T.drucken}
      </Knopf>
      {(emailGrund && perEmail) || !pdf ? (
        <p className="basis-full text-[12px] leading-4 text-bo-text-faint">{[perEmail && emailGrund, !pdf && T.pdfNurFrappe].filter(Boolean).join(" ")}</p>
      ) : null}
    </div>
  );

  return (
    <Sheet offen={offen} onSchliessen={onSchliessen} titel={T.titel} unter={anzeigeTitel} groesse="lg" className="bo-druck-sheet" panel="drucken" testid={testid} fuss={fuss}>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {sammel ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label={T.formate}>
              {formate.map((f) => {
                const an = sammel.has(f.name);
                return (
                  <button key={f.name} type="button" className="bo-druck-chip" aria-pressed={an} onClick={() => umschalten(f.name)} data-testid={`druck-chip-${f.titel}`}>
                    <span className="bo-druck-chip__haken" aria-hidden="true">
                      {an && <Icon name="Check" className="size-3" strokeWidth={2.5} />}
                    </span>
                    {f.titel}
                    <span className="text-bo-text-faint">{T.papier[f.papier]}</span>
                  </button>
                );
              })}
            </div>
          ) : formate.length > 1 && formate.length <= 4 ? (
            <Segment label={T.format} groesse="s" wert={aktuell.name} onWechsel={waehle} optionen={formate.map((f) => ({ wert: f.name, titel: f.titel }))} testid="druck-format" />
          ) : formate.length > 4 ? (
            <label className="flex min-w-0 items-center gap-2 text-[13px] text-bo-text-soft">
              {T.format}
              <select className="bo-input w-auto rounded-pill" value={aktuell.name} onChange={(e) => waehle(e.target.value)} data-testid="druck-format">
                {formate.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.titel}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-[13px] font-medium text-bo-text-soft">
              {aktuell.titel} · {T.papier[aktuell.papier]}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {formate.length > 1 && (
              <Knopf size="s" variant="ghost" icon={sammel ? "X" : "Layers"} aria-pressed={!!sammel} onClick={() => setSammel((x) => (x ? null : new Set([aktuell.name])))} data-testid="druck-mehrere">
                {sammel ? T.nurEines : T.mehrere}
              </Knopf>
            )}
            {!pdf && <Segment label={T.zoom} groesse="s" variante="hell" wert={zoom} onWechsel={setZoom} optionen={ZOOM.map((z) => ({ wert: z, titel: T.zoomStufen[z] }))} testid="druck-zoom" />}
          </div>
        </div>

        {offline && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-bo-karte bg-bo-danger-soft px-4 py-3 text-bo-danger-text" data-testid="druck-offline">
            <Icon name="TriangleAlert" className="size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">{T.druckerOffline(drucker.name)}</p>
              <p className="text-[13px] opacity-90">{T.druckerOfflineUnter}</p>
            </div>
            {pdf ? (
              <Knopf size="s" variant="secondary" href={pdfHref(doctype, name, aktuell.name)} target="_blank" rel="noopener">
                {T.pdfOeffnen}
              </Knopf>
            ) : null}
          </div>
        )}

        <Vorschau doctype={doctype} name={name} format={aktuell.name} pdf={pdf && !pdfKaputt} papier={aktuell.papier} zoom={zoom} titel={`${anzeigeTitel} · ${aktuell.titel}`} onPdfFehler={() => setPdfKaputt(true)} />

        <div className="grid gap-3 rounded-bo-karte bg-bo-surface p-4 shadow-(--bo-sh-card) sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-bo-fill text-bo-text-soft">
              <Icon name="Printer" className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] leading-[18px] text-bo-text-soft">{T.ausgabe}</p>
              <p className="truncate text-[15px] leading-[22px] font-medium">{drucker?.name || T.geraet}</p>
              {!drucker && <p className="text-[12px] leading-4 text-bo-text-faint">{T.systemdruck}</p>}
            </div>
          </div>
          {testdaten && (
            <Pille material="eiche" groesse="sm">
              {T.beispieldaten}
            </Pille>
          )}
        </div>

        {eigene.length > 0 && (
          <section aria-label={T.warteschlange} className="grid gap-1" data-testid="druck-warteschlange">
            <h3 className="px-1 text-[13px] font-medium text-bo-text-soft">{T.warteschlange}</h3>
            <ul className="grid gap-1">
              {eigene.map((a) => (
                <li key={a.id} className="flex min-w-0 items-center gap-3 rounded-bo-zeile px-3 py-2 hover:bg-bo-fill">
                  <span className="min-w-0 flex-1 truncate text-[14px]">{a.titel}</span>
                  <span className="shrink-0 text-[12px] text-bo-text-faint tabular-nums">{new Date(a.zeit).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</span>
                  <Pille material={AUFTRAG_MATERIAL[a.zustand]} groesse="sm">
                    {T.zustand[a.zustand]}
                  </Pille>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Knopf „Drucken“ mit Panel und Strg/⌘+P. Props wie DruckPanel + `knopf` (Props für den Knopf).
 */
export function DruckKnopf({ knopf = {}, kontext = "akte", ...panel }) {
  const [offen, setOffen] = useDruckTaste({ kontext });
  return (
    <>
      <Knopf variant="secondary" icon="Printer" kuerzel={T.taste} onClick={() => setOffen(true)} data-testid="druck-oeffnen" {...knopf}>
        {knopf.children || T.drucken}
      </Knopf>
      <DruckPanel offen={offen} onSchliessen={() => setOffen(false)} {...panel} />
    </>
  );
}
