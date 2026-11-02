"use client";
// Geteiltes Board → eigenes Ideenboard dieses Browsers (nur nach Klick).
import { useState } from "react";
import { Plus } from "lucide-react";
import { addToBoard } from "@/lib/ideenboard/clientStore";
import { fmt } from "@/lib/pinterest/copy";

/** @param {{copyToMine: string, copied: string}} labels vom Server (ideenboard.seite.shared) */
export default function CopyToMine({ cards, labels }) {
  const t = { shared: labels || {} };
  const [status, setStatus] = useState("");
  const copy = () => {
    let n = 0;
    for (const c of cards || []) if (addToBoard(c).added) n++;
    setStatus(fmt(t.shared.copied, { n }));
  };
  return (
    <>
      <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 px-3 text-small text-text hover:bg-ink/5" data-ideenboard-copy="">
        <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
        {t.shared.copyToMine}
      </button>
      <span role="status" className="text-small text-text-soft">
        {status}
      </span>
    </>
  );
}
