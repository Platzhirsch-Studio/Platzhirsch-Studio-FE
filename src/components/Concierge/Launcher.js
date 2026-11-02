"use client";

// Sitewide KI-Concierge launcher (concierge-sitewide-architektur.md §3).
// A quiet button bottom right – never opens by itself, no greeting bubble, no
// pulse, no counter, no entrance animation. Mounted by client-layout.js after
// idle. Budget ≤ 3 KB gzip: no lucide, no motion, no next-intl; the panel
// (Panel.js) is a separate chunk, fetched on hover/focus/touch, mounted on
// click. No request before the click.
// Hidden while the cookie banner/dialog or another modal dialog is open; lifted
// 12 px above fixed bars at the bottom edge (MobileCtaBar); z 44 = always
// below the CTA bar (45), menus (50), overlays (60) and toasts (70).
// r7-p1 (ux P1-4): phones (< 768 px) get NO floating button – the KI entry
// sits in the MobileCtaBar, which opens the panel through window.phConcierge
// (or links to /concierge before this island is mounted). On the request
// pages (/beratung, /kontakt in all languages) there is no idle button (a
// conversation already open stays), and while focus is inside a form field
// the button hides. From 768 px (QM shell-home 01.11.2026): a vertical tab
// flush with the right edge, 40 px wide – always inside the page gutter
// (≥ 48 px), so it never lies over tiles, prices or text of the content
// column, and it carries the same full label at every scroll position
// (r4-gesamtwerk Nr. 4; the former compact form is gone). Lifted above bars.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { clearDnd, dndStore, hiddenOn, setDnd, yieldToConsent } from "./flags";
import s from "./launcher.module.css";

const L = {
  de: ["Concierge", "KI-Concierge öffnen. Sie schreiben mit einer KI.", "Gespräch fortsetzen", "KI-Concierge wieder einblenden", "KI", "Entwurf kopiert – Gespräch fortsetzen"],
  en: ["Concierge", "Open the AI concierge. You are writing to an AI.", "Continue conversation", "Show the AI concierge again", "AI", "Draft copied – continue conversation"],
  fr: ["Concierge", "Ouvrir le concierge IA. Vous écrivez à une IA.", "Reprendre la conversation", "Réafficher le concierge IA", "IA", "Brouillon copié – reprendre la conversation"],
  it: ["Concierge", "Aprite il concierge IA. State scrivendo con un’IA.", "Riprendete la conversazione", "Mostrate di nuovo il concierge IA", "IA", "Bozza copiata – riprendete la conversazione"],
};
const loadPanel = () => import("./Panel");
// Request pages: first segment after the locale (ROUTES.beratung/kontakt).
const FORM_PAGES = ["beratung", "consultation", "conseil", "consulenza", "kontakt", "contact", "contatto"];
const PHONE = "(max-width: 767px)";
const phoneStore = {
  subscribe(fn) {
    const mq = matchMedia(PHONE);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  },
  get: () => matchMedia(PHONE).matches,
  server: () => false,
};

// Fix-Runde 1 (F2): Im Produktions-Build erscheint der Knopf nur, wenn der
// Concierge nutzbar ist (Runde 5: conciergeLive() – API-Schlüssel, kein Mock,
// kein Not-Aus). Eine kleine
// GET-Abfrage ohne Daten an /api/labs/status, Ergebnis je Sitzung gemerkt.
// Im Dev-Server immer an (Mock zum Testen).
const CHECK = process.env.NODE_ENV === "production";
const AVAIL_KEY = "ph-concierge:avail";
function cachedAvail() {
  try {
    const v = sessionStorage.getItem(AVAIL_KEY);
    return v === "1" ? true : v === "0" ? false : null;
  } catch {
    return null;
  }
}

// A stored conversation (sessionStorage, same tab) → "Gespräch fortsetzen".
function storedChat() {
  try {
    const v = JSON.parse(sessionStorage.getItem("ph-concierge:chat") || "null");
    return { has: Array.isArray(v?.messages) && v.messages.length > 0, resume: Boolean(v?.resume) };
  } catch {
    return { has: false, resume: false };
  }
}

