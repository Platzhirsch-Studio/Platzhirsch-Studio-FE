"use client";
import { useSyncExternalStore } from "react";

// Small client helpers of the planning area.

export async function postFeedback(payload) {
  const res = await fetch("/api/portal/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
  if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen.");
  return data.entry;
}

const RM = "(prefers-reduced-motion: reduce)";
function subscribeRM(cb) {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
}

// Microphone availability, checked BEFORE the customer taps record:
// "ok" | "blocked" (Permissions-Policy forbids it on this page) |
// "unsupported" (no MediaRecorder/getUserMedia) | "unknown" (server render).
// Safari has no policy API; a denial there surfaces on getUserMedia instead.
export function micAvailability() {
  if (typeof window === "undefined") return "unknown";
  if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) return "unsupported";
  const policy = document.permissionsPolicy || document.featurePolicy;
  try {
    if (policy?.allowsFeature && !policy.allowsFeature("microphone")) return "blocked";
  } catch {
    /* ignore – treat as available, getUserMedia will tell */
  }
  return "ok";
}
const noop = () => () => {};
export function useMicAvailability() {
  return useSyncExternalStore(noop, micAvailability, () => "unknown");
}

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function chip(active) {
  return `inline-flex min-h-11 items-center gap-1.5 border px-4 text-sm transition-colors ${focusRing} ${
    active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink/40"
  }`;
}
