"use client";

// WhatsApp-Einstieg (Inhaber-Entscheidung Nr. 15; Konzept B1): zweistufig,
// ohne Modal. Erst ein Nebenweg-Knopf (nie Primärknopf – der Termin bleibt
// primär, Design-Bibel P2), darunter klappt der Hinweis mit dem eigentlichen
// wa.me-Link auf (WhatsAppHint).
//
// Sichtbar nur, wenn der Server eine gültige WHATSAPP_NUMBER liefert
// (src/lib/whatsapp/config.js entryProps → `digits`). Im Dev-Server ohne
// Nummer: Vorschau mit fiktiver Testnummer per ?whatsapp=test, sonst nichts.
//
// Varianten:
//   block   eigener Abschnitt mit Overline, Titel, Text und Knopf (Kontakt, Beratung)
//   button  nur der Knopf
//   link    Textlink (Footer; Produktseite neben „Merken“/„Anrufen“, dort mit QR)
import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { MessageCircle } from "@/components/ui/icons";
import cx from "@/components/ui/cx";
import { useWhatsAppDigits } from "./useWhatsAppDigits";

// Tempo-Runde Shell (qa-screenshots/tempo/shell.md): the notice (texts in four
// languages, wa.me link builder, QR) loads only when it is opened – the
// trigger is in the footer of EVERY page. Its chunk is requested as soon as
// the visitor points at, touches or focuses the trigger, so it is there by the
// click. The notice moves focus to its title on mount, as before.
const loadHint = () => import("./WhatsAppHint");
const WhatsAppHint = dynamic(loadHint, { ssr: false });
const preloadHint = () => {
  loadHint().catch(() => {});
};

const SECONDARY =
  "inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper lg:min-h-13 lg:px-7";
const LINK =
  "inline-flex min-h-11 items-center gap-2 text-ui font-normal text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

/**
 * @param {object} props
 * @param {string|null} props.digits     vom Server (null = keine Nummer)
 * @param {boolean} [props.devPreview]   Server ist Dev und hat keine Nummer
 * @param {string|null} [props.replyNote]
 * @param {"block"|"button"|"link"} [props.variant]
 * @param {object} [props.context]       { kind, product, brand }
 * @param {string} [props.anchorId]      öffnet automatisch bei #<anchorId>
 * @param {"product"|"default"} [props.label]
 * @param {"kontakt"|"beratung"} [props.copy]  Texte der Variante block
 * @param {2|3} [props.headingLevel]
 * @param {boolean} [props.qr]           QR-Code im Hinweis (Desktop); Standard: nicht im Footer
 * @param {object} [props.labels]        Texte der Auslöser, vom Server (WhatsApp/index.js whatsappLabels)
 */
export default function WhatsAppEntry({
  digits: serverDigits = null,
  devPreview = false,
  replyNote = null,
  variant = "button",
  context = null,
  anchorId,
  label = "default",
  copy = "kontakt",
  headingLevel = 3,
  qr,
  className,
  labels = {},
}) {
  const locale = useLocale();
  const t = labels;
  const { digits, preview } = useWhatsAppDigits(serverDigits, devPreview);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const panelId = `wa-${uid}`;

  // #whatsapp (z. B. aus dem Concierge) öffnet den Hinweis der Kontaktseite.
  useEffect(() => {
    if (!anchorId || !digits) return undefined;
    const check = () => {
      if (window.location.hash === `#${anchorId}`) setOpen(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [anchorId, digits]);

  if (!digits) return null;

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const triggerText = label === "product" ? t.openProduct : t.open;
  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen((v) => !v)}
      onPointerEnter={preloadHint}
      onTouchStart={preloadHint}
      onFocus={preloadHint}
      data-whatsapp-open=""
      className={variant === "link" ? LINK : SECONDARY}
    >
      <MessageCircle aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
      <span>{triggerText}</span>
    </button>
  );
  const hint = open ? (
    <WhatsAppHint
      id={panelId}
      digits={digits}
      locale={locale}
      context={context}
      replyNote={replyNote}
      devPreview={preview}
      qr={qr ?? variant !== "link"}
      onClose={close}
      className="mt-4"
    />
  ) : (
    <div id={panelId} hidden />
  );

  if (variant === "block") {
    const H = headingLevel === 2 ? "h2" : "h3";
    const title = copy === "beratung" ? t.beratungTitle : t.kontaktTitle;
    const text = copy === "beratung" ? t.beratungText : t.kontaktText;
    return (
      <div id={anchorId} data-whatsapp-entry="block" className={cx("scroll-mt-24", className)}>
        <p className="text-overline uppercase text-text-soft">{t.kontaktEyebrow}</p>
        <H className="mt-stack-s text-title text-text">{title}</H>
        <p className="mt-3 max-w-measure text-body text-text-soft">{text}</p>
        <div className="mt-stack-m">{trigger}</div>
        {hint}
      </div>
    );
  }

  return (
    <div id={anchorId} data-whatsapp-entry={variant} className={className}>
      {trigger}
      {hint}
    </div>
  );
}
