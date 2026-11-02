import { useLocale, useTranslations } from "next-intl";
import cx from "./cx";

// Until the "Recht & Texte" integration adds ui.leitsatz to
// src/messages/*.json (proposal: Marktresearch/digital/redesign/messages-fundament.json).
const FALLBACK = { de: "Nehmen Sie Platz.", en: "Take a seat.", fr: "Prenez place.", it: "Si accomodi." };

/**
 * The Leitsatz "Nehmen Sie Platz." (Bibel §16 W15): a Bodoni italic line in
 * the closing CTA, at most ONCE per page, the one centred element. Not a
 * heading (the H1 carries the page content) – rendered as <p> by default.
 * Works in server and client components.
 * @param {"m"|"l"|"xl"} [size="l"] display-m / display-l / display-xl
 * @param {"text"|"inverse"} [tone="text"]
 * @param {"center"|"start"} [align="center"]
 * @param {ReactNode} [children] overrides the translated sentence
 */
export default function Leitsatz({ as: Tag = "p", size = "l", tone = "text", align = "center", className, children }) {
  const locale = useLocale();
  const t = useTranslations("ui");
  const text = children ?? (t.has("leitsatz") ? t("leitsatz") : FALLBACK[locale] || FALLBACK.de);
  const sizes = { m: "text-display-m", l: "text-display-l", xl: "text-display-xl" };
  return (
    <Tag
      className={cx(
        "font-display-italic font-normal",
        sizes[size] ?? sizes.l,
        tone === "inverse" ? "text-text-inverse" : "text-text",
        align === "center" ? "text-center" : "text-start",
        className
      )}
    >
      {text}
    </Tag>
  );
}
