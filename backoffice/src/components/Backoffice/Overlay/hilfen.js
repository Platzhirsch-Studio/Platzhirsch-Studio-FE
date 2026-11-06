"use client";
// Gemeinsame Client-Hilfen der Overlays (Team P0-4): schmale Ansicht, Kiosk-Erkennung,
// Fokus (erste fokussierbare Stelle, Fokusfalle, Rückgabe), Ziehen am Griff mit Feder,
// nativer <dialog> im Takt eines `offen`-Props.

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { animiere, reduziert } from "../motion";
import { SCHMAL_BIS, gummiband, zieheEntscheidung } from "./logik";

const MEDIA_SCHMAL = `(max-width: ${SCHMAL_BIS - 1}px)`;

function aboSchmal(cb) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(MEDIA_SCHMAL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const schmalJetzt = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(MEDIA_SCHMAL).matches;
const nein = () => false;

/** true unter 640 px (Telefon): Popover, Dialog und Sheet werden zum Bottom-Sheet. */
export function useSchmal() {
  return useSyncExternalStore(aboSchmal, schmalJetzt, nein);
}

/** Liegt das Element in einer Kiosk-Hülle (Kassa, Packtisch, Montage)? */
export function imKiosk(el) {
  return !!el?.closest?.('[data-bo-kiosk], [data-dichte="kiosk"]');
}

export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOKUSSIERBAR = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Fokussierbare, sichtbare Kinder eines Elements in Dokument-Reihenfolge. */
export function fokussierbare(el) {
  if (!el) return [];
  return [...el.querySelectorAll(FOKUSSIERBAR)].filter((k) => !k.closest("[inert]") && (k.offsetWidth > 0 || k.offsetHeight > 0 || k.getClientRects().length > 0));
}

/** Tab/Umschalt+Tab im Element halten. Für onKeyDown. */
export function halteFokus(e, el) {
  if (e.key !== "Tab" || !el) return;
  const liste = fokussierbare(el);
  if (!liste.length) {
    e.preventDefault();
    el.focus?.();
    return;
  }
  const erstes = liste[0];
  const letztes = liste[liste.length - 1];
  const aktiv = el.ownerDocument.activeElement;
  if (e.shiftKey && (aktiv === erstes || !el.contains(aktiv))) {
    e.preventDefault();
    letztes.focus();
  } else if (!e.shiftKey && (aktiv === letztes || !el.contains(aktiv))) {
    e.preventDefault();
    erstes.focus();
  }
}

/**
 * Nativen <dialog> mit `offen` abgleichen. `modal`: showModal() (Top-Layer, Rest inert),
 * sonst show() (Peek: Liste bleibt bedienbar). Gibt beim Schließen den Fokus an den
 * vorherigen Ort zurück, falls er noch im Dokument ist.
 */
export function useDialogOffen(ref, offen, { modal = true, fokusZurueck = true, fokusAufDialog = false } = {}) {
  const vorher = useRef(null);
  useIsoLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) {
      vorher.current = d.ownerDocument.activeElement;
      if (modal) d.showModal();
      else d.show();
      // Ohne ausdrückliches autofocus den Dialog selbst fokussieren (kein Fokusring/Tooltip auf
      // dem ersten Werkzeugknopf, Tab führt von dort in den Inhalt).
      if (fokusAufDialog && !d.querySelector("[autofocus]")) {
        if (!d.hasAttribute("tabindex")) d.setAttribute("tabindex", "-1");
        d.focus({ preventScroll: true });
      }
    } else if (!offen && d.open) {
      d.close();
      const z = vorher.current;
      vorher.current = null;
      if (fokusZurueck && z && z.isConnected && typeof z.focus === "function") z.focus({ preventScroll: true });
    }
  }, [offen, modal, fokusZurueck, fokusAufDialog, ref]);
  // Beim Entfernen der Komponente offenen Dialog schließen (kein verwaister Top-Layer).
  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, [ref]);
}

/**
 * Ziehen am Griff eines Sheets von unten (iOS): folgt dem Finger, Gummiband nach oben,
 * beim Loslassen schließen oder mit Feder zurück. Liefert Props für Griff/Kopf; bewegt wird
 * der umgebende <dialog>.
 * @param {{aktiv: boolean, onSchliessen: () => void}} p
 */
export function useZiehen({ aktiv, onSchliessen }) {
  const zustand = useRef(null);

  const onPointerDown = (e) => {
    if (!aktiv || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (e.target.closest?.("button, a, input, select, textarea")) return;
    const el = e.currentTarget.closest("dialog");
    if (!el) return;
    zustand.current = { el, start: e.clientY, letztes: e.clientY, zeit: e.timeStamp, vy: 0, dy: 0, hoehe: el.getBoundingClientRect().height, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    el.setAttribute("data-ziehen", "true");
  };

  const onPointerMove = (e) => {
    const z = zustand.current;
    if (!z || e.pointerId !== z.id) return;
    const dt = Math.max(1, e.timeStamp - z.zeit);
    z.vy = (e.clientY - z.letztes) / dt;
    z.letztes = e.clientY;
    z.zeit = e.timeStamp;
    z.dy = e.clientY - z.start;
    z.el.style.setProperty("transform", `translateY(${gummiband(z.dy)}px)`);
  };

  const ende = (e) => {
    const z = zustand.current;
    zustand.current = null;
    if (!z) return;
    const el = z.el;
    e?.currentTarget?.releasePointerCapture?.(z.id);
    el.removeAttribute("data-ziehen");
    const jetzt = gummiband(z.dy);
    const urteil = z.dy > 4 ? zieheEntscheidung({ dy: z.dy, vy: z.vy, hoehe: z.hoehe }) : "zurueck";
    if (urteil === "schliessen") {
      const anim = animiere(el, [{ transform: `translateY(${jetzt}px)` }, { transform: `translateY(${z.hoehe + 24}px)` }], { duration: reduziert() ? 0 : 220, easing: "ein", fill: "forwards" });
      anim.finished.then(() => {
        onSchliessen();
        // erst nach der Schließ-Blende (120 ms) zurücksetzen, sonst springt das Panel sichtbar zurück
        setTimeout(() => {
          el.style.removeProperty("transform");
          anim.cancel?.();
        }, 200);
      });
    } else {
      el.style.removeProperty("transform");
      if (jetzt !== 0) animiere(el, [{ transform: `translateY(${jetzt}px)` }, { transform: "translateY(0)" }], { duration: 620, easing: "feder" });
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp: ende, onPointerCancel: ende };
}
