"use client";
// Kompakte Zusatzfilter der Dokumentenliste (R4, Abnahme N6): Zahlung und
// Projekt stehen als zwei Auswahlfelder in EINER Zeile unter den Dokumentart-
// Chips, statt als zwei weitere Chip-Reihen.
// Ohne JavaScript ist es ein normales GET-Formular mit "Anwenden"-Knopf; mit
// JavaScript wechselt die Liste direkt bei der Auswahl (router.replace, ohne
// Sprung nach oben) und der Knopf entfällt. Die URL bleibt dieselbe wie bei den
// Chips (?typ=…&zahlung=…&projekt=…), der Server prüft alle Werte.
// Mobil stehen beide Felder nebeneinander (2 Spalten), ab sm in einer Zeile.
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { tx } from "@/lib/portal/i18n";
import { focusRing } from "./labels";

// appearance-none: WebKit zeichnet sonst eine graue, gerundete Systemfläche (Bibel §6: keine Radien).
const field =
  "min-h-11 w-full min-w-0 appearance-none border border-ink/20 bg-white py-2 pl-3 pr-9 text-sm text-ink hover:border-ink/40 sm:w-auto sm:min-w-[12rem]";
const chevron = (
  <ChevronDown
    size={16}
    aria-hidden="true"
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/70"
  />
);

export default function FilterSelects({
  base,
  typ,
  zahlung,
  projekt,
  payment,
  projects,
}) {
  const router = useRouter();
  const id = useId();
  const t = useTranslations();

  const go = (next) => {
    const v = { typ, zahlung, projekt, ...next };
    // Wie die Chips: ein Zahlungsstatus gilt nur für Rechnungen.
    if (v.zahlung) v.typ = "rechnung";
    const q = new URLSearchParams();
    for (const k of ["typ", "zahlung", "projekt"]) if (v[k]) q.set(k, v[k]);
    const s = q.toString();
    router.replace(s ? `${base}?${s}` : base, { scroll: false });
  };

  if (!payment && !projects) return null;
  return (
    <form
      method="get"
      action={base}
      className="grid grid-cols-2 gap-3 pt-1 sm:flex sm:flex-wrap sm:items-end"
      aria-label={tx(t, "Portal.docs.moreFilters", "Weitere Filter")}
    >
      {typ && <input type="hidden" name="typ" value={typ} />}
      {payment && (
        <div
          className={`flex min-w-0 flex-col gap-1 ${projects ? "" : "col-span-2"}`}
        >
          <label
            htmlFor={`${id}-z`}
            className="text-xs font-semibold tracking-wide text-ink/80"
          >
            {tx(t, "Portal.docs.payment", "Zahlung")}
          </label>
          <span className="relative block">
            <select
              id={`${id}-z`}
              name="zahlung"
              value={zahlung}
              onChange={(e) => go({ zahlung: e.target.value })}
              className={`${field} ${focusRing}`}
            >
              {payment.map((o) => (
                <option key={o.value || "alle"} value={o.value}>
                  {typeof o.count === "number"
                    ? `${o.label} (${o.count})`
                    : o.label}
                </option>
              ))}
            </select>
            {chevron}
          </span>
        </div>
      )}
      {projects && (
        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor={`${id}-p`}
            className="text-xs font-semibold tracking-wide text-ink/80"
          >
            {tx(t, "Portal.docs.project", "Projekt")}
          </label>
          <span className="relative block">
            <select
              id={`${id}-p`}
              name="projekt"
              value={projekt}
              onChange={(e) => go({ projekt: e.target.value })}
              className={`${field} ${focusRing}`}
            >
              {projects.map((o) => (
                <option key={o.value || "alle"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {chevron}
          </span>
        </div>
      )}
      {/* Nur ohne JavaScript nötig: mit JS wirkt die Auswahl sofort. */}
      <noscript>
        <button
          type="submit"
          className="min-h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
        >
          {tx(t, "Portal.docs.apply", "Anwenden")}
        </button>
      </noscript>
    </form>
  );
}
