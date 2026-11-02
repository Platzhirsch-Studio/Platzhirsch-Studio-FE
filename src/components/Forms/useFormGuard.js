"use client";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { withGuardFields } from "@/lib/forms/client";

/**
 * Contract fields for a form (R1-formulare): remembers when the form was
 * rendered (performance.now(), after mount: no clock in render) and returns
 * `guard(payload, formElement)` → payload + `website` (honeypot value from
 * <Honeypot/>) + `_t` (ms since render; does not depend on the device clock).
 */
export default function useFormGuard() {
  const renderedAt = useRef(null);
  useEffect(() => {
    renderedAt.current = performance.now();
  }, []);
  return useCallback((payload, form) => {
    const field = form?.elements?.namedItem?.("website");
    const website = field && typeof field.value === "string" ? field.value : "";
    return withGuardFields(payload, { website, renderedAt: renderedAt.current });
  }, []);
}

const noSubscribe = () => () => {};

/**
 * false in the server HTML and during hydration, true once React handles
 * the form. Submit buttons stay `disabled` until then: a submit before
 * hydration would otherwise fire a native request and silently lose the
 * enquiry (feedback R2-leads P2-1; the forms also carry method="post" so
 * no personal data can ever land in a URL).
 */
export function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

/**
 * Remembers a field the SERVER rejected (400 with `field`) together with its
 * value: while the value is unchanged, blur must not clear that error just
 * because the client check passes (feedback R2-leads P3-1).
 */
export function useServerFieldError() {
  const ref = useRef(null);
  return useMemo(
    () => ({
      set(name, value) {
        ref.current = { name, value };
      },
      holds(name, value) {
        const s = ref.current;
        return Boolean(s) && s.name === name && s.value === value;
      },
      clear() {
        ref.current = null;
      },
    }),
    []
  );
}

/** Focus a field by id on the next frame (after React rendered the error). */
export function focusField(id) {
  if (!id || typeof window === "undefined") return;
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
  });
}

function reducedMotion() {
  return (
    document.documentElement.dataset.motion === "reduced" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
