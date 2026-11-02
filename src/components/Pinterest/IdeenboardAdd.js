"use client";
// „Zum Ideenboard“ – legt eine Karte im Board dieses Browsers ab
// (src/lib/ideenboard/clientStore.js). Geschrieben wird erst mit dem Klick.
// Danach: „Im Ideenboard“ (aria-pressed) und ein Link zum Board; Rückmeldung
// per role="status". Kleine Insel: nur React + Store, keine Bibliothek.
import { useId, useState } from "react";
import { Check, LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { addToBoard, removeFromBoard, useBoard } from "@/lib/ideenboard/clientStore";
import { cardKey, sanitizeCard } from "@/lib/ideenboard/model";
import { fmt } from "@/lib/pinterest/copy";
import { usePinCopy } from "@/lib/pinterest/useCopy";

const cx = (...p) => p.filter(Boolean).join(" ");

/**
 * @param {{type: string, title: string, subtitle?: string, href?: string, image?: string, quelle?: string, room?: string}} card
 * @param {"de"|"en"|"fr"|"it"} [locale]
 * @param {boolean} [onDark]
 * @param {boolean} [showLink] Link „Ideenboard ansehen“ nach dem Ablegen
 */
export default function IdeenboardAdd({ card, locale = "de", onDark = false, showLink = true, className }) {
  const t = usePinCopy().ideenboard;
  const board = useBoard();
  const [status, setStatus] = useState("");
  const statusId = useId();
  const clean = sanitizeCard(card);
  if (!clean) return null;
  const id = cardKey(clean);
  const inBoard = board.cards.some((c) => c.id === id);

  const toggle = () => {
    if (inBoard) {
      removeFromBoard(id);
      setStatus(fmt(t.removedStatus, { title: clean.title }));
      return;
    }
    const r = addToBoard(clean);
    // kurze Rückmeldung aus den Insel-Texten (Client-Payload klein halten)
    setStatus(r.added ? `${t.added}: ${clean.title}` : "");
  };

  const tone = onDark ? "text-text-inverse hover:bg-paper/10" : "text-text hover:bg-ink/5";
  return (
    <span className={cx("relative z-10 inline-flex flex-wrap items-center", className)} data-ideenboard-add="">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={inBoard}
        aria-label={inBoard ? `${t.added}: ${clean.title}` : fmt(t.addAria, { title: clean.title })}
        aria-describedby={status ? statusId : undefined}
        className={cx("inline-flex min-h-11 items-center gap-2 px-3 text-small transition-colors duration-(--duration-micro)", tone)}
      >
        {inBoard ? <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} /> : <LayoutGrid aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />}
        <span>{inBoard ? t.added : t.add}</span>
      </button>
      {inBoard && showLink && (
        <Link href="/ideenboard" locale={locale} className={cx("inline-flex min-h-11 items-center px-3 text-small underline underline-offset-4", onDark ? "text-text-inverse" : "text-text")}>
          {t.view}
        </Link>
      )}
      <span id={statusId} role="status" className="sr-only">
        {status}
      </span>
    </span>
  );
}
