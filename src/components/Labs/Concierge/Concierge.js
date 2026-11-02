"use client";

// KI-Concierge chat panel. Desktop: inline panel on the page. Mobile (<768px):
// bottom sheet opened from a floating button, swipe down on the handle to
// close. Streams NDJSON events from /api/labs/concierge. Without an API key
// ("unavailable") the panel is a compact inline contact card on every width.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, CalendarCheck, Copy, MapPin, MessageCircle, Phone, Square, X } from "lucide-react";
import ProductCards from "./ProductCards";
import RichText from "./RichText";
import s from "./concierge.module.css";
import { useTranslations } from "next-intl";
import { fetchWithTimeout, netErrorText, netTexts } from "../net.js";
import { RETENTION_DAYS } from "@/lib/concierge/retention";

const API = "/api/labs/concierge";
const MAX_CHARS = 800;
const HISTORY = 16;
const TOKEN_KEY = "ph-concierge-token";
// Anchor for the concierge section the privacy team still has to add.
const PRIVACY_HREF = "/de/datenschutz#ki-concierge";
// Cookie banner and settings dialog (src/components/Cookies/cookiecomponent.js).
// While one of them is on screen the floating button stays hidden, so it never
// covers a consent choice.
const COOKIE_UI = 'section[role="region"][aria-label="Cookie-Einstellungen"], #cookie-settings-title';
const COOKIE_BANNER = 'section[role="region"][aria-label="Cookie-Einstellungen"]';

// Height (px) of fixed/sticky UI that sits on the bottom edge of the viewport
// in the launcher's column – e.g. a page-wide mobile action bar ("Anrufen /
// Termin anfragen"). The launcher is lifted above it instead of being covered.
// Generic on purpose: the bar belongs to another team and may change.
function bottomOverlay(launcher) {
  if (typeof document.elementsFromPoint !== "function") return 0;
  const vh = window.innerHeight;
  const rect = launcher?.getBoundingClientRect();
  const xs = rect && rect.width ? [rect.left + 8, rect.left + rect.width / 2, rect.right - 8] : [window.innerWidth - 40];
  let lift = 0;
  for (const x of xs) {
    for (const el of document.elementsFromPoint(x, vh - 2)) {
      if (launcher && (el === launcher || launcher.contains(el))) continue;
      if (el === document.body || el === document.documentElement) continue;
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        const cs = getComputedStyle(node);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) break;
        const r = node.getBoundingClientRect();
        if (r.bottom >= vh - 4 && r.top < vh && r.height < vh * 0.6) lift = Math.max(lift, Math.round(vh - r.top));
        break;
      }
    }
  }
  return lift;
}

const CHIPS = [
  "Ein Sofa für ein helles Wohnzimmer",
  "Was führen Sie von Minotti?",
  "Outdoor-Möbel für die Terrasse am See",
  "Öffnungszeiten und Anfahrt",
  "Ich möchte einen Termin im Showroom",
  "Do you deliver to Switzerland?",
];

let nextId = 0;
const uid = () => `m${Date.now().toString(36)}${(nextId++).toString(36)}`;

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked – token lives in memory only
  }
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Plain text of an assistant message (what goes back as history).
const textOf = (msg) => msg.parts.filter((p) => p.type === "text").map((p) => p.text).join("").trim();

