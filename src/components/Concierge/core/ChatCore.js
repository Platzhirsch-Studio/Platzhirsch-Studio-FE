"use client";

// Chat core of the sitewide concierge (lazy chunk): consent, NDJSON stream,
// history in sessionStorage, product cards, handoff, website-agent proposals.
// The shell (Panel.js) decides desktop side panel vs. mobile bottom sheet.
// Same API as the Labs page (/api/labs/concierge); surface:"site" plus a page
// context per user turn turn on the proposals.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, CalendarCheck, Copy, MapPin, MessageCircle, MoreHorizontal, Phone, RotateCcw, Square, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ROUTES } from "@/utils/routing";
import RichText from "@/components/Labs/Concierge/RichText";
import { fetchWithTimeout, LabsTimeoutError } from "@/components/Labs/net.js";
import { RETENTION_DAYS } from "@/lib/concierge/retention";
import { whatsappCopy } from "@/lib/whatsapp/copy";
import { devPreviewActive } from "@/lib/whatsapp/preview";
import { collectContext } from "./pageContext";
import { executeAction, wishlistItemsOf } from "./executeAction";
import { loadChat, markResume, readToken, saveChat, writeToken } from "./session";
import { fill } from "./texts";
import SiteProductCards from "./SiteProductCards";
import ActionCard from "./ActionCard";
import s from "../panel.module.css";

const API = "/api/labs/concierge";
const MAX_CHARS = 800;
const HISTORY = 16;
const NO_TEXT = "[Karten oder Vorschläge angezeigt]";
const MODE_SLOW_MS = 4000;
const MODE_TIMEOUT_MS = 10000;
const MODE_GIVE_UP_MS = 60000;
const CHAT_BUDGET_MS = 30000;
const AUTO_RETRY_MS = 600;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const tm = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(tm);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });

// Network failure while sending (WebKit "Load failed", Chromium "Failed to fetch").
const isNetworkError = (e) => e instanceof TypeError || /load failed|failed to fetch|networkerror/i.test(e?.message || "");

// Error with a text that is already in the visitor's language.
class UiError extends Error {
  constructor(message, retry = false) {
    super(message);
    this.retry = retry;
  }
}

/** Localised error text: offline only when the browser says so, else "Verbindung unterbrochen". */
function errorText(e, t) {
  if (e instanceof UiError) return { text: e.message, retry: e.retry };
  if (e?.name === "LabsTimeoutError") return { text: t.errTimeout, retry: true };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { text: t.errOffline, retry: true };
  return { text: t.errCut, retry: true };
}

const samePath = (a, b) => {
  const norm = (p) => {
    try {
      return decodeURIComponent(p).replace(/\/+$/, "") || "/";
    } catch {
      return p;
    }
  };
  return norm(a) === norm(b);
};

/** Did the browser arrive at the (checked) target of a navigation proposal? */
function arrivedAt(href) {
  if (!href) return false;
  const want = new URL(href, location.origin);
  if (!samePath(location.pathname, want.pathname)) return false;
  const have = new URLSearchParams(location.search);
  for (const [k, v] of want.searchParams) if (!have.getAll(k).includes(v)) return false;
  return true;
}

/** Without the last user question and the answers after it (for "Erneut senden"). */
function dropLastTurn(list) {
  let i = list.length - 1;
  while (i >= 0 && list[i].role === "assistant") i--;
  return i >= 0 ? list.slice(0, i) : list;
}

let nextId = 0;
const uid = () => `m${Date.now().toString(36)}${(nextId++).toString(36)}`;
const textOf = (m) => m.parts.filter((p) => p.type === "text").map((p) => p.text).join("").trim();
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";

