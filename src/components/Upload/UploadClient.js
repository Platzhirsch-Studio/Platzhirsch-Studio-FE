"use client";
// Mobile upload page UI (/de/upload/<token>, also embedded in the labs demo).
// Files go up one after another in 4 MB chunks (XHR for byte progress), with
// automatic retries; offline → paused, resumes when the connection is back.
// After a reload, selecting the same file again continues where it stopped
// (the server matches name + size + lastModified). Previews stay local
// (object URLs) — the server never sends files back.
// The scroll container is the nearest [data-upload-scroll] (the phone frame in
// the labs demo), otherwise the page itself (/de/upload/<token>, bare shell).
//
// Labs-Ausbau "Handy-Upload Premium" (presentation only — tickets, type
// checks, limits, chunking and retries above are unchanged):
//   Stepper (Zustimmen → Aufnehmen → Senden), large capture tiles (Raumfotos,
//   Video-Rundgang, Grundriss/Plan, Galerie, Notiz & Maße), guided capture
//   tips (own line drawings), preview gallery with progress per file, sticky
//   overall progress on ink-deep (the page's one dark surface, Bibel §4),
//   success view with summary and "So geht es weiter". Light only: the Bibel
//   ships no system dark mode yet (§4.4). Motion: transform/opacity only,
//   all behind motion-safe; haptics (navigator.vibrate, Android) only without
//   reduced motion. Safe areas left/right/bottom.
//
// QA fix2 (feedback-2.md): every POST attempt has its own 12 s timeout and
// POST /files gets 5 attempts like the chunks; the sticky bar mirrors the
// active file ("Verbindung ist langsam…", "Neuer Versuch 2/5…", "Pausiert –
// wartet auf Verbindung") with a 32 px preview and a sweeping bar, and offers
// "Erneut versuchen" after 20 s without byte progress. Progress never moves
// backwards (97 % cap per chunk until the server confirms, max(prev, new)) and
// shows "100 %" only once every file is confirmed (else ≤ 99 %, floor).
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  Camera, Film, Images, FileText, FileX, Trash2, RotateCw, CircleCheck, CircleAlert, WifiOff, MapPinOff, Send, ChevronDown,
  Check, Plus, NotebookPen, Hourglass,
} from "lucide-react";
import { CONSENT_VERSION, DATETIME_FMT, FINAL_ERRORS, UPLOAD_CONFIG, formatBytes } from "@/lib/upload/config";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { LINK_ERRORS, uploadErrorText as message } from "@/lib/upload/messages";
import { detectType } from "@/lib/upload/magic";
import { ConsentDetails, ConsentShort } from "./ConsentText";

const TYPE_HINT = message("unsupported_type");
const BACKOFF = [1000, 2500, 6000, 12000];
// Attempts per chunk = first try + one per BACKOFF step ("neuer Versuch (2/5)").
const TRIES = BACKOFF.length + 1;

/**
 * QA fix1 P2-3: type check in the browser BEFORE the upload starts (first 16
 * bytes, same rules as the server in lib/upload/magic.js). A renamed .exe is
 * refused at once instead of sitting at "0 %". The server check stays the
 * binding one. Returns the detected type or null.
 */
async function sniff(file) {
  try {
    return detectType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  } catch {
    return undefined; // unreadable here: let the server decide
  }
}
const SUBMIT_BACKOFF = [1000, 3000];
const ACTIVE = ["checking", "queued", "uploading"];

// `body` is the chunk read into an ArrayBuffer (QA fix1 P1-1): WebKit failed
// the first send of a File slice ("WebKit encountered an internal error") and
// only the BACKOFF retries got it through; plain bytes go up at once.
function putChunk(url, body, onProgress, xhrBox, ctl) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrBox.xhr = xhr;
    // Manual "Erneut versuchen" (QA fix2 P1-1): abort marked as a kick → the caller retries at once.
    ctl.kick = () => ((ctl.kicked = true), xhr.abort());
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.timeout = 180000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
    xhr.onload = () => {
      let json = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      resolve({ status: xhr.status, json });
    };
    const fail = (kind) => () => reject(Object.assign(new Error(kind), { kind }));
    xhr.onerror = fail("network");
    xhr.ontimeout = fail("network");
    xhr.onabort = fail("aborted");
    xhr.send(body);
  });
}

/**
 * JSON POST with automatic retries on network errors and 5xx (both endpoints
 * are idempotent). WebKit sometimes fails a POST on a reused keep-alive
 * connection ("rewinding of the data stream failed") — a retry fixes it.
 * @returns {{ ok, status, json, network }}
 */
// QA fix2 P1-1: WebKit gives up on a hanging fetch only after ~60 s ("Timeout
// was reached"). Every POST attempt now has its own 12 s timeout, so a slow
// server costs seconds, not minutes, before the next attempt.
const POST_TIMEOUT_MS = 12000;
const SUBMIT_TIMEOUT_MS = 20000;
// No byte progress for this long → the sticky bar offers "Erneut versuchen".
const STALL_MS = 20000;

/**
 * Signal for one attempt: own timeout (AbortSignal.timeout where available)
 * plus `ctl.kick()` — the manual "Erneut versuchen" in the sticky bar, which
 * ends the attempt at once and starts the next one.
 */
function attemptSignal(ms, ctl) {
  const ac = new AbortController();
  if (ctl) ctl.kick = () => ((ctl.kicked = true), ac.abort());
  if (typeof AbortSignal.timeout === "function" && typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([AbortSignal.timeout(ms), ac.signal]), done() {} };
  }
  const t = setTimeout(() => ac.abort(), ms); // Safari < 17.4: no AbortSignal.any
  return { signal: ac.signal, done: () => clearTimeout(t) };
}

/** Back-off pause that a manual "Erneut versuchen" cuts short. */
function nap(ms, ctl) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (ctl) ctl.kick = () => (clearTimeout(t), (ctl.kicked = true), resolve());
  });
}

async function postJson(url, body, delays, onRetry, { timeout = POST_TIMEOUT_MS, ctl } = {}) {
  for (let attempt = 0; ; attempt++) {
    // 12 s for the first two attempts, then longer (24/36/48 s): a server that is
    // merely slow (cold start) still gets through instead of five equal timeouts.
    const a = attemptSignal(timeout * Math.max(1, attempt), ctl);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: a.signal });
      const json = await r.json().catch((e) => {
        if (a.signal.aborted) throw e; // timed out while reading the body: retry
        return {};
      });
      if (r.status < 500 || attempt >= delays.length) return { ok: r.ok && json.ok, status: r.status, json, network: false };
    } catch {
      if (ctl?.kicked) {
        // Manual retry: the next attempt starts now and does not use up one of the five.
        ctl.kicked = false;
        attempt--;
        continue;
      }
      if (attempt >= delays.length || !navigator.onLine) return { ok: false, status: 0, json: {}, network: true };
    } finally {
      a.done();
      if (ctl) ctl.kick = null;
    }
    onRetry?.(attempt + 2, delays.length + 1);
    await nap(delays[attempt], ctl);
    if (ctl) Object.assign(ctl, { kick: null, kicked: false });
  }
}

function videoDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (d) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null); // codec unknown to this browser: size limit still applies
    setTimeout(() => done(null), 4000);
    v.src = url;
  });
}

/** Does the browser's MIME type fit the picker's accept list? Empty type → let the server decide (magic bytes). */
function accepts(accept, type) {
  if (!type) return true;
  return accept.split(",").some((a) => (a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a));
}