// QM shell-home r2: the tab lay over the hero photo, which runs to the right
// viewport edge (home from 1280 px, its caption on landscape phones). While
// such a full-bleed stage sits under the tab's column it stays hidden; it
// comes back as soon as the stage scrolls away. Probed at fixed points of the
// tab's column (the hidden button has no box), the button itself is skipped.
const AVOID = "[data-wow-stage],[data-concierge-avoid]";
export function overAvoid(doc = document, w = innerWidth, h = innerHeight) {
  if (!doc.elementsFromPoint) return false;
  const x = w - 20;
  for (const y of [h - 24, h - 96, h - 168]) {
    if (y < 0) continue;
    for (const el of doc.elementsFromPoint(x, y)) {
      if (el.closest?.("[data-concierge-launcher]")) continue;
      if (el.closest?.(AVOID)) return true;
    }
  }
  return false;
}

function blocked(min) {
  if (document.querySelector("[data-consent-bar],#cookie-settings-title")) return true;
  // A form step in progress: no button next to the fields.
  if (document.activeElement?.closest?.("form")) return true;
  if (!min && !matchMedia(PHONE).matches && overAvoid()) return true;
  try {
    return Boolean(document.querySelector("dialog:modal:not(#concierge-panel)"));
  } catch {
    return false;
  }
}

// Height of fixed/sticky UI on the bottom edge in the button's column.
function lift(btn) {
  const vh = innerHeight;
  const r = btn?.getBoundingClientRect();
  let h = 0;
  if (!r?.width || !document.elementsFromPoint) return 0;
  for (const x of [r.left + 8, r.right - 8]) {
    for (let el of document.elementsFromPoint(x, vh - 2)) {
      if (btn.contains(el)) continue;
      for (; el && el !== document.body; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.visibility === "hidden" || +cs.opacity === 0) break;
        const b = el.getBoundingClientRect();
        if (b.bottom >= vh - 4 && b.top < vh && b.height < vh * 0.6) h = Math.max(h, Math.round(vh - b.top));
        break;
      }
    }
  }
  return h;
}

