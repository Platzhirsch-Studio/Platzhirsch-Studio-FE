"use client";
// Starts an `ambient` InlineVideo (muted loop) only when the visitor allows
// motion, and pauses it as soon as that changes (Design-Bibel §8.4):
//   - prefers-reduced-motion: reduce → never starts
//   - <html data-motion="reduced"> ("Ruhige Ansicht" in the footer) → never starts
//   - tab hidden → paused (no hidden playback)
// Renders nothing. The video keeps its native controls, so it can always be
// paused by mouse, touch or keyboard (WCAG 2.2.2).
import { useEffect } from "react";

export function motionAllowed() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return document.documentElement.dataset.motion !== "reduced";
}

export default function AmbientPlay({ targetId }) {
  useEffect(() => {
    const video = document.getElementById(targetId);
    if (!(video instanceof HTMLVideoElement)) return undefined;
    // A pause by the visitor is final; our own pauses (motion off, tab
    // hidden) are not.
    let userPaused = false;
    let ownPause = false;
    const onPause = () => {
      if (ownPause) ownPause = false;
      else userPaused = true;
    };
    const sync = () => {
      if (motionAllowed() && !document.hidden && !userPaused) {
        video.muted = true;
        video.play().catch(() => {});
      } else if (!video.paused) {
        ownPause = true;
        video.pause();
      }
    };
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    media?.addEventListener?.("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("pause", onPause);
    sync();
    return () => {
      observer.disconnect();
      media?.removeEventListener?.("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("pause", onPause);
    };
  }, [targetId]);
  return null;
}
