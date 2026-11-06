// Slot „Offene Aufgaben“ für Kundenakte und Auftragsmappe (G-14, Team B-ZEN). Ohne JSX geschrieben, damit
// Unit-Tests das Slot-Register laden können (wie Logistik/LieferungenSlot). Server-tauglich, bekommt nur `daten`.

import { createElement as h } from "react";
import Link from "next/link";

const heute = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default function AufgabenSlot({ daten }) {
  const t = heute();
  const zeilen = daten?.zeilen || [];
  return h(
    "ul",
    { className: "flex flex-col gap-1", "data-testid": "slot-aufgaben" },
    zeilen.map((z) => {
      const ueber = z.faellig && String(z.faellig).slice(0, 10) < t;
      return h(
        "li",
        { key: z.name },
        h(
          Link,
          { href: `/aufgaben/${encodeURIComponent(z.name)}`, className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-bo-surface-2" },
          h("span", { className: "truncate text-[14px] font-medium" }, z.titel || z.name),
          h("span", { className: ueber ? "text-[13px] font-medium whitespace-nowrap text-bo-ziegel-text" : "text-[13px] whitespace-nowrap text-bo-text-soft" }, z.faellig ? String(z.faellig).slice(0, 10).split("-").reverse().join(".") : "–")
        )
      );
    })
  );
}
