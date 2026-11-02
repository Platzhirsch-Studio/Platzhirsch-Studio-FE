"use client";
import { useState, useSyncExternalStore } from "react";
import { Link2, Mail, Share2 } from "lucide-react";
import Heading from "@/components/ui/Heading";

// Share a job (R3-inhalt, replaces react-share). Progressive:
//   - always in the HTML: plain links (e-mail, WhatsApp, LinkedIn) – work
//     without JavaScript, load nothing from third parties until clicked,
//   - "Link kopieren" (Clipboard API) and, where the browser has it, the
//     system share sheet (Web Share API: iOS/Android/Safari/Edge).
// Status messages in a polite live region that is always in the DOM.
const noop = () => () => {};
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
// QM wm-r4: "Link kopieren" was missing on one iPad run (rendered only after
// hydration). It is now in the server HTML (server snapshot true) and also
// works without the async Clipboard API (execCommand fallback).
const canCopy = () =>
  typeof navigator !== "undefined" &&
  (Boolean(navigator.clipboard?.writeText) || (typeof document !== "undefined" && document.queryCommandSupported?.("copy") !== false));

function copyFallback(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } finally {
    area.remove();
  }
}

const LINK =
  "inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";
const ACTION =
  "inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper";

/**
 * @param {string} url    absolute page URL
 * @param {string} title  job title
 * @param {object} labels title, native, copy, copied, copyFailed, email, whatsapp, linkedin, newTab, mailBody
 */
export default function ShareJob({ url, title, labels }) {
  // false on the server and in the first client render → no hydration mismatch.
  const native = useSyncExternalStore(noop, canNativeShare, () => false);
  const copyable = useSyncExternalStore(noop, canCopy, () => true);
  const [status, setStatus] = useState("");

  const shareNative = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed by the visitor (AbortError) or not allowed – the links stay.
    }
  };

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else if (!copyFallback(url)) throw new Error("copy");
      setStatus(labels.copied);
    } catch {
      setStatus(labels.copyFailed);
    }
  };

  const mail = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(labels.mailBody)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div>
      <Heading id="job-share" level={2} size="title" as="h2">
        {labels.title}
      </Heading>
      {(native || copyable) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {native && (
            <button type="button" onClick={shareNative} className={ACTION}>
              <Share2 aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              <span>{labels.native}</span>
            </button>
          )}
          {copyable && (
            <button type="button" onClick={copy} className={ACTION}>
              <Link2 aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              <span>{labels.copy}</span>
            </button>
          )}
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-6" aria-labelledby="job-share">
        <li>
          <a href={mail} className={LINK}>
            <Mail aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
            <span>{labels.email}</span>
          </a>
        </li>
        <li>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={LINK}>
            <span>{labels.whatsapp}</span>
            <span className="sr-only"> {labels.newTab}</span>
          </a>
        </li>
        <li>
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className={LINK}>
            <span>{labels.linkedin}</span>
            <span className="sr-only"> {labels.newTab}</span>
          </a>
        </li>
      </ul>
      <p role="status" aria-live="polite" className="mt-2 min-h-6 text-small text-text-soft">
        {status}
      </p>
    </div>
  );
}
