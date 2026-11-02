"use client";
// Ezarri-Konfigurator „Becken“ (Team B) – Steuerung, Zustand und Bühne.
//
// Zustand: state.js (Schema v1, ?k= im Link, Rückgängig 50 Schritte), Mischregeln
// mix.js, Flächen geometry.js, Mengen rechner/core.js (Team C). Jede Einstellung ist
// ein DOM-Steuerelement; die Bühne (2D sofort, 3D lazy) ist nur Ansicht.
// Konzept: Marktresearch/digital/features/ezarri-konzept.md §4, Doku: ezarri-konfigurator.md
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Link2, Printer, Heart, RotateCcw, Plus, Calculator, CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";
import SmartLink from "@/components/ui/SmartLink";
import { planTerminHref } from "@/lib/kuechenplaner/planTermin";
import { useCart } from "@/context/CartContext";
import SaveActions from "@/components/Pinterest/SaveActions"; // enthält IdeenboardAdd
import { ezarriPath } from "@/lib/ezarri/config";
import { anfrageHref as anfrageLink } from "@/components/Ezarri/Anfrage/AnfrageLink";
import { quantities } from "@/lib/ezarri/rechner/core";
import {
  BECKEN_START,
  createHistory,
  DEFAULT_STATE,
  encodeState,
  FORMEN,
  GRENZEN,
  LAGEN,
  MAX_KANAELE,
  MAX_MIX,
  pushHistory,
  redo,
  sanitizeState,
  SZENEN,
  undo,
  withBecken,
  withSzene,
} from "@/lib/ezarri/konfigurator/state";
import { addToMix, removeFromMix, replaceInMix } from "@/lib/ezarri/konfigurator/mix";
import { areas, TREPPEN_JE_FORM, treppeFuerForm } from "@/lib/ezarri/konfigurator/geometry";
import { buildIndex, hasAll } from "@/lib/ezarri/konfigurator/katalog-index";
import { useKonfCopy } from "./useKonfCopy";
import { facetsFor } from "@/lib/ezarri/facets";
import { wert } from "@/lib/ezarri/werte";
import Stage from "./Stage";
import EigenesFoto from "./EigenesFoto";
import POSTER from "@/lib/ezarri/konfigurator/poster.json";
import MixBand from "./MixBand";
import { Bestaetigen, Block, Choice, NumberField, Thumb, Toggle } from "./controls";
import { MengenTabelle } from "./Mengen";
import { merkeStandbild } from "@/lib/ezarri/konfigurator/standbild";
import { PANEL_IN, beobachteRuhig, istRuhig } from "@/lib/ezarri/motion";
import { useGeaendert } from "@/lib/ezarri/useGeaendert";
import useConciergeAvoid from "@/components/Ezarri/Welt/useConciergeAvoid";

/** Wasserwirkung-Rohwerte (Ezarri, deutsch erfasst) in der Sprache der Seite. */
// FR/IT: X.wasserwirkung (vom Server, je Filter-ID).
const wfLabel = (vals = [], locale = "de", X = null) =>
  vals.map((v) => {
    const w = facetsFor(locale).WASSERWIRKUNG.find((x) => x.value === v);
    return (w && X?.wasserwirkung?.[w.id]) ?? w?.label ?? v;
  });

const Picker = dynamic(() => import("./Picker"), { ssr: false });
const ArAnsicht = dynamic(() => import("./ArAnsicht"), { ssr: false });

function reducer(h, a) {
  if (a.type === "set") return pushHistory(h, a.state);
  if (a.type === "replace") return { ...h, present: a.state };
  if (a.type === "undo") return undo(h);
  if (a.type === "redo") return redo(h);
  return h;
}

function usePrefersReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    // Systemeinstellung UND html[data-motion="reduced" | "calm"], live (Motion-Runde)
    const upd = () => setR(istRuhig());
    upd();
    return beobachteRuhig(upd);
  }, []);
  return r;
}

