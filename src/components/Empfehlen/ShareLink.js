"use client";
// Persönlichen Empfehlungslink erzeugen und SELBST weitergeben
// (/[locale]/empfehlen). Nichts wird an Platzhirsch gesendet: Der Link wird
// im Browser gebaut, geteilt wird über die Zwischenablage, das Teilen-Menü des
// Geräts (navigator.share) oder das eigene Mailprogramm (mailto ohne
// Empfänger). Damit schreibt nie Platzhirsch eine dritte Person an
// (BGH I ZR 208/12, § 174 TKG 2021).
import { useId, useState } from "react";
import { normalizeReferralCode, referralShareUrl, shareMessage } from "@/lib/kundenbetreuung/empfehlung";

const btnSecondary =
  "inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper";

/** @param {{ copy: object, locale: string }} props  copy = empfehlenCopy(locale).share */
export default function ShareLink({ copy: t, locale = "de" }) {
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const make = (e) => {
    e.preventDefault();
    setNote("");
    const c = normalizeReferralCode(code);
    if (!c) {
      setLink("");
      setError(t.invalid);
      requestAnimationFrame(() => document.getElementById(`${id}-code`)?.focus());
      return;
    }
    setError("");
    setCode(c);
    setLink(referralShareUrl(c, { locale, base: typeof window !== "undefined" ? window.location.origin : undefined }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote(t.copied);
    } catch {
      setNote(t.copyFailed);
      const el = document.getElementById(`${id}-link`);
      el?.focus();
      el?.select?.();
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title: t.mailSubject, text: shareMessage(t.shareText, link) });
    } catch {
      /* abgebrochen: nichts zu tun */
    }
  };

  const mailHref = link
    ? `mailto:?subject=${encodeURIComponent(t.mailSubject)}&body=${encodeURIComponent(shareMessage(t.shareText, link))}`
    : undefined;

  return (
    <div>
      <form onSubmit={make} noValidate className="flex flex-col items-start gap-3">
        <div className="w-full min-w-0">
          <label htmlFor={`${id}-code`} className="block text-ui text-text">
            {t.codeLabel}
          </label>
          <input
            id={`${id}-code`}
            name="empfehlungscode"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            placeholder={t.codeHint}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-fehler` : undefined}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`mt-2 block h-13 w-full border bg-surface px-4 text-ui text-text tabular uppercase placeholder:normal-case placeholder:text-text-soft ${error ? "border-2 border-error" : "border-line-control"}`}
          />
        </div>
        <button type="submit" className={btnSecondary}>
          {t.make}
        </button>
      </form>
      {error && (
        <p id={`${id}-fehler`} className="mt-2 text-small text-error">
          {error}
        </p>
      )}

      {link && (
        <div className="mt-6 border-t border-line pt-6">
          <label htmlFor={`${id}-link`} className="block text-ui text-text">
            {t.linkLabel}
          </label>
          <input
            id={`${id}-link`}
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="mt-2 block h-13 w-full border border-line-control bg-surface-raised px-4 text-small text-text"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={copyLink} className={btnSecondary}>
              {t.copy}
            </button>
            {canShare && (
              <button type="button" onClick={shareNative} className={btnSecondary}>
                {t.shareNative}
              </button>
            )}
            <a href={mailHref} className={btnSecondary}>
              {t.mail}
            </a>
          </div>
          <p role="status" className="mt-3 min-h-6 text-small text-text">
            {note}
          </p>
          <p className="text-small text-text-soft">{t.note}</p>
        </div>
      )}
    </div>
  );
}
