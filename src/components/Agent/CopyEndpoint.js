"use client";
// Knopf „Adresse kopieren“ (Clipboard API; Rückmeldung in einer Live-Region).
// Ohne Clipboard (alte Browser, unsicherer Kontext) wird die Adresse markiert
// und der Hinweis zum manuellen Kopieren gezeigt.
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import cx from "@/components/ui/cx";

const BASE =
  "inline-flex items-center justify-center gap-2 text-ui transition-colors duration-(--duration-micro) ease-quiet";
const VARIANTS = {
  primary: "min-h-12 px-6 lg:min-h-13 lg:px-7 bg-action text-paper hover:bg-action-hover",
  secondary: "min-h-12 px-5 border border-ink text-text hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper",
};

export default function CopyEndpoint({ url, label, copied, failed, variant = "primary", compact = false }) {
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("ok");
    } catch {
      setState("fail");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2400);
  }

  const Icon = state === "ok" ? Check : Copy;
  return (
    <span className={cx("inline-flex flex-col", compact ? "items-start sm:items-end" : "items-stretch sm:items-start")}>
      <button type="button" onClick={copy} className={cx(BASE, VARIANTS[variant], compact && "w-full sm:w-auto")} data-copy-endpoint>
        <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
        <span>{label}</span>
      </button>
      <span role="status" aria-live="polite" className={cx("text-small", state === "idle" ? "sr-only" : "mt-2", state === "fail" ? "text-error" : "text-text-soft")}>
        {state === "ok" ? copied : state === "fail" ? failed : ""}
      </span>
    </span>
  );
}
