"use client";

import { useEffect, useRef, useState } from "react";
import s from "./Navbar.module.css";
import { fitNav } from "./navFit";

// The <header> landmark with the one behaviour that needs JS: below 768 px it
// slides away while scrolling down and returns after ≥ 8 px of scrolling up
// (Design-Bibel W7). Desktop stays put. It never hides while focus is inside
// (WCAG 2.4.11) or while one of its menus is open. Children stay server-
// rendered – this island only toggles attributes.
// navStart: server guess of the main bar density (navbar.js navStart) – the
// CSS default per locale and width until fitNav() has measured (navFit.js).
export default function HeaderFrame({ children, className, navStart }) {
  const ref = useRef(null);
  const [hidden, setHidden] = useState(false);

  // Main bar fit ≥ 1280 px (navFit.js). Not while the menu dialog is open:
  // showModal + overflow:hidden drops the scrollbar and would widen the slot.
  useEffect(() => {
    const header = ref.current;
    const slot = header?.querySelector("[data-nav-slot]");
    if (!header || !slot) return undefined;
    let frame = 0;
    const run = () => {
      frame = 0;
      if (header.querySelector("dialog[open]")) return;
      fitNav(header);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(slot);
    const list = slot.querySelector("ul");
    if (list) ro.observe(list);
    const wide = window.matchMedia("(min-width: 1280px)");
    wide.addEventListener("change", schedule);
    header.addEventListener("close", schedule, true); // menu dialog closed
    document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", schedule);
      header.removeEventListener("close", schedule, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)");
    let lastY = window.scrollY;
    let upTravel = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const header = ref.current;
      const busy = header && header.querySelector(":focus-visible, [aria-expanded='true'], dialog[open]");
      if (!phone.matches || busy || y < (header?.offsetHeight || 56)) {
        setHidden(false);
        upTravel = 0;
      } else if (y > lastY) {
        upTravel = 0;
        if (y - lastY > 2) setHidden(true);
      } else if (y < lastY) {
        upTravel += lastY - y;
        if (upTravel >= 8) setHidden(false);
      }
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const show = () => setHidden(false);

    window.addEventListener("scroll", onScroll, { passive: true });
    phone.addEventListener("change", show);
    const header = ref.current;
    const onFocus = () => header?.querySelector(":focus-visible") && show();
    header?.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      phone.removeEventListener("change", show);
      header?.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header ref={ref} data-hidden={hidden ? "true" : "false"} data-nav-start={navStart} className={`${s.header} ${className || ""}`}>
      {children}
    </header>
  );
}
