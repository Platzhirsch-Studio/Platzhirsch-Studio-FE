// src/lib/yacht/device.js
// Touch detection shared by the Werfthalle hint and the 3D controls.
// `pointer: coarse` alone misses hybrid devices and emulators that report a
// fine primary pointer (QA round 2, P3.2) – any coarse pointer or touch
// points count as touch.

/** @returns {boolean} true on touch devices (client only; false on the server) */
export function isTouch() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(any-pointer: coarse)").matches || navigator.maxTouchPoints > 0);
}
