"use client";
import { useActionState, useMemo, useState } from "react";
import { bedienerWechselAction } from "@/lib/backoffice/actions";
import Knopf from "@/components/Backoffice/Knopf";
import cx from "@/components/Backoffice/cx";
import { Icon } from "@/components/Backoffice/icons";
import { rollenLabel } from "@/lib/backoffice/labels";

const TASTEN = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

/**
 * Bedienerwahl mit Suche (Name/Rolle) und Standortfilter (Standard: Standort des Geräts),
 * PIN-Eingabe mit Zifferntastatur. benutzer: [{email, name, kurzname?, roles, standort?}].
 */
export default function WechselForm({ benutzer, standort = "" }) {
  const [state, action, pending] = useActionState(bedienerWechselAction, null);
  const standorte = useMemo(() => [...new Set(benutzer.map((u) => u.standort || standort).filter(Boolean))].sort(), [benutzer, standort]);
  const [ort, setOrt] = useState(standorte.includes(standort) ? standort : "");
  const [suche, setSuche] = useState("");
  const [gewaehlt, setGewaehlt] = useState("");
  const [pin, setPin] = useState("");
  const taste = (t) => setPin((p) => (t === "DEL" ? p.slice(0, -1) : p.length < 6 ? p + t : p));

  const q = suche.trim().toLowerCase();
  const sichtbar = benutzer.filter((u) => (!ort || (u.standort || standort) === ort) && (!q || `${u.name} ${u.email} ${(u.roles || []).join(" ")}`.toLowerCase().includes(q)));
  const aktiv = gewaehlt || (sichtbar.length === 1 ? sichtbar[0].email : "");

  return (
    <form action={action} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-8">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">Bediener</legend>
        <div className="mb-3 flex min-w-0 flex-wrap gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bo-text-faint" />
            <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Bediener suchen" placeholder="Name oder Rolle …" className="bo-input min-h-12 pl-9" autoComplete="off" />
          </div>
          {standorte.length > 1 && (
            <select value={ort} onChange={(e) => setOrt(e.target.value)} aria-label="Standort" className="bo-input min-h-12 w-auto min-w-36">
              <option value="">Alle Standorte</option>
              {standorte.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
        {sichtbar.length === 0 ? (
          <p className="rounded-bo border border-dashed border-bo-line px-3 py-6 text-center text-sm text-bo-text-soft">Kein Bediener gefunden.</p>
        ) : (
          <ul className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {sichtbar.map((u) => {
              const an = aktiv === u.email;
              const initialen = String(u.name || "?").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
              return (
                <li key={u.email} className="min-w-0">
                  <label className={cx("bo-motion flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition-colors duration-[120ms]", an ? "border-bo-text bg-bo-selected" : "border-bo-line bg-bo-surface hover:border-bo-line-strong")}>
                    
                    <span aria-hidden="true" className={cx("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", an ? "bg-bo-action text-bo-action-text" : "bg-bo-surface-3 text-bo-text-soft")}>
                      {initialen}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{u.name}</span>
                      <span className="block truncate text-xs text-bo-text-soft">{(u.roles || []).map(rollenLabel).join(", ")}</span>
                    </span>
                    <input type="radio" name="email" value={u.email} checked={an} onChange={() => setGewaehlt(u.email)} className="ml-auto size-4 shrink-0 accent-[var(--color-bo-action)]" />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>
      <div className="min-w-0">
        <label htmlFor="pin" className="mb-2 block text-sm font-medium">
          PIN (4 bis 6 Ziffern)
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="bo-input min-h-14 text-center text-2xl tracking-[0.5em]"
          aria-describedby={state && !state.ok ? "pin-fehler" : undefined}
        />
        <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
          {TASTEN.map((t, i) =>
            t ? (
              <button key={i} type="button" onClick={() => taste(t)} tabIndex={-1} className="bo-motion min-h-14 rounded-[10px] border border-bo-line bg-bo-surface text-xl font-medium tabular-nums transition-[background-color,transform] duration-[50ms] hover:bg-bo-surface-2 active:translate-y-px active:bg-bo-surface-3">
                {t === "DEL" ? "⌫" : t}
              </button>
            ) : (
              <span key={i} />
            )
          )}
        </div>
        {state && !state.ok && (
          <p id="pin-fehler" role="alert" className="mt-3 text-sm text-bo-danger">
            {state.message}
          </p>
        )}
        <Knopf type="submit" variant="primary" size="l" className="mt-4 w-full" disabled={pending || pin.length < 4 || !aktiv} laedt={pending}>
          {pending ? "Wechselt …" : "Anmelden"}
        </Knopf>
        {!aktiv && <p className="mt-2 text-center text-xs text-bo-text-soft">Bitte zuerst einen Bediener wählen.</p>}
      </div>
    </form>
  );
}