const categoryOf = (file, hint) => (hint === "plan" ? "plan" : file.type.startsWith("video/") ? "video" : "photo");
let keySeq = 0;

// Abnahme R-1: "mounted" flag — false on the server and during hydration.
// The consent box stays disabled until then, so an early tick can no longer
// look set while React never saw it (iPhone under load).
const noopSubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

function subscribeOnline(cb) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Scrolls `el` to the top of its upload scroll container (not the whole page). */
function bringIntoView(el) {
  if (!el) return;
  const behavior = reducedMotion() ? "auto" : "smooth";
  const scroller = el.closest("[data-upload-scroll]");
  if (scroller) {
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16;
    scroller.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    el.scrollIntoView({ block: "start", behavior });
  }
}

/** A short, quiet tick on Android (iOS Safari has no vibrate); never with reduced motion. */
function buzz(ms = 8) {
  try {
    if (!reducedMotion()) navigator.vibrate?.(ms);
  } catch {
    /* not allowed without a user gesture: fine */
  }
}

// Keyframes once per page (transform/opacity only; used behind motion-safe:).
const KEYFRAMES =
  "@keyframes uploadRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
  "@keyframes uploadTick{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}" +
  "@keyframes uploadSweep{from{transform:translateX(-100%)}to{transform:translateX(340%)}}" +
  "@media (prefers-reduced-motion:no-preference){[data-upload-tick]{stroke-dasharray:40;animation:uploadTick var(--duration-morph) var(--ease-quiet) 160ms both}}";

const CATEGORY_ORDER = [
  ["photo", "Foto", "Fotos"],
  ["video", "Video", "Videos"],
  ["plan", "Plan", "Pläne"],
];

const NEXT_STEPS = [
  ["Ihre Unterlagen sind da", "Sicher gespeichert, nur für diese Anfrage."],
  ["Wir sehen sie uns vorab an", "Damit das erste Gespräch gleich konkret wird."],
  ["Wir melden uns persönlich", "Mit Ideen und Rückfragen – telefonisch oder per E-Mail."],
];

