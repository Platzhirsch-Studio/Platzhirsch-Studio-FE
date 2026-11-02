"use client";
// src/components/Einblicke/EinblickeLoader.js – Lader der Besucher-Einblicke
// (Konzept Marktresearch/digital/features/besucher-einblicke.md §3).
//
// Rendert nichts. Prüft das Tor (src/lib/einblicke/gate.js: Schalter,
// eigene Einwilligung "einblicke", DNT/GPC, Route) und lädt den Sammler
// (src/lib/einblicke/client.js) erst dann – im Leerlauf (requestIdleCallback,
// spätestens nach 5 s; ohne rIC 3 s nach load). Ohne Einwilligung wird der
// Sammler nicht einmal angefragt.
//   - Einwilligung später erteilt (ph-consent-change) → wird nachgeladen
//   - Einwilligung widerrufen → stop(): sofort aus, Warteschlange verworfen,
//     sessionStorage "ph_eb" gelöscht
//   - SPA-Navigation (usePathname) → nav(pfad) (ausgeschlossene Routen
//     erfassen nichts)
// Eingebunden in src/app/[locale]/client-layout.js, nur wenn der Schalter
// an ist (sonst ist der Zweig beim Build konstant falsch).
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, channelOf, getAttribution } from "@/lib/attribution";
import { darfMessenHier, einblickeAllowed } from "@/lib/einblicke/gate";
import { SESSION_KEY } from "@/lib/einblicke/config";

function whenIdle(fn) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }
  const run = () => (timer = window.setTimeout(fn, 3000));
  let timer = 0;
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("load", run);
  };
}

export default function EinblickeLoader() {
  const pathname = usePathname() || "";
  const mod = useRef(null);
  const tryStart = useRef(null);

  useEffect(() => {
    let cancelIdle = null;
    let loading = false;
    let alive = true;

    const begin = (consent) => {
      if (mod.current || loading || !darfMessenHier(window, consent)) return;
      loading = true;
      // Warteschlange für event.js: existiert nur bei offenem Tor.
      if (!window.__phEb) window.__phEb = [];
      cancelIdle = whenIdle(() => {
        import("@/lib/einblicke/client")
          .then((m) => {
            loading = false;
            if (!alive || !darfMessenHier(window)) return;
            mod.current = m;
            let ch = "";
            try {
              ch = channelOf(getAttribution(window).current);
            } catch {
              ch = "";
            }
            m.start(window.location.pathname, ch);
          })
          .catch(() => {
            loading = false;
          });
      });
    };

    const end = () => {
      cancelIdle?.();
      cancelIdle = null;
      loading = false;
      mod.current?.stop();
      mod.current = null;
      window.__phEb = undefined;
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* ignore */
      }
    };

    const onConsent = (event) => {
      const consent = event?.detail && typeof event.detail === "object" ? event.detail : undefined;
      // Widerruf: Einwilligung "einblicke" fehlt → sofort aus (Route und DNT spielen dafür keine Rolle).
      if (!einblickeAllowed(consent !== undefined ? consent : document.cookie)) end();
      else begin(consent);
    };

    tryStart.current = begin;
    begin();
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      alive = false;
      tryStart.current = null;
      window.removeEventListener(CONSENT_EVENT, onConsent);
      cancelIdle?.();
    };
  }, []);

  useEffect(() => {
    // Einstieg auf einer ausgeschlossenen Route (z. B. Portal) und dann weiter:
    // erst hier darf der Sammler starten.
    if (mod.current) mod.current.nav(pathname);
    else tryStart.current?.();
  }, [pathname]);

  return null;
}