export default function Launcher({ locale }) {
  const l = L[locale] || L.de;
  const pathname = usePathname() || "";
  const dnd = useSyncExternalStore(dndStore.subscribe, dndStore.get, dndStore.server);
  const [view, setView] = useState("closed"); // closed | open | min
  const [Panel, setPanel] = useState(null);
  const [hide, setHide] = useState(true);
  const [up, setUp] = useState(0);
  const [hasChat, setHasChat] = useState(false);
  // Path on which "Entwurf kopiert" was set: the bar says it only there (QA2 P3-6).
  const [copiedOn, setCopiedOn] = useState(null);
  const copiedBar = copiedOn !== null && copiedOn === pathname;
  const btn = useRef(null);
  const wasOpen = useRef(false);
  const [avail, setAvail] = useState(!CHECK);
  const phone = useSyncExternalStore(phoneStore.subscribe, phoneStore.get, phoneStore.server);
  const off = hiddenOn(pathname) || !avail;
  // Request pages: no idle button. A conversation the visitor started (open
  // panel, "Gespräch fortsetzen") stays, e.g. after a Termin proposal led here.
  const formPage = FORM_PAGES.includes(pathname.split("/")[2]);

  // Phones: the CTA bar carries the entry; the bar calls window.phConcierge.
  useEffect(() => {
    if (off) return undefined;
    window.phConcierge = () => {
      clearDnd();
      setCopiedOn(null);
      loadPanel().then((m) => {
        setPanel(() => m.default);
        setView("open");
      });
    };
    return () => {
      delete window.phConcierge;
    };
  }, [off]);

  useEffect(() => {
    if (!CHECK) return undefined;
    const c = cachedAvail();
    if (c !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage once after mount
      setAvail(c);
      return undefined;
    }
    let alive = true;
    fetch("/api/labs/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { concierge: false }))
      .catch(() => ({ concierge: false }))
      .then((j) => {
        const ok = j?.concierge === true;
        try {
          sessionStorage.setItem(AVAIL_KEY, ok ? "1" : "0");
        } catch {
          /* storage blocked */
        }
        if (alive) setAvail(ok);
      });
    return () => {
      alive = false;
    };
  }, []);

  const prefetch = () => loadPanel().catch(() => {});
  const show = (v) =>
    loadPanel().then((m) => {
      setPanel(() => m.default);
      setView(v);
    });

  // Back after a full page load caused by a proposal: show the bar, not the panel.
  useEffect(() => {
    const stored = storedChat();
    if (stored.resume) show("min");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage once after mount
    else if (stored.has) setHasChat(true);
    const onClick = (e) => e.target.closest?.("[data-concierge-show]") && clearDnd();
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    // Also measured for the "KI" tab (dnd): it sits at launcher height, above fixed bars.
    if (off || view === "open") return undefined;
    let f = 0;
    let tm = 0;
    const measure = () => {
      f = 0;
      setHide(blocked(view === "min"));
      setUp(lift(btn.current));
    };
    const go = () => {
      if (!f) f = requestAnimationFrame(measure);
      clearTimeout(tm);
      tm = setTimeout(measure, 450);
    };
    go();
    addEventListener("scroll", go, { passive: true });
    addEventListener("resize", go, { passive: true });
    addEventListener("focusin", go);
    addEventListener("focusout", go);
    const mo = new MutationObserver(go);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open"] });
    const root = document.documentElement.style;
    // QM shell-home r3: only while a button is really drawn. Phones (and the
    // request pages) render none in the closed state – the footer spacer
    // (data-concierge-gap) then left 64 px of empty band under the last row.
    if (!((phone || formPage) && view === "closed")) root.setProperty("--ph-concierge-h", "64px");
    else root.removeProperty("--ph-concierge-h");
    return () => {
      cancelAnimationFrame(f);
      clearTimeout(tm);
      removeEventListener("scroll", go);
      removeEventListener("resize", go);
      removeEventListener("focusin", go);
      removeEventListener("focusout", go);
      mo.disconnect();
      root.removeProperty("--ph-concierge-h");
    };
  }, [off, dnd, view, phone, formPage]);

  // Open side panel (≥ 768 px, non-modal) and a cookie bar that shows up
  // later: shrink above it or, if too little room is left, minimise.
  useEffect(() => {
    if (view !== "open" || phone) return undefined;
    const check = () => {
      const bar = document.querySelector("[data-consent-bar]");
      if (!bar) return;
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
      if (yieldToConsent({ barH: bar.getBoundingClientRect().height, vh: innerHeight, headerH })) setView("min");
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    addEventListener("resize", check, { passive: true });
    return () => {
      mo.disconnect();
      removeEventListener("resize", check);
    };
  }, [view, phone]);

  // Focus back on the button when the panel closes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- label follows the stored chat
    if (view !== "open") setHasChat(storedChat().has);
    if (view === "open") wasOpen.current = true;
    else if (wasOpen.current && view === "closed") {
      wasOpen.current = false;
      btn.current?.focus();
    }
  }, [view]);

  if (off) return null;
  if (dnd && !phone && !formPage) {
    return (
      <button
        ref={btn}
        type="button"
        className={s.tab}
        style={up ? { bottom: `${up + 14}px` } : undefined}
        onClick={clearDnd}
        aria-label={l[3]}
        data-concierge-tab=""
      >
        {l[4]}
      </button>
    );
  }
  const min = view === "min";
  const resume = min || hasChat;
  const resumeText = min && copiedBar ? l[5] : l[2];
  return (
    <>
      {view !== "open" && !((phone || formPage) && view === "closed") && (
        <button
          ref={btn}
          type="button"
          className={s.btn}
          data-concierge-launcher=""
          data-min={min || undefined}
          hidden={hide}
          style={up ? { bottom: `${up + 12}px` } : undefined}
          aria-expanded="false"
          aria-controls="concierge-panel"
          aria-label={resume ? `${resumeText} – ${l[0]} ${l[4]}` : l[1]}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          onTouchStart={prefetch}
          onClick={() => {
            setCopiedOn(null);
            show("open");
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
            <path d="M12 8.2l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="currentColor" stroke="none" />
          </svg>
          <span className={s.label}>{resume ? resumeText : l[0]}</span>
          <span className={s.ai}>{l[4]}</span>
        </button>
      )}
      {Panel && (
        <Panel
          open={view === "open"}
          locale={locale}
          pathname={pathname}
          onClose={() => setView("closed")}
          onMinimize={(o) => {
            if (o?.copied) setCopiedOn(pathname);
            setView("min");
          }}
          onHide={(mode) => {
            setView("closed");
            wasOpen.current = false;
            setDnd(mode);
          }}
        />
      )}
    </>
  );
}
