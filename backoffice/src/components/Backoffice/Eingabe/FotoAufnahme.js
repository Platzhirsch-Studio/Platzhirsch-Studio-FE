"use client";
// G-30 FotoAufnahme (Team P0-6): Fotos für Montage, Technik, Wareneingang, Kassenbuch, Kundenkarte-Nachweis.
// Zwei Wege: „Foto aufnehmen“ (Rückkamera über `capture="environment"`) und „Aus Datei“. Vorschau 96 px,
// Aufnahmezeit aus EXIF (sonst Dateizeit), privat hochladen über `dateiHochladenAction` (bzw. eigene
// `aktion`). Mit `warteschlange` (Standard im Kiosk) laufen Uploads über die Offline-Warteschlange (G-24):
// sichtbar „wartet / wird gesendet / gesendet“, Fehler je Datei „Upload fehlgeschlagen – erneut“.

import { useEffect, useId, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RefreshCw, TriangleAlert, X } from "lucide-react";
import Knopf from "../Knopf";
import cx from "../cx";
import { einreihen, erneut as erneutQueue, registriereSender, useWarteschlange } from "../Kiosk/warteschlange";
import { dateiHochladenAction } from "./aktionen";
import { exifZeit } from "./exif";
import { TEXTE } from "./texte";
import "./eingabe.css";

const T = TEXTE.foto;
const MAX_BYTES = 15 * 1024 * 1024;

function zeitAnzeige(wert) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/.exec(wert || "");
  return m ? `${m[3]}.${m[2]}. ${m[4]}` : "";
}

