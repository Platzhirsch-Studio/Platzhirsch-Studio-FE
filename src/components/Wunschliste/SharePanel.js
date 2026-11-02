"use client";
// Teilen-Werkzeuge einer Wunschliste: Link (kopieren), WhatsApp, E-Mail,
// System-Teilen (wo vorhanden), QR-Code; optional der Verwaltungslink.
// Barrierefreiheit: Link als lesbares, markierbares Feld mit Label, Rückmeldung
// „Link kopiert.“ in einer höflichen Live-Region, alle Ziele ≥ 44 px.
import { useId, useState, useSyncExternalStore } from "react";
import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import { copyText } from "./client";
import useWlCopy from "./useWlCopy";

const noSubscribe = () => () => {};
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

function CopyField({ id, label, value, copyLabel, hint }) {
  const { c } = useWlCopy();
  const [status, setStatus] = useState("");
  const onCopy = async () => {
    const ok = await copyText(value);
    setStatus(ok ? c("share.copied") : c("share.copyFailed"));
    if (!ok) document.getElementById(id)?.select();
  };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-ui text-text">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 max-w-measure text-small text-text-soft">
          {hint}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          readOnly
          value={value}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onFocus={(e) => e.target.select()}
          className="h-13 min-w-0 flex-1 border border-line-control bg-surface px-4 text-ui text-text tabular"
        />
        <Button variant="secondary" onClick={onCopy} className="sm:w-auto">
          <span className="inline-flex items-center gap-2">
            <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />
            {copyLabel}
          </span>
        </Button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-small text-text-soft">
        {/* Motion: „Link kopiert.“ settles in (ph-arrive); the live region stays mounted. */}
        {status && (
          <span key={status} className="ph-arrive">
            {status}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * @param {{ shareUrl: string, qr?: string, manageUrl?: string, title: string }} props
 */
export default function SharePanel({ shareUrl, qr, manageUrl, title, className }) {
  const { c } = useWlCopy();
  const uid = useId();
  const native = useSyncExternalStore(noSubscribe, canNativeShare, () => false);
  const text = c("share.shareText", { title });
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(c("share.mailSubject", { title }))}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
  const LINK = "inline-flex min-h-12 items-center gap-2 border border-ink px-5 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-action hover:text-paper";

  return (
    <div className={cx("grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16", className)}>
      <div className="min-w-0 space-y-6">
        <CopyField id={`${uid}-share`} label={c("share.shareLink")} value={shareUrl} copyLabel={c("share.copy")} />
        <ul className="flex flex-wrap gap-3" aria-label={c("share.shareLink")}>
          <li>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={LINK}>
              <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {c("share.whatsapp")}
            </a>
          </li>
          <li>
            <a href={mail} className={LINK}>
              <Mail aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {c("share.mail")}
            </a>
          </li>
          {native && (
            <li>
              <button
                type="button"
                className={LINK}
                onClick={() => navigator.share({ title, text, url: shareUrl }).catch(() => {})}
              >
                <Share2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
                {c("share.nativeShare")}
              </button>
            </li>
          )}
        </ul>
        {manageUrl && (
          <div className="border-t border-line pt-6">
            <CopyField id={`${uid}-admin`} label={c("share.adminTitle")} hint={c("share.adminText")} value={manageUrl} copyLabel={c("share.adminCopy")} />
          </div>
        )}
      </div>
      {qr && (
        <figure className="max-w-64">
          {/* eslint-disable-next-line @next/next/no-img-element -- data:-URL vom Server, kein Optimierer nötig */}
          <img src={qr} alt={c("share.qrAlt")} width={256} height={256} className="block size-56 border border-line bg-paper sm:size-64" />
          <figcaption className="mt-2 text-small text-text-soft">{c("share.qr")}</figcaption>
        </figure>
      )}
    </div>
  );
}
