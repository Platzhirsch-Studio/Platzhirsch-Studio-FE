"use client";
// G-22 ScanTor (Team P0-6): EIN Tor für Hand-Scanner (Tastatur-Wedge) je Seite.
// - erkennt Scanner-Folgen (Zeichenabstand < 30 ms, Enter/Tab am Ende) und verhindert, dass ihre Zeichen
//   Kürzel auslösen (Lauscher in der Capture-Phase am window, vor dem Kürzel-Register);
// - Backoffice (Q-D8): nur Felder mit `data-scan="ja"` bekommen Scans (Ereignis „ph-bo:scan“ am Feld,
//   `useScanFeld`); außerhalb von Feldern öffnet ein Code die Befehlspalette mit dem Code;
// - Kiosk: global aktiv (onScan der Seite), Opt-out `data-scan="nein"`, gesperrt z. B. während der Zahlung;
//   ein Scan in ein normales Feld wird dort wieder entfernt (das Feld behält seinen Text).
// Code-Erkennung über lib/backoffice/codes.js (Kartennummer, EAN, Belegnummer, Abholcode, Lageretikett,
// Event-QR …). Ein Einzelzeichen außerhalb von Feldern wird ~35 ms zurückgehalten und danach unverändert
// weitergegeben, wenn kein zweites Zeichen folgt – so lösen Scans nie Einzeltasten aus.
//
//   <ScanTor modus="kiosk" onScan={(code, erkannt) => …} gesperrt={zahlungLaeuft} />
//   const ref = useRef(); useScanFeld(ref, (code, erkannt) => …); <input ref={ref} data-scan="ja" />

import { useEffect, useRef } from "react";
import { erkenneCode } from "@/lib/backoffice/codes";
import { SCAN_ABSTAND_MS, erstelleScanErkenner, scanAnsage, scanZiel } from "./scan";

export const SCAN_EREIGNIS = "ph-bo:scan";
// Gleicher Name wie Shell/Befehlspalette.js (PALETTE_EREIGNIS) – hier ohne Import, damit das Tor die
// Palette nicht ins Kiosk-Bündel zieht.
const PALETTE_EREIGNIS = "ph-bo:palette";
const DURCHGEREICHT = Symbol.for("ph-bo:scan-durch");

function istEditierbar(el) {
  return !!el && (/^(input|textarea|select)$/i.test(el.tagName || "") || !!el.isContentEditable);
}