function dateiZeit(file) {
  const d = new Date(file.lastModified || Date.now());
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formDaten(datei, ziel, aufgenommen) {
  const fd = new FormData();
  fd.set("datei", datei);
  fd.set("doctype", ziel?.doctype || "");
  fd.set("name", ziel?.name || "");
  fd.set("aufgenommen", aufgenommen || "");
  return fd;
}

// Sender der Warteschlange für Fotos (einmal je Seite registriert; Ziel steht im Eintrag).
let senderAbmelden = null;
function stelleSenderSicher(aktion) {
  if (senderAbmelden) return;
  senderAbmelden = registriereSender("foto", async (e) => {
    const r = await (aktion || dateiHochladenAction)(formDaten(e.daten, e.meta?.ziel, e.meta?.aufgenommen));
    return r?.ok ? { ok: true } : { ok: false, fehler: r?.fehler || T.fehler, netz: r?.code === "unavailable" };
  });
}

/**
 * @param {object} p
 * @param {string} [p.label]                    Überschrift der Gruppe
 * @param {{doctype:string, name:string}} [p.ziel]  Datensatz, an den die Fotos privat gehängt werden
 * @param {(formData:FormData) => Promise<{ok:boolean, fehler?:string, datei?:object}>} [p.aktion]  eigene Server Action
 * @param {boolean} [p.warteschlange]           über die Offline-Warteschlange senden (Kiosk)
 * @param {boolean} [p.hochladen]               false = nur sammeln (Formular sendet selbst), Standard true
 * @param {number} [p.max]
 * @param {boolean} [p.pflicht]
 * @param {(fotos:Array<{id:string, name:string, zustand:string, url?:string, aufgenommen:string, datei:File}>) => void} [p.onAenderung]
 */
export default function FotoAufnahme({ label, ziel, aktion, warteschlange = false, hochladen = true, max = 10, pflicht = false, onAenderung, className, testid = "foto-aufnahme" }) {
  const id = useId();
  const kamera = useRef(null);
  const datei = useRef(null);
  const [fotos, setFotos] = useState([]);
  const [hinweis, setHinweis] = useState("");
  const { eintraege } = useWarteschlange();
  const urls = useRef(new Map());

  useEffect(() => {
    if (warteschlange) stelleSenderSicher(aktion);
  }, [warteschlange, aktion]);

  // Zustand der Warteschlangen-Einträge spiegeln (nur Einträge dieses Bausteins).
  const sicht = fotos.map((f) => {
    if (!f.queueId) return f;
    const q = eintraege.find((e) => e.id === f.queueId);
    if (!q) return f.zustand === "gesendet" ? f : { ...f, zustand: "gesendet" };
    return { ...f, zustand: q.zustand, fehler: q.fehler };
  });

  const onAenderungRef = useRef(onAenderung);
  useEffect(() => {
    onAenderungRef.current = onAenderung;
  });
  const signatur = sicht.map((f) => `${f.id}:${f.zustand}`).join("|");
  useEffect(() => {
    onAenderungRef.current?.(sicht);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur bei echter Änderung melden
  }, [signatur]);

  useEffect(() => {
    const map = urls.current;
    return () => {
      for (const u of map.values()) URL.revokeObjectURL(u);
    };
  }, []);

  const setze = (fid, teil) => setFotos((liste) => liste.map((f) => (f.id === fid ? { ...f, ...teil } : f)));

  const senden = async (f) => {
    if (!hochladen) return;
    if (warteschlange) {
      const queueId = await einreihen({ art: "foto", daten: f.datei, meta: { ziel, aufgenommen: f.aufgenommen, dateiname: f.name } });
      setze(f.id, { queueId, zustand: "wartet" });
      return;
    }
    setze(f.id, { zustand: "sendet", fehler: "" });
    try {
      const r = await (aktion || dateiHochladenAction)(formDaten(f.datei, ziel, f.aufgenommen));
      if (r?.ok) setze(f.id, { zustand: "gesendet", url: r.datei?.url || "" });
      else setze(f.id, { zustand: "fehler", fehler: r?.fehler || T.fehler });
    } catch {
      setze(f.id, { zustand: "fehler", fehler: T.fehler });
    }
  };

  const hinzufuegen = async (liste) => {
    setHinweis("");
    const neu = [];
    for (const file of liste) {
      if (fotos.length + neu.length >= max) {
        setHinweis(T.max(max));
        break;
      }
      if (!/^image\//.test(file.type || "") && !/\.(heic|heif)$/i.test(file.name || "")) {
        setHinweis(T.keinBild);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setHinweis(T.zuGross);
        continue;
      }
      let aufgenommen = null;
      try {
        aufgenommen = exifZeit(await file.slice(0, 131072).arrayBuffer());
      } catch {
        aufgenommen = null;
      }
      const fid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const vorschau = URL.createObjectURL(file);
      urls.current.set(fid, vorschau);
      neu.push({ id: fid, name: file.name || `foto-${fid}.jpg`, datei: file, vorschau, aufgenommen: aufgenommen || dateiZeit(file), zustand: hochladen ? "wartet" : "bereit" });
    }
    if (!neu.length) return;
    setFotos((alt) => [...alt, ...neu]);
    for (const f of neu) senden(f);
  };

  const entfernen = (fid) => {
    const u = urls.current.get(fid);
    if (u) URL.revokeObjectURL(u);
    urls.current.delete(fid);
    setFotos((liste) => liste.filter((f) => f.id !== fid));
  };

  const nochmal = (f) => {
    if (f.queueId) erneutQueue(f.queueId);
    else senden(f);
  };

  const voll = fotos.length >= max;
  const titelId = `${id}-t`;
  return (
    <div className={cx("bo-ein-foto", className)} role="group" aria-labelledby={label ? titelId : undefined} data-testid={testid}>
      {label && (
        <p id={titelId} className="text-[13px] font-medium text-bo-text-soft">
          {label}
          {pflicht && <span className="sr-only"> ({T.pflicht})</span>}
        </p>
      )}
      <div className="bo-ein-foto__knoepfe">
        <Knopf variant="secondary" size="l" onClick={() => kamera.current?.click()} disabled={voll}>
          <Camera aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {T.aufnehmen}
        </Knopf>
        <Knopf variant="ghost" size="l" onClick={() => datei.current?.click()} disabled={voll}>
          <ImagePlus aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {T.datei}
        </Knopf>
        <input
          ref={kamera}
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            hinzufuegen([...(e.target.files || [])]);
            e.target.value = "";
          }}
        />
        <input
          ref={datei}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          data-testid={`${testid}-datei`}
          onChange={(e) => {
            hinzufuegen([...(e.target.files || [])]);
            e.target.value = "";
          }}
        />
      </div>
      {hinweis && (
        <p className="bo-ein-fehler" role="alert">
          <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={1.75} />
          {hinweis}
        </p>
      )}
      {sicht.length > 0 && (
        <ul className="bo-ein-foto__liste" aria-label={label || T.aufnehmen}>
          {sicht.map((f, i) => (
            <li key={f.id} className="bo-ein-foto__bild" data-zustand={f.zustand}>
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (Object-URL) */}
              <img src={f.vorschau} alt={T.vorschau(i + 1)} />
              {f.zustand !== "sendet" && f.zustand !== "gesendet" && (
                <button type="button" className="bo-rund bo-rund--s bo-ein-foto__weg bo-ziel" aria-label={`${T.entfernen} ${i + 1}`} onClick={() => entfernen(f.id)}>
                  <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </button>
              )}
              <FotoStatus foto={f} onErneut={() => nochmal(f)} />
              <span className="bo-ein-foto__zeit tabular-nums">{zeitAnzeige(f.aufgenommen)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FotoStatus({ foto, onErneut }) {
  if (foto.zustand === "fehler")
    return (
      <button type="button" className="bo-ein-foto__erneut" onClick={onErneut} title={foto.fehler || undefined}>
        {T.fehler}
      </button>
    );
  if (foto.zustand === "bereit") return null;
  const text = { wartet: T.wartet, sendet: T.sendet, gesendet: T.gesendet }[foto.zustand] || T.wartet;
  return (
    <span className="bo-ein-foto__status" data-zustand={foto.zustand} role="status">
      {foto.zustand === "gesendet" ? <Check aria-hidden="true" className="size-3.5" strokeWidth={2} /> : <RefreshCw aria-hidden="true" className={cx("size-3.5", foto.zustand === "sendet" && "bo-ein-dreht")} strokeWidth={1.75} />}
      {text}
    </span>
  );
}