/** Zustimmen → Aufnehmen → Senden. */
function Stepper({ step }) {
  const labels = ["Zustimmen", "Aufnehmen", "Senden"];
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label={`Fortschritt: Schritt ${step} von 3`}>
      {labels.map((label, i) => {
        const n = i + 1;
        return (
          <li key={label} aria-current={n === step ? "step" : undefined} className="min-w-0">
            <span className="block h-0.5 bg-line-strong" aria-hidden="true">
              <span
                className={`block h-full origin-left bg-ink transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none ${n <= step ? "scale-x-100" : "scale-x-0"}`}
              />
            </span>
            <span className={`mt-1.5 block truncate text-xs tabular-nums ${n === step ? "font-semibold text-ink" : "text-ink-soft"}`}>
              {n} · {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Own line drawings for the capture tips (ink on bone, one brass-500 accent line each).
const TIP_ART = {
  corners: (
    <>
      <rect x="22" y="10" width="76" height="52" />
      <path d="M26 14l22 14M26 14l12 22" className="stroke-brass-500" />
      <path d="M94 58L72 44M94 58L82 36" className="stroke-brass-500" />
      <rect x="23.5" y="11.5" width="5" height="5" className="fill-ink" />
      <rect x="91.5" y="55.5" width="5" height="5" className="fill-ink" />
    </>
  ),
  pan: (
    <>
      <path d="M60 14a22 22 0 1 1-20.8 14.8" />
      <path d="M36 22l3.2 6.8 7-2.6" />
      <path d="M60 36h0" strokeWidth="5" />
      <path d="M60 36l14-8" className="stroke-brass-500" />
    </>
  ),
  measure: (
    <>
      <rect x="20" y="14" width="80" height="44" />
      <rect x="64" y="22" width="22" height="18" />
      <path d="M12 14v44M9 14h6M9 58h6" className="stroke-brass-500" />
      <path d="M20 66h80M20 63v6M100 63v6" className="stroke-brass-500" />
    </>
  ),
  light: (
    <>
      <rect x="40" y="12" width="40" height="48" />
      <path d="M60 12v48M40 36h40" />
      <path d="M86 20l10-6M88 36h12M86 52l10 6" className="stroke-brass-500" />
    </>
  ),
};

const TIPS = [
  ["corners", "Aus den Ecken fotografieren", "In jede Ecke stellen und diagonal in den Raum fotografieren – so sehen wir alle Wände."],
  ["pan", "Video langsam schwenken", "Einmal langsam im Kreis drehen, das Handy ruhig auf Brusthöhe halten."],
  ["measure", "Maße notieren", "Raumhöhe, Wandlängen, Fenster und Türen – grob genügt. Einfach in die Notiz schreiben."],
  ["light", "Licht an, Vorhänge auf", "Tageslicht zeigt Farben und Materialien am ehrlichsten."],
];

function Tips() {
  const id = useId();
  const listRef = useRef(null);
  const [current, setCurrent] = useState(0);
  // QA fix1 P3-3: visible position ("1 / 4" + bars) instead of only the cut-off card.
  const onScroll = () => {
    const ul = listRef.current;
    const first = ul?.firstElementChild;
    if (!first) return;
    const stride = first.getBoundingClientRect().width + 12; // gap-3
    setCurrent(Math.max(0, Math.min(TIPS.length - 1, Math.round(ul.scrollLeft / stride))));
  };
  const goTo = (i) => {
    const li = listRef.current?.children[i];
    if (!li) return;
    listRef.current.scrollTo({ left: li.offsetLeft - listRef.current.firstElementChild.offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
  };
  return (
    <section className="mt-7" aria-labelledby={`${id}-tips`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`${id}-tips`} className="text-overline uppercase text-gold-text">So gelingen die Aufnahmen</h2>
        <p className="text-xs tabular-nums text-ink-soft" aria-hidden="true">
          {current + 1} / {TIPS.length}
        </p>
      </div>
      {/* Horizontal on phones (scroll-snap, keyboard-scrollable region), no autoplay. */}
      <ul
        ref={listRef}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Aufnahme-Tipps, seitlich wischen"
        className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink [scrollbar-width:thin]"
      >
        {TIPS.map(([art, title, text], i) => (
          <li key={art} className="w-[15.5rem] shrink-0 snap-start border border-line bg-paper">
            <svg viewBox="0 0 120 72" className="block h-auto w-full bg-bone" fill="none" stroke="#30373e" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
              {TIP_ART[art]}
            </svg>
            <div className="p-3">
              <p className="text-sm font-medium">
                <span className="mr-1.5 tabular-nums text-gold-text" aria-hidden="true">0{i + 1}</span>
                {title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/80">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      {/* Position bars: tap targets 44 px tall, the visible bar is a 2 px hairline. */}
      <div className="mt-1 flex justify-center gap-1" role="group" aria-label="Tipp wählen">
        {TIPS.map(([art, title], i) => (
          <button
            key={art}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Tipp ${i + 1}: ${title}`}
            aria-current={i === current ? "true" : undefined}
            className="group flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
          >
            <span
              aria-hidden="true"
              className={`block h-0.5 transition-[width,background-color] duration-(--duration-ui) ease-quiet motion-reduce:transition-none ${i === current ? "w-6 bg-ink" : "w-3 bg-line-strong group-hover:bg-ink-soft"}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/** Check mark of the success view: the tick draws itself (400 ms) unless reduced motion. */
function DoneMark() {
  return (
    <svg viewBox="0 0 56 56" className="mx-auto block size-14 text-ink" fill="none" stroke="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="54" height="54" strokeWidth="1.5" />
      <path data-upload-tick="" d="M17 29l7.5 7.5L40 21" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

function Thumb({ it, size = "h-16 w-16" }) {
  const rejected = it.status === "rejected";
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center overflow-hidden ${rejected ? "bg-error/10" : "bg-linen"}`}>
      {rejected ? (
        <FileX className="text-error" aria-hidden="true" />
      ) : it.preview && it.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.preview} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
      ) : it.preview && it.kind === "video" ? (
        <video src={`${it.preview}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-hidden="true" />
      ) : it.category === "video" ? (
        <Film className="text-ink/60" aria-hidden="true" />
      ) : it.category === "plan" ? (
        <FileText className="text-ink/60" aria-hidden="true" />
      ) : (
        <Camera className="text-ink/60" aria-hidden="true" />
      )}
    </div>
  );
}

export default function UploadClient({ token, initialSession, embedded = false }) {
  const [session, setSession] = useState(initialSession || null);
  const [items, setItems] = useState(() =>
    (initialSession?.files || []).map((f) => ({
      key: `r${f.fileId}`,
      remote: true,
      fileId: f.fileId,
      name: f.name,
      size: f.size,
      category: f.category,
      status: f.status === "complete" ? "done" : "interrupted",
      progress: f.status === "complete" ? 1 : f.received.length / f.totalChunks,
      gpsRemoved: f.gpsRemoved,
    })),
  );
  const [consent, setConsent] = useState(Boolean(initialSession?.consentGiven));
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const mounted = useMounted();
  const [note, setNote] = useState(initialSession?.note || "");
  const [submitState, setSubmitState] = useState(initialSession?.submittedAt ? "done" : "idle");
  const [submitError, setSubmitError] = useState("");
  const [announce, setAnnounce] = useState("");
  const [tick, setTick] = useState(0);
  // Link expired/invalid while the page was open: stop the queue, show one notice.
  const [linkProblem, setLinkProblem] = useState(null);
  const linkProblemRef = useRef(null);
  const linkDead = useCallback((code) => {
    if (!LINK_ERRORS.has(code) || linkProblemRef.current) return false;
    linkProblemRef.current = code;
    setLinkProblem(code);
    setItems((prev) => prev.map((it) => (ACTIVE.includes(it.status) || it.status === "paused" || it.status === "error" ? { ...it, status: "stopped", error: message(code) } : it)));
    return true;
  }, []);

  const itemsRef = useRef(items);
  const runningRef = useRef(false);
  // Plain holder (not a ref) for the running XHR, so unmount can abort it.
  const [xhrBox] = useState(() => ({ xhr: null }));
  // Retry control of the running upload (QA fix2 P1-1): manual kick, stall clock.
  const ctlRef = useRef({ kick: null, kicked: false, lastAt: 0, stalledKey: null });
  const removedRef = useRef(new Set());
  const inputs = { photo: useRef(null), video: useRef(null), gallery: useRef(null), plan: useRef(null) };
  const doneRef = useRef(null);
  const doneHeadingRef = useRef(null);
  const justSubmitted = useRef(false);
  const quarterRef = useRef(0);
  const uid = useId();
  const consentRef = useRef(null);
  const submitRef = useRef(null);
  // QA fix1 P3-4: tapping a tile before consent scrolls to the checkbox, focuses it and marks it.
  const [nudged, setNudged] = useState(false);
  // QA fix1 P3-1: the sticky bar drops its own "Senden" while the form button is on screen.
  const [formButtonOnScreen, setFormButtonOnScreen] = useState(false);
  const api = `/api/upload/${token}`;
  const uploadsEnabled = session?.uploadsEnabled !== false;
  const maxFiles = session?.limits?.maxFiles || UPLOAD_CONFIG.maxFiles;

  const update = useCallback((key, patch) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }, []);

  // Byte progress arrived: reset the stall clock (and lift a shown stall).
  const beat = useCallback(
    (key) => {
      const ctl = ctlRef.current;
      ctl.lastAt = Date.now();
      if (ctl.stalledKey === key) {
        ctl.stalledKey = null;
        update(key, { stalled: false, slow: false });
      }
    },
    [update],
  );

  // Sticky bar "Erneut versuchen" after STALL_MS without progress: ends the
  // running attempt (fetch/XHR) or the back-off pause and starts again now.
  const kickNow = () => {
    const ctl = ctlRef.current;
    const key = ctl.stalledKey;
    ctl.lastAt = Date.now();
    ctl.stalledKey = null;
    if (key) update(key, { stalled: false });
    ctl.kick?.();
    setAnnounce("Neuer Versuch gestartet.");
  };

  // QA fix2: a tick on the consent box before hydration (slow phone, busy
  // server) stayed visible but was lost — take it over once after mount.
  useEffect(() => {
    const t = setTimeout(() => {
      if (consentRef.current?.checked) setConsent(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // ---- connection state, leave warning, revoke previews ----
  useEffect(() => {
    const on = () => setItems((prev) => prev.map((it) => (it.status === "paused" ? { ...it, status: "queued" } : it)));
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);

  const busy = items.some((it) => ACTIVE.includes(it.status));
  useEffect(() => {
    if (!busy) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    // Keep the screen on while uploading (a locked phone pauses the browser).
    let lock = null;
    navigator.wakeLock?.request?.("screen").then((l) => (lock = l)).catch(() => {});
    return () => {
      window.removeEventListener("beforeunload", warn);
      lock?.release?.().catch(() => {});
    };
  }, [busy]);

  useEffect(() => {
    const removed = removedRef.current;
    return () => {
      itemsRef.current.forEach((it) => it.preview && URL.revokeObjectURL(it.preview));
      removed.clear();
      xhrBox.xhr?.abort();
    };
  }, [xhrBox]);

  // ---- after "Senden": bring the thank-you block into view and focus it ----
  useEffect(() => {
    if (submitState !== "done" || !justSubmitted.current) return;
    justSubmitted.current = false;
    bringIntoView(doneRef.current);
    doneHeadingRef.current?.focus({ preventScroll: true });
  }, [submitState]);

  const showingDone = submitState === "done";
  useEffect(() => {
    const el = submitRef.current;
    if (showingDone || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setFormButtonOnScreen(e.isIntersecting), {
      root: el.closest("[data-upload-scroll]"),
      // The sticky bar covers the bottom ~5 rem of the scroller.
      rootMargin: "0px 0px -80px 0px",
      threshold: 0.5,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [showingDone]);

  // ---- upload one file ----
  const uploadOne = useCallback(
    async (item) => {
      const { key, file } = item;
      const ctl = ctlRef.current;
      update(key, { status: "uploading", phase: "prepare", retry: 0, error: null, stalled: false });
      Object.assign(ctl, { kicked: false, kick: null, lastAt: Date.now(), stalledKey: null });
      // QA fix2 P2-1: the bar never moves backwards. While a chunk is on the
      // wire it stops at 97 % of that chunk until the server confirms it, and
      // a retry of the same chunk keeps the value shown so far.
      let shown = item.progress || 0;
      const show = (value, extra) => {
        shown = Math.max(shown, Math.min(1, value));
        update(key, { progress: shown, ...extra });
      };
      const reject = (code) => {
        if (linkDead(code)) return;
        update(key, FINAL_ERRORS.has(code) ? { status: "rejected", error: message(code) } : { status: "error", error: message(code) });
      };
      // QA fix1 P1-1: never a silent "0 %" — every automatic retry is shown
      // on the card ("Verbindung holpert – neuer Versuch (2/5)…") and once in
      // the live region.
      const onRetry = (n, of) => {
        update(key, { retry: n, retryOf: of });
        setAnnounce(`Verbindung holpert – neuer Versuch ${n} von ${of}.`);
      };
      const res = await postJson(`${api}/files`, {
        name: file.name || "aufnahme",
        size: file.size,
        type: file.type,
        lastModified: file.lastModified || 0,
        category: item.category,
        consentVersion: CONSENT_VERSION,
      }, BACKOFF, onRetry, { ctl }); // 5 attempts like the chunks (idempotent: fingerprint → same fileId)
      if (res.network) return update(key, { status: navigator.onLine ? "error" : "paused", error: message("network") });
      if (!res.ok) return reject(res.json.error || (res.status === 429 ? "rate_limited" : res.status >= 500 ? "server_error" : undefined));
      const meta = res.json.file;
      // A resumed file replaces its "interrupted" entry from the server list.
      setItems((prev) => prev.filter((it) => !(it.remote && it.fileId === meta.fileId)).map((it) => (it.key === key ? { ...it, fileId: meta.fileId } : it)));
      if (meta.status === "complete") return update(key, { status: "done", progress: 1, gpsRemoved: meta.gpsRemoved });

      const chunkSize = session?.limits?.chunkSize || UPLOAD_CONFIG.chunkSize;
      const have = new Set(meta.received);
      let doneBytes = [...have].reduce((s, i) => s + Math.min(chunkSize, file.size - i * chunkSize), 0);
      show(doneBytes / file.size, { phase: "send", retry: 0 });

      for (let i = 0; i < meta.totalChunks; i++) {
        if (have.has(i)) continue;
        const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
        // Read once per chunk (≤ 4 MB), reused by every retry. If the read
        // itself fails (file moved/deleted on the device), fall back to the Blob.
        const body = await blob.arrayBuffer().catch(() => blob);
        for (let attempt = 0; ; attempt++) {
          if (removedRef.current.has(key)) return;
          try {
            const { status, json } = await putChunk(
              `${api}/files/${meta.fileId}?index=${i}`,
              body,
              (loaded) => {
                beat(key);
                show((doneBytes + Math.min(loaded, blob.size * 0.97)) / file.size);
              },
              xhrBox,
              ctl,
            );
            if (status >= 200 && status < 300 && json?.ok) {
              doneBytes += blob.size;
              if (json.file.status === "complete") {
                setAnnounce(`${file.name || "Datei"} hochgeladen.`);
                buzz();
                return update(key, { status: "done", progress: 1, retry: 0, stalled: false, gpsRemoved: json.file.gpsRemoved });
              }
              show(doneBytes / file.size, { retry: 0 });
              break;
            }
            if (status >= 400 && status < 500) return reject(json?.error || (status === 429 ? "rate_limited" : undefined));
            throw Object.assign(new Error("server"), { kind: "server" });
          } catch (e) {
            if (removedRef.current.has(key)) return;
            if (e.kind === "aborted") {
              if (!ctl.kicked) return; // unmount / removed
              ctl.kicked = false; // manual "Erneut versuchen": same chunk again, right now
              attempt--;
              continue;
            }
            if (!navigator.onLine) return update(key, { status: "paused", retry: 0, error: message("network") });
            if (attempt >= BACKOFF.length) return update(key, { status: "error", retry: 0, error: message(e.kind === "server" ? "server_error" : "network") });
            onRetry(attempt + 2, TRIES);
            await nap(BACKOFF[attempt], ctl);
            Object.assign(ctl, { kick: null, kicked: false });
          }
        }
      }
    },
    [api, session, update, xhrBox, linkDead, beat],
  );

  // ---- queue: one file at a time ----
  useEffect(() => {
    itemsRef.current = items;
    if (runningRef.current || !consent || !online || linkProblem) return;
    const next = items.find((it) => it.status === "queued");
    if (!next) return;
    const timer = setTimeout(() => {
      const ctl = ctlRef.current;
      runningRef.current = true;
      // Slow network/server: after 5 s without a first byte the card says so
      // (QA fix1 P1-1) instead of a frozen "Wird vorbereitet…" / "0 %".
      const slow = setTimeout(() => {
        update(next.key, { slow: true });
        setAnnounce("Verbindung ist langsam – wir bleiben dran.");
      }, 5000);
      // QA fix2 P1-1: no byte progress for 20 s → the sticky bar offers "Erneut versuchen".
      const watch = setInterval(() => {
        if (ctl.stalledKey || Date.now() - (ctl.lastAt || Date.now()) < STALL_MS) return;
        ctl.stalledKey = next.key;
        update(next.key, { stalled: true, slow: true });
        setAnnounce("Es geht gerade nicht voran. Unten können Sie einen neuen Versuch starten.");
      }, 1000);
      uploadOne(next).finally(() => {
        clearTimeout(slow);
        clearInterval(watch);
        ctl.stalledKey = null;
        update(next.key, { slow: false, stalled: false });
        runningRef.current = false;
        setTick((t) => t + 1);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [items, consent, online, tick, uploadOne, linkProblem, update]);

  // ---- overall progress (sticky bar + screen-reader steps of 25 %) ----
  const counted = items.filter((it) => !["rejected", "interrupted", "stopped"].includes(it.status));
  const totalSize = counted.reduce((s, it) => s + it.size, 0);
  const sentSize = counted.reduce((s, it) => s + it.size * (it.status === "done" ? 1 : it.progress || 0), 0);
  const overall = totalSize ? sentSize / totalSize : 0;
  const done = items.filter((it) => it.status === "done");
  // QA fix2 P2-2: "100 %" only when every counted file is confirmed by the server.
  const allDone = counted.length > 0 && counted.every((it) => it.status === "done");
  const pct = allDone ? 100 : Math.min(99, Math.floor(overall * 100));
  const doneBytes = done.reduce((s, it) => s + it.size, 0);

  useEffect(() => {
    if (!busy) {
      quarterRef.current = 0;
      return;
    }
    const q = Math.floor(pct / 25);
    if (q > quarterRef.current && q < 4) {
      quarterRef.current = q;
      setAnnounce(`${q * 25} Prozent hochgeladen.`);
    }
  }, [pct, busy]);

  // ---- add files ----
  const addFiles = async (fileList, picker) => {
    const files = Array.from(fileList || []);
    const count = itemsRef.current.filter((it) => it.status !== "rejected").length;
    for (const [n, file] of files.entries()) {
      const category = categoryOf(file, picker.hint);
      const limit = UPLOAD_CONFIG.categories[category].maxBytes;
      const key = `l${++keySeq}`;
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const item = {
        key,
        file,
        name: file.name || (isVideo ? "Video" : "Foto"),
        size: file.size,
        category,
        status: "checking",
        progress: 0,
        preview: isImage || isVideo ? URL.createObjectURL(file) : null,
        kind: isVideo ? "video" : isImage ? "image" : "file",
      };
      if (!accepts(picker.accept, file.type)) Object.assign(item, { status: "rejected", error: TYPE_HINT });
      else if (count + n >= maxFiles) Object.assign(item, { status: "rejected", error: `Maximal ${maxFiles} Dateien pro Anfrage.` });
      else if (file.size > limit) Object.assign(item, { status: "rejected", error: `Zu groß: max. ${formatBytes(limit)} für ${UPLOAD_CONFIG.categories[category].labelPlural}.` });
      setItems((prev) => [...prev, item]);
      if (item.status === "rejected") continue;
      // Content check before the upload (magic bytes, QA fix1 P2-3).
      const sniffed = await sniff(file);
      if (sniffed === null) {
        update(key, { status: "rejected", error: TYPE_HINT });
        continue;
      }
      if (sniffed) {
        // An empty/odd browser MIME type: let the bytes pick photo vs. video.
        const real = picker.hint === "plan" ? "plan" : sniffed.family === "video" ? "video" : sniffed.family === "image" ? "photo" : category;
        if (!UPLOAD_CONFIG.categories[real].families.includes(sniffed.family)) {
          update(key, { status: "rejected", error: TYPE_HINT });
          continue;
        }
        if (real !== category) {
          if (file.size > UPLOAD_CONFIG.categories[real].maxBytes) {
            update(key, { status: "rejected", error: `Zu groß: max. ${formatBytes(UPLOAD_CONFIG.categories[real].maxBytes)} für ${UPLOAD_CONFIG.categories[real].labelPlural}.` });
            continue;
          }
          update(key, { category: real });
        }
      }
      if (isVideo) {
        const d = await videoDuration(file);
        if (d && d > UPLOAD_CONFIG.videoMaxSeconds + 5) {
          update(key, { status: "rejected", error: `Video ist ${Math.round(d)} s lang – bitte max. ${UPLOAD_CONFIG.videoMaxSeconds / 60} Minuten.` });
          continue;
        }
      }
      update(key, { status: "queued" });
    }
  };

  const onPick = (picker) => (e) => {
    addFiles(e.target.files, picker);
    e.target.value = ""; // allow picking the same file again (resume)
  };

  const remove = async (item) => {
    removedRef.current.add(item.key);
    if (item.status === "uploading") xhrBox.xhr?.abort();
    if (item.preview) URL.revokeObjectURL(item.preview);
    setItems((prev) => prev.filter((it) => it.key !== item.key));
    if (item.fileId) await fetch(`${api}/files/${item.fileId}`, { method: "DELETE" }).catch(() => {});
  };

  const retry = (item) => update(item.key, { status: "queued", error: null });
  const retryFailed = () => {
    setItems((prev) => prev.map((it) => (it.status === "error" && it.file ? { ...it, status: "queued", error: null } : it)));
    setAnnounce("Neuer Versuch gestartet.");
  };

  // Confirmation POST: idempotent on the server, so network errors (e.g. the
  // WebKit "rewinding of the data stream failed" on reused connections) are
  // retried twice before the visitor sees an error.
  const submit = async (e) => {
    e?.preventDefault();
    setSubmitState("sending");
    setSubmitError("");
    const res = await postJson(api, { note, submit: true, consentVersion: CONSENT_VERSION }, SUBMIT_BACKOFF, null, { timeout: SUBMIT_TIMEOUT_MS });
    if (res.ok) {
      setSession(res.json.session);
      justSubmitted.current = true;
      setSubmitState("done");
      setAnnounce("Vielen Dank – Ihre Unterlagen sind bei uns.");
      buzz(14);
      return;
    }
    if (res.status >= 400 && res.status < 500) {
      if (linkDead(res.json.error)) {
        setSubmitState("idle");
        return;
      }
      setSubmitError(message(res.json.error || (res.status === 429 ? "rate_limited" : undefined)));
      setSubmitState("error");
      return;
    }
    setSubmitError(
      res.network && !navigator.onLine
        ? "Keine Verbindung – bitte tippen Sie erneut auf „Senden“, sobald Sie wieder online sind."
        : done.length > 0
        ? "Ihre Dateien sind gespeichert – nur die Bestätigung fehlt. Bitte tippen Sie erneut auf „Senden“."
        : "Senden fehlgeschlagen – bitte erneut versuchen.",
    );
    setSubmitState("error");
  };

  const canSubmit = consent && uploadsEnabled && !linkProblem && !busy && (done.length > 0 || note.trim().length > 0);
  // Hard lock (link dead, uploads off): disabled + dashed. Missing consent is a
  // soft lock: tiles look ready (aria-disabled) and lead to the checkbox.
  const hardLocked = !uploadsEnabled || Boolean(linkProblem);
  const locked = !consent || hardLocked;
  const needsConsent = !consent && !hardLocked;
  const formId = `${uid}-form`;
  const CONSENT_HINT = "Bitte zuerst zustimmen – dann können Sie Fotos und Pläne hinzufügen.";
  const askConsent = () => {
    const box = consentRef.current;
    bringIntoView(box?.closest("[data-upload-consent]"));
    box?.focus({ preventScroll: true });
    setNudged(true);
    setAnnounce((a) => (a === CONSENT_HINT ? `${CONSENT_HINT} ` : CONSENT_HINT));
  };


  const pickers = [
    { id: "photo", icon: Camera, label: "Foto aufnehmen", sub: "Raumfotos mit der Kamera", accept: "image/*", capture: "environment", cat: "photo" },
    { id: "video", icon: Film, label: "Video-Rundgang", sub: `Kamera · max. ${UPLOAD_CONFIG.videoMaxSeconds / 60} Min.`, accept: "video/*", capture: "environment", cat: "video" },
    { id: "plan", icon: FileText, label: "Grundriss / Plan", sub: "PDF oder Bild", accept: "application/pdf,image/*", multiple: true, hint: "plan", cat: "plan" },
    { id: "gallery", icon: Images, label: "Aus Galerie", sub: "Fotos & Videos", accept: "image/*,video/*", multiple: true },
  ];
  // Abnahme R-1: files that landed in a capture input before hydration (slow
  // phone, busy server) are adopted once after mount instead of dropped. They
  // still pass the full client check and wait in the queue until consent.
  useEffect(() => {
    const t = setTimeout(() => {
      for (const p of pickers) {
        const el = inputs[p.id].current;
        if (el?.files?.length) {
          addFiles(el.files, p);
          el.value = "";
        }
      }
    }, 0);
    return () => clearTimeout(t);
    // Mount only: addFiles/pickers are read once from the first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const countOf = (cat) => items.filter((it) => it.category === cat && it.status !== "rejected").length;
  const noteFilled = note.trim().length > 0;
  const step = !consent ? 1 : done.length === 0 && !noteFilled ? 2 : 3;

  const live = (
    <>
      <style>{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </>
  );
  // Side safe areas (landscape phones with a notch) on top of the 16 px gutter.
  const gutter = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

  if (submitState === "done") {
    const byCat = CATEGORY_ORDER.map(([cat, one, many]) => {
      const n = done.filter((it) => it.category === cat).length;
      return n ? `${n} ${n === 1 ? one : many}` : null;
    }).filter(Boolean);
    return (
      <div ref={doneRef} data-upload-done="" className={`mx-auto w-full max-w-md scroll-mt-28 ${gutter} ${embedded ? "py-6" : "py-8"}`}>
        {live}
        <div className="border border-line bg-paper motion-safe:animate-[uploadRise_var(--duration-enter)_var(--ease-quiet)_both]">
          <div className="px-6 pb-6 pt-8 text-center">
            <DoneMark />
            <h2 ref={doneHeadingRef} tabIndex={-1} className="font-display mt-4 text-[2.25rem] leading-tight focus:outline-none">Vielen Dank!</h2>
            <p className="mx-auto mt-3 max-w-[30ch] text-base leading-relaxed text-ink/85 text-pretty">
              {done.length > 0 ? `${done.length} ${done.length === 1 ? "Datei" : "Dateien"} (${formatBytes(doneBytes)})` : "Ihre Notiz"}{" "}
              {done.length === 1 || done.length === 0 ? "ist" : "sind"} bei uns angekommen. Wir melden uns persönlich.
            </p>
          </div>

          {done.length > 0 && (
            // QA fix2 P3-1: one file → full width in 4:3; two → two columns; more → the 4-column grid.
            <ul
              className={`grid border-y border-line ${done.length === 1 ? "grid-cols-1" : done.length === 2 ? "grid-cols-2" : done.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
              aria-label="Gesendete Dateien"
              data-upload-done-grid={Math.min(done.length, 4)}
            >
              {done.slice(0, 8).map((it) => (
                <li
                  key={it.key}
                  title={it.name}
                  className={`border-r border-line bg-paper last:border-r-0 ${done.length === 1 ? "aspect-[4/3]" : "aspect-square"} ${done.length > 3 ? "[&:nth-child(4n)]:border-r-0" : ""}`}
                >
                  <Thumb it={it} size="h-full w-full" />
                  <span className="sr-only">{it.name}</span>
                </li>
              ))}
              {done.length > 8 && <li className="flex aspect-square items-center justify-center bg-bone text-sm font-medium">+{done.length - 8}</li>}
            </ul>
          )}

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-6 py-5 text-sm">
            <dt className="text-ink-soft">Ihre Referenz</dt>
            <dd className="text-right font-medium tabular-nums">{session?.ref}</dd>
            {byCat.length > 0 && (
              <>
                <dt className="text-ink-soft">Unterlagen</dt>
                <dd className="text-right">{byCat.join(" · ")}</dd>
              </>
            )}
            <dt className="text-ink-soft">Notiz</dt>
            <dd className="text-right">{noteFilled ? "mitgesendet" : "keine"}</dd>
          </dl>

          <div className="border-t border-line px-6 py-5">
            <h3 className="text-overline uppercase text-gold-text">So geht es weiter</h3>
            <ol className="mt-3 space-y-3">
              {NEXT_STEPS.map(([title, text], i) => (
                <li key={title} className="grid grid-cols-[1.75rem_1fr] gap-x-3">
                  <span
                    className={`flex size-7 items-center justify-center border text-xs font-semibold tabular-nums ${i === 0 ? "border-ink bg-ink text-paper" : "border-line-control text-ink"}`}
                    aria-hidden="true"
                  >
                    {i === 0 ? <Check size={14} strokeWidth={2.25} /> : i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">
                    <span className="block font-medium text-ink">{i === 0 ? <><span className="sr-only">Erledigt: </span>{title}</> : title}</span>
                    <span className="text-ink/80">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          {session?.demo && <p className="border-t border-line bg-bone px-6 py-3 text-sm">Demo-Modus: Es wurde niemand benachrichtigt.</p>}
        </div>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 border border-ink px-5 text-base font-medium text-ink transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Plus size={18} aria-hidden="true" /> Weitere Dateien hinzufügen
        </button>
        {!embedded && (
          <Link href="/de" className="mx-auto mt-2 flex min-h-11 w-fit items-center px-2 text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
            Zur Website von Platzhirsch
          </Link>
        )}
      </div>
    );
  }

  const showBar = items.some((it) => it.status !== "rejected");

  // ---- sticky bar state (QA fix2 P1-1/P2-2): mirrors the active file ----
  const active = items.find((it) => it.status === "uploading");
  const failed = items.filter((it) => it.status === "error" && it.file);
  const waiting = counted.some((it) => ACTIVE.includes(it.status) || it.status === "paused");
  const isPaused = waiting && (!online || (!active && items.some((it) => it.status === "paused")));
  const activePct = active ? Math.min(99, Math.floor((active.progress || 0) * 100)) : 0;
  const barMode = isPaused
    ? "paused"
    : active?.retry > 1
      ? "retry"
      : active && (active.slow || active.stalled) && (activePct === 0 || active.stalled)
        ? "slow"
        : busy
          ? "busy"
          : failed.length > 0
            ? "failed"
            : "idle";
  const barTitle = {
    paused: "Pausiert – wartet auf Verbindung",
    retry: `Neuer Versuch ${active?.retry}/${active?.retryOf || TRIES}…`,
    slow: "Verbindung ist langsam – wir bleiben dran…",
    busy: active?.phase === "prepare" ? "Wird vorbereitet…" : "Lädt hoch…",
    failed: `${failed.length} ${failed.length === 1 ? "Datei" : "Dateien"} nicht hochgeladen`,
    idle: done.length > 0 ? `${done.length} ${done.length === 1 ? "Datei" : "Dateien"} bereit` : "Keine Datei hochgeladen",
  }[barMode];
  const barDetail = waiting || failed.length ? `${done.length} von ${counted.length} fertig · ${pct} % der Daten` : formatBytes(doneBytes);
  // Calm sweep over the bar while nothing measurable moves (never a frozen 0 %).
  const sweeping = Boolean(active) && (active.phase === "prepare" || barMode === "retry" || barMode === "slow" || activePct === 0);
  const BarIcon = { paused: WifiOff, retry: RotateCw, slow: Hourglass, failed: CircleAlert }[barMode];
  // QA fix2 P3-2: 32 px preview of the file in work (or the newest one) right in the bar.
  const barThumb = active || [...items].reverse().find((it) => it.status !== "rejected");

  return (
    <div className="mx-auto w-full max-w-md" data-upload-client="">
      {live}
      <div className={`${gutter} pb-6 pt-4`}>
        <Stepper step={step} />

        {!online && (
          <p role="status" className="mt-4 flex items-center gap-2 border border-line bg-stone p-3 text-sm">
            <WifiOff size={18} className="shrink-0" aria-hidden="true" /> Keine Verbindung – der Upload geht automatisch weiter, sobald Sie wieder online sind.
          </p>
        )}
        {linkProblem && (
          <div role="alert" className="mt-4 border border-error/40 bg-paper p-3 text-sm leading-relaxed">
            <p className="flex items-start gap-2 font-medium text-error"><CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{message(linkProblem)}</p>
            <p className="mt-1 text-ink/85">
              Fertig hochgeladene Dateien bleiben bei uns. Für weitere Unterlagen rufen Sie uns an (
              <a href={PHONE_HREF} className="font-medium text-gold-text underline">{PHONE_DISPLAY}</a>) oder schreiben Sie an{" "}
              <a href={EMAIL_HREF} className="font-medium text-gold-text underline">{EMAIL}</a>.
            </p>
          </div>
        )}
        {!uploadsEnabled && (
          <p role="status" className="mt-4 border border-line-strong bg-paper p-3 text-sm">
            Demo nur in der Entwicklungsumgebung: Hier werden keine Dateien angenommen.
          </p>
        )}

        {/* 1 · consent */}
        <div
          data-upload-consent=""
          className={`mt-4 border bg-paper transition-[border-color,outline-color] duration-(--duration-micro) ${consent ? "border-ink" : nudged ? "border-ink outline-2 outline-offset-2 outline-ink" : "border-line-control"}`}
        >
          <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 text-[15px] leading-snug">
            <input
              ref={consentRef}
              type="checkbox"
              checked={consent}
              disabled={!mounted}
              onChange={(e) => {
                setConsent(e.target.checked);
                setNudged(false);
              }}
              className="h-6 w-6 shrink-0 cursor-pointer accent-[#30373e]"
              aria-describedby={`${uid}-consent-details`}
            />
            <span>
              <ConsentShort />
            </span>
          </label>
          <details className="group border-t border-line px-4 text-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span className="underline decoration-line-strong underline-offset-4">Details: Speicherdauer, Widerruf, Datenschutz</span>
              <ChevronDown size={16} className="shrink-0 transition-transform duration-(--duration-ui) group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <div id={`${uid}-consent-details`} className="pb-3 leading-relaxed text-ink/85">
              <ConsentDetails refCode={session?.ref} />
            </div>
          </details>
        </div>

        {/* 2 · capture tiles */}
        <h2 className="mt-7 text-overline uppercase text-gold-text">Was möchten Sie zeigen?</h2>
        <div className="mt-3 grid grid-cols-2 gap-3" role="group" aria-label="Dateien hinzufügen">
          {pickers.map((p) => {
            const n = p.cat ? countOf(p.cat) : 0;
            return (
              <div key={p.id}>
                <input
                  ref={inputs[p.id]}
                  id={`${uid}-${p.id}`}
                  type="file"
                  accept={p.accept}
                  capture={p.capture}
                  multiple={p.multiple}
                  onChange={onPick(p)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  disabled={hardLocked}
                  aria-disabled={needsConsent || undefined}
                  aria-describedby={needsConsent ? `${uid}-consent-hint` : undefined}
                  onClick={() => (needsConsent ? askConsent() : inputs[p.id].current?.click())}
                  className={`group relative flex min-h-36 w-full flex-col items-start justify-between gap-3 border p-4 text-left transition-[background-color,border-color,transform] duration-(--duration-micro) ease-quiet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-safe:enabled:active:scale-[0.98] ${
                    hardLocked ? "cursor-not-allowed border-dashed border-stone-deep bg-bone text-ink/80" : "border-line-control bg-paper text-ink hover:border-ink hover:bg-bone"
                  }`}
                >
                  <span className={`flex size-11 items-center justify-center border ${hardLocked ? "border-stone-deep" : "border-line-strong group-hover:border-ink"}`}>
                    <p.icon size={22} strokeWidth={1.5} className={hardLocked ? "text-ink/45" : "text-ink"} aria-hidden="true" />
                  </span>
                  <span className="block">
                    {/* Locked: ink/80 and ink/75 on bone = 6.1:1 and 5.3:1 (ink/60 would only be 3.5:1). */}
                    <span className={`block text-base font-medium leading-tight ${hardLocked ? "text-ink/80" : ""}`}>{p.label}</span>
                    <span className={`mt-1 block text-xs leading-snug ${hardLocked ? "text-ink/75" : "text-ink-soft"}`}>{p.sub}</span>
                  </span>
                  {n > 0 && (
                    <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center bg-ink px-1.5 text-xs font-semibold tabular-nums text-paper">
                      {n}
                      <span className="sr-only"> {n === 1 ? "Datei" : "Dateien"} gewählt</span>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (needsConsent) return askConsent();
              const el = document.getElementById(`${uid}-note`);
              bringIntoView(el);
              el?.focus({ preventScroll: true });
            }}
            disabled={hardLocked}
            aria-disabled={needsConsent || undefined}
            aria-describedby={needsConsent ? `${uid}-consent-hint` : undefined}
            className={`col-span-2 flex min-h-16 w-full items-center gap-4 border px-4 py-3 text-left transition-colors duration-(--duration-micro) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              hardLocked ? "cursor-not-allowed border-dashed border-stone-deep bg-bone text-ink/80" : "border-line-control bg-paper text-ink hover:border-ink hover:bg-bone"
            }`}
          >
            <span className={`flex size-11 shrink-0 items-center justify-center border ${hardLocked ? "border-stone-deep" : "border-line-strong"}`}>
              <NotebookPen size={22} strokeWidth={1.5} className={hardLocked ? "text-ink/45" : "text-ink"} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-base font-medium leading-tight ${hardLocked ? "text-ink/80" : ""}`}>Notiz &amp; Maße</span>
              <span className={`mt-1 block text-xs leading-snug ${hardLocked ? "text-ink/75" : "text-ink-soft"}`}>
                {noteFilled ? "Notiz geschrieben – tippen zum Bearbeiten" : "Raumhöhe, Wandlängen, Wünsche"}
              </span>
            </span>
            {noteFilled && <Check size={18} className="shrink-0 text-ink" aria-hidden="true" />}
          </button>
        </div>
        {needsConsent && (
          <p id={`${uid}-consent-hint`} className={`mt-2 text-center text-xs ${nudged ? "font-medium text-ink" : "text-ink/80"}`}>
            {nudged ? "Einmal oben zustimmen – dann geht es los." : "Zum Hochladen bitte zuerst oben zustimmen."}
          </p>
        )}

        {/* guided capture tips */}
        <Tips />

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink/80">
          <MapPinOff size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Standortdaten (GPS) entfernen wir aus JPEG-Fotos automatisch. Bei HEIC-Fotos (iPhone „High Efficiency“) bitte den Standort in der Kamera ausschalten.
        </p>

        {/* 3 · preview gallery with per-file progress */}
        {items.length > 0 && (
          <section className="mt-7" aria-labelledby={`${uid}-files`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id={`${uid}-files`} className="text-overline uppercase text-gold-text">Ihre Dateien</h2>
              <p className="text-xs text-ink-soft tabular-nums">{done.length} von {counted.length} · {formatBytes(doneBytes)}</p>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-3" aria-label="Ihre Dateien">
              {items.map((it) => {
                const p = it.status === "done" ? 100 : Math.min(99, Math.floor((it.progress || 0) * 100));
                const moving = ["uploading", "queued", "paused", "interrupted"].includes(it.status);
                const bad = ["rejected", "stopped", "error"].includes(it.status);
                return (
                  <li key={it.key} className={`flex min-w-0 flex-col border bg-paper motion-safe:animate-[uploadRise_var(--duration-ui)_var(--ease-quiet)_both] ${bad ? "border-error/40" : "border-line"}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Thumb it={it} size="h-full w-full" />
                      {it.status === "done" && (
                        <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center bg-ink text-paper" aria-hidden="true">
                          <Check size={16} strokeWidth={2.25} />
                        </span>
                      )}
                      {it.status === "uploading" && it.phase !== "prepare" && (
                        <span className="absolute bottom-3 left-2 bg-ink-deep/85 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-paper" aria-hidden="true">{p} %</span>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(it)}
                        className="absolute right-0 top-0 inline-flex size-11 items-center justify-center bg-paper/90 text-ink hover:bg-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                        aria-label={`${it.name} entfernen`}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                      {moving && (
                        <div
                          className="absolute inset-x-0 bottom-0 h-1.5 overflow-hidden bg-paper/70"
                          role="progressbar"
                          aria-label={`Upload ${it.name}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={p}
                        >
                          {it.status === "uploading" && p === 0 ? (
                            // Before the first byte: a calm sweeping segment (static 30 % with reduced motion), never a frozen empty bar.
                            <div className="h-full w-[30%] bg-ink motion-safe:animate-[uploadSweep_1.4s_var(--ease-quiet)_infinite]" />
                          ) : (
                            <div className={`h-full bg-ink motion-safe:transition-[width] motion-safe:duration-300 ${it.status === "paused" ? "opacity-50" : ""}`} style={{ width: `${p}%` }} />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 p-2.5">
                      <p className="truncate text-sm font-medium" title={it.name}>{it.name}</p>
                      <p className="text-xs text-ink-soft tabular-nums">
                        {UPLOAD_CONFIG.categories[it.category].label} · {formatBytes(it.size)}
                      </p>
                      <p className="mt-1 text-xs leading-snug" aria-live="off">
                        {it.status === "checking" && "Wird geprüft…"}
                        {it.status === "queued" && "Wartet…"}
                        {it.status === "uploading" &&
                          (it.retry > 1 ? (
                            <span className="inline-flex items-start gap-1 text-ink" data-upload-retry="">
                              <RotateCw size={13} className="mt-px shrink-0 motion-safe:animate-spin motion-safe:[animation-duration:1.6s]" aria-hidden="true" />
                              Verbindung holpert – neuer Versuch ({it.retry}/{it.retryOf || TRIES})…
                            </span>
                          ) : it.slow && p === 0 ? (
                            <span data-upload-slow="">Verbindung ist langsam – wir bleiben dran…</span>
                          ) : it.phase === "prepare" ? (
                            "Wird vorbereitet…"
                          ) : (
                            `Lädt hoch · ${p} %`
                          ))}
                        {it.status === "paused" && "Pausiert – wartet auf Verbindung"}
                        {it.status === "interrupted" && `Unterbrochen bei ${p} % – dieselbe Datei erneut auswählen, um fortzusetzen.`}
                        {it.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CircleCheck size={14} aria-hidden="true" /> Hochgeladen{it.gpsRemoved ? " · Standort entfernt" : ""}
                          </span>
                        )}
                        {it.status === "rejected" && (
                          <span className="inline-flex items-start gap-1 text-error">
                            <CircleAlert size={14} className="mt-px shrink-0" aria-hidden="true" /> Abgelehnt: {it.error}
                          </span>
                        )}
                        {it.status === "stopped" && (
                          <span className="inline-flex items-start gap-1 text-error">
                            <CircleAlert size={14} className="mt-px shrink-0" aria-hidden="true" /> Gestoppt: {it.error}
                          </span>
                        )}
                        {it.status === "error" && (
                          <span className="inline-flex items-start gap-1 text-error">
                            <CircleAlert size={14} className="mt-px shrink-0" aria-hidden="true" /> {it.error}
                          </span>
                        )}
                      </p>
                      {it.status === "error" && it.file && (
                        <button type="button" onClick={() => retry(it)} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink underline underline-offset-4">
                          <RotateCw size={14} aria-hidden="true" /> Erneut versuchen
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 4 · note + send */}
        <form id={formId} onSubmit={submit} className="mt-7">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={`${uid}-note`} className="block text-base font-medium">
              Notiz &amp; Maße <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <span className="text-xs text-ink-soft tabular-nums" aria-hidden="true">{note.length} / {UPLOAD_CONFIG.noteMaxLength}</span>
          </div>
          <textarea
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={UPLOAD_CONFIG.noteMaxLength}
            rows={4}
            disabled={locked}
            placeholder="z. B. Raumhöhe 2,60 m, Fenster nach Süden, Sofa soll an die linke Wand"
            className="mt-2 w-full border border-line-control bg-paper p-3 text-base placeholder:text-ink-soft focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink disabled:cursor-not-allowed disabled:border-dashed disabled:border-stone-deep disabled:bg-bone"
          />
          <button
            ref={submitRef}
            type="submit"
            disabled={!canSubmit || submitState === "sending"}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-5 text-base font-medium tracking-wide text-paper transition-colors duration-(--duration-micro) hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-stone disabled:text-ink/80"
          >
            <Send size={16} aria-hidden="true" />
            {submitState === "sending" ? "Wird gesendet…" : busy ? "Upload läuft…" : "An Platzhirsch senden"}
          </button>
          {submitState === "error" && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-error">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {submitError}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-ink/80 tabular-nums">
            {done.length} {done.length === 1 ? "Datei" : "Dateien"} · {formatBytes(doneBytes)}
            {session?.expiresAt && <> · Link gültig bis {DATETIME_FMT.format(new Date(session.expiresAt))} Uhr</>}
          </p>
        </form>
      </div>

      {/* Sticky overall progress: the page's one dark surface (Design-Bibel §4, ink-deep). */}
      {showBar && (
        <div className={`sticky bottom-0 z-20 bg-ink-deep pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-paper ${gutter}`}>
          <div className="flex items-center justify-between gap-3 text-sm" data-upload-bar="" data-upload-bar-mode={barMode}>
            <div className="flex min-w-0 items-center gap-3" aria-hidden="true">
              {barThumb && (
                <span key={barThumb.key} className="relative block size-8 shrink-0 overflow-hidden motion-safe:animate-[uploadRise_var(--duration-ui)_var(--ease-quiet)_both]" data-upload-bar-thumb="">
                  <Thumb it={barThumb} size="h-8 w-8 [&_svg]:size-4" />
                  {barThumb.status === "done" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink-deep/55 text-paper">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </span>
              )}
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-1.5 font-medium" data-upload-bar-title="">
                  {BarIcon && (
                    <BarIcon
                      size={14}
                      className={`shrink-0 ${barMode === "retry" ? "motion-safe:animate-spin motion-safe:[animation-duration:1.6s]" : ""} ${barMode === "failed" ? "text-brass-400" : ""}`}
                    />
                  )}
                  <span className="truncate">{barTitle}</span>
                </span>
                <span className="block truncate text-xs tabular-nums text-paper/80" data-upload-bar-detail="">{barDetail}</span>
              </span>
            </div>
            {barMode !== "paused" && active?.stalled && (
              <button
                type="button"
                onClick={kickNow}
                data-upload-kick=""
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 border border-paper/60 text-sm font-medium text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400 sm:px-3.5"
              >
                {/* Abnahme R-5: icon-only on phones so the status text keeps its room */}
                <RotateCw size={16} aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Erneut versuchen</span>
              </button>
            )}
            {barMode === "failed" && (
              <button
                type="button"
                onClick={retryFailed}
                data-upload-retry-all=""
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 border border-paper/60 text-sm font-medium text-paper hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400 sm:px-3.5"
              >
                {/* Abnahme R-5: icon-only on phones so the status text keeps its room */}
                <RotateCw size={16} aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Erneut versuchen</span>
              </button>
            )}
            {!busy && barMode !== "failed" && canSubmit && submitState !== "sending" && !formButtonOnScreen && (
              <button
                type="submit"
                form={formId}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-paper px-4 text-sm font-medium tracking-wide text-ink hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400"
              >
                <Send size={14} aria-hidden="true" /> Senden
              </button>
            )}
          </div>
          <div className="relative mt-2 h-1 overflow-hidden bg-paper/20" aria-hidden="true">
            <div
              className={`h-full bg-brass-400 motion-safe:transition-[width] motion-safe:duration-300 ${barMode === "paused" ? "opacity-50" : ""}`}
              style={{ width: `${waiting || done.length ? pct : 0}%` }}
            />
            {sweeping && (
              <div className="absolute inset-y-0 left-0 w-[30%] bg-brass-400/80 motion-safe:animate-[uploadSweep_1.4s_var(--ease-quiet)_infinite] motion-reduce:hidden" data-upload-bar-sweep="" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
