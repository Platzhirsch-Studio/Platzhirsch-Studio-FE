"use client";
// G-23 Unterschrift (Team P0-6): Lieferschein, Abnahme, Serviceeinsatz, Kassa-Retoure, Tagesabschluss.
// Fläche 100 % × 200 als schwebende Karte, gestrichelte Grundlinie mit „×“, Finger/Stift/Maus (Druck bei
// Stiften), Striche als Vektoren – Drehen des iPads oder Größenänderung zeichnet sauber neu. Erklärungstext
// darüber ist Pflicht. Alternativen (Segment) z. B. „Name bestätigt“ (Name in Druckbuchstaben) oder
// „Abgestellt laut Absprache“ (Pflicht-Foto über FotoAufnahme). Ergebnis: PNG + Prüfwert (SHA-256) + Zeit.
// Einmal übernommen ist sie nicht mehr änderbar: `aktion` (Server Action, z. B. unterschriftSpeichernAction)
// prüft vorher, ob schon eine Unterschrift existiert; `gesetzt` zeigt eine vorhandene nur an.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Lock, TriangleAlert } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Haken } from "../motion";
import cx from "../cx";
import FotoAufnahme from "./FotoAufnahme";
import { alternativeFehler, glaette, pngAusDataUrl, pruefwert, strichBreite, unterschriftGenug } from "./unterschrift-logik";
import { TEXTE } from "./texte";
import "./eingabe.css";

const T = TEXTE.unterschrift;

function farbe(el, name, ersatz) {
  const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : "";
  return v || ersatz;
}

function zeichne(canvas, striche, { tinte }) {
  const ctx = canvas.getContext("2d");
  const { width: b, height: h } = canvas;
  ctx.clearRect(0, 0, b, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = tinte;
  ctx.fillStyle = tinte;
  const dpr = canvas.width / (canvas.clientWidth || canvas.width);
  for (const s of striche) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0].x * b, s[0].y * h, (strichBreite(s[0].p) * dpr) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1];
      const c = s[i];
      ctx.lineWidth = strichBreite(c.p) * dpr;
      ctx.beginPath();
      if (i === 1) ctx.moveTo(a.x * b, a.y * h);
      else {
        const v = s[i - 2];
        ctx.moveTo(((v.x + a.x) / 2) * b, ((v.y + a.y) / 2) * h);
      }
      ctx.quadraticCurveTo(a.x * b, a.y * h, ((a.x + c.x) / 2) * b, ((a.y + c.y) / 2) * h);
      ctx.stroke();
    }
  }
}

/** PNG in fester Größe (Druck/Archiv): 2× der sichtbaren Fläche, transparent, Tinte schwarz-grau. */
function alsPng(striche, breite, hoehe, tinte) {
  const c = document.createElement("canvas");
  c.width = Math.round(breite * 2);
  c.height = Math.round(hoehe * 2);
  Object.defineProperty(c, "clientWidth", { value: breite });
  zeichne(c, striche, { tinte });
  return c.toDataURL("image/png");
}