export default function ChatCore({ locale, t, pathname, isMobile, titleRef, onClose, onHide, onMinimize, announce, dragHandlers, sheet }) {
  const router = useRouter();
  const cart = useCart();
  const [info, setInfo] = useState(null); // GET /api: { enabled, mode, devMock, showroom }
  const [mockOn, setMockOn] = useState(false);
  const [token, setToken] = useState(() => readToken());
  const [messages, setMessages] = useState(() => loadChat().messages);
  const [storeConsent, setStoreConsent] = useState(false);
  const [consenting, setConsenting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [notice, setNotice] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modeSlow, setModeSlow] = useState(false); // GET mode > 4 s
  const [modeLate, setModeLate] = useState(false); // GET mode > 10 s → contact card

  const abortRef = useRef(null);
  const logRef = useRef(null);
  const spacerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const pinRef = useRef(null);
  const justSentRef = useRef(false);
  const followRef = useRef(false);
  const awayRef = useRef(false); // visitor scrolled the log up
  const lastTopRef = useRef(0);
  const autoRef = useRef(0); // until then, scroll events are our own (smooth scroll)
  const consentedRef = useRef(false); // focus the composer once the chat is there
  const messagesRef = useRef(messages);
  const pathRef = useRef(pathname);
  const navRef = useRef(null); // { id, href, label, copied } of the page that is opening

  const mode =
    info?.enabled === false ? "off" : info?.mode === "live" ? "live" : info?.mode === "mock" || mockOn ? "mock" : info || modeLate ? "unavailable" : "loading";
  // After a reload: show the stored conversation at once; only the composer
  // waits for the mode answer.
  const restoring = mode === "loading" && Boolean(token) && messages.length > 0;
  const privacyHref = `/${locale}/datenschutz#ki-concierge`;
  const humanHref = `/${locale}${ROUTES.beratung[locale] || ROUTES.beratung.de}?quelle=concierge`;
  // WhatsApp handoff (Inhaber-Entscheidung Nr. 15): only a link to the contact
  // page, whose #whatsapp block shows the notice before wa.me. The chat
  // history is never passed on. Without a number (GET showroom.whatsapp) none.
  const waMode = info?.showroom?.whatsapp;
  const whatsapp =
    waMode === "on" || (waMode === "dev" && devPreviewActive())
      ? { href: `/${locale}${ROUTES.kontakt[locale] || ROUTES.kontakt.de}#whatsapp`, label: whatsappCopy(locale).concierge }
      : null;

  // Mode is asked only now (panel opened) – no request before the click.
  // Time limits (QA2 P2-3): after 4 s "Das dauert länger als üblich.", after
  // 10 s the contact card (phone, appointment) with the stored history below.
  // A late answer (up to 60 s) still switches the chat on; then it gives up.
  useEffect(() => {
    let live = true;
    const ctrl = new AbortController();
    const slowTimer = setTimeout(() => live && setModeSlow(true), MODE_SLOW_MS);
    const lateTimer = setTimeout(() => live && setModeLate(true), MODE_TIMEOUT_MS);
    fetchWithTimeout(API, { cache: "no-store", signal: ctrl.signal }, MODE_GIVE_UP_MS)
      .then((r) => r.json())
      .then((d) => live && setInfo(d))
      .catch(() => live && setInfo({ enabled: true, mode: "unavailable", devMock: false }))
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(lateTimer);
      });
    return () => {
      live = false;
      ctrl.abort();
      clearTimeout(slowTimer);
      clearTimeout(lateTimer);
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    saveChat(messages);
  }, [messages]);

  // Page changed: a navigation proposal is "Erledigt" only once the browser is
  // really on its target (path and query); then announce it. Open proposals retire.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    const nav = navRef.current;
    if (nav) {
      navRef.current = null;
      const ok = arrivedAt(nav.href);
      setMessages((list) => retire(setAction(nav.id, ok ? "done" : "stale", list)));
      if (ok) announce(fill(t.navigated, { label: nav.label }));
      // Mobile: Panel.js minimises on every page change; this only adds "Entwurf kopiert" to the bar.
      if (isMobile && ok && nav.copied) onMinimize({ copied: true });
      return;
    }
    setMessages((list) => retire(list));
  }, [pathname, announce, t, isMobile, onMinimize]);

  // After a full page load (filter on the same page, or a reload while a page
  // was opening): settle "Wird geöffnet …" against where the browser is now.
  useEffect(() => {
    const open = messagesRef.current.flatMap((m) => (m.role === "assistant" ? m.parts.filter((p) => p.type === "action" && p.status === "opening") : []));
    if (!open.length) return;
    let list = messagesRef.current;
    for (const p of open) {
      const ok = arrivedAt(p.href);
      list = setAction(p.id, ok ? "done" : "stale", list);
      if (ok) announce(fill(t.navigated, { label: p.label }));
    }
    setMessages(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuOpen(false);
        menuRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menuOpen]);

  // Scroll: the sent question moves to the top of the log, the answer grows
  // below it (spacer); we only follow the stream if the visitor is at the end.
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
      awayRef.current = false;
      autoRef.current = Date.now() + 1000;
      log.scrollTo({ top: Math.max(0, pinned.offsetTop - 12), behavior: reducedMotion() ? "auto" : "smooth" });
    } else if (followRef.current && need === 0) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages, status]);

  // Restored conversation: start at its end.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [token]);

  // Right after "Concierge starten": focus the composer once it is rendered
  // (a single rAF was too early in WebKit, the focus stayed on the dialog).
  useEffect(() => {
    if (!token || !consentedRef.current) return undefined;
    const tm = setTimeout(() => {
      consentedRef.current = false;
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(tm);
  }, [token]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onLogScroll = () => {
    const log = logRef.current;
    if (!log) return;
    const fromEnd = log.scrollHeight - log.scrollTop - log.clientHeight;
    followRef.current = fromEnd < 24 && spacerRef.current?.offsetHeight === 0;
    // Scrolled up on purpose → status changes no longer pull the log down.
    if (Date.now() > autoRef.current && log.scrollTop < lastTopRef.current - 4) awayRef.current = true;
    if (fromEnd < 24) awayRef.current = false;
    lastTopRef.current = log.scrollTop;
  };

  // A status line of the latest answer changed (card or retry notice): bring
  // it fully into view above the composer, unless the visitor scrolled away.
  const reveal = useCallback((el) => {
    const log = logRef.current;
    if (!el || !log || awayRef.current || !log.contains(el)) return;
    autoRef.current = Date.now() + 1000;
    requestAnimationFrame(() => el.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" }));
  }, []);

  const accept = async () => {
    if (consenting) return;
    setError("");
    setNotice("");
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
      consentedRef.current = true;
      setToken(data.token);
    } catch {
      setError(t.consentError);
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
    setMenuOpen(false);
  };

  const revoke = async () => {
    if (revoking) return;
    const current = token;
    setRevoking(true);
    clearChat();
    setInput("");
    writeToken(null);
    setToken(null);
    setStoreConsent(false);
    setNotice(t.revokedPending);
    requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    let deleted = true;
    try {
      const res = await fetch(`${API}/consent`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: current }),
      });
      deleted = res.ok || res.status === 401;
    } catch {
      deleted = false;
    }
    setRevoking(false);
    setNotice(deleted ? t.revokedDone : fill(t.revokedFail, { email: info?.showroom?.email || "info@platzhirsch.studio" }));
  };

  const update = (id, fn) => setMessages((list) => list.map((m) => (m.id === id ? fn(m) : m)));

  const applyEvent = (id, ev) => {
    switch (ev.type) {
      case "text":
        setStatus("");
        update(id, (m) => {
          const parts = [...m.parts];
          const last = parts[parts.length - 1];
          if (last?.type === "text") parts[parts.length - 1] = { ...last, text: last.text + ev.delta };
          else parts.push({ type: "text", text: ev.delta });
          return { ...m, parts };
        });
        break;
      case "reset":
        update(id, (m) => {
          const parts = [...m.parts];
          if (parts[parts.length - 1]?.type === "text") parts.pop();
          return { ...m, parts };
        });
        break;
      case "products":
        update(id, (m) => ({ ...m, parts: [...m.parts, { type: "products", items: ev.items }] }));
        break;
      case "handoff":
        update(id, (m) => ({ ...m, parts: [...m.parts, { type: "handoff", ...ev }] }));
        break;
      case "action":
        update(id, (m) => ({ ...m, parts: [...m.parts, { ...ev, type: "action", status: "pending", page: pathRef.current }] }));
        break;
      case "notice":
      case "error":
        update(id, (m) => ({ ...m, parts: [...m.parts, { type: "notice", text: ev.message, ...(ev.type === "error" ? { retry: ev.retry !== false } : null) }] }));
        break;
      case "status":
        setStatus(ev.label);
        break;
      default:
        break;
    }
  };

  const setAction = (id, status, list = messagesRef.current, extra = null) =>
    list.map((m) =>
      m.role !== "assistant" ? m : { ...m, parts: m.parts.map((p) => (p.type === "action" && p.id === id ? { ...p, ...extra, status } : p)) }
    );

  const send = async (raw, { retry = false } = {}) => {
    const text = String(raw || "").trim().slice(0, MAX_CHARS);
    if (!text || busy || !token || restoring) return;
    setError("");
    if (!retry) setInput("");
    // "Erneut senden": the failed question and its error answer are replaced.
    const messages = retry ? dropLastTurn(messagesRef.current) : messagesRef.current;

    // Outcome of the proposals since the last question → this turn's context.
    const reported = [];
    for (let i = messages.length - 1; i >= 0 && messages[i].role === "assistant"; i--) {
      for (const p of messages[i].parts) {
        if (p.type !== "action") continue;
        const st = p.status === "done" ? "done" : p.status === "failed" ? "failed" : p.status === "declined" || p.status === "undone" ? "declined" : null;
        if (st) reported.push({ id: p.id, sig: p.sig, exp: p.exp, status: st });
      }
    }
    const ctx = collectContext({ pathname, locale, selectionCount: cart.cartItems.length, actions: reported });
    const userMsg = { id: uid(), role: "user", parts: [{ type: "text", text }], ctx };
    const botMsg = { id: uid(), role: "assistant", parts: [] };

    const history = [];
    for (const m of [...messages, userMsg]) {
      if (m.role === "user") {
        if (history.length && history[history.length - 1].role === "user") history.push({ role: "assistant", content: NO_TEXT });
        history.push({ role: "user", content: m.parts[0].text.slice(0, MAX_CHARS), ...(m.ctx ? { ctx: m.ctx } : {}) });
      } else {
        if (!history.length) continue;
        history.push({ role: "assistant", content: (textOf(m) || NO_TEXT).slice(0, 6000) });
      }
    }
    let trimmed = history.slice(-HISTORY);
    while (trimmed.length && trimmed[0].role !== "user") trimmed = trimmed.slice(1);

    pinRef.current = userMsg.id;
    justSentRef.current = true;
    setMessages((list) => [...retire(retry ? dropLastTurn(list) : list), userMsg, botMsg]);
    setBusy(true);
    setStatus(t.wait);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // Same request id for the silent second attempt: the server counts the
    // rate limit for it only once (rateLimit.js, retry pass).
    const rid = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const body = JSON.stringify({ token, surface: "site", messages: trimmed, mock: mode === "mock", rid });
    const started = Date.now();
    let received = false;

    // One attempt: POST and read the NDJSON stream into the answer.
    const attempt = async () => {
      const left = CHAT_BUDGET_MS - (Date.now() - started);
      if (left <= 0) throw new LabsTimeoutError();
      const res = await fetchWithTimeout(API, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal }, left);
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "consent_required") {
          writeToken(null);
          setToken(null);
          throw new UiError(t.errConsent);
        }
        if (data.error === "rate_limited") throw new UiError(t.errRate, true);
        if (data.error === "budget_exhausted") throw new UiError(`${t.errBudget}${info?.showroom?.phone ? ` – ${info.showroom.phone}` : ""}`);
        if (data.error === "invalid_input") throw new UiError(t.errInvalid);
        if (data.error === "disabled") setInfo((i) => ({ ...i, enabled: false }));
        throw new UiError(t.errDown, true);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value?.length) received = true;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            applyEvent(botMsg.id, JSON.parse(line));
          } catch {
            // malformed line
          }
        }
      }
    };

    try {
      try {
        await attempt();
      } catch (e) {
        // WebKit drops a POST now and then on a reused keep-alive connection
        // ("Load failed", QA2 P2-2): once, silently, after 600 ms – but only
        // if nothing has arrived yet (else the answer would be doubled).
        if (received || ctrl.signal.aborted || !isNetworkError(e)) throw e;
        await sleep(AUTO_RETRY_MS, ctrl.signal);
        await attempt();
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        const { text: msg, retry: again } = errorText(e, t);
        applyEvent(botMsg.id, { type: "error", message: msg, retry: again });
      }
    } finally {
      setBusy(false);
      setStatus("");
      abortRef.current = null;
      setMessages((list) => list.filter((m) => m.id !== botMsg.id || m.parts.length > 0));
    }
  };

  const runAction = async (action) => {
    if (action.status !== "pending" || action.page !== pathname) return;
    setMessages((list) => setAction(action.id, "running", list));
    const label = action.label;
    // Appointment: the form is not pre-filled, so the draft goes to the
    // clipboard right here (still inside the click gesture).
    const note = action.kind === "appointment_form" ? String(action.params?.note || "") : "";
    const copying = note && navigator.clipboard?.writeText ? navigator.clipboard.writeText(note).then(() => true, () => false) : null;
    const copied = copying ? await Promise.race([copying, new Promise((r) => setTimeout(() => r(false), 1500))]) : false;
    const extra = note ? { copied } : null;
    const res = await executeAction(action, {
      locale,
      router,
      cart,
      beforeNavigate: (href) => {
        // "Wird geöffnet …" until the target page is there (pathname effect).
        navRef.current = { id: action.id, href, label, copied };
        setMessages((list) => setAction(action.id, "opening", list, { ...extra, href, since: Date.now() }));
      },
      beforeReload: (href) => {
        // Full page load follows: persist "opening"; the mount effect settles it.
        navRef.current = null;
        saveChat(setAction(action.id, "opening", messagesRef.current, { ...extra, href, since: Date.now() }));
        markResume();
      },
      beforeScroll: async () => {
        if (!isMobile) return;
        onMinimize();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      },
    });
    if (!res.ok) {
      navRef.current = null;
      setMessages((list) => setAction(action.id, "failed", list));
      return;
    }
    if (res.navigated || res.reload) return;
    setMessages((list) => setAction(action.id, "done", list));
    if (action.kind === "save_to_selection") announce(fill(t.saved, { label }));
    if (action.kind === "scroll_to_section") announce(fill(t.scrolled, { label }));
  };

  const retryLast = () => {
    const lastUser = [...messagesRef.current].reverse().find((m) => m.role === "user");
    if (lastUser) send(lastUser.parts[0].text, { retry: true });
  };

  const declineAction = (action) => setMessages((list) => setAction(action.id, "declined", list));
  const undoAction = (action) => {
    if (action.kind !== "save_to_selection") return;
    cart.removeManyFromCart(wishlistItemsOf(action.params.items));
    setMessages((list) => setAction(action.id, "undone", list));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const hasMasse = typeof document !== "undefined" && Boolean(document.querySelector('main h2[id^="masse"], main [data-concierge-section^="masse"]'));
  const chips = hasMasse ? [t.chipMasse, ...t.chips] : t.chips;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  // One message of the log (chat, and read-only below the contact card).
  const renderMessage = (m) =>
    m.role === "user" ? (
      <div key={m.id} data-mid={m.id} className={s.user}>
        <span className="sr-only">{t.you}</span>
        {m.parts[0].text}
      </div>
    ) : (
      <article key={m.id} className={s.bot} aria-label={t.answer}>
        <span className={s.botLabel} aria-hidden="true">
          {t.aiFull}
        </span>
        {m.parts.map((p, i) => {
          if (p.type === "text")
            return (
              <div key={i} className={s.prose}>
                <RichText text={p.text} />
              </div>
            );
          if (p.type === "products") return <SiteProductCards key={i} items={p.items} t={t} />;
          if (p.type === "handoff") return <Handoff key={i} {...p} t={t} whatsapp={whatsapp} />;
          if (p.type === "action") {
            const current = m.id === lastAssistant && p.page === pathname;
            return (
              <ActionCard
                key={p.id}
                action={p}
                status={p.status === "pending" && !current ? "stale" : p.status}
                t={t}
                locale={locale}
                onRun={() => runAction(p)}
                onDecline={() => declineAction(p)}
                onUndo={() => undoAction(p)}
                reveal={m.id === lastAssistant ? reveal : undefined}
              />
            );
          }
          const canRetry = Boolean(p.retry && m.id === lastAssistant && !busy && token && mode !== "unavailable" && mode !== "off");
          return <Notice key={i} text={p.text} retry={canRetry} label={t.retry} onRetry={retryLast} reveal={reveal} />;
        })}
      </article>
    );

  return (
    <>
      <header className={s.head} {...(sheet ? dragHandlers : {})}>
        {sheet && <span className={s.handle} aria-hidden="true" />}
        <div className={s.headText}>
          <div className={s.titleRow}>
            <h2 id="concierge-title" ref={titleRef} tabIndex={-1} className={s.title}>
              {t.title}
            </h2>
            <span className={s.badge}>{t.ai}</span>
            {mode === "mock" && (
              <span className={s.badgeSoft} title={t.mockTitle}>
                {t.mock}
              </span>
            )}
          </div>
          {/* ph-dotlist (globals.css): the "·" never hangs at a line end (QM r2) */}
          <p className={`${s.sub} ph-dotlist`}>
            <span>{t.sub}</span>
            <span>
              <Link href={humanHref} className={s.humanLink}>
                {t.human}
              </Link>
            </span>
          </p>
        </div>
        <div className={s.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={s.iconBtn}
            aria-label={t.menu}
            aria-expanded={menuOpen}
            aria-controls="concierge-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div id="concierge-menu" className={s.menu}>
              {messages.length > 0 && (
                <button type="button" className={s.menuItem} onClick={clearChat}>
                  {t.newChat}
                </button>
              )}
              <button type="button" className={s.menuItem} onClick={() => onHide("visit")}>
                {t.hideVisit}
              </button>
              <button type="button" className={s.menuItem} onClick={() => onHide("30d")}>
                {t.hide30}
              </button>
              <p className={s.menuNote}>{t.hideNote}</p>
              {token && (
                <button type="button" className={s.menuItem} onClick={revoke} disabled={revoking}>
                  {revoking ? t.revoking : t.revoke}
                </button>
              )}
            </div>
          )}
        </div>
        <button type="button" className={s.iconBtn} onClick={onClose} aria-label={t.close}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      {mode === "loading" && !restoring ? (
        <p className={s.loading} role="status">
          {t.loading}
          {modeSlow && ` ${t.slow}`}
        </p>
      ) : mode === "unavailable" || mode === "off" ? (
        <ContactCard t={t} locale={locale} whatsapp={whatsapp} showroom={info?.showroom} off={mode === "off"} devMock={mode === "unavailable" && info?.devMock} onMock={() => setMockOn(true)}>
          {/* Mode answer too late (P2-3): the stored conversation stays readable below. */}
          {token && messages.length > 0 && (
            <section className={s.pastLog} aria-label={t.history}>
              <p className={s.draftLabel}>{t.history}</p>
              {messages.map(renderMessage)}
            </section>
          )}
        </ContactCard>
      ) : !token ? (
        <div className={s.consent}>
          {notice && (
            <p className={s.infoBox} role="status">
              {notice}
            </p>
          )}
          <span className={s.rule} aria-hidden="true" />
          <p className={s.lead}>{t.consentLead}</p>
          {/* Short version visible; the complete AI Act Art. 50 / GDPR text
              stays one tap away and is part of the consent (version in config.js). */}
          <p>
            {t.consentShort} {mode === "mock" ? t.consentSendMock : t.consentSendLive}
          </p>
          <details className={s.details}>
            <summary className={s.summary}>{t.consentMore}</summary>
            <div className={s.detailsBody}>
              <p>{t.consentAi}</p>
              <p>
                {mode === "mock" ? t.consentMock : t.consentLive} {t.consentPage}
              </p>
              <p>{t.consentAgent}</p>
              <p>{t.consentRest}</p>
              <p>
                <Link href={privacyHref} className={s.tapLink}>
                  {t.privacyDetails}
                </Link>
              </p>
            </div>
          </details>
          <div className={s.consentFoot}>
            <label className={s.check}>
              <input type="checkbox" checked={storeConsent} onChange={(e) => setStoreConsent(e.target.checked)} />
              <span>{fill(t.store, { days: RETENTION_DAYS })}</span>
            </label>
            <button type="button" className={s.primary} onClick={accept} disabled={consenting} aria-busy={consenting || undefined}>
              {consenting ? t.wait : t.start}
            </button>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div ref={logRef} className={s.log} role="log" aria-live="polite" aria-relevant="additions" aria-busy={busy} onScroll={onLogScroll}>
            {messages.length === 0 && (
              <div className={s.welcome}>
                <span className={s.rule} aria-hidden="true" />
                <p className={s.welcomeTitle}>{t.welcome}</p>
                <p>{t.welcomeText}</p>
                <div className={s.chips} role="group" aria-label={t.chipsLabel}>
                  {chips.map((c) => (
                    <button key={c} type="button" className={s.chip} onClick={() => send(c)} disabled={busy || restoring}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(renderMessage)}
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
            <label htmlFor="concierge-site-input" className="sr-only">
              {t.inputLabel}
            </label>
            <textarea
              id="concierge-site-input"
              ref={inputRef}
              className={s.input}
              rows={1}
              maxLength={MAX_CHARS}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={restoring ? t.loading : t.placeholder}
              disabled={restoring}
              aria-describedby="concierge-site-hint"
            />
            {busy ? (
              <button type="button" className={s.send} onClick={stop} aria-label={t.stop}>
                <Square size={14} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" className={s.send} disabled={!input.trim() || restoring} aria-label={t.send}>
                <ArrowUp size={18} aria-hidden="true" />
              </button>
            )}
          </form>
          <div className={s.foot}>
            <p id="concierge-site-hint" className={s.hint}>
              {restoring && modeSlow ? t.slow : t.hint}
              {input.length > MAX_CHARS - 150 && ` · ${fill(t.charsLeft, { n: MAX_CHARS - input.length })}`}
            </p>
            <Link href={privacyHref} className={s.tapLink}>
              {t.privacy}
            </Link>
          </div>
        </>
      )}
    </>
  );
}

// Pending proposals become inactive once a new question is asked or the page changes.
function retire(list) {
  let changed = false;
  const next = list.map((m) => {
    if (m.role !== "assistant" || !m.parts.some((p) => p.type === "action" && p.status === "pending")) return m;
    changed = true;
    return { ...m, parts: m.parts.map((p) => (p.type === "action" && p.status === "pending" ? { ...p, status: "stale" } : p)) };
  });
  return changed ? next : list;
}

// Hint in an answer; with "Erneut senden" it scrolls itself into view (QA2 P2-1).
function Notice({ text, retry, label, onRetry, reveal }) {
  const ref = useRef(null);
  useEffect(() => {
    if (retry) reveal?.(ref.current);
  }, [retry, reveal]);
  return (
    <div ref={ref} className={s.softNotice}>
      <p>{text}</p>
      {retry && (
        <button type="button" className={s.textBtn} onClick={onRetry}>
          <RotateCcw size={14} aria-hidden="true" /> {label}
        </button>
      )}
    </div>
  );
}

function ContactCard({ t, locale, showroom, off, devMock, onMock, whatsapp = null, children }) {
  const phone = showroom?.phone;
  const book = `/${locale}${ROUTES.beratung[locale] || ROUTES.beratung.de}?quelle=concierge`;
  return (
    <div className={s.contact}>
      <span className={s.rule} aria-hidden="true" />
      <p className={s.lead}>{t.unLead}</p>
      <p>{off ? t.offText : t.unText}</p>
      {locale === "de" && showroom?.hours?.length > 0 && (
        <dl className={s.hours}>
          {showroom.hours.map((h) => (
            <div key={h.days} className={s.hoursRow}>
              <dt>{h.days}</dt>
              <dd>{h.time}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className={s.actions}>
        <Link href={book} className={s.primary}>
          <CalendarCheck size={16} aria-hidden="true" /> {t.book}
        </Link>
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={s.secondary}>
            <Phone size={16} aria-hidden="true" /> {phone}
          </a>
        )}
        {whatsapp && (
          <Link href={whatsapp.href} className={s.secondary} data-whatsapp-handoff="">
            <MessageCircle size={16} aria-hidden="true" /> {whatsapp.label}
          </Link>
        )}
        {showroom?.directions && (
          <a href={showroom.directions} className={s.secondary} target="_blank" rel="noopener noreferrer">
            <MapPin size={16} aria-hidden="true" /> {t.route}
          </a>
        )}
      </div>
      {devMock && (
        <button type="button" className={s.devBtn} onClick={onMock}>
          {t.devMock}
        </button>
      )}
      {children}
    </div>
  );
}

function Handoff({ topic, summary, href, phone, t, whatsapp = null }) {
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
      <p className={s.cardTitle}>
        {t.handoff}
        {topic ? ` · ${topic}` : ""}
      </p>
      {summary && (
        <div className={s.draft}>
          <p className={s.draftLabel}>{t.handoffNote}</p>
          <p>{summary}</p>
          <button type="button" className={s.textBtn} onClick={copy}>
            <Copy size={14} aria-hidden="true" /> {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
      <div className={s.actions}>
        <Link href={href} className={s.secondary}>
          <CalendarCheck size={16} aria-hidden="true" /> {t.handoffBook}
        </Link>
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={s.secondary}>
            <Phone size={16} aria-hidden="true" /> {phone}
          </a>
        )}
        {whatsapp && (
          <Link href={whatsapp.href} className={s.secondary} data-whatsapp-handoff="">
            <MessageCircle size={16} aria-hidden="true" /> {whatsapp.label}
          </Link>
        )}
      </div>
    </div>
  );
}