export default function Konfigurator({ initialState, initialKatalog, linkInvalid = false, calendar = false }) {
  const {
    AKTIONEN,
    FORM_LABEL,
    FORMAT_LABEL,
    HINWEIS_MIX,
    KANAL_NAMEN,
    LAGE_LABEL,
    LED_LABEL,
    MASSE_LABEL,
    MODI_LABEL,
    RAND_LABEL,
    SEITE,
    SZENEN_LABEL,
    TABS,
    TREPPE_LABEL,
    WASSER_LABEL,
    WASSERTON_LABEL,
    ZEIT_LABEL,
    zusammenfassung,
    en,
    locale,
    t,
    credit,
  } = useKonfCopy();
  const [hist, dispatch] = useReducer(reducer, initialState, createHistory);
  const state = hist.present;
  const conciergeAusweichen = useConciergeAvoid();
  const [katalog, setKatalog] = useState(initialKatalog);
  const index = useMemo(() => buildIndex(katalog), [katalog]);
  const [loadingFull, setLoadingFull] = useState(false);
  const [tab, setTab] = useState("mosaik");
  const tabBewegt = useGeaendert(tab); // Panel-Einblenden erst nach dem ersten Tabwechsel
  const [picker, setPicker] = useState(null);
  const [vorher, setVorher] = useState(null);
  const [split, setSplit] = useState(0.5);
  const [hinweis, setHinweis] = useState(linkInvalid ? SEITE.linkUngueltig : "");
  const [stageMode, setStageMode] = useState("2d");
  const reducedMotion = usePrefersReduced();
  const apiRef = useRef(null);
  const merge = useRef({ key: "", t: 0 });
  const { addToCart } = useCart();
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Marker „hydriert“ für Tests, einmal nach dem Mount
  useEffect(() => setHydrated(true), []);

  // ---------------------------------------------------------------------------
  // Änderungen
  const update = useCallback(
    (fn, { mergeKey } = {}) => {
      const next = sanitizeState(fn(hist.present));
      const now = Date.now();
      if (mergeKey && merge.current.key === mergeKey && now - merge.current.t < 900) {
        dispatch({ type: "replace", state: next });
      } else dispatch({ type: "set", state: next });
      merge.current = { key: mergeKey || "", t: now };
    },
    [hist.present],
  );

  // Vollständiges Sortiment im Leerlauf bzw. bei Bedarf laden
  const loadFull = useCallback(async () => {
    if (!katalog.teil || loadingFull) return;
    setLoadingFull(true);
    try {
      const base = window.location.pathname.replace(/\/$/, "");
      const res = await fetch(`${base}/katalog`, { headers: { accept: "application/json" } });
      if (res.ok) setKatalog(await res.json());
    } catch {
      setHinweis(t("Das Sortiment konnte nicht geladen werden. Bitte laden Sie die Seite neu.", "The range could not be loaded. Please reload the page."));
    } finally {
      setLoadingFull(false);
    }
  }, [katalog.teil, loadingFull, t]);

  useEffect(() => {
    if (!katalog.teil) return undefined;
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1800));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = ric(() => loadFull(), { timeout: 3500 });
    return () => cancel(id);
  }, [katalog.teil, loadFull]);

  // Link-Zustand (?k=) mitschreiben
  const k = useMemo(() => encodeState(state), [state]);
  const ersterLink = useRef(true);
  useEffect(() => {
    // Erst nach der ersten Änderung schreiben (der Router ist dann sicher bereit;
    // ein frühes replaceState vor der Router-Initialisierung wirft in Next 16)
    if (ersterLink.current) {
      ersterLink.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      ["m", "ref", "serie", "szene"].forEach((p) => url.searchParams.delete(p));
      url.searchParams.set("k", k);
      window.history.replaceState(window.history.state, "", url.toString());
    }, 250);
    return () => clearTimeout(t);
  }, [k]);

  // Strg+Z / Strg+Umschalt+Z / Strg+Y
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) && t.type !== "range" && t.type !== "radio" && t.type !== "checkbox") return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------------------------------------------------------------------------
  // Abgeleitet
  const pool = state.szene === "pool" || state.szene === "whirlpool";
  const flaechen = useMemo(() => areas(state.becken, state.szene), [state.becken, state.szene]);
  const mengen = useMemo(() => quantities({ flaechen, margeProzent: 10, format: state.format, mix: state.mix }), [flaechen, state.format, state.mix]);
  const refOf = useCallback((e) => index.resolveRef(e.id, state.format, { ref: e.ref }), [index, state.format]);
  const mixText = state.modus === "pattern" && state.pattern ? `${t("Motiv-Raster", "Motif grid")} ${state.pattern.id}` : state.mix.map((e) => `${index.label(e.id)}${state.mix.length > 1 ? ` ${e.anteil} %` : ""}`).join(", ");
  const fuge = index.fuge(state.fuge);
  const summary = zusammenfassung({ szene: state.szene, becken: state.becken, mixText: `${t("Mosaik", "Mosaic")} ${mixText}`, fugeName: fuge?.name || "", formatLabel: FORMAT_LABEL[state.format] });
  const formatsOk = (f) => state.mix.every((e) => index.formatsOf(e.id).includes(f) || !index.mosaic(e.id));
  const refsForAnfrage = useMemo(() => {
    // abgeleitete Safe-Einträge (nur ?as-… bei Ezarri) laufen über ihre Produktseite
    const rid = (r) => r?.basis || r?.id;
    const ids = [...state.mix, ...state.kanaele].map((e) => rid(refOf(e))).filter(Boolean);
    if (state.modus === "pattern" && state.pattern) ids.push(...state.pattern.ids.map((id) => rid(index.resolveRef(id, state.format))).filter(Boolean));
    return [...new Set(ids)].slice(0, 6);
  }, [state, refOf, index]);
  const PROJEKT = { pool: "pool", whirlpool: "wellness", bad: "bad", kueche: "kueche" };
  // Vertrag §7.4 Nr. 5 (Team C): /ezarri/anfrage?art=…&ref=…&k=…
  const anfrageHref = (art) => anfrageLink({ art, refs: refsForAnfrage, k, m2: mengen.m2, projekt: PROJEKT[state.szene], quelle: "konfigurator" });
  const blattHref = `${ezarriPath("konfigurator", "blatt")}?k=${k}`;
  const rechnerHref = `${ezarriPath("rechner")}?k=${k}`;
  const corner = state.spezial.cornerId ? index.byId.get(state.spezial.cornerId) : index.spezialFuer(state.mix[0]?.id, "corner");
  const cove = state.spezial.coveId ? index.byId.get(state.spezial.coveId) : index.spezialFuer(state.mix[0]?.id, "cove");
  const mixLabels = Object.fromEntries(state.mix.map((e) => [e.id, index.label(e.id)]));
  const ready = hasAll(index, state);

  // ---------------------------------------------------------------------------
  // Auswahl
  // Fokus: Auslöser merken und nach dem Schließen zurückgeben (WCAG 2.4.3, QM P2-1)
  const pickerTrigger = useRef(null);
  // Der Auslöser kommt als Element vom Klick (event.currentTarget), nicht über
  // document.activeElement: Safari/iOS fokussiert Buttons beim Antippen nicht (QM R2 P2-2).
  const openPicker = (trigger, target) => {
    pickerTrigger.current = trigger || null;
    setPicker(target);
    if (katalog.teil) loadFull();
  };
  // Erste 9 Kacheln des Pickers vorladen, sobald „Mosaik wählen“ in Reichweite ist
  // (QM R2 P3: am Desktop waren sie nach 1,5 s noch leer)
  const vorgeladen = useRef(false);
  const vorladen = () => {
    if (vorgeladen.current) return;
    vorgeladen.current = true;
    // wie Thumb(): <picture> mit AVIF-Quelle, damit der Browser dieselbe Datei wählt (Cache-Treffer)
    for (const r of (index.katalog?.refs || []).filter((x) => !x.safe && x.typ !== "corner" && x.typ !== "cove" && x.typ !== "safe-step" && x.img).slice(0, 9)) {
      const pic = document.createElement("picture");
      const src = document.createElement("source");
      src.type = "image/avif";
      src.srcset = `${r.img}-600.avif 600w`;
      src.sizes = "190px";
      const img = document.createElement("img");
      pic.append(src, img);
      img.src = `${r.img}-600.webp`;
    }
  };
  const closePicker = useCallback(() => {
    setPicker(null);
    const t = pickerTrigger.current;
    const key = t?.dataset?.ezkFokus;
    pickerTrigger.current = null;
    // zwei Frames: Dialog ist geschlossen und die Auswahl neu gerendert
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Auslöser kann nach der Auswahl neu gerendert sein: dann über data-Attribut wiederfinden
        const el = (t?.isConnected ? t : key ? document.querySelector(`[data-ezk-fokus="${key}"]`) : null) || document.querySelector("[data-ezk-waehlen], [data-ezk-add]");
        if (!el) return;
        el.focus({ preventScroll: true });
        // Mobil verdeckt die angeheftete Bühne sonst die neue Auswahl (QM R2 P2-5):
        // Überschrift des Blocks unter die Bühne holen (scroll-margin in Block()).
        const block = el.closest("section");
        const h = block?.querySelector("h3") || el;
        const r = h.getBoundingClientRect();
        // Unterkante der angehefteten Bühne im angehefteten Zustand (Kopfzeile + volle Höhe),
        // nicht die momentane Lage: vor dem Anheften bzw. mit Kamera-Leiste weicht sie ab
        const buehne = document.querySelector("[data-ezk-buehne]");
        const top = Number.parseFloat(getComputedStyle(buehne || document.documentElement).top) || 0;
        const unterBuehne = buehne && !window.matchMedia("(min-width: 1024px)").matches ? top + buehne.offsetHeight : 0;
        // selbst rechnen statt scrollIntoView: scroll-padding der Seite und scroll-margin des
        // Blocks würden sich sonst addieren (Überschrift landete unterhalb des Bildschirms)
        if (r.top < unterBuehne + 8 || el.getBoundingClientRect().bottom > window.innerHeight) {
          const ziel = unterBuehne ? unterBuehne + 12 : (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0) * 16 + 72;
          window.scrollBy({ top: r.top - ziel, behavior: "instant" });
        }
      }),
    );
  }, []);
  const onPick = (r) => {
    const t = picker;
    closePicker();
    if (!t) return;
    if (t.art === "corner" || t.art === "cove") {
      update((s) => ({ ...s, spezial: { ...s.spezial, [t.art]: true, [`${t.art}Id`]: r.id } }));
      return;
    }
    const mid = r.mid;
    const basis = index.resolveRef(mid, r.fmt || state.format);
    const exact = basis && basis.id !== r.id ? r.id : undefined;
    if (t.art === "kanal") {
      update((s) => {
        const kanaele = [...s.kanaele];
        const neu = { id: mid, lage: kanaele[t.i]?.lage || (s.szene === "pool" ? "bahnen" : "wasserlinie"), breite: kanaele[t.i]?.breite || 25, ...(exact ? { ref: exact } : {}) };
        kanaele[t.i] = neu;
        return { ...s, kanaele };
      });
      return;
    }
    if (t.art === "pattern") {
      update((s) => {
        const ids = [...(s.pattern?.ids || [])];
        ids[t.i] = mid;
        return { ...s, pattern: { ...s.pattern, ids } };
      });
      return;
    }
    if (t.art === "ersetzen") {
      update((s) => {
        if (s.mix.length > 1 && !index.isMixable(mid)) {
          setHinweis(HINWEIS_MIX.allein);
          return { ...s, mix: [{ id: mid, anteil: 100, ...(exact ? { ref: exact } : {}) }], modus: "mosaik" };
        }
        return { ...s, mix: replaceInMix(s.mix, t.id, mid, exact) };
      });
      return;
    }
    if (t.art === "mix") {
      update((s) => {
        const res = addToMix(s.mix, mid, index.isMixable, { ref: exact });
        if (res.hinweis) setHinweis(HINWEIS_MIX[res.hinweis]);
        return { ...s, mix: res.mix, modus: res.mix.length > 1 ? "mix" : s.modus };
      });
      return;
    }
    // ein Mosaik: ersetzt alles, übernimmt das Format der gewählten Referenz
    update((s) => ({ ...s, mix: [{ id: mid, anteil: 100, ...(exact ? { ref: exact } : {}) }], format: r.fmt || s.format, modus: "mosaik" }));
  };

  const setModus = (m) => {
    if (m === "pattern") loadFull();
    update((s) => {
      if (m === "mosaik") return { ...s, modus: m, mix: [{ ...s.mix[0], anteil: 100 }] };
      if (m === "pattern") {
        const first = (katalog.patterns || [])[0];
        const pattern = s.pattern || (first ? { id: first.id, ids: [s.mix[0].id, "45", "38"] } : null);
        return pattern ? { ...s, modus: m, pattern } : s;
      }
      return { ...s, modus: m };
    });
  };

  const onVorher = () => {
    if (vorher) setVorher(null);
    else {
      setVorher(state);
      setSplit(0.5);
      setHinweis(t("Vorher festgehalten. Ändern Sie jetzt Mosaik, Fuge oder Wasser – links sehen Sie den Stand von vorher.", "“Before” kept. Now change mosaic, grout or water – on the left you see the earlier state."));
    }
  };

  const teilen = async () => {
    const url = `${window.location.origin}${window.location.pathname}?k=${k}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: t("Mein Becken mit Ezarri-Mosaik", "My pool with Ezarri mosaic"), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setHinweis(AKTIONEN.kopiert);
    } catch {
      setHinweis(`Link: ${url}`);
    }
  };

  // Rat 9,5 B2 (T2-Vertrag, src/lib/kuechenplaner/planTermin.js): „Termin mit diesem Plan“
  // – der Teilen-Link (?k=) geht als ?plan= an /termin (mit Kalender) bzw. die Beratung.
  const terminMitPlan = () => {
    const plan = `${window.location.origin}${window.location.pathname}?k=${k}`;
    window.location.assign(planTerminHref({ locale, calendar, planer: "ezarri", produkt: `${t("Ezarri-Konfigurator", "Ezarri configurator")}: ${mixText}`, plan, origin: window.location.origin }));
  };

  const merken = () => {
    const ref = refOf(state.mix[0]);
    addToCart({
      id: `ezarri-entwurf-${k.slice(-16)}`,
      name: `${t("Becken-Entwurf", "Pool design")}: ${mixText}`,
      image: null,
      category: "Ezarri-Konfigurator",
      kategories: "ezarri",
      url_slug: ref?.id || "konfigurator",
      href: `${ezarriPath("konfigurator")}?k=${k}`,
      produkte_id: `ezarri-${ref?.id || "entwurf"}`,
    });
  };

  const druckblatt = () => {
    // Standbild der aktuellen 3D-Kamera fürs Blatt; ohne 3D rendert das Blatt selbst
    if (stageMode !== "3d") return;
    try {
      const snap = apiRef.current?.snapshot?.(1400);
      if (snap) merkeStandbild(k, snap);
    } catch {
      /* Blatt rendert dann selbst */
    }
  };

  const [frageNeu, setFrageNeu] = useState(false);
  const neu = () => setFrageNeu(true);
  const neuBestaetigt = () => {
    setFrageNeu(false);
    update(() => DEFAULT_STATE);
    setVorher(null);
    setHinweis(t("Neu begonnen. Rückgängig holt den alten Stand zurück.", "Started again. Undo brings back the previous state."));
  };

  // ---------------------------------------------------------------------------
  // Tabs (WAI-ARIA Tabs, Pfeiltasten)
  const tabRefs = useRef({});
  const onTabKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    setTab(TABS[n].id);
    tabRefs.current[TABS[n].id]?.focus();
  };

  const masse = MASSE_LABEL[state.szene];
  const g = GRENZEN[state.szene];
  const b = state.becken;
  const rezepte = katalog.rezepte || [];
  const patterns = katalog.patterns || [];
  const aktivesRezept = rezepte.find((r) => r.mix.length === state.mix.length && r.mix.every((x, i) => state.mix[i]?.id === x.id && state.mix[i]?.anteil === x.anteil));

  return (
    // QM r1 (ezarri-yacht): Spalten über Container-Queries (rem = echte Root-Schrift → bei 200 %
    // Text einspaltig statt 330 px schmaler Seitenleiste); Handy quer (niedrig, ≥ 640 px breit)
    // zweispaltig mit Bühne links in voller Resthöhe statt 180 px hoher Bühne über allem.
    // Bei 200 % Text auf dem Handy (Container < 20rem) ist die Bühne nicht angeheftet.
    <div className="@container/ezk">
    {/* ::after reicht bis an den Bildschirmrand: der Concierge-Launcher prüft im Seitenrand (x = Breite − 20 px) */}
    <div className="relative data-concierge-avoid:after:absolute data-concierge-avoid:after:inset-y-0 data-concierge-avoid:after:left-full data-concierge-avoid:after:w-(--space-gutter) data-concierge-avoid:after:content-[''] @5xl/ezk:grid @5xl/ezk:grid-cols-12 @5xl/ezk:gap-8 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:grid [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:grid-cols-12 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:gap-5" data-ezk="" data-ezk-ready={hydrated ? "1" : undefined} data-concierge-avoid={conciergeAusweichen ? "" : undefined}>
      {/* Bühne: mobil oben angeheftet, Desktop links angeheftet */}
      {/* QM r2 (desktop-zoom): Einspaltig ab lg-Viewport (200 % Text) fluchtet die Bühne mit dem Inhalt und ist höher.
          QM r4: dort auch nicht angeheftet – die gestapelte Bühne lag beim Scrollen über der (ebenfalls
          angehefteten) Ezarri-Unterleiste und verdeckte Reiter und „Muster anfragen“. */}
      <div data-ezk-buehne="" className="sticky top-(--header-h) z-(--z-sticky) -mx-gutter h-[42svh] min-h-60 bg-paper @max-[20rem]/ezk:static @max-5xl/ezk:lg:static @max-5xl/ezk:lg:mx-0 @max-5xl/ezk:lg:h-[58svh] @5xl/ezk:top-[calc(var(--header-h)+3.5rem)] @5xl/ezk:z-0 @5xl/ezk:col-span-7 @5xl/ezk:mx-0 @5xl/ezk:h-[calc(100svh-var(--header-h)-5rem)] @5xl/ezk:min-h-[480px] @6xl/ezk:col-span-8 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:top-[calc(var(--header-h)+0.5rem)] [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:z-0 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:col-span-7 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:mx-0 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:h-[calc(100svh-var(--header-h)-1rem)] [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:min-h-0">
        <Stage
          state={state}
          index={index}
          vorher={vorher}
          split={split}
          onSplit={setSplit}
          onKamera={(id) => update((s) => ({ ...s, kamera: id }))}
          onUndo={() => dispatch({ type: "undo" })}
          onRedo={() => dispatch({ type: "redo" })}
          canUndo={hist.past.length > 0}
          canRedo={hist.future.length > 0}
          onVorher={onVorher}
          reducedMotion={reducedMotion}
          apiRef={apiRef}
          onMode={setStageMode}
          poster={k === POSTER.k ? POSTER : null}
          posterDaten={POSTER}
          aktion={`${k}|${tab}`}
        />
      </div>

      <div className="@container/ezs min-w-0 pt-4 @5xl/ezk:col-span-5 @5xl/ezk:pt-0 @6xl/ezk:col-span-4 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:col-span-5 [@media(orientation:landscape)_and_(max-height:500px)_and_(min-width:640px)]:pt-0">
        <p id="ezk-summary" className="sr-only" aria-live="polite">
          {summary}
        </p>
        {/* Kurzergebnis + eine Hauptaktion */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-ui text-text" data-ezk-kurz="">
            <span className="tabular-nums">{t("ca.", "approx.")} {en ? String(mengen.m2) : String(mengen.m2).replace(".", ",")} m²</span>
            <span className="text-text-soft"> · </span>
            <span className="tabular-nums">{mengen.kartons} {t("Kartons", "boxes")}</span>
            <span className="text-text-soft"> · </span>
            <span className="tabular-nums">{mengen.blaetter} {t("Blätter", "sheets")}</span>
          </p>
          <Button href={anfrageHref("muster")} variant="primary" className="w-full sm:w-auto" data-ezk-muster="">
            {AKTIONEN.muster}
          </Button>
        </div>
        <p role="status" aria-live="polite" className={hinweis ? "mb-4 border-l-2 border-see bg-surface-raised px-3 py-2 text-small text-text" : "sr-only"}>
          {hinweis}
        </p>

        <div role="tablist" aria-label={t("Einstellungen", "Settings")} className="mb-4 flex overflow-x-auto border-b border-line pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] [scrollbar-width:none]" onKeyDown={onTabKey}>
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => (tabRefs.current[t.id] = el)}
              type="button"
              role="tab"
              id={`ezk-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`ezk-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`ph-press min-h-12 shrink-0 border-b-2 px-3 text-ui transition-colors duration-(--duration-micro) ${tab === t.id ? "border-ink text-text" : "border-transparent text-text-soft hover:text-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---------------- Mosaik ---------------- */}
        <div role="tabpanel" id="ezk-panel-mosaik" aria-labelledby="ezk-tab-mosaik" hidden={tab !== "mosaik"} className={`pb-10 ${tabBewegt ? PANEL_IN : ""}`}>
          <Block title={t("Wie möchten Sie starten?", "How would you like to start?")} id="ezk-h-start">
            <Choice
              legend={t("Einstieg", "Start")}
              legendHidden
              name="modus"
              variant="cards"
              value={state.modus}
              onChange={setModus}
              options={Object.entries(MODI_LABEL).map(([id, o]) => ({ id, ...o }))}
            />
          </Block>

          {state.modus === "mosaik" && (
            <Block title={t("Ihr Mosaik", "Your mosaic")} id="ezk-h-mosaik">
              <AktuellesMosaik refe={refOf(state.mix[0])} index={index} />
              <button type="button" onClick={(e) => openPicker(e.currentTarget, { art: "mosaik", titel: t("Mosaik wählen", "Choose a mosaic") })} onPointerEnter={vorladen} onFocus={vorladen} className="ph-press min-h-12 w-full border border-ink px-4 text-ui transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper" data-ezk-waehlen="" data-ezk-fokus="waehlen">
                {t("Anderes Mosaik wählen", "Choose another mosaic")}
              </button>
            </Block>
          )}

          {(state.modus === "mix" || state.modus === "rezept") && (
            <Block title={state.modus === "rezept" ? t("Ezarri-Mischung", "Ezarri blend") : t("Ihre Mischung", "Your blend")} id="ezk-h-mix">
              {state.modus === "rezept" && (
                <label className="block text-small font-medium">
                  {t("Fertige Mischung laut Ezarri", "Ready-made blend according to Ezarri")}
                  <select
                    className="mt-1 h-12 w-full border border-line-control bg-paper px-2 text-ui"
                    value={aktivesRezept?.id || ""}
                    onChange={(e) => {
                      const r = rezepte.find((x) => x.id === e.target.value);
                      if (r) update((s) => ({ ...s, mix: r.mix.map((x) => ({ ...x })), modus: "rezept" }));
                    }}
                  >
                    <option value="">{aktivesRezept ? "" : t("Bitte wählen (oder unten verändern)", "Please choose (or change below)")}</option>
                    <optgroup label={t("Rezept laut Ezarri", "Recipe according to Ezarri")}>
                      {rezepte
                        .filter((r) => !r.unvollstaendig)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}&nbsp;· {r.serie}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label={t("Nach Produktfoto (Rezept unvollständig oder widersprüchlich)", "From product photo (recipe incomplete or contradictory)")}>
                      {rezepte
                        .filter((r) => r.unvollstaendig)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}&nbsp;· {r.serie}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
              )}
              {state.modus === "rezept" && aktivesRezept?.unvollstaendig && (
                <p className="border-l-2 border-notice bg-surface-raised px-3 py-2 text-small text-text" data-ezk-rezept-hinweis="">
                  {aktivesRezept.fehlend?.[0] === "Anteile"
                    ? t(
                        `Darstellung nach Produktfoto: Ezarris Rezeptangaben zu „${aktivesRezept.name}“ sind hier widersprüchlich, wir zeigen die fertige Referenz nach Produktfoto.`,
                        `Shown from the product photo: Ezarri's recipe details for “${aktivesRezept.name}” are contradictory here, so we show the ready-made reference from the product photo.`,
                        "rezept.widerspruch",
                        { name: aktivesRezept.name }
                      )
                    : t(
                        `Rezept unvollständig, Darstellung nach Produktfoto: Ezarri nennt für „${aktivesRezept.name}“ Bestandteile, die im Konfigurator-Sortiment von Ezarri fehlen. Wir zeigen deshalb die fertige Referenz mit den Farben aus dem Ezarri-Foto, nicht als veränderbare Mischung.`,
                        `Recipe incomplete, shown from the product photo: for “${aktivesRezept.name}”, Ezarri names components that are missing from Ezarri's configurator range. We therefore show the ready-made reference with the colours from the Ezarri photo, not as a changeable blend.`,
                        "rezept.unvollstaendig",
                        { name: aktivesRezept.name }
                      )}
                </p>
              )}
              {ready && (
                <MixBand
                  mix={state.mix}
                  index={index}
                  format={state.format}
                  onChange={(mix) => update((s) => ({ ...s, mix }), { mergeKey: "mix" })}
                  onRemove={(id) => update((s) => ({ ...s, mix: removeFromMix(s.mix, id) }))}
                  onReplace={(id, el) => openPicker(el, { art: "ersetzen", id, titel: t("Mosaik austauschen", "Replace mosaic"), nurMischbar: state.mix.length > 1 })}
                />
              )}
              {state.mix.length < MAX_MIX && (
                <button type="button" onClick={(e) => openPicker(e.currentTarget, { art: "mix", titel: t("Mosaik zur Mischung hinzufügen", "Add a mosaic to the blend"), nurMischbar: true })} className="flex min-h-12 w-full items-center justify-center gap-2 border border-ink px-4 text-ui hover:bg-ink hover:text-paper" data-ezk-add="" data-ezk-fokus="add">
                  <Plus className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  {t("Mosaik hinzufügen", "Add mosaic")} ({state.mix.length} {t("von", "of")} {MAX_MIX})
                </button>
              )}
              <p className="text-small text-text-soft">{t("Nicht mischbare Mosaike (laut Ezarri) stehen immer allein. Die Verteilung je Stein ist zufällig und bleibt beim Teilen gleich.", "Mosaics that cannot be blended (according to Ezarri) always stand on their own. The distribution per tile is random and stays the same when shared.")}</p>
              <button type="button" className="min-h-11 text-left text-ui underline decoration-line-strong underline-offset-4" onClick={() => update((s) => ({ ...s, seed: (s.seed * 7919 + 13) % 99991 || 7 }))}>
                {t("Verteilung neu würfeln", "Shuffle the distribution")}
              </button>
            </Block>
          )}

          {state.modus === "pattern" && (
            <Block title={t("Motiv-Raster", "Motif grid")} id="ezk-h-pattern">
              {!patterns.some((p) => p.maske) && <p className="text-small text-text-soft">{t("Raster werden geladen …", "Loading grids …")}</p>}
              <fieldset>
                <legend className="sr-only">Pattern</legend>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {patterns.map((p) => (
                    <label key={p.id} className="relative block">
                      <input
                        type="radio"
                        name="ezk-pattern"
                        checked={state.pattern?.id === p.id}
                        onChange={() => update((s) => ({ ...s, pattern: { id: p.id, ids: s.pattern?.ids || [s.mix[0].id, "45", "38"] } }))}
                        className="peer absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                        aria-label={t(`Raster ${p.name.replace("Pattern", "")}, ${p.kanaele} Farben`, `Grid ${p.name.replace("Pattern", "")}, ${p.kanaele} colours`, "raster.aria", { name: p.name.replace("Pattern", ""), n: p.kanaele })}
                      />
                      <Thumb img={p.bild} size="aspect-square w-full" className="pointer-events-none border-2 border-transparent peer-checked:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus" />
                    </label>
                  ))}
                </div>
              </fieldset>
              {state.pattern && (
                <ul className="space-y-2">
                  {state.pattern.ids.slice(0, patterns.find((p) => p.id === state.pattern.id)?.kanaele || 3).map((id, i) => {
                    const r = index.resolveRef(id, state.format);
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <Thumb img={r?.img} size="size-11" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-small text-text-soft">{KANAL_NAMEN[i]}</span>
                          <span className="block truncate text-ui">{index.label(id)}</span>
                        </span>
                        <button type="button" className="min-h-11 border border-line-control px-3 text-ui hover:border-ink" onClick={(e) => openPicker(e.currentTarget, { art: "pattern", i, titel: `${KANAL_NAMEN[i]}: ${t("Mosaik wählen", "choose a mosaic")}` })}>
                          {t("Ändern", "Change")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-small text-text-soft">{t("Patterns laut Ezarri, Steinraster aus den Ezarri-Vorschaubildern abgelesen.", "Patterns according to Ezarri, tile grids read from the Ezarri preview images.")} {credit("bild")}</p>
            </Block>
          )}

          <Block title={t("Format und Fuge", "Format and grout")} id="ezk-h-format">
            <Choice
              legend="Format"
              name="format"
              value={state.format}
              onChange={(f) =>
                update((s) => ({
                  ...s,
                  format: f,
                  mix: s.mix.map((e) => {
                    const cur = e.ref ? index.byId.get(e.ref) : null;
                    const m = index.mosaic(e.id);
                    const ref = cur?.safe && m?.safe[f] ? m.safe[f] : undefined;
                    return { id: e.id, anteil: e.anteil, ...(ref ? { ref } : {}) };
                  }),
                }))
              }
              options={["25", "50", "hexa"].map((f) => ({ id: f, label: FORMAT_LABEL[f], disabled: !formatsOk(f), hint: !formatsOk(f) ? t("Nicht für alle gewählten Mosaike erhältlich", "Not available for all chosen mosaics") : undefined }))}
            />
            <Choice
              legend={`${t("Fugenfarbe", "Grout colour")}: ${fuge?.name || ""}`}
              name="fuge"
              value={state.fuge}
              onChange={(id) => update((s) => ({ ...s, fuge: id }))}
              options={(katalog.fugen || []).map((f) => ({ id: f.id, label: f.name.replace(/\s\d+$/, ""), swatch: f.hex }))}
            />
          </Block>

          {pool && (
            <Block title={t("Kanäle und Streifen", "Lanes and bands")} id="ezk-h-kanaele">
              <p className="text-small text-text-soft">{t("Bis zu 3 Streifen mit eigenem Mosaik: Bahnmarkierung, Band an der Wasserlinie oder Stufenkanten.", "Up to 3 bands with their own mosaic: lane marking, band at the waterline or step edges.")}</p>
              <ul className="space-y-4">
                {state.kanaele.map((kn, i) => {
                  const r = refOf(kn);
                  return (
                    <li key={i} className="space-y-2 border border-line p-3">
                      <div className="flex items-center gap-3">
                        <Thumb img={r?.img} size="size-11" />
                        <span className="min-w-0 flex-1 truncate text-ui">{index.label(kn.id)}</span>
                        <button type="button" className="min-h-11 border border-line-control px-3 text-ui hover:border-ink" onClick={(e) => openPicker(e.currentTarget, { art: "kanal", i, titel: t("Mosaik für den Streifen", "Mosaic for the band") })}>
                          {t("Ändern", "Change")}
                        </button>
                        <button type="button" className="min-h-11 px-3 text-ui underline underline-offset-4" onClick={() => update((s) => ({ ...s, kanaele: s.kanaele.filter((_, j) => j !== i) }))}>
                          {t("Entfernen", "Remove")}
                        </button>
                      </div>
                      <Choice
                        legend={t("Lage", "Position")}
                        name={`lage-${i}`}
                        value={kn.lage}
                        onChange={(lage) => update((s) => ({ ...s, kanaele: s.kanaele.map((x, j) => (j === i ? { ...x, lage } : x)) }))}
                        options={LAGEN.filter((l) => state.szene === "pool" || l !== "bahnen").map((l) => ({ id: l, label: LAGE_LABEL[l] }))}
                      />
                      <NumberField label={t("Breite", "Width")} unit="cm" min={5} max={40} step={1} digits={0} value={kn.breite} onChange={(v) => update((s) => ({ ...s, kanaele: s.kanaele.map((x, j) => (j === i ? { ...x, breite: v } : x)) }), { mergeKey: `kb${i}` })} />
                    </li>
                  );
                })}
              </ul>
              {state.kanaele.length < MAX_KANAELE && (
                <button type="button" onClick={(e) => openPicker(e.currentTarget, { art: "kanal", i: state.kanaele.length, titel: t("Mosaik für den Streifen", "Mosaic for the band") })} className="flex min-h-12 w-full items-center justify-center gap-2 border border-ink px-4 text-ui hover:bg-ink hover:text-paper">
                  <Plus className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  {t("Streifen hinzufügen", "Add band")}
                </button>
              )}
            </Block>
          )}

          <Block title={t("Spezialteile", "Special pieces")} id="ezk-h-spezial">
            <Toggle
              label={t("Kanten mit Corner-Teilen", "Edges with Corner pieces")}
              sub={corner ? `${corner.name}${corner.fehlt ? t(" (laut Ezarri, Bild fehlt)", " (according to Ezarri, no image)") : ""}` : t("Für dieses Mosaik führt Ezarri kein Corner-Teil – wählen Sie ein passendes.", "Ezarri has no Corner piece for this mosaic – choose a suitable one.")}
              checked={state.spezial.corner}
              onChange={(v) => update((s) => ({ ...s, spezial: { ...s.spezial, corner: v } }))}
            />
            <Toggle
              label={t("Hohlkehlen mit Cove-Teilen", "Coves with Cove pieces")}
              sub={cove ? `${cove.name}${cove.fehlt ? t(" (laut Ezarri, Bild fehlt)", " (according to Ezarri, no image)") : ""}` : t("Für dieses Mosaik führt Ezarri kein Cove-Teil – wählen Sie ein passendes.", "Ezarri has no Cove piece for this mosaic – choose a suitable one.")}
              checked={state.spezial.cove}
              onChange={(v) => update((s) => ({ ...s, spezial: { ...s.spezial, cove: v } }))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 border border-line-control px-3 text-ui hover:border-ink" onClick={(e) => openPicker(e.currentTarget, { art: "corner", typen: ["corner"], titel: t("Corner-Teil wählen", "Choose a Corner piece") })}>
                {t("Corner wählen", "Choose Corner")}
              </button>
              <button type="button" className="min-h-11 border border-line-control px-3 text-ui hover:border-ink" onClick={(e) => openPicker(e.currentTarget, { art: "cove", typen: ["cove"], titel: t("Cove-Teil wählen", "Choose a Cove piece") })}>
                {t("Cove wählen", "Choose Cove")}
              </button>
            </div>
            <p className="text-small text-text-soft">{t("Corner deckt Kanten (Beckenkopf, Stufen, Bank), Cove die Kehle zwischen Boden und Wand. Die Längen stehen unter „Mengen“.", "Corner covers edges (coping, steps, bench), Cove the junction between floor and wall. The lengths are under “Quantities”.")}</p>
          </Block>
        </div>

        {/* ---------------- Becken ---------------- */}
        <div role="tabpanel" id="ezk-panel-becken" aria-labelledby="ezk-tab-becken" hidden={tab !== "becken"} className={`pb-10 ${tabBewegt ? PANEL_IN : ""}`}>
          <Block title={t("Wo liegt das Mosaik?", "Where will the mosaic go?")} id="ezk-h-szene">
            <Choice legend={t("Szene", "Scene")} legendHidden name="szene" variant="cards" value={state.szene} onChange={(sz) => update((s) => withSzene(s, sz))} options={SZENEN.map((id) => ({ id, label: SZENEN_LABEL[id] }))} />
          </Block>
          <Block title={t("Form und Maße", "Shape and dimensions")} id="ezk-h-masse">
            {FORMEN[state.szene].length > 1 && (
              <Choice
                legend={t("Form", "Shape")}
                name="form"
                value={b.form}
                onChange={(form) => update((s) => withBecken(s, { form, treppe: treppeFuerForm({ ...s.becken, form }) }))}
                options={FORMEN[state.szene].map((id) => ({ id, label: FORM_LABEL[id] }))}
              />
            )}
            {masse.l && <NumberField label={masse.l} value={b.l} min={g.l[0]} max={g.l[1]} step={state.szene === "pool" ? 0.5 : 0.1} onChange={(v) => update((s) => withBecken(s, { l: v, ...(s.szene === "whirlpool" && s.becken.form === "kreis" ? { b: v } : {}) }), { mergeKey: "l" })} />}
            {masse.b && !(state.szene === "whirlpool" && b.form === "kreis") && state.szene !== "kueche" && <NumberField label={masse.b} value={b.b} min={g.b[0]} max={g.b[1]} step={state.szene === "pool" ? 0.5 : 0.1} onChange={(v) => update((s) => withBecken(s, { b: v }), { mergeKey: "b" })} />}
            {masse.tFlach && <NumberField label={masse.tFlach} value={b.tFlach} min={g.tFlach[0]} max={g.tFlach[1]} step={0.05} digits={2} onChange={(v) => update((s) => withBecken(s, { tFlach: v }), { mergeKey: "tf" })} />}
            {masse.tTief && <NumberField label={masse.tTief} value={b.tTief} min={g.tTief[0]} max={g.tTief[1]} step={0.05} digits={2} onChange={(v) => update((s) => withBecken(s, { tTief: v, ...(s.szene === "whirlpool" ? { tFlach: v } : {}) }), { mergeKey: "tt" })} />}
            {state.szene === "pool" && <p className="text-small text-text-soft">{t("Der Boden fällt stufenlos von der flachen zur tiefen Seite.", "The floor slopes evenly from the shallow to the deep end.")}</p>}
            {state.szene !== "pool" && state.szene !== "whirlpool" && (
              <button type="button" className="min-h-11 text-left text-ui underline decoration-line-strong underline-offset-4" onClick={() => update((s) => ({ ...s, becken: { ...BECKEN_START[s.szene] } }))}>
                {t("Standardmaße", "Standard dimensions")}
              </button>
            )}
          </Block>
          {state.szene === "pool" && (
            <Block title={t("Treppe, Bank und Rand", "Steps, bench and edge")} id="ezk-h-ausstattung">
              <Choice legend={t("Treppe", "Steps")} name="treppe" value={treppeFuerForm(b)} onChange={(treppe) => update((s) => withBecken(s, { treppe }))} options={(TREPPEN_JE_FORM[b.form] || TREPPEN_JE_FORM.rechteck).map((id) => ({ id, label: TREPPE_LABEL[id] }))} />
              <Toggle label={t("Sitzbank unter Wasser", "Underwater bench")} sub={t("an der Längswand, Sitzfläche 50 cm unter dem Rand", "along the long wall, seat 50 cm below the edge")} checked={b.bank} onChange={(bank) => update((s) => withBecken(s, { bank }))} />
              <Choice legend={t("Beckenrand", "Pool edge")} name="rand" variant="cards" cols="grid-cols-1 @sm/ezs:grid-cols-3" value={b.rand} onChange={(rand) => update((s) => withBecken(s, { rand }))} options={Object.entries(RAND_LABEL).map(([id, o]) => ({ id, ...o }))} />
            </Block>
          )}
          {state.szene === "whirlpool" && (
            <Block title={t("Ausstattung", "Features")} id="ezk-h-whirl">
              <Toggle label={t("Umlaufende Sitzbank", "Bench all round")} checked={b.bank} onChange={(bank) => update((s) => withBecken(s, { bank }))} />
            </Block>
          )}
          {/* Runde 4 P5 (neuland P2-2): optional eigenes Foto als Hintergrund, nur lokal im Browser */}
          <Block title={t("Mit Foto Ihres Beckens vergleichen", "Compare with a photo of your pool")} id="ezk-h-eigenes-foto">
            <EigenesFoto state={state} index={index} />
          </Block>
        </div>

        {/* ---------------- Wasser & Licht ---------------- */}
        <div role="tabpanel" id="ezk-panel-wasser" aria-labelledby="ezk-tab-wasser" hidden={tab !== "wasser"} className={`pb-10 ${tabBewegt ? PANEL_IN : ""}`}>
          {pool ? (
            <>
              <Block title={t("Wasser", "Water")} id="ezk-h-wasser">
                <Choice legend={t("Zustand", "State")} name="wasser" value={state.wasser} onChange={(w) => update((s) => ({ ...s, wasser: w }))} options={Object.entries(WASSER_LABEL).map(([id, label]) => ({ id, label }))} />
                <Choice legend={t("Wasserart", "Type of water")} name="wasserton" variant="cards" cols="grid-cols-1 @sm/ezs:grid-cols-3" value={state.wasserton} onChange={(w) => update((s) => ({ ...s, wasserton: w }))} options={Object.entries(WASSERTON_LABEL).map(([id, o]) => ({ id, ...o }))} />
                <Wasserwirkung mix={state.mix} refOf={refOf} index={index} />
              </Block>
              <Block title={t("Licht", "Light")} id="ezk-h-licht">
                <Choice legend={t("Tageszeit", "Time of day")} name="zeit" value={state.zeit} onChange={(z) => update((s) => ({ ...s, zeit: z }))} options={Object.entries(ZEIT_LABEL).map(([id, label]) => ({ id, label }))} />
                <Choice legend={t("Unterwasser-Licht (LED)", "Underwater light (LED)")} name="led" value={state.led} onChange={(l) => update((s) => ({ ...s, led: l }))} options={Object.entries(LED_LABEL).map(([id, label]) => ({ id, label }))} />
                <p className="text-small text-text-soft">{t("Die Kaustik (Lichtnetz am Boden) wird aus Sonnenstand und Wasserbewegung berechnet. Bei „Bewegung reduzieren“ steht sie still.", "The caustics (light pattern on the floor) are calculated from the sun's position and water movement. With “reduce motion” they stand still.")}</p>
              </Block>
            </>
          ) : (
            <p className="text-ui text-text-soft">{t("Wasser und Tageslicht gelten für Pool und Whirlpool. Bad und Küche zeigen wir im Innenlicht.", "Water and daylight apply to pool and hot tub. Bathroom and kitchen are shown in indoor light.")}</p>
          )}
        </div>

        {/* ---------------- Mengen ---------------- */}
        <div role="tabpanel" id="ezk-panel-mengen" aria-labelledby="ezk-tab-mengen" hidden={tab !== "mengen"} className={`pb-10 ${tabBewegt ? PANEL_IN : ""}`}>
          <Block title={t("Flächen und Mengen", "Areas and quantities")} id="ezk-h-mengen">
            <MengenTabelle flaechen={flaechen} mengen={mengen} mixLabels={mixLabels} spezial={state.spezial} cornerName={corner?.name} coveName={cove?.name} />
          </Block>
          <Block title={t("Nächste Schritte", "Next steps")} id="ezk-h-weiter">
            <div className="grid gap-2">
              <Button href={anfrageHref("angebot")} variant="secondary" fullWidth>
                {AKTIONEN.angebot}
              </Button>
              <SmartLink href={rechnerHref} className="flex min-h-12 items-center gap-2 border border-line-control px-4 text-ui hover:border-ink">
                <Calculator className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {AKTIONEN.rechner}
              </SmartLink>
              <SmartLink href={blattHref} onClick={druckblatt} className="flex min-h-12 items-center gap-2 border border-line-control px-4 text-ui hover:border-ink" data-ezk-blatt="">
                <Printer className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {AKTIONEN.drucken}
              </SmartLink>
              <button type="button" onClick={teilen} className="flex min-h-12 items-center gap-2 border border-line-control px-4 text-left text-ui hover:border-ink" data-ezk-teilen="">
                <Link2 className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {AKTIONEN.teilen}
              </button>
              <button type="button" onClick={terminMitPlan} className="flex min-h-12 items-center gap-2 border border-line-control px-4 text-left text-ui hover:border-ink" data-ezk-termin="">
                <CalendarDays className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {t("Termin mit diesem Plan", "Appointment with this plan")}
              </button>
              <button type="button" onClick={merken} className="flex min-h-12 items-center gap-2 border border-line-control px-4 text-left text-ui hover:border-ink">
                <Heart className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {AKTIONEN.merken}
              </button>
              {/* Ideenboard + Pinterest (Inhaber-Entscheidung Nr. 14): die Mischung als
                  Karte mit Teilen-Link (?k=), Bild = Nahaufnahme des ersten Mosaiks
                  (Ezarri, Pinterest erlaubt). */}
              <SaveActions
                className="mt-1"
                card={{
                  type: "ezarriMix",
                  title: `${t("Becken-Entwurf", "Pool design")}: ${mixText}`,
                  subtitle: t("Ezarri-Konfigurator", "Ezarri configurator"),
                  href: `/${locale}${ezarriPath("konfigurator")}?k=${k}`,
                  image: refOf(state.mix[0])?.img ? `${refOf(state.mix[0]).img}-600.webp` : null,
                  quelle: "Ezarri",
                  room: state.szene === "pool" ? t("Pool", "Pool") : state.szene === "bad" ? t("Bad", "Bathroom") : state.szene === "kueche" ? t("Küche", "Kitchen") : t("Whirlpool", "Hot tub"),
                }}
                // Pin: 1600er-Fassung (Pinterest empfiehlt ≥ 1000 px Breite); Ziel
                // mit ?k= ist für Pinterestbot freigegeben (src/app/robots.js).
                pin={{ brand: "Ezarri", media: refOf(state.mix[0])?.img ? `${refOf(state.mix[0]).img}-1600.webp` : null }}
              />
              {pool && <ArAnsicht apiRef={apiRef} state={state} index={index} disabled={stageMode !== "3d"} />}
              <button type="button" onClick={neu} className="flex min-h-12 items-center gap-2 px-4 text-left text-ui text-text-soft hover:text-text">
                <RotateCcw className="size-4" aria-hidden="true" strokeWidth={1.5} />
                {AKTIONEN.neu}
              </button>
            </div>
          </Block>
          <Fotos mix={state.mix} refOf={refOf} index={index} />
        </div>
      </div>

      <Bestaetigen open={frageNeu} frage={AKTIONEN.neuFrage} text={t("Mosaik, Becken, Wasser und Licht gehen auf den Startentwurf zurück. Mit „Rückgängig“ holen Sie den jetzigen Stand zurück.", "Mosaic, pool, water and light go back to the starting design. With “Undo” you bring back the current state.")} ja={AKTIONEN.neu} onJa={neuBestaetigt} onNein={() => setFrageNeu(false)} />
      {picker && <Picker open={Boolean(picker)} onClose={closePicker} index={index} loading={katalog.teil} target={picker} onPick={onPick} />}
    </div>
    </div>
  );
}

function AktuellesMosaik({ refe, index }) {
  const { HINWEIS_MIX, t, locale, X } = useKonfCopy();
  if (!refe) return null;
  return (
    // QM r2 (200 % Text): Text rutscht unter das Musterbild, sobald daneben < 12 rem frei sind.
    <div className="flex flex-wrap gap-4">
      <Thumb img={refe.img} alt="" size="size-24" />
      <div className="min-w-[min(100%,12rem)] flex-1 text-ui">
        <p className="text-title">{index.label(refe.mid)}</p>
        <p className="text-small text-text-soft">
          {index.kollektion(refe.kol)}&nbsp;· {index.linie(refe.kol)}&nbsp;· {(refe.ob && X?.oberflaeche?.[refe.ob]) || wert("oberflaeche", refe.ob, locale) || t("Oberfläche laut Ezarri nicht angegeben", "surface not stated by Ezarri")}
        </p>
        {refe.wf?.length > 0 && <p className="text-small text-text-soft">{t("Wasserwirkung laut Ezarri", "Water effect according to Ezarri")}: {wfLabel(refe.wf, locale, X).join(", ")}</p>}
        {!refe.mx && <p className="text-small text-text-soft">{HINWEIS_MIX.nichtMischbar}</p>}
      </div>
    </div>
  );
}

function Wasserwirkung({ mix, refOf, index }) {
  const { t, locale, X } = useKonfCopy();
  const rows = mix.map((e) => ({ name: index.label(e.id), wf: refOf(e)?.wf || [] }));
  return (
    <div className="bg-surface-raised p-3">
      <p className="text-overline uppercase text-see">{t("Wasserwirkung", "Water effect")}</p>
      <ul className="mt-1 space-y-1 text-small text-text">
        {rows.map((r) => (
          <li key={r.name}>
            {r.name}: {r.wf.length ? `${t("laut Ezarri", "according to Ezarri")} ${wfLabel(r.wf, locale, X).join(", ")}` : t("laut Ezarri ohne Angabe", "not stated by Ezarri")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fotos({ mix, refOf, index }) {
  const { t, credit } = useKonfCopy();
  const refs = mix.map(refOf).filter(Boolean);
  const bilder = refs.flatMap((r) => [{ web: r.img, b: 600, h: 600, alt: t(`Ezarri ${index.label(r.mid)}, Glasmosaik, Nahaufnahme`, `Ezarri ${index.label(r.mid)}, glass mosaic, close-up`, "bild.nah", { name: index.label(r.mid) }) }, ...(r.anw || []).map((a) => ({ ...a, alt: t(`Becken mit Ezarri ${index.label(r.mid)}`, `Pool with Ezarri ${index.label(r.mid)}`, "bild.becken", { name: index.label(r.mid) }) }))]).filter((x) => x.web).slice(0, 6);
  if (!bilder.length) return null;
  return (
    <section className="border-t border-line py-5" aria-labelledby="ezk-h-fotos">
      <h3 id="ezk-h-fotos" className="mb-3 text-title">
        {t("Fotos des Mosaiks", "Photos of the mosaic")}
      </h3>
      <ul className="grid grid-cols-2 gap-2">
        {bilder.map((x) => (
          <li key={x.web}>
            <figure className="m-0">
              <picture className="block aspect-square overflow-hidden bg-linen">
                <source type="image/avif" srcSet={`${x.web}-600.avif`} />
                <img src={`${x.web}-600.webp`} alt={x.alt} width={600} height={600} loading="lazy" decoding="async" className="size-full object-cover" />
              </picture>
            </figure>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-small text-text-soft">{t("Projekte und Muster mit Ezarri-Mosaik", "Projects and samples with Ezarri mosaic")}&nbsp;· {credit("bild")}</p>
    </section>
  );
}
