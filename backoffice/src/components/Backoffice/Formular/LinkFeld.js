"use client";
import { useEffect, useId, useRef, useState } from "react";
import cx from "../cx";
import { doctypeLabel } from "@/lib/backoffice/labels";

/**
 * Link-Feld mit Suche-Popover: GET /api/link?doctype=&q= (serverseitig searchLink).
 * Tastatur: ↑/↓/Enter/Esc. Der Wert ist der Datensatzname (Frappe `name`).
 */
export default function LinkFeld({ id, name, doctype, value = "", onChange, disabled, required, invalid, describedBy, ariaLabel }) {
  const [q, setQ] = useState(value || "");
  const [vorherigerWert, setVorherigerWert] = useState(value);
  const [treffer, setTreffer] = useState([]);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const listId = useId();
  const wrap = useRef(null);
  // Wert von außen geändert (Formular zurückgesetzt): Anzeige während des Renders nachziehen.
  if (vorherigerWert !== value) {
    setVorherigerWert(value);
    setQ(value || "");
  }
  useEffect(() => {
    if (!offen) return;
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/link?doctype=${encodeURIComponent(doctype)}&q=${encodeURIComponent(q)}`, { signal: ac.signal });
        const d = r.ok ? await r.json() : { treffer: [] };
        setTreffer(d.treffer || []);
        setAktiv(0);
      } catch {
        // abgebrochen
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q, offen, doctype]);
  useEffect(() => {
    if (!offen) return;
    const h = (e) => wrap.current && !wrap.current.contains(e.target) && setOffen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);

  const waehle = (t) => {
    onChange(t.value);
    setQ(t.value);
    setOffen(false);
  };
  return (
    <div ref={wrap} className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={offen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={offen && treffer[aktiv] ? `${listId}-${aktiv}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        value={q}
        disabled={disabled}
        onChange={(e) => {
          setQ(e.target.value);
          setOffen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => !disabled && setOffen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOffen(true);
            setAktiv((a) => Math.min(treffer.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAktiv((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && offen && treffer[aktiv]) {
            e.preventDefault();
            waehle(treffer[aktiv]);
          } else if (e.key === "Escape") setOffen(false);
        }}
        placeholder={`${doctypeLabel(doctype)} suchen …`}
        className="bo-input"
        autoComplete="off"
      />
      {offen && (
        <ul id={listId} role="listbox" className="bo-pop absolute z-30 mt-2 max-h-64 w-full min-w-56 overflow-y-auto rounded-bo-karte bg-bo-surface p-1.5 shadow-(--bo-sh-float)">
          {treffer.length === 0 && <li className="px-3 py-2 text-[13px] text-bo-text-soft">Keine Treffer.</li>}
          {treffer.map((t, i) => (
            <li key={t.value} id={`${listId}-${i}`} role="option" aria-selected={i === aktiv} onMouseDown={() => waehle(t)} onMouseEnter={() => setAktiv(i)} className={cx("flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-[12px] px-3 text-sm", i === aktiv && "bg-bo-fill-2")}>
              <span className="shrink-0 font-medium">{t.value}</span>
              {t.description && <span className="min-w-0 truncate text-[13px] text-bo-text-soft">{t.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
