"use client";

// Shell of the sitewide concierge (lazy chunk, loaded on intent by
// Launcher.js). Desktop (≥ 768 px): NON-modal side panel (<dialog>.show()), the
// page stays usable while the agent works on it; Esc closes. Mobile: modal
// bottom sheet (<dialog>.showModal(), 88 dvh, handle, swipe down, close
// button); on a page change it minimises to the "Gespräch fortsetzen" bar so
// the new page is visible. Stays mounted once loaded → the conversation
// survives client navigation; sessionStorage covers a reload.
import { useCallback, useEffect, useRef, useState } from "react";
import ChatCore from "./core/ChatCore";
import { texts } from "./core/texts";
import s from "./panel.module.css";

const MOBILE = "(max-width: 767px)";

export default function Panel({ open, locale, pathname, onClose, onMinimize, onHide }) {
  const t = texts(locale);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const dragStart = useRef(null);
  const pathRef = useRef(pathname);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE).matches);
  const [drag, setDrag] = useState(0);
  const [said, setSaid] = useState("");

  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Live region outside the dialog: still heard when the sheet is minimised.
  const announce = useCallback((msg) => {
    setSaid("");
    requestAnimationFrame(() => setSaid(msg));
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return undefined;
    if (!open) {
      if (d.open) d.close();
      return undefined;
    }
    let modal = false;
    try {
      modal = d.matches(":modal");
    } catch {
      /* old engine */
    }
    if (d.open && modal !== isMobile) d.close();
    if (!d.open) {
      if (isMobile) d.showModal();
      else d.show();
    }
    const frame = requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
    // Modal sheet: the page behind must not scroll.
    const root = document.documentElement;
    const prev = root.style.overflow;
    if (isMobile) root.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      root.style.overflow = prev;
    };
  }, [open, isMobile]);

  // Esc: the modal sheet fires "cancel"; the non-modal panel needs a key handler.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return undefined;
    const onCancel = (e) => {
      e.preventDefault();
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        onClose();
      }
    };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("keydown", onKey);
    return () => {
      d.removeEventListener("cancel", onCancel);
      d.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // A page change while the sheet is open (card link, proposal): minimise.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    if (open && isMobile) onMinimize();
  }, [pathname, open, isMobile, onMinimize]);

  const dragHandlers = {
    onPointerDown: (e) => {
      if (e.target.closest("button, a")) return;
      dragStart.current = e.clientY;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      if (dragStart.current == null) return;
      setDrag(Math.max(0, e.clientY - dragStart.current));
    },
    onPointerUp: () => {
      if (dragStart.current == null) return;
      if (drag > 90) onClose();
      dragStart.current = null;
      setDrag(0);
    },
  };
  dragHandlers.onPointerCancel = dragHandlers.onPointerUp;

  return (
    <>
      <dialog
        id="concierge-panel"
        ref={dialogRef}
        className={s.panel}
        data-sheet={isMobile || undefined}
        aria-labelledby="concierge-title"
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
      >
        <ChatCore
          locale={locale}
          t={t}
          pathname={pathname}
          isMobile={isMobile}
          sheet={isMobile}
          titleRef={titleRef}
          onClose={onClose}
          onMinimize={onMinimize}
          onHide={onHide}
          announce={announce}
          dragHandlers={dragHandlers}
        />
      </dialog>
      <p className="sr-only" aria-live="polite" role="status">
        {said}
      </p>
    </>
  );
}
