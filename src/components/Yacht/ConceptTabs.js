"use client";
// Tabs for the example concepts. The FIRST panel is rendered on the server
// (children); the others come from a small chunk (src/lib/yacht/conceptPanels.js)
// that loads when a tab is hovered, focused or chosen (R5 technik P1-3: the six
// panels made the yacht HTML 625 KB). Without JavaScript the first concept is
// shown and the tab row is hidden (<noscript> style). WAI-ARIA tabs: arrow keys / Home / End move between tabs, the
// panel follows (automatic activation). A link to #konzept-<id> (from the
// Werfthalle sheet) opens the matching tab.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";
import Concept from "./ConceptPanel";
import { PANEL_IN } from "@/lib/yacht/motion";
import { useGeaendert } from "@/lib/ezarri/useGeaendert";

// Welle 2 (EN): the panels come in the page language (panelConcepts(locale)).
// Yacht team (31.10.2026): one promise PER LOCALE – a single module-level
// promise kept the first language for the whole session, so after a client
// navigation /en/yacht-interior → … → /de/yacht-interior the tabs showed the
// English panels on the German page.
const panelsPromises = new Map();
const loadPanels = (locale) => {
  if (!panelsPromises.has(locale)) panelsPromises.set(locale, import("@/lib/yacht/conceptPanels").then((m) => m.panelConcepts(locale)));
  return panelsPromises.get(locale);
};

export default function ConceptTabs({ tabs, children, label }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  const [active, setActive] = useState(0);
  const bewegt = useGeaendert(active); // Panel-Einblenden erst nach dem ersten Tabwechsel
  const refs = useRef([]);
  const [data, setData] = useState(null); // PANEL_CONCEPTS after the chunk loaded
  const [failed, setFailed] = useState(false);
  const want = useCallback(() => {
    loadPanels(locale).then(setData, () => {
      panelsPromises.delete(locale);
      setFailed(true);
    });
  }, [locale]);
  useEffect(() => {
    if (active > 0 && !data) want();
  }, [active, data, want]);

  const fromHash = useCallback(() => {
    const id = window.location.hash.replace(/^#konzept-/, "");
    const i = tabs.findIndex((t) => t.id === id);
    if (i >= 0) {
      setActive(i);
      return true;
    }
    return false;
  }, [tabs]);

  // the hash is read before the first paint after hydration (no flash of the
  // first tab, stable under load – QA round 2, P3.3)
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL hash once after hydration
    fromHash();
  }, [fromHash]);

  useEffect(() => {
    const onHash = () => {
      if (fromHash()) document.getElementById("konzepte-title")?.scrollIntoView({ block: "start" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [fromHash]);

  // QM r2: Reihe läuft (200 % Text, Handy) rechts über – dann ein Verlauf am Rand statt eines harten
  // Schnitts mitten im Buchstaben. Am Ende der Reihe verschwindet der Verlauf.
  const rowRef = useRef(null);
  const [mehrRechts, setMehrRechts] = useState(false);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const pruefe = () => setMehrRechts(el.scrollWidth - el.clientWidth - el.scrollLeft > 2);
    pruefe();
    const ro = new ResizeObserver(pruefe);
    ro.observe(el);
    el.addEventListener("scroll", pruefe, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", pruefe);
    };
  }, []);

  const onKey = (e) => {
    const n = tabs.length;
    const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: n - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    const i = (next + n) % n;
    setActive(i);
    refs.current[i]?.focus();
  };

  return (
    <div>
      <noscript>
        <style>{`[data-concept-tabs]{display:none!important}`}</style>
      </noscript>
      <div
        role="tablist"
        aria-label={label || t.conceptsLabel}
        data-concept-tabs=""
        ref={rowRef}
        onKeyDown={onKey}
        className={`-mx-gutter flex gap-x-6 overflow-x-auto border-b border-line px-gutter [scrollbar-width:none] lg:mx-0 lg:px-0 ${mehrRechts ? "[mask-image:linear-gradient(to_right,#000_calc(100%-4rem),transparent)]" : ""}`}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => (refs.current[i] = el)}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`konzept-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onPointerEnter={i > 0 ? want : undefined}
            onFocus={i > 0 ? want : undefined}
            className="ph-press relative -mb-px flex min-h-14 shrink-0 flex-col items-start justify-center border-b-2 border-transparent py-2 text-left transition-colors duration-(--duration-micro) hover:border-line-strong aria-selected:border-ink"
          >
            <span className="text-overline uppercase text-text-soft">{t.kicker}</span>
            <span className="text-ui text-text">{t.title}</span>
          </button>
        ))}
      </div>
      {tabs.map((t, i) => {
        const c = i > 0 && data ? data.find((x) => x.id === t.id) : null;
        return (
          <div
            key={t.id}
            id={`konzept-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            aria-busy={i > 0 && i === active && !c && !failed ? true : undefined}
            data-concept-panel=""
            hidden={i !== active}
            tabIndex={0}
            className={`scroll-mt-28 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus ${bewegt ? PANEL_IN : ""}`}
          >
            {i === 0 ? children : c ? <Concept c={c} /> : i === active ? (
              <div className="min-h-[24rem] pt-stack-m">
                <p className="text-small text-text-soft" role="status">
                  {failed ? t.conceptFailed : t.conceptLoading}
                </p>
                {/* Laden: Skelett in der Größe des Konzeptbilds (Schimmer, bei ruhiger Ansicht still) */}
                {!failed && <div aria-hidden="true" className="ph-skeleton mt-4 aspect-[16/9] w-full" />}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
