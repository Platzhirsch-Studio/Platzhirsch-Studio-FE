"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// WowControls – the only client JS of the "Pause" hero (≤ 4 KB gzip, no
// library, no motion).
//  - starts the ink pen (push r3, Wächter #2): only when the photo is decoded
//    and the page is hydrated and idle (requestIdleCallback, ≤ 600 ms) – until
//    then the start script holds the stage on the paper (data-wow-wait); at
//    its deadline it starts the compositor pen itself (data-wow-pen="wipe");
//  - push r4 (luxus-cd #3, Wächter #2, awwwards #2): at rest the photo stands
//    alone. When the sequence comes to rest by itself, the drawing glides in
//    once to 35 % with the labelled handle and springs back (data-wow-invite,
//    CSS, compositor only; never with reduced motion or after a skip). ONE
//    quiet button "Die Linie zeigen" / "Nur das Foto" opens and closes the
//    comparison slider (data-wow-line);
//  - the comparison slider: drag the edge (pointer or finger, touch-action
//    pan-y – no scroll hijacking), tap in the photo to move it there (WCAG
//    2.5.7), or use the keyboard (role slider);
//  - measures the H1 so the horizon stops before the type (Wächter #5);
//  - dispatches "ph:wow-done" once when the stage is at rest – after the
//    sequence, after a skip, or at once when it does not play (reduced
//    motion, seen in this session) – and sets window.phWowDone, so the cookie
//    banner can wait for it (awwwards / luxus-cd #6, Wächter #5).
// Before hydration and without JS the button stands as quiet text in the
// server HTML (aria-disabled).

const mq = (q) => window.matchMedia(q).matches;
const subscribeNone = () => () => {};
const track = (action) => {
  // Same path as lib/analytics trackEvent: gtag exists only under Consent Mode.
  if (typeof window.gtag === "function") window.gtag("event", "wow_pause", { action });
};
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 50));
const announce = () => {
  if (window.phWowDone) return;
  window.phWowDone = true;
  window.dispatchEvent(new Event("ph:wow-done"));
};

// Visitor actions that count as "seen" (same list as the inline start script).
const SEEN_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

