"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import { Icon } from "@/components/Backoffice/icons";
import { useToast } from "@/components/Backoffice/Toast";
import cx from "@/components/Backoffice/cx";
import { rolleAendernAction } from "@/lib/backoffice/actions";
import { rollenLabel } from "@/lib/backoffice/labels";

const MAX_CHIPS = 3;

/**
 * Benutzer und Rollen: Suche (Name/E-Mail), Rollenfilter, kompakte Tabelle (Telefon: Karten).
 * Admin bearbeitet Rollen über das Zeilenmenü → Dialog mit Rollen-Chips (entfernen ×, hinzufügen).
 * @param {{benutzer:Array<{name:string, email?:string, full_name?:string, rollen:string[]}>, admin:boolean, alleRollen:string[]}} props
 */
export default function BenutzerTabelle({ benutzer, admin, alleRollen }) {
  const [suche, setSuche] = useState("");
  const [rolle, setRolle] = useState("");
  const [menu, setMenu] = useState(null);
  const [bearbeiten, setBearbeiten] = useState(null); // user name
  const rollenImEinsatz = useMemo(() => [...new Set(benutzer.flatMap((u) => u.rollen))].sort((a, b) => rollenLabel(a).localeCompare(rollenLabel(b), "de")), [benutzer]);
  const q = suche.trim().toLowerCase();
  const sichtbar = benutzer.filter((u) => (!rolle || u.rollen.includes(rolle)) && (!q || `${u.full_name || ""} ${u.email || ""} ${u.name}`.toLowerCase().includes(q)));
  const aktuell = benutzer.find((u) => u.name === bearbeiten) || null;

  const chips = (rollen) => (
    <span className="flex min-w-0 flex-wrap gap-1">
      {rollen.slice(0, MAX_CHIPS).map((r) => (
        <span key={r} className="whitespace-nowrap rounded-[4px] bg-bo-surface-3 px-1.5 py-0.5 text-[11px] text-bo-text-soft">
          {rollenLabel(r)}
        </span>
      ))}
      {rollen.length > MAX_CHIPS && (
        <span className="whitespace-nowrap rounded-[4px] px-1 py-0.5 text-[11px] text-bo-text-faint" title={rollen.slice(MAX_CHIPS).map(rollenLabel).join(", ")}>
          +{rollen.length - MAX_CHIPS}
        </span>
      )}
      {rollen.length === 0 && <span className="text-xs text-bo-text-faint">keine Rolle</span>}
    </span>
  );

  const zeilenMenue = (u) =>
    admin && (
      <ZeilenMenue
        offen={menu === u.name}
        name={u.full_name || u.name}
        onToggle={() => setMenu(menu === u.name ? null : u.name)}
        onSchliessen={() => setMenu(null)}
        onBearbeiten={() => {
          setMenu(null);
          setBearbeiten(u.name);
        }}
      />
    );

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-80">
          <Icon name="Search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-bo-text-faint" />
          <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Benutzer suchen" placeholder="Name oder E-Mail …" className="bo-input min-h-9 py-1 pl-8 text-sm" data-testid="benutzer-suche" />
        </div>
        <select value={rolle} onChange={(e) => setRolle(e.target.value)} aria-label="Nach Rolle filtern" className="bo-input min-h-9 min-w-0 flex-1 py-1 text-sm sm:w-auto sm:flex-none" data-testid="benutzer-rolle">
          <option value="">Alle Rollen</option>
          {rollenImEinsatz.map((r) => (
            <option key={r} value={r}>
              {rollenLabel(r)}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs tabular-nums text-bo-text-soft">
          {sichtbar.length} von {benutzer.length}
        </span>
      </div>

      <div className="min-w-0 rounded-[10px] border border-bo-line bg-bo-surface">
        {sichtbar.length === 0 ? (
          <div className="p-4">
            <Leer titel="Kein Benutzer gefunden" text="Suche oder Rollenfilter anpassen." />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-bo-line md:hidden" data-testid="benutzer-karten">
              {sichtbar.map((u) => (
                <li key={u.name} className="flex min-w-0 items-start gap-3 px-3 py-3">
                  <Avatar name={u.full_name || u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.full_name || u.name}</p>
                    <p className="truncate text-xs text-bo-text-soft">{u.email || u.name}</p>
                    <div className="mt-1.5">{chips(u.rollen)}</div>
                  </div>
                  {zeilenMenue(u)}
                </li>
              ))}
            </ul>
            <table className="hidden w-full border-collapse text-[13px] md:table" data-testid="benutzer-tabelle">
              <thead className="border-b border-bo-line-strong bg-bo-surface-2 text-left text-xs text-bo-text-soft">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Rollen
                  </th>
                  {admin && (
                    <th scope="col" className="w-12 px-3 py-2">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sichtbar.map((u) => (
                  <tr key={u.name} className="border-t border-bo-line first:border-t-0 transition-colors duration-[120ms] hover:bg-bo-surface-2">
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={u.full_name || u.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.full_name || u.name}</p>
                          <p className="truncate text-xs text-bo-text-soft">{u.email || u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{chips(u.rollen)}</td>
                    {admin && <td className="px-3 py-2 text-right">{zeilenMenue(u)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      {admin && <RollenDialog benutzer={aktuell} alleRollen={alleRollen} onSchliessen={() => setBearbeiten(null)} />}
    </div>
  );
}

function Avatar({ name }) {
  const initialen = String(name || "?")
    .replace(/\(.*\)/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-bo-surface-3 text-[11px] font-semibold text-bo-text-soft">
      {initialen}
    </span>
  );
}

function ZeilenMenue({ offen, name, onToggle, onSchliessen, onBearbeiten }) {
  const ref = useRef(null);
  const schliessen = useRef(onSchliessen);
  useEffect(() => {
    schliessen.current = onSchliessen;
  });
  useEffect(() => {
    if (!offen) return;
    ref.current?.querySelector("[role=menuitem]")?.focus();
    const klick = (e) => ref.current && !ref.current.contains(e.target) && schliessen.current();
    const taste = (e) => e.key === "Escape" && schliessen.current();
    document.addEventListener("mousedown", klick);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", klick);
      document.removeEventListener("keydown", taste);
    };
  }, [offen]);
  return (
    <div ref={ref} className="relative inline-block shrink-0">
      <button type="button" onClick={onToggle} aria-haspopup="menu" aria-expanded={offen} aria-label={`Aktionen für ${name}`} className="bo-motion inline-flex size-9 items-center justify-center rounded-bo text-bo-text-soft transition-colors duration-[120ms] hover:bg-bo-action-soft hover:text-bo-text">
        <Icon name="MoreHorizontal" className="size-4" />
      </button>
      {offen && (
        <div role="menu" aria-label={`Aktionen für ${name}`} className="bo-pop absolute right-0 z-30 mt-1 w-48 rounded-bo border border-bo-line bg-bo-surface p-1 text-left shadow-bo">
          <button type="button" role="menuitem" onClick={onBearbeiten} className="flex min-h-9 w-full items-center gap-2 rounded px-2 text-sm hover:bg-bo-action-soft focus-visible:bg-bo-action-soft">
            <Icon name="UserCog" className="size-4 text-bo-text-soft" /> Rollen bearbeiten
          </button>
        </div>
      )}
    </div>
  );
}

/** Dialog: Rollen als Chips mit Entfernen (×) und Hinzufügen (Auswahl + Knopf). Jede Änderung wirkt sofort. */
function RollenDialog({ benutzer, alleRollen, onSchliessen }) {
  const ref = useRef(null);
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  const [neu, setNeu] = useState("");
  const [rollen, setRollen] = useState(benutzer?.rollen || []);
  const [fuer, setFuer] = useState(benutzer?.name || null);
  // Anderer Benutzer gewählt (oder Serverstand neu): lokale Rollen nachziehen.
  if ((benutzer?.name || null) !== fuer) {
    setFuer(benutzer?.name || null);
    setRollen(benutzer?.rollen || []);
    setNeu("");
  }
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (benutzer && !d.open) d.showModal();
    if (!benutzer && d.open) d.close();
  }, [benutzer]);

  const aendern = (rolle, entfernen) =>
    start(async () => {
      const r = await rolleAendernAction({ user: benutzer.name, rolle, entfernen });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      setRollen((alt) => (entfernen ? alt.filter((x) => x !== rolle) : [...alt, rolle]));
      setNeu("");
      zeige(entfernen ? `${rollenLabel(rolle)} entzogen.` : `${rollenLabel(rolle)} zugewiesen.`, { art: "ok" });
      router.refresh();
    });
  const frei = alleRollen.filter((r) => !rollen.includes(r));

  return (
    <dialog
      ref={ref}
      onClose={onSchliessen}
      onCancel={(e) => {
        e.preventDefault();
        onSchliessen();
      }}
      aria-labelledby="bo-rollen-titel"
      className="bo-dialog m-auto w-[min(94vw,32rem)] rounded-[10px] border border-bo-line bg-bo-surface p-0 text-bo-text shadow-bo-lg"
    >
      {benutzer && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="bo-rollen-titel" className="text-base font-semibold">
                Rollen bearbeiten
              </h2>
              <p className="mt-0.5 truncate text-sm text-bo-text-soft">
                {benutzer.full_name || benutzer.name} · {benutzer.email || benutzer.name}
              </p>
            </div>
            <button type="button" onClick={onSchliessen} aria-label="Dialog schließen" className="-mr-2 -mt-1 inline-flex size-9 items-center justify-center rounded-bo text-bo-text-soft hover:bg-bo-action-soft hover:text-bo-text">
              <Icon name="X" className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-xs font-medium text-bo-text-soft">Zugewiesen</p>
          <ul className="mt-1.5 flex min-h-9 flex-wrap gap-1.5" aria-label="Zugewiesene Rollen">
            {rollen.length === 0 && <li className="text-sm text-bo-text-faint">Noch keine Rolle.</li>}
            {rollen.map((r) => (
              <li key={r} className="bo-pop inline-flex items-center gap-1 rounded-bo bg-bo-surface-3 py-0.5 pl-2 pr-0.5 text-sm">
                {rollenLabel(r)}
                <button type="button" onClick={() => aendern(r, true)} disabled={pending} aria-label={`${rollenLabel(r)} entziehen`} className="inline-flex size-7 items-center justify-center rounded text-bo-text-soft hover:bg-bo-danger-soft hover:text-bo-danger disabled:opacity-50">
                  <Icon name="X" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-5 flex min-w-0 flex-wrap items-end gap-2 border-t border-bo-line pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (neu) aendern(neu, false);
            }}
          >
            <label className="min-w-0 flex-1 text-xs font-medium text-bo-text-soft">
              <span className="mb-1 block">Rolle hinzufügen</span>
              <select value={neu} onChange={(e) => setNeu(e.target.value)} className="bo-input text-sm">
                <option value="">Rolle wählen …</option>
                {frei.map((r) => (
                  <option key={r} value={r}>
                    {rollenLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <Knopf type="submit" variant="primary" disabled={!neu || pending} laedt={pending}>
              <Icon name="Plus" className="size-4" /> Hinzufügen
            </Knopf>
          </form>
          <div className={cx("mt-5 flex justify-end")}>
            <Knopf onClick={onSchliessen}>Fertig</Knopf>
          </div>
        </div>
      )}
    </dialog>
  );
}
