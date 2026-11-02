"use client";

// Hinweis vor dem Wechsel zu WhatsApp (Konzept B1, Schritt 2; Recht A3.5).
// Klappt unter dem Auslöser auf – keine Überlagerung, kein Fokus-Fang. Der
// eigentliche wa.me-Link steht erst hier. Telefon, E-Mail und Formular stehen
// als gleichwertige Wege daneben. Kein Skript von Meta, nichts wird gesendet,
// bevor der Kunde in WhatsApp selbst auf Senden tippt.
//
// Der Link wird beim Öffnen aus der aktuellen Adresse gebaut (Seite, Produkt,
// Ezarri-Mischung, geteiltes Ideenboard; src/lib/whatsapp/link.js). Auf
// breiten Bildschirmen (≥ 768 px) zeigt der Hinweis zusätzlich einen lokal
// erzeugten QR-Code (dynamischer Import, Telefone laden ihn nie), 200 px
// groß, damit auch lange Produkttexte (QR v14+) gut lesbar bleiben.
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "@/components/ui/icons";
import cx from "@/components/ui/cx";
import { EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, openingHoursLine } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import { hrefForLocation } from "@/lib/whatsapp/link";
import { whatsappCopy } from "@/lib/whatsapp/copy";

const LINK =
  "underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

function useQr(href, enabled) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!enabled || !href || typeof window === "undefined") return undefined;
    if (!window.matchMedia?.("(min-width: 768px)").matches) return undefined;
    let live = true;
    import("@/lib/whatsapp/qr")
      .then((m) => live && setSrc(m.whatsappQrDataUrl(href)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [href, enabled]);
  return src;
}

/**
 * @param {object} props
 * @param {string} props.id            id des Bereichs (aria-controls des Auslösers)
 * @param {string} props.digits        Ziffern der Nummer (ohne „+“)
 * @param {string} props.locale
 * @param {object} [props.context]     { kind, product, brand } vom Server
 * @param {string|null} [props.replyNote]  nur aus der Konfiguration
 * @param {boolean} [props.devPreview] fiktive Testnummer (nur Dev)
 * @param {boolean} [props.qr]         QR-Code auf breiten Bildschirmen
 * @param {() => void} props.onClose
 * @param {import("react").RefObject} [props.titleRef]
 */
export default function WhatsAppHint({ id, digits, locale, context, replyNote = null, devPreview = false, qr = true, onClose, titleRef, className }) {
  const t = whatsappCopy(locale);
  const ownTitle = useRef(null);
  const title = titleRef || ownTitle;
  // Nur im Browser gemountet (erst nach dem Klick) – window ist da.
  const [{ href }] = useState(() =>
    hrefForLocation(digits, locale, { pathname: window.location.pathname, search: window.location.search }, context || {})
  );
  const qrSrc = useQr(href, qr);
  const formHref = `/${locale}${ROUTES.kontakt[locale] || ROUTES.kontakt.de}#nachricht`;
  const privacyHref = `/${locale}/datenschutz#whatsapp`;

  useEffect(() => {
    title.current?.focus({ preventScroll: false });
  }, [title]);

  if (!href) return null;

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={`${id}-title`}
      data-whatsapp-hint=""
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose?.();
        }
      }}
      className={cx("relative border border-line bg-surface-raised p-5 text-text md:p-6", className)}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute right-1 top-1 inline-flex size-11 items-center justify-center text-text-soft hover:text-text"
      >
        <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </button>
      <div className={cx("grid gap-6", qrSrc && "md:grid-cols-[1fr_auto]")}>
        <div className="min-w-0">
          <p id={`${id}-title`} ref={title} tabIndex={-1} className="pr-10 text-ui font-medium text-text outline-none focus-visible:underline">
            {t.hintTitle}
          </p>
          {devPreview && <p className="mt-2 text-small text-notice">{t.devPreview}</p>}
          <p className="mt-3 max-w-measure text-small text-text-soft">{t.hintBody}</p>
          <p className="mt-2 max-w-measure text-small text-text-soft">{t.hintPrefill}</p>
          {replyNote && <p className="mt-2 max-w-measure text-small text-text">{replyNote}</p>}
          <p className="mt-2 text-small text-text-soft">
            {t.hours}: <span className="tabular">{openingHoursLine(locale)}</span>
          </p>
          <p className="mt-4">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-whatsapp-link=""
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper lg:min-h-13"
            >
              <span>{t.continue}</span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="sr-only">({t.opensApp})</span>
            </a>
          </p>
          <p className="mt-4 text-small text-text-soft">
            {t.alternatives}{" "}
            <a href={PHONE_HREF} className={cx(LINK, "tabular inline-flex min-h-6 items-center text-text")}>
              {t.phone} {PHONE_DISPLAY}
            </a>
            {" · "}
            <a href={EMAIL_HREF} className={cx(LINK, "inline-flex min-h-6 items-center text-text")}>
              {t.email}
            </a>
            {" · "}
            <a href={formHref} className={cx(LINK, "inline-flex min-h-6 items-center text-text")}>
              {t.form}
            </a>
          </p>
          <p className="mt-2 text-small text-text-soft">
            {t.privacyPrefix}{" "}
            <a href={privacyHref} className={cx(LINK, "inline-flex min-h-6 items-center text-text")}>
              {t.privacy}
            </a>
            .
          </p>
        </div>
        {qrSrc && (
          <figure className="hidden w-50 md:block">
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, lokal erzeugt */}
            <img src={qrSrc} alt={t.qrAlt} width={200} height={200} className="block size-50" data-whatsapp-qr="" />
            <figcaption className="mt-2 text-small text-text-soft">
              <span className="block font-medium text-text">{t.qrTitle}</span>
              {t.qrText}
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}
