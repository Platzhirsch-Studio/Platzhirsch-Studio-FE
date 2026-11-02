"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import cx from "@/components/ui/cx";

// The interactive bits of the otherwise server-rendered footer.

// Footer link groups are <details> accordions on phones (Footer.js). From
// 768 px they are always open: globals.css shows the content via
// ::details-content even before/without JS; this island sets [open] so the
// state is right for assistive technology and for engines without
// ::details-content, and folds them again when the window shrinks to phone
// width. Renders nothing.
const GROUPS_DESKTOP = "(min-width: 768px)";
export function FooterGroupsOpen() {
  useEffect(() => {
    const mq = window.matchMedia(GROUPS_DESKTOP);
    const sync = () => {
      document.querySelectorAll("#site-footer details[data-footer-group]").forEach((d) => {
        d.open = mq.matches;
      });
    };
    if (mq.matches) sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return null;
}

// The consent dialog code loads only when the visitor asks for it (R4-shell-perf).
const CookieBanner = dynamic(() => import("@/components/Cookies/cookiecomponent"), { ssr: false });

/** Re-opens the consent settings (Consent Mode v2 banner). */
export function PrivacySettingsButton({ label, className }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <CookieBanner forceShow onClose={() => setOpen(false)} />}
    </>
  );
}

// "Ruhige Ansicht" (Design-Bibel §8.4, §14): motion off (html[data-motion=
// "reduced"], read by globals.css and every motion module), text +12.5 %,
// secondary and accent text switched to ink (≥ 7:1). Stored per browser in
// localStorage (try/catch: private mode, blocked storage). The colour and size
// overrides go on <html> as inline custom properties, so they win over the
// :root tokens without touching globals.css.
const STORAGE_KEY = "ph-calm-view";

function applyCalmView(on) {
  const root = document.documentElement;
  if (on) {
    root.dataset.motion = "reduced";
    root.dataset.view = "calm";
    root.style.fontSize = "112.5%";
    root.style.setProperty("--color-text-soft", "var(--color-ink)");
    root.style.setProperty("--color-text-accent", "var(--color-ink)");
  } else {
    delete root.dataset.motion;
    delete root.dataset.view;
    root.style.removeProperty("font-size");
    root.style.removeProperty("--color-text-soft");
    root.style.removeProperty("--color-text-accent");
  }
}

export function CalmViewToggle({ label, hint }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      /* storage blocked */
    }
    if (stored) {
      applyCalmView(true);
      setOn(true); // eslint-disable-line react-hooks/set-state-in-effect -- sync with storage after hydration
    }
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    applyCalmView(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, "on");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked: works for this visit only */
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby="ph-calm-hint"
        onClick={toggle}
        className="group inline-flex min-h-11 items-center gap-3 text-left text-ui text-text"
      >
        {/* Square track and knob: no radii in this system (§6). */}
        <span
          aria-hidden="true"
          className={cx(
            "relative inline-flex h-6 w-11 shrink-0 items-center border border-line-control transition-colors duration-(--duration-micro)",
            on ? "bg-action" : "bg-surface"
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 left-0.5 size-4.5 transition-transform duration-(--duration-micro) ease-quiet motion-reduce:transition-none",
              on ? "translate-x-5 bg-paper" : "bg-ink"
            )}
          />
        </span>
        <span>{label}</span>
      </button>
      <p id="ph-calm-hint" className="text-small text-text-soft">
        {hint}
      </p>
    </div>
  );
}
