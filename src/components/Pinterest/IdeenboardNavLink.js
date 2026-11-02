"use client";
// Dezenter Weg zum Ideenboard in Kopfzeile, Menü und Merkliste – gebaut wie
// „Ihre Auswahl“ (src/components/Navbar/SelectionLink.js): 44-px-Ziel, Linie
// statt Füllung, Beschriftung optional. Kein Zähler (der Pill ist laut Bibel
// §6 der Auswahl vorbehalten). Nur kurze Client-Texte (ideenboard.nav/view),
// damit der Payload jeder Seite klein bleibt.
import { LayoutGrid } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { usePinCopy } from "@/lib/pinterest/useCopy";

const cx = (...p) => p.filter(Boolean).join(" ");

/**
 * @param {false|true|"always"} [showLabel] false = nur Symbol, true = Text ab 1536 px, "always" = immer
 * @param {"icon"|"text"} [variant] "text": unterstrichener Textlink (Merkliste-Seite)
 */
export default function IdeenboardNavLink({ showLabel = false, variant = "icon", className }) {
  const t = usePinCopy().ideenboard;
  const name = t.nav || "Ideenboard";

  if (variant === "text") {
    return (
      <Link href="/ideenboard" className={cx("inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4", className)} data-ideenboard-nav="">
        <LayoutGrid aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
        <span>{t.view}</span>
      </Link>
    );
  }
  return (
    <Link
      href="/ideenboard"
      aria-label={showLabel === "always" ? undefined : name}
      prefetch={false}
      data-ideenboard-nav=""
      className={cx(
        "relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft",
        showLabel === true && "2xl:px-2",
        className
      )}
    >
      <LayoutGrid aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
      {showLabel && <span className={showLabel === "always" ? "" : "hidden 2xl:inline"}>{name}</span>}
    </Link>
  );
}