function wertSetzen(el, wert) {
  if (!el || !("value" in el)) return;
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter ? setter.call(el, wert) : (el.value = wert);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * @param {object} p
 * @param {"kiosk"|"backoffice"} [p.modus]
 * @param {(code:string, erkannt:object, info:{ziel:string, el:Element|null}) => void} [p.onScan]
 *        Kiosk: jeder Scan außerhalb von data-scan-Feldern. Backoffice: statt Palette, wenn gesetzt und
 *        `true` zurückgegeben wird; sonst öffnet die Palette.
 * @param {boolean} [p.gesperrt]   z. B. während der Zahlung (Q-D8)
 * @param {boolean} [p.abholcode]  6-stellige Abholcodes erkennen
 * @param {(text:string) => void} [p.onAnsage]  Text für die Live-Region („Kundenkarte KK-… gelesen“)
 */
export function useScanTor({ modus = "backoffice", onScan, gesperrt = false, abholcode = false, onAnsage } = {}) {
  const ref = useRef({ onScan, gesperrt, abholcode, onAnsage, modus });
  useEffect(() => {
    ref.current = { onScan, gesperrt, abholcode, onAnsage, modus };
  });

  useEffect(() => {
    const erkenner = erstelleScanErkenner();
    let anfang = null; // { el, wert, ziel } beim ersten Zeichen
    let gehalten = null; // { ereignis, timer }

    const weitergeben = () => {
      if (!gehalten) return;
      const { ereignis, ziel } = gehalten;
      gehalten = null;
      const neu = new KeyboardEvent("keydown", {
        key: ereignis.key,
        code: ereignis.code,
        shiftKey: ereignis.shiftKey,
        altKey: ereignis.altKey,
        ctrlKey: ereignis.ctrlKey,
        metaKey: ereignis.metaKey,
        repeat: ereignis.repeat,
        bubbles: true,
        cancelable: true,
      });
      neu[DURCHGEREICHT] = true;
      (ziel && ziel.isConnected ? ziel : document.body).dispatchEvent(neu);
    };
    const verwerfen = () => {
      if (gehalten) clearTimeout(gehalten.timer);
      gehalten = null;
    };

    const h = (e) => {
      if (e[DURCHGEREICHT] || e.isComposing) return;
      const cfg = ref.current;
      if (cfg.gesperrt) {
        erkenner.zuruecksetzen();
        return;
      }
      const r = erkenner.taste(e.key, performance.now());
      const el = e.target instanceof Element ? e.target : null;

      if (r.art === "zeichen" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!r.folge) {
          // Erstes Zeichen einer möglichen Folge: Ziel und Feldinhalt merken.
          if (gehalten) {
            clearTimeout(gehalten.timer);
            weitergeben();
          }
          anfang = { el, wert: el && "value" in el ? el.value : null, ziel: scanZiel(el, cfg.modus) };
          if (!istEditierbar(el) && (anfang.ziel === "global" || anfang.ziel === "palette")) {
            // Außerhalb von Feldern kurz zurückhalten – folgt nichts, geht es unverändert weiter.
            e.preventDefault();
            e.stopImmediatePropagation();
            gehalten = { ereignis: e, ziel: el, timer: setTimeout(weitergeben, SCAN_ABSTAND_MS + 5) };
          }
          return;
        }
        // Folgezeichen < 30 ms: gehört zu einem Scan → nie Kürzel.
        verwerfen();
        if (!anfang || anfang.ziel === "aus" || anfang.ziel === "tippen") return;
        e.stopImmediatePropagation();
        if (anfang.ziel !== "feld" && !istEditierbar(el)) e.preventDefault();
        return;
      }

      if (r.art === "scan") {
        verwerfen();
        const start = anfang;
        anfang = null;
        if (!start || start.ziel === "aus" || start.ziel === "tippen") return;
        const code = r.code;
        const erkannt = erkenneCode(code, { abholcode: cfg.abholcode });
        e.preventDefault();
        e.stopImmediatePropagation();
        cfg.onAnsage?.(scanAnsage(erkannt, code));
        if (start.ziel === "feld") {
          start.el?.dispatchEvent(new CustomEvent(SCAN_EREIGNIS, { bubbles: true, detail: { code, erkannt } }));
          return;
        }
        // Kiosk-Scan in ein gewöhnliches Feld: Feld zurücksetzen, Scan geht an die Seite.
        if (istEditierbar(start.el) && start.wert !== null && start.el.value !== start.wert) wertSetzen(start.el, start.wert);
        if (start.ziel === "global") {
          cfg.onScan?.(code, erkannt, { ziel: "global", el: start.el });
          return;
        }
        if (start.ziel === "palette") {
          const erledigt = cfg.onScan?.(code, erkannt, { ziel: "palette", el: start.el });
          if (erledigt !== true) window.dispatchEvent(new CustomEvent(PALETTE_EREIGNIS, { detail: { start: code } }));
        }
        return;
      }
      if (r.art === "andere" && !r.neutral) {
        if (gehalten) {
          clearTimeout(gehalten.timer);
          weitergeben();
        }
        anfang = null;
      }
    };
    window.addEventListener("keydown", h, true);
    return () => {
      window.removeEventListener("keydown", h, true);
      verwerfen();
    };
  }, []);
}

/** Komponente zum Einbinden in Server-Seiten-Bäume (rendert nichts). */
export default function ScanTor(props) {
  useScanTor(props);
  return null;
}

/**
 * Feld-Anbindung: ruft onScan(code, erkannt), wenn das ScanTor einen Scan in dieses Feld meldet.
 * Das Feld braucht `data-scan="ja"`.
 */
export function useScanFeld(ref, onScan) {
  const cb = useRef(onScan);
  useEffect(() => {
    cb.current = onScan;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e) => cb.current?.(e.detail.code, e.detail.erkannt);
    el.addEventListener(SCAN_EREIGNIS, h);
    return () => el.removeEventListener(SCAN_EREIGNIS, h);
  }, [ref]);
}