function zeitText(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * @param {object} p
 * @param {import("react").ReactNode} p.erklaerung    Pflicht: was bestätigt wird („Ware vollständig und unbeschädigt erhalten.“)
 * @param {string} [p.name]                           Unterzeichner (klein unter der Linie)
 * @param {Array<{wert:string, titel:string, feld?:{label:string}, fotoPflicht?:boolean}>} [p.alternativen]
 * @param {(ergebnis:object) => Promise<{ok:boolean, fehler?:string, gesetzt?:object}>|void} [p.aktion]   Server Action (prüft vorher, ob schon gesetzt)
 * @param {(ergebnis:object) => void} [p.onUebernommen]
 * @param {{png?:string, url?:string, zeit:string, pruefwert?:string, art?:string, text?:string}|null} [p.gesetzt]   vorhandene Unterschrift (nur Anzeige)
 * @param {object} [p.ziel]                           { doctype, name } für Pflicht-Fotos der Alternative
 * @param {boolean} [p.disabled]
 */
export default function Unterschrift({ erklaerung, name, alternativen = [], aktion, onUebernommen, gesetzt: gesetztProp = null, ziel, disabled = false, className, testid = "unterschrift" }) {
  const id = useId();
  const flaeche = useRef(null);
  const canvas = useRef(null);
  const striche = useRef([]);
  const aktuell = useRef(null);
  const [leer, setLeer] = useState(true);
  const [art, setArt] = useState("unterschrift");
  const [altText, setAltText] = useState("");
  const [fotos, setFotos] = useState([]);
  const [fehler, setFehler] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [gesetzt, setGesetzt] = useState(gesetztProp);
  if (!erklaerung && process.env.NODE_ENV !== "production") console.warn("[Unterschrift] Prop „erklaerung“ ist Pflicht (G-23).");

  const neuZeichnen = useCallback(() => {
    const c = canvas.current;
    const f = flaeche.current;
    if (!c || !f) return;
    const dpr = window.devicePixelRatio || 1;
    const r = f.getBoundingClientRect();
    if (!r.width) return;
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    zeichne(c, striche.current, { tinte: farbe(f, "--color-bo-text", "currentColor") });
  }, []);

  useEffect(() => {
    if (gesetzt || art !== "unterschrift") return;
    neuZeichnen();
    const ro = new ResizeObserver(neuZeichnen);
    if (flaeche.current) ro.observe(flaeche.current);
    // Hell/Dunkel gewechselt → Tinte neu
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", neuZeichnen);
    const mo = new MutationObserver(neuZeichnen);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mq?.removeEventListener?.("change", neuZeichnen);
      mo.disconnect();
    };
  }, [gesetzt, art, neuZeichnen]);

  const punkt = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), p: e.pointerType === "pen" ? e.pressure : 0.5 };
  };

  const runter = (e) => {
    if (disabled || laeuft) return;
    e.preventDefault();
    canvas.current.setPointerCapture?.(e.pointerId);
    aktuell.current = [punkt(e)];
    striche.current = [...striche.current, aktuell.current];
    setFehler("");
    neuZeichnen();
  };
  const ziehen = (e) => {
    if (!aktuell.current) return;
    const r = canvas.current.getBoundingClientRect();
    const ereignisse = e.getCoalescedEvents?.() || [e];
    for (const ev of ereignisse) {
      const neu = glaette(aktuell.current[aktuell.current.length - 1], punkt(ev), r.width, r.height);
      if (neu) aktuell.current.push(neu);
    }
    neuZeichnen();
  };
  const hoch = () => {
    if (!aktuell.current) return;
    aktuell.current = null;
    setLeer(striche.current.length === 0);
  };

  const loeschen = () => {
    striche.current = [];
    setLeer(true);
    setFehler("");
    neuZeichnen();
  };

  const alternative = alternativen.find((a) => a.wert === art) || null;

  const uebernehmen = async () => {
    if (laeuft || gesetzt) return;
    let ergebnis;
    if (!alternative) {
      const r = canvas.current.getBoundingClientRect();
      if (!unterschriftGenug(striche.current, r.width, r.height)) {
        setFehler(leer ? T.leer : T.zuKurz);
        return;
      }
      const png = alsPng(striche.current, r.width, r.height, "black");
      const bytes = pngAusDataUrl(png);
      ergebnis = { art: "unterschrift", png, pruefwert: await pruefwert(bytes), zeit: new Date().toISOString(), striche: striche.current.length };
    } else {
      const f = alternativeFehler(alternative, { text: altText, fotos: fotos.length }, T);
      if (f) {
        setFehler(f);
        return;
      }
      const text = alternative.feld ? altText.trim() : alternative.titel;
      const bytes = new TextEncoder().encode(`${alternative.wert}|${text}|${fotos.map((x) => x.name).join(",")}`);
      ergebnis = { art: alternative.wert, text, fotos: fotos.map((x) => x.url || x.name), pruefwert: await pruefwert(bytes), zeit: new Date().toISOString() };
    }
    setLaeuft(true);
    try {
      const antwort = aktion ? await aktion(ergebnis) : { ok: true };
      if (antwort && antwort.ok === false) {
        setFehler(antwort.fehler || T.bereitsGesetzt);
        if (antwort.code === "conflict") setGesetzt(antwort.gesetzt || { zeit: "", art: "unterschrift" });
        return;
      }
      const fertig = { ...ergebnis, ...(antwort?.gesetzt || {}), png: ergebnis.png };
      setGesetzt(fertig);
      onUebernommen?.(fertig);
    } catch {
      setFehler(TEXTE.aktion.nichtErreichbar);
    } finally {
      setLaeuft(false);
    }
  };

  const fehlerId = `${id}-fehler`;

  if (gesetzt) {
    const bild = gesetzt.png || gesetzt.url;
    return (
      <section className={cx("bo-ein-us", className)} data-testid={testid} data-zustand="gesetzt" aria-labelledby={`${id}-e`}>
        <p id={`${id}-e`} className="bo-ein-us__erklaerung">
          {erklaerung}
        </p>
        <div className="bo-ein-us__gesetzt">
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- Daten-URL bzw. private Datei, keine Optimierung möglich */}
            {bild ? <img src={bild} alt={`${T.unterschrift}${name ? ` ${name}` : ""}`} /> : <p className="text-[17px] font-semibold">{gesetzt.text || alternativen.find((a) => a.wert === gesetzt.art)?.titel || T.unterschrift}</p>}
            <p className="bo-ein-us__meta mt-2">
              <b>{T.gesetzt(zeitText(gesetzt.zeit))}</b>
              {gesetzt.pruefwert && (
                <>
                  {" · "}
                  {T.pruefwert} <span className="font-mono">{gesetzt.pruefwert.slice(0, 8)}</span>
                </>
              )}
            </p>
            {fehler && (
              <p className="bo-ein-fehler" role="alert">
                <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={1.75} />
                {fehler}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-bo-text-soft">
            <Haken groesse={28} className="text-bo-salbei" titel={T.gesetzt("")} />
          </span>
        </div>
        <p className="bo-ein-us__meta inline-flex items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          {T.nichtUeberschreibbar}
        </p>
      </section>
    );
  }

  return (
    <section className={cx("bo-ein-us", className)} data-testid={testid} data-zustand="offen" aria-labelledby={`${id}-e`}>
      <p id={`${id}-e`} className="bo-ein-us__erklaerung">
        {erklaerung}
      </p>
      {alternativen.length > 0 && (
        <div className="bo-ein-us__art">
        <Segment
          label={T.art}
          wert={art}
          onWechsel={(w) => {
            setArt(w);
            setFehler("");
          }}
          optionen={[{ wert: "unterschrift", titel: T.unterschrift }, ...alternativen.map((a) => ({ wert: a.wert, titel: a.titel }))]}
          variante="hell"
        />
        </div>
      )}
      {!alternative ? (
        <div ref={flaeche} className="bo-ein-us__flaeche" data-leer={leer ? "true" : "false"}>
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${T.feld}${name ? ` – ${name}` : ""}`}
            aria-describedby={fehler ? fehlerId : undefined}
            onPointerDown={runter}
            onPointerMove={ziehen}
            onPointerUp={hoch}
            onPointerCancel={hoch}
            onLostPointerCapture={hoch}
            data-testid={`${testid}-flaeche`}
          />
          <span className="bo-ein-us__leer">{T.hinweisFeld}</span>
          <span className="bo-ein-us__x" aria-hidden="true">
            ×
          </span>
          <span className="bo-ein-us__linie" aria-hidden="true" />
          {name && <span className="bo-ein-us__name">{name}</span>}
        </div>
      ) : (
        <div className="bo-ein-us__alt">
          {alternative.feld && (
            <label className="grid gap-1.5 text-[13px] font-medium text-bo-text-soft">
              {alternative.feld.label || T.name}
              <input className="bo-input text-[17px]" value={altText} autoComplete="off" onChange={(e) => setAltText(e.target.value)} aria-invalid={fehler && !altText.trim() ? "true" : undefined} />
            </label>
          )}
          {alternative.fotoPflicht && <FotoAufnahme label={T.fotoPflicht} ziel={ziel} onAenderung={setFotos} max={4} pflicht />}
        </div>
      )}
      {fehler && (
        <p id={fehlerId} className="bo-ein-fehler" role="alert">
          <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={1.75} />
          {fehler}
        </p>
      )}
      <div className="bo-ein-us__fuss">
        {!alternative ? (
          <Knopf variant="ghost" onClick={loeschen} disabled={leer || laeuft || disabled} data-testid={`${testid}-loeschen`}>
            {T.loeschen}
          </Knopf>
        ) : (
          <span />
        )}
        <Knopf variant="primary" size="l" onClick={uebernehmen} laedt={laeuft} disabled={disabled} data-testid={`${testid}-uebernehmen`}>
          {laeuft ? T.uebernimmt : T.uebernehmen}
        </Knopf>
      </div>
    </section>
  );
}