export default function WowControls({ labels, end, open: OPEN, inviteMs, mobileSequence, seenKey, cls }) {
  const bar = useRef(null);
  const handle = useRef(null);
  const timers = useRef([]);
  const inited = useRef(false);
  const cut = useRef(0);
  // false in the server HTML and during hydration, true once hydrated.
  const ready = useSyncExternalStore(subscribeNone, () => true, () => false);
  const [open, setOpen] = useState(false);

  const fig = () => bar.current?.closest("[data-wow-stage]");
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const setCut = (v) => {
    const f = fig();
    const n = Math.round(Math.min(100, Math.max(0, v)));
    cut.current = n;
    f?.style.setProperty("--cut", `${n}%`);
    f?.toggleAttribute("data-wow-flip", n > 70);
    const h = handle.current;
    if (h) {
      h.setAttribute("aria-valuenow", n);
      h.setAttribute("aria-valuetext", labels.slider.value.replace("{n}", n));
    }
  };
  const calm = () =>
    mq("(prefers-reduced-motion: reduce)") || document.documentElement.dataset.motion === "reduced";
  // natural = the sequence ran to its end (not skipped, not a still start)
  const rest = (f, natural) => {
    f.dataset.wow = "done";
    f.dataset.wowState = "room";
    if (natural && !calm() && !f.hasAttribute("data-wow-line")) {
      f.dataset.wowInvite = "";
      // r8 (gesamtwerk P1-1): animationend of the rail ends it at once; the
      // timeout stays as the fallback (WebKit does not fire it reliably).
      const rail = f.querySelector("[data-wow-rail]");
      const done = (e) => {
        if (e && e.target !== rail) return;
        rail?.removeEventListener("animationend", done);
        delete f.dataset.wowInvite;
      };
      rail?.addEventListener("animationend", done);
      timers.current.push(setTimeout(done, inviteMs + 50));
    }
    announce();
  };
  const follow = (f, elapsed) => {
    clear();
    timers.current.push(setTimeout(() => rest(f, true), Math.max(0, end - elapsed)));
  };

  useEffect(() => {
    const f = fig();
    if (!f) return;
    f.dataset.wowReady = "";
    if (inited.current === false) {
      let seen = false;
      // Hard loads ran the inline start script; client navigations did not.
      if (!f.hasAttribute("data-wow-init")) {
        try {
          seen = !!sessionStorage.getItem(seenKey);
        } catch {}
      }
      const still =
        seen ||
        calm() ||
        mq("(prefers-reduced-data: reduce)") ||
        mq("(update: slow)") ||
        (!mobileSequence && mq("(max-width: 639px)"));
      inited.current = true;
      if (still && f.dataset.wow === "play") {
        f.dataset.wow = "still";
        delete f.dataset.wowWait;
        f.dataset.wowState = "room";
      }
    }
    if (f.dataset.wow !== "play") announce();
    // The start script may skip to the room on input: stop the timers.
    const sync = new MutationObserver(() => {
      if (f.dataset.wow !== "still") return;
      clear();
      announce();
    });
    sync.observe(f, { attributes: true, attributeFilter: ["data-wow"] });

    // Start the pen: photo decoded + idle main thread (Wächter #2).
    let cancelled = false;
    let handleIdle = 0;
    // The sequence already runs (started by the start script): end it in step.
    const followRunning = () => {
      const a = f.querySelector("[data-wow-paper] > div > div")?.getAnimations?.()[0]; // runs in both pens
      const now = document.timeline?.currentTime;
      follow(f, a && a.startTime != null && now != null ? now - a.startTime : 0);
    };
    if (f.dataset.wow === "play") {
      if (f.hasAttribute("data-wow-wait")) {
        const img = f.querySelector("img");
        const decoded = img.complete ? Promise.resolve() : img.decode().catch(() => {});
        decoded.then(() => {
          handleIdle = idle(() => {
            if (cancelled || f.dataset.wow !== "play") return;
            // Team Grün (Konsolidierung): the start script's START_DEADLINE may
            // have started the compositor pen while this waited for decode/idle.
            // Returning here left data-wow="play" for good (no timer ever set
            // "done"; seen in the full E2E run under load) – follow that run.
            if (!f.hasAttribute("data-wow-wait")) return followRunning();
            delete f.dataset.wowWait;
            follow(f, 0);
          });
        });
      } else {
        // no start script ran (client navigation) or it started without waiting
        followRunning();
      }
    }

    // "Ruhige Ansicht" switched on later (footer): stop and show the end state.
    const quiet = new MutationObserver(() => {
      if (document.documentElement.dataset.motion === "reduced" && f.dataset.wow === "play") {
        clear();
        f.dataset.wow = "still";
        f.dataset.wowState = "room";
        delete f.dataset.wowWait;
        announce();
      }
    });
    quiet.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });

    // Horizon: from lg it runs left over the page paper; where a line of the
    // H1 lies within 12 px of it, it stops 16 px after that line's last glyph.
    const reach = f.querySelector("[data-wow-reach]");
    const h1 = document.getElementById("home-hero-title");
    const measure = () => {
      if (!reach || !h1 || !mq("(min-width: 1024px)")) return;
      const line = reach.firstElementChild.getBoundingClientRect();
      const frame = f.querySelector("[data-wow-frame]").getBoundingClientRect();
      // line boxes of the TEXT (a range over the element would add the block boxes)
      const rects = [];
      const walk = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(n);
        rects.push(...[...range.getClientRects()].filter((r) => r.width > 0));
      }
      if (!rects.length) return;
      const hit = rects.filter((r) => r.top - 12 < line.top && r.bottom + 12 > line.top);
      const start = hit.length ? Math.max(...hit.map((r) => r.right)) + 16 : Math.min(...rects.map((r) => r.left));
      // Design-Jury P2-18: a run shorter than 64 px reads as a stray stub between
      // the H1 and the photo (1440 px: 27 px after "am Bodensee.") – then none.
      const run = Math.round(frame.left - start);
      reach.style.setProperty("--reach", `${run >= 64 ? run : 0}px`);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    document.fonts?.ready.then(measure);

    // Comparison slider (only while the line is shown): drag the edge or tap a place in the photo.
    const frame = f.querySelector("[data-wow-frame]");
    let drag = null;
    let raf = 0;
    const at = (e) => {
      const r = frame.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    const active = () => f.dataset.wow !== "play" && f.hasAttribute("data-wow-line");
    // listeners on the figure: the handle lies in its own grid cell over the frame
    const down = (e) => {
      if (!active() || e.button > 0 || !e.target.closest("[data-wow-frame], [data-wow-handle]")) return;
      const x = at(e);
      // r8: at 0 % / 100 % the grip is clamped into the frame (beside the edge), so a press on it grabs too
      const onGrip = !!e.target.closest("[data-wow-handle]");
      const near = Math.abs(x - cut.current) * (frame.clientWidth / 100) < 36;
      drag = { id: e.pointerId, x0: e.clientX, grab: onGrip || near, near, moved: false };
      if (drag.grab) {
        f.setPointerCapture(e.pointerId);
        f.dataset.wowDrag = "";
      }
    };
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id || !drag.grab) return;
      drag.moved = true;
      const x = at(e);
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          setCut(x);
        });
    };
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      // a tap (no drag, < 8 px travel) moves the edge there, animated
      // (a grip met only while it still glides – not near the value – counts as a tap too)
      if ((!drag.grab || (!drag.near && !drag.moved)) && Math.abs(e.clientX - drag.x0) < 8) setCut(at(e));
      if (drag.grab || Math.abs(e.clientX - drag.x0) < 8) track("slider");
      delete f.dataset.wowDrag;
      drag = null;
    };
    const cancel = () => {
      delete f.dataset.wowDrag;
      drag = null;
    };
    f.addEventListener("pointerdown", down);
    f.addEventListener("pointermove", move);
    f.addEventListener("pointerup", up);
    f.addEventListener("pointercancel", cancel);
    // Rat 9,5 (A13, recht 8, § 165 Abs 3 TKG): "seen" is stored only after a
    // visitor action (pointer, key, wheel, touch) – a passive visit leaves no
    // entry. The inline start script does the same on hard loads.
    const markSeen = () => {
      try {
        sessionStorage.setItem(seenKey, "1");
      } catch {}
      SEEN_EVENTS.forEach((e) => window.removeEventListener(e, markSeen));
    };
    SEEN_EVENTS.forEach((e) => window.addEventListener(e, markSeen, { passive: true }));

    return () => {
      SEEN_EVENTS.forEach((e) => window.removeEventListener(e, markSeen));
      cancelled = true;
      clear();
      sync.disconnect();
      quiet.disconnect();
      ro.disconnect();
      if (window.cancelIdleCallback && handleIdle) cancelIdleCallback(handleIdle);
      cancelAnimationFrame(raf);
      f.removeEventListener("pointerdown", down);
      f.removeEventListener("pointermove", move);
      f.removeEventListener("pointerup", up);
      f.removeEventListener("pointercancel", cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Die Linie zeigen" / "Nur das Foto"
  const toggle = () => {
    const f = fig();
    if (!f || f.dataset.wow === "play") return;
    const next = !open;
    delete f.dataset.wowInvite;
    delete f.dataset.wowFade;
    f.dataset.wowEase = ""; // eased edge from now on (never on the switch from the sequence)
    if (next) f.dataset.wowLine = "";
    else delete f.dataset.wowLine;
    // R5-USP: "Nur das Foto" means the photo alone – the resting line
    // (data-wow-rest) leaves too; "Die Linie zeigen" brings it back after the comparison.
    if (next) delete f.dataset.wowPhoto;
    else f.dataset.wowPhoto = "";
    setCut(next ? OPEN : 0);
    setOpen(next);
    track(next ? "line_open" : "line_close");
  };

  const onSlider = (e) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 25, PageDown: -25 }[e.key];
    const abs = { Home: 0, End: 100 }[e.key];
    if (step == null && abs == null) return;
    e.preventDefault();
    setCut(abs ?? cut.current + step);
  };

  return (
    <>
      <button
        ref={bar}
        type="button"
        className={cls.show}
        data-wow-show=""
        aria-disabled={ready ? undefined : "true"}
        onClick={() => ready && toggle()}
      >
        <svg className={cls.glyph} viewBox="0 0 28 18" aria-hidden="true" focusable="false">
          <path d="M1 17 14 9l13 8M14 9V1" />
        </svg>
        {open ? labels.show.close : labels.show.open}
      </button>
      {/* The slider lies over the frame (same grid cell); only its handle
          takes pointer events. Shown while the line is open, and during the
          invitation (not focusable then – visibility). */}
      <div className={cls.track}>
        <div className={cls.rail} data-wow-rail="">
          <div
            ref={handle}
            role="slider"
            tabIndex={0}
            className={cls.handle}
            data-wow-handle=""
            aria-label={labels.slider.label}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            aria-valuetext={labels.slider.value.replace("{n}", 0)}
            onKeyDown={onSlider}
          >
            <span className={cls.grip} aria-hidden="true" />
            <span className={cls.gripLabel} aria-hidden="true">
              {labels.slider.grip}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