export default function Concierge({ mode: serverMode, devMock, showroom }) {
  const t = useTranslations();
  const [mockOn, setMockOn] = useState(serverMode === "mock");
  const mode = serverMode === "live" ? "live" : mockOn ? "mock" : "unavailable";
  const inline = mode === "unavailable";

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cookieUi, setCookieUi] = useState(false);
  const [fitH, setFitH] = useState(null);
  const [lift, setLift] = useState(0);
  const [token, setToken] = useState(null);
  const [storeConsent, setStoreConsent] = useState(false);
  const [consenting, setConsenting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [info, setInfo] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(0);

  const abortRef = useRef(null);
  const panelRef = useRef(null);
  const titleRef = useRef(null);
  const logRef = useRef(null);
  const spacerRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const scrimRef = useRef(null);
  const dragStart = useRef(null);
  const pinRef = useRef(null); // id of the user message pinned to the top
  const justSentRef = useRef(false);
  const followRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore per-tab consent once on mount
    setToken(readToken());
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Watch for the cookie banner (it mounts after hydration and unmounts once
  // the visitor chose). rAF-throttled: our own streaming also mutates the DOM.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      setCookieUi(Boolean(document.querySelector(COOKIE_UI)));
      // Desktop: while the banner is open, the inline panel is shortened so its
      // footer (Datenschutz / Widerruf) ends 12 px above the banner in the
      // first view (N4). Measured, not derived from header constants.
      const banner = document.querySelector(COOKIE_BANNER);
      const panel = panelRef.current;
      const r = banner?.getBoundingClientRect();
      if (!r || !r.height || !panel || window.matchMedia("(max-width: 767px)").matches) {
        setFitH(null);
      } else {
        const top = panel.getBoundingClientRect().top + window.scrollY;
        const room = Math.round(r.top - 12 - top);
        setFitH(room > 0 && room < panel.offsetHeight + 1 ? Math.max(320, room) : null);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const sheetOpen = isMobile && open && !inline;
  const launcherShown = isMobile && !inline && !open && !cookieUi;

  // A3/N1: keep the floating button clear of fixed bars at the bottom edge.
  // Re-measured on scroll/resize/DOM changes and once more after the bars'
  // slide transition has settled.
  useEffect(() => {
    if (!launcherShown) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the launcher is not on screen
      setLift(0);
      return undefined;
    }
    let frame = 0;
    let timer = 0;
    const measure = () => {
      frame = 0;
      setLift(bottomOverlay(launcherRef.current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      clearTimeout(timer);
      timer = setTimeout(measure, 450);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "inert", "hidden"] });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, [launcherShown]);

  // Mobile sheet is modal: lock page scroll, make everything else inert, trap
  // Tab, Escape closes, focus moves to the title and back to the launcher.
  useEffect(() => {
    if (!sheetOpen) return;
    const panel = panelRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const inerted = [];
    for (let node = panel; node && node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sib of node.parentElement.children) {
        if (sib === node || sib === scrimRef.current || sib.inert || /^(SCRIPT|STYLE|LINK)$/.test(sib.tagName)) continue;
        sib.inert = true;
        inerted.push(sib);
      }
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside || document.activeElement === titleRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const launcher = launcherRef.current;
    const frame = requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      for (const el of inerted) el.inert = false;
      window.removeEventListener("keydown", onKey);
      launcher?.focus();
    };
  }, [sheetOpen]);

  // Scrolling: after sending, the visitor's question moves to the top of the
  // log and the answer grows below it. A spacer at the end makes that possible
  // while the answer is still short. We only follow the stream when the
  // visitor scrolled to the very end themselves.
  useLayoutEffect(() => {
    const log = logRef.current;
    const spacer = spacerRef.current;
    if (!log || !spacer) return;
    const pinned = pinRef.current && log.querySelector(`[data-mid="${pinRef.current}"]`);
    if (!pinned) {
      spacer.style.height = "0px";
      return;
    }
    const used = spacer.offsetTop - pinned.offsetTop;
    const need = Math.max(0, log.clientHeight - used - 20);
    spacer.style.height = `${need}px`;
    if (justSentRef.current) {
      justSentRef.current = false;
      followRef.current = false;
      log.scrollTo({ top: Math.max(0, pinned.offsetTop - 12), behavior: reducedMotion() ? "auto" : "smooth" });
    } else if (followRef.current && need === 0) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages, status]);

  const onLogScroll = () => {
    const log = logRef.current;
    if (!log) return;
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 24;
    followRef.current = atEnd && spacerRef.current?.offsetHeight === 0;
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  const focusTitle = () => requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));

  const accept = async () => {
    if (consenting) return;
    setError("");
    setInfo("");
    setConsenting(true);
    try {
      const res = await fetch(`${API}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true, store: storeConsent, mock: mode === "mock" }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "consent");
      writeToken(data.token);
      setToken(data.token);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setError("Die Zustimmung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
    } finally {
      setConsenting(false);
    }
  };

  const stop = () => abortRef.current?.abort();

  const clearChat = () => {
    stop();
    pinRef.current = null;
    setMessages([]);
    setError("");
  };

  // Withdraw consent: the client forgets token and conversation at once
  // (optimistic, N2); the server deletes any stored transcript of this session
  // in the background and the notice is updated with the outcome.
  const revoke = async () => {
    if (revoking) return;
    const current = token;
    setRevoking(true);
    clearChat();
    setInput("");
    writeToken(null);
    setToken(null);
    setStoreConsent(false);
    setInfo("Ihre Einwilligung ist widerrufen. Ein gespeicherter Verlauf dieser Sitzung wird gelöscht …");
    focusTitle();
    let deleted = true;
    try {
      const res = await fetch(`${API}/consent`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: current }),
      });
      // 401: token not verifiable – then nothing can be linked to it.
      deleted = res.ok || res.status === 401;
    } catch {
      deleted = false;
    }
    setRevoking(false);
    setInfo(
      deleted
        ? "Ihre Einwilligung ist widerrufen. Ein gespeicherter Verlauf dieser Sitzung wurde gelöscht."
        : `Ihre Einwilligung ist widerrufen. Das Löschen eines gespeicherten Verlaufs ist fehlgeschlagen – bitte schreiben Sie uns an ${showroom?.email || "unser Team"}.`
    );
  };

  const updateAssistant = (id, fn) => setMessages((list) => list.map((m) => (m.id === id ? fn(m) : m)));

  const applyEvent = (id, ev) => {
    switch (ev.type) {
      case "text":
        setStatus("");
        updateAssistant(id, (m) => {
          const parts = [...m.parts];
          const last = parts[parts.length - 1];
          if (last?.type === "text") parts[parts.length - 1] = { ...last, text: last.text + ev.delta };
          else parts.push({ type: "text", text: ev.delta });
          return { ...m, parts };
        });
        break;
      case "reset":
        updateAssistant(id, (m) => {
          const parts = [...m.parts];
          if (parts[parts.length - 1]?.type === "text") parts.pop();
          return { ...m, parts };
        });
        break;
      case "products":
        updateAssistant(id, (m) => ({ ...m, parts: [...m.parts, { type: "products", items: ev.items }] }));
        break;
      case "handoff":
        updateAssistant(id, (m) => ({ ...m, parts: [...m.parts, { type: "handoff", ...ev }] }));
        break;
      case "notice":
      case "error":
        updateAssistant(id, (m) => ({ ...m, parts: [...m.parts, { type: "notice", text: ev.message }] }));
        break;
      case "status":
        setStatus(ev.label);
        break;
      default:
        break;
    }
  };

  const send = async (raw) => {
    const text = String(raw || "").trim().slice(0, MAX_CHARS);
    if (!text || busy || !token) return;
    setError("");
    setInput("");

    const userMsg = { id: uid(), role: "user", parts: [{ type: "text", text }] };
    const botMsg = { id: uid(), role: "assistant", parts: [] };

    // Text-only history, alternating roles, starting with a user turn.
    const history = [];
    for (const m of [...messages, userMsg]) {
      const content = m.role === "user" ? m.parts[0].text : textOf(m);
      if (!content) continue;
      if (history.length && history[history.length - 1].role === m.role) history.pop();
      history.push({ role: m.role, content: content.slice(0, m.role === "user" ? MAX_CHARS : 6000) });
    }
    let trimmed = history.slice(-HISTORY);
    while (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);

    pinRef.current = userMsg.id;
    justSentRef.current = true;
    setMessages((list) => [...list, userMsg, botMsg]);
    setBusy(true);
    setStatus("Einen Moment …");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      // R4: 30 s bis zur ersten Antwort, danach klare Meldung statt endlosem "Einen Moment …".
      const res = await fetchWithTimeout(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, messages: trimmed, mock: mode === "mock" }),
        signal: ctrl.signal,
      }, 30000);
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "consent_required") {
          writeToken(null);
          setToken(null);
          throw new Error("Ihre Zustimmung ist abgelaufen. Bitte bestätigen Sie den Hinweis erneut.");
        }
        if (data.error === "rate_limited") throw new Error("Sie haben viele Fragen in kurzer Zeit gestellt. Bitte warten Sie einen Moment.");
        if (data.error === "budget_exhausted") {
          throw new Error(`Der Concierge macht für heute Pause. Unser Team ist gerne persönlich für Sie da${showroom?.phone ? ` – ${showroom.phone}` : ""}.`);
        }
        if (data.error === "invalid_input") throw new Error("Die Nachricht ist zu lang oder der Verlauf zu umfangreich. Bitte neu beginnen.");
        throw new Error("Der Concierge ist gerade nicht erreichbar.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            applyEvent(botMsg.id, JSON.parse(line));
          } catch {
            // ignore a malformed line
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        applyEvent(botMsg.id, { type: "error", message: netErrorText(e, "Verbindung unterbrochen.", netTexts(t)) });
      }
    } finally {
      setBusy(false);
      setStatus("");
      abortRef.current = null;
      // Drop an assistant bubble that never got content.
      setMessages((list) => list.filter((m) => m.id !== botMsg.id || m.parts.length > 0));
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  // Swipe-to-close on the sheet handle.
  const onPointerDown = (e) => {
    if (!sheetOpen || e.target.closest("button")) return;
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragStart.current == null) return;
    setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragStart.current == null) return;
    if (drag > 90) setOpen(false);
    dragStart.current = null;
    setDrag(0);
  };

  const startMock = useCallback(() => {
    setMockOn(true);
    setOpen(true);
  }, []);

  const panelClass = [s.panel, open ? s.open : "", inline ? s.inline : ""].join(" ");
  const sheetStyle = {
    ...(fitH ? { maxHeight: `${fitH}px`, minHeight: `${Math.min(480, fitH)}px` } : null),
    ...(drag ? { transform: `translateY(${drag}px)`, transition: "none" } : null),
  };
  const launcherStyle = lift ? { bottom: `${lift + 12}px` } : undefined;

  return (
    <>
      {!inline && (
        <button
          ref={launcherRef}
          type="button"
          className={s.launcher}
          style={launcherStyle}
          data-lift={lift || undefined}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="concierge-panel"
          hidden={open || cookieUi}
        >
          <MessageCircle size={18} aria-hidden="true" />
          Concierge fragen
        </button>
      )}
      {sheetOpen && <div ref={scrimRef} className={s.scrim} onClick={() => setOpen(false)} aria-hidden="true" />}

      <section
        id="concierge-panel"
        ref={panelRef}
        className={panelClass}
        style={sheetStyle}
        aria-labelledby="concierge-title"
        role={sheetOpen ? "dialog" : "region"}
        aria-modal={sheetOpen ? true : undefined}
        inert={isMobile && !open && !inline ? true : undefined}
      >
        <header
          className={s.head}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {!inline && <span className={s.handle} aria-hidden="true" />}
          <div className={s.headText}>
            <div className={s.titleRow}>
              <h2 id="concierge-title" ref={titleRef} tabIndex={-1} className={s.title}>
                Concierge
              </h2>
              <span className={s.aiBadge}>KI</span>
              {mode === "mock" && (
                <span className={s.mockBadge} title="Mock-Modus: feste Beispielantworten, nichts geht an Anthropic">
                  Mock
                </span>
              )}
            </div>
            <p className={s.sub}>{inline ? "Persönliche Beratung im Showroom" : "Digitaler Einrichtungsberater"}</p>
          </div>
          {messages.length > 0 && (
            <button type="button" className={s.textBtn} onClick={clearChat}>
              Neu
            </button>
          )}
          {!inline && (
            <button type="button" className={s.close} onClick={() => setOpen(false)} aria-label="Concierge schließen">
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </header>

        {inline ? (
          <Unavailable showroom={showroom} devMock={devMock} onMock={startMock} />
        ) : !token ? (
          <div className={s.consent}>
            {info && (
              <p className={s.infoBox} role="status">
                {info}
              </p>
            )}
            <p className={s.consentLead}>Bevor es losgeht</p>
            <p>
              Der Concierge ist ein <strong>KI-System</strong> (Claude von Anthropic), kein Mensch. Antworten werden
              automatisch erzeugt und können Fehler enthalten; verbindlich sind nur Auskünfte unseres Teams. Preise,
              Lieferzeiten und Steuerfragen klären wir persönlich.
            </p>
            <p>
              {mode === "mock"
                ? "Im Mock-Modus werden Ihre Eingaben nicht an Anthropic übermittelt."
                : "Ihre Eingaben werden zur Beantwortung an Anthropic PBC (USA) übermittelt."}{" "}
              Bitte geben Sie keine persönlichen Daten ein. Ohne Ihre Zustimmung speichern wir den Verlauf nicht. Ihre
              Zustimmung können Sie jederzeit unten im Chat über „Einwilligung widerrufen“ zurückziehen.
            </p>
            <p>
              <Link href={PRIVACY_HREF} className={s.tapLink}>
                Details in der Datenschutzerklärung
              </Link>
            </p>
            <label className={s.check}>
              <input type="checkbox" checked={storeConsent} onChange={(e) => setStoreConsent(e.target.checked)} />
              <span>
                Optional: Verlauf zur Verbesserung des Concierge speichern (ohne IP-Adresse, Löschung nach {RETENTION_DAYS} Tagen,
                jederzeit widerrufbar).
              </span>
            </label>
            <button
              type="button"
              className={s.primary}
              onClick={accept}
              disabled={consenting}
              aria-busy={consenting || undefined}
            >
              {consenting ? "Einen Moment …" : "Verstanden – Concierge starten"}
            </button>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              ref={logRef}
              className={s.log}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={busy}
              onScroll={onLogScroll}
            >
              {messages.length === 0 && (
                <div className={s.welcome}>
                  <span className={s.ornament} aria-hidden="true" />
                  <p className={s.welcomeTitle}>Guten Tag.</p>
                  <p>
                    Ich zeige Ihnen Produkte und Marken aus unserem Katalog, gebe Einrichtungstipps und vermittle Sie an
                    unser Team. Schreiben Sie in Ihrer Sprache.
                  </p>
                  <div className={s.chips} role="group" aria-label="Vorschläge">
                    {CHIPS.map((c) => (
                      <button key={c} type="button" className={s.chip} onClick={() => send(c)} disabled={busy}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} data-mid={m.id} className={s.user}>
                    <span className="sr-only">Sie: </span>
                    {m.parts[0].text}
                  </div>
                ) : (
                  <article key={m.id} className={s.bot} aria-label="Antwort des KI-Concierge">
                    <span className={s.botLabel} aria-hidden="true">
                      KI-Concierge
                    </span>
                    {m.parts.map((p, i) => {
                      if (p.type === "text")
                        return (
                          <div key={i} className={s.prose}>
                            <RichText text={p.text} />
                          </div>
                        );
                      if (p.type === "products") return <ProductCards key={i} items={p.items} />;
                      if (p.type === "handoff") return <Handoff key={i} {...p} />;
                      return (
                        <p key={i} className={s.softNotice}>
                          {p.text}
                        </p>
                      );
                    })}
                  </article>
                )
              )}
              {busy && status && (
                <p className={s.status} role="status">
                  <span className={s.dots} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  {status}
                </p>
              )}
              <div ref={spacerRef} className={s.spacer} aria-hidden="true" />
            </div>

            <form
              className={s.composer}
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <label htmlFor="concierge-input" className="sr-only">
                Ihre Nachricht an den KI-Concierge
              </label>
              <textarea
                id="concierge-input"
                ref={inputRef}
                className={s.input}
                rows={1}
                maxLength={MAX_CHARS}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Wonach suchen Sie?"
                aria-describedby="concierge-hint"
              />
              {busy ? (
                <button type="button" className={s.send} onClick={stop} aria-label="Antwort stoppen">
                  <Square size={14} aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className={s.send} disabled={!input.trim()} aria-label="Nachricht senden">
                  <ArrowUp size={18} aria-hidden="true" />
                </button>
              )}
            </form>
            <div className={s.foot}>
              <p id="concierge-hint" className={s.hint}>
                KI-generierte Antworten · keine Preise, keine verbindlichen Auskünfte
                {input.length > MAX_CHARS - 150 && ` · ${MAX_CHARS - input.length} Zeichen übrig`}
              </p>
              <div className={s.footLinks}>
                <Link href={PRIVACY_HREF} className={s.tapLink}>
                  Datenschutz
                </Link>
                <button type="button" className={s.tapLink} onClick={revoke} disabled={revoking} aria-busy={revoking || undefined}>
                  {revoking ? "Wird widerrufen …" : "Einwilligung widerrufen"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

// No API key: a calm, compact contact card instead of an empty chat.
function Unavailable({ showroom, devMock, onMock }) {
  const phone = showroom?.phone;
  return (
    <div className={s.notice}>
      <span className={s.ornament} aria-hidden="true" />
      <p className={s.consentLead}>Persönlich beraten wir am liebsten.</p>
      <p>
        Der digitale Concierge ist auf diesem Server noch nicht aktiviert. Unser Team berät Sie gerne – telefonisch oder
        bei einem Kaffee im Showroom in Lochau.
      </p>
      {showroom?.hours?.length > 0 && (
        <dl className={s.hours}>
          {showroom.hours.map((h) => (
            <div key={h.days} className={s.hoursRow}>
              <dt>{h.days}</dt>
              <dd>{h.time}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className={s.noticeActions}>
        <Link href="/de/beratung?quelle=concierge" className={s.primary}>
          <CalendarCheck size={16} aria-hidden="true" /> Beratung anfragen
        </Link>
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={s.secondary}>
            <Phone size={16} aria-hidden="true" /> {phone}
          </a>
        )}
        {showroom?.directions && (
          <a href={showroom.directions} className={s.secondary} target="_blank" rel="noopener noreferrer">
            <MapPin size={16} aria-hidden="true" /> Route planen
          </a>
        )}
      </div>
      {devMock && (
        <button type="button" className={s.devBtn} onClick={onMock}>
          Mock-Modus testen (nur Entwicklung)
        </button>
      )}
    </div>
  );
}

function Handoff({ topic, summary, href, phone }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked – text stays selectable
    }
  };
  return (
    <div className={s.handoff}>
      <p className={s.handoffTitle}>Persönliche Beratung{topic ? ` · ${topic}` : ""}</p>
      {summary && (
        <div className={s.summary}>
          <p className={s.summaryLabel}>Notiz für Ihre Anfrage (KI-Entwurf, wird nicht gespeichert):</p>
          <p>{summary}</p>
          <button type="button" className={s.textBtn} onClick={copy}>
            <Copy size={14} aria-hidden="true" /> {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
      )}
      <div className={s.handoffActions}>
        <Link href={href} className={s.primary}>
          <CalendarCheck size={16} aria-hidden="true" /> Termin anfragen
        </Link>
        <a href={`tel:${phone.replace(/\s+/g, "")}`} className={s.secondary}>
          <Phone size={16} aria-hidden="true" /> {phone}
        </a>
      </div>
    </div>
  );
}
