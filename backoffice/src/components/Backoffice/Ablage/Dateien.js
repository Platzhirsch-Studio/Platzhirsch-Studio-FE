"use client";
// Dateien als Raster (Karten mit Vorschaubild 4:3) oder Liste (Tabelle in Kachel) – Konzept §3.1.
// Klick wählt die Datei ins Vorschau-Panel, Doppelklick/Enter öffnet die Akte, Leertaste = Panel,
// Rechtsklick/Langdruck = Kontextmenü, X bzw. Kreis = Auswahl, Ziehen auf einen Ordner = verschieben.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Link2, Lock } from "lucide-react";
import { Menue } from "../Overlay/Popover";
import Avatar from "../Avatar";
import Vorschaubild from "./Vorschaubild";
import { sperreArt } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";
import { person, titelZeit, wann } from "./zeit";

function Marken({ d, user }) {
  const sperre = sperreArt(d, user);
  return (
    <span className="bo-abl-karte__marken">
      {sperre && (
        <span className="bo-abl-marke" data-ton={sperre === "fremd" ? "eiche" : "see"} title={sperre === "fremd" ? "Ausgecheckt" : "Von dir ausgecheckt"}>
          <Lock className="size-3.5" strokeWidth={2} />
        </span>
      )}
      {d.freigabelinks_aktiv > 0 && (
        <span className="bo-abl-marke" data-ton="salbei" title={T.status.geteilt(d.freigabelinks_aktiv)}>
          <Link2 className="size-3.5" strokeWidth={2} />
        </span>
      )}
      {d.portal_freigabe ? (
        <span className="bo-abl-marke" data-ton="messing" title={T.status.portal}>
          <Globe className="size-3.5" strokeWidth={2} />
        </span>
      ) : null}
    </span>
  );
}

function statusText(d, user) {
  const teile = [];
  const s = sperreArt(d, user);
  if (s) teile.push(s === "fremd" ? "ausgecheckt" : "von dir ausgecheckt");
  if (d.freigabelinks_aktiv > 0) teile.push(T.status.geteilt(d.freigabelinks_aktiv));
  if (d.portal_freigabe) teile.push(T.status.portal);
  return teile.join(", ");
}

/**
 * @param {object} p
 * @param {object[]} p.items
 * @param {"raster"|"liste"} p.ansicht
 * @param {string|null} p.aktiv            Datei im Panel
 * @param {Set<string>} p.auswahl
 * @param {(d:object)=>void} p.onWaehle
 * @param {(d:object)=>void} p.onAuswahl
 * @param {object} p.werkzeug             useDateiWerkzeug()
 * @param {string} p.user
 * @param {Record<string,string>} p.namen
 * @param {boolean} [p.ziehbar]
 * @param {boolean} [p.mitOrdner]          Ordnerpfad statt Größe in der Unterzeile (Suche/Zuletzt)
 * @param {Record<string,string>} [p.ordnerTitel]
 */
export default function Dateien({ zusatz, items, ansicht = "raster", aktiv, auswahl = new Set(), onWaehle, onAuswahl, werkzeug, user, namen = {}, info, ziehbar = false, mitOrdner = false, ordnerTitel = {}, testid = "abl-dateien" }) {
  const router = useRouter();
  const [ctx, setCtx] = useState(null);
  const lang = useRef(null);
  const kontext = (d) => ({
    onContextMenu: (e) => {
      e.preventDefault();
      setCtx({ d, x: e.clientX, y: e.clientY });
    },
    onPointerDown: (e) => {
      if (e.pointerType !== "touch") return;
      const { clientX: x, clientY: y } = e;
      clearTimeout(lang.current);
      lang.current = setTimeout(() => setCtx({ d, x, y }), 500);
    },
    onPointerUp: () => clearTimeout(lang.current),
    onPointerCancel: () => clearTimeout(lang.current),
  });
  const menue = ctx ? (
    <Menue
      label={`${T.aktionen.menue}: ${ctx.d.dateiname}`}
      offen
      onOffen={(o) => !o && setCtx(null)}
      ausloeser={(p) => <span {...p} aria-hidden="true" tabIndex={-1} style={{ position: "fixed", left: ctx.x, top: ctx.y, width: 1, height: 1, pointerEvents: "none" }} />}
      testid="abl-kontextmenue"
    >
      {werkzeug.menue(ctx.d)}
    </Menue>
  ) : null;
  const akte = (d) => `/ablage/datei/${encodeURIComponent(d.datei)}`;
  const tasten = (e, d, i) => {
    if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") {
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      setCtx({ d, x: r.left + 24, y: r.top + Math.min(r.height, 40) });
      return;
    }
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onWaehle(d);
    } else if (e.key === "Enter") {
      e.preventDefault();
      router.push(akte(d));
    } else if (e.key === "x" || e.key === "X") {
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      onAuswahl?.(d);
    } else if (e.key === "Delete" && werkzeug.rechte(d).papierkorb.an) {
      e.preventDefault();
      werkzeug.h.papierkorb(d);
    } else if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
      const knoepfe = [...e.currentTarget.closest("[data-abl-liste]").querySelectorAll("[data-abl-ziel]")];
      const spalten = ansicht === "raster" ? Math.max(1, Math.round(e.currentTarget.closest("[data-abl-liste]").clientWidth / (e.currentTarget.offsetWidth || 200))) : 1;
      const schritt = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? spalten : -spalten;
      const ziel = knoepfe[Math.min(Math.max(i + schritt, 0), knoepfe.length - 1)];
      if (ziel) {
        e.preventDefault();
        ziel.focus();
      }
    }
  };
  const ziehen = (d) =>
    ziehbar && werkzeug.rechte(d).verschieben.an
      ? {
          draggable: true,
          onDragStart: (e) => {
            const namen = auswahl.has(d.datei) ? [...auswahl] : [d.datei];
            e.dataTransfer.setData("application/x-ph-datei", JSON.stringify(namen));
            e.dataTransfer.effectAllowed = "move";
          },
        }
      : {};
  const unter = (d) => `${(d.endung || "").toUpperCase()} · ${d.groesse_text}`;
  const herkunft = (d) => (mitOrdner ? ordnerTitel[d.ordner] || d.bezug_titel || "" : "");

  if (ansicht === "liste") {
    return (
      <div className="bo-kachel bo-kachel--flach overflow-x-auto px-3 pt-4 pb-3" data-testid={testid}>
        <table className="bo-abl-liste" data-abl-liste>
          <thead>
            <tr>
              <th scope="col" className="w-10">
                <span className="sr-only">Auswahl</span>
              </th>
              <th scope="col">{T.inhalt.spalten.name}</th>
              <th scope="col" className="bo-abl-spalte-weg">
                {T.inhalt.spalten.geaendert}
              </th>
              <th scope="col" className="bo-rechts bo-abl-spalte-weg">
                {T.inhalt.spalten.groesse}
              </th>
              <th scope="col" className="bo-abl-spalte-weg">
                {T.inhalt.spalten.von}
              </th>
              <th scope="col">
                <span className="sr-only">{T.inhalt.spalten.status}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, i) => (
                <tr key={d.datei} {...kontext(d)} aria-haspopup="menu" data-aktiv={aktiv === d.datei ? "true" : undefined} onClick={() => onWaehle(d)} onDoubleClick={() => router.push(akte(d))} {...ziehen(d)} data-testid="abl-zeile">
                  <td>
                    <button type="button" role="checkbox" aria-checked={auswahl.has(d.datei)} aria-label={`${d.dateiname} auswählen`} className="bo-abl-karte__auswahl static opacity-100" onClick={(e) => (e.stopPropagation(), onAuswahl?.(d))}>
                      <Check className="size-3.5" strokeWidth={2.25} />
                    </button>
                  </td>
                  <td className="max-w-0">
                    <button type="button" className="bo-abl-liste__name w-full" data-abl-ziel onKeyDown={(e) => tasten(e, d, i)} aria-label={`${d.dateiname}${statusText(d, user) ? `, ${statusText(d, user)}` : ""}`} aria-pressed={aktiv === d.datei}>
                      <span className="bo-abl-liste__daumen">
                        <Vorschaubild datei={d} klein officeVorschau={info?.office_vorschau} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="bo-abl-liste__titel">{d.dateiname}</span>
                        <span className="bo-abl-liste__unter">{herkunft(d) ? `${herkunft(d)} · ${unter(d)}` : unter(d)}</span>
                      </span>
                    </button>
                  </td>
                  <td className="bo-abl-spalte-weg whitespace-nowrap text-bo-text-soft" title={titelZeit(d.geaendert)} suppressHydrationWarning>
                    {zusatz ? zusatz(d) : wann(d.geaendert)}
                  </td>
                  <td className="bo-rechts bo-abl-spalte-weg whitespace-nowrap text-bo-text-soft">{d.groesse_text}</td>
                  <td className="bo-abl-spalte-weg">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Avatar name={person(d.hochgeladen_von, namen)} groesse={26} dekorativ />
                      <span className="max-w-32 truncate text-bo-text-soft">{person(d.hochgeladen_von, namen)}</span>
                    </span>
                  </td>
                  <td className="w-24">
                    <span className="relative flex justify-end gap-1.5 [&_.bo-abl-karte__marken]:static">
                      <Marken d={d} user={user} />
                    </span>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        {menue}
      </div>
    );
  }

  return (
    <>
    <ul className="bo-abl-raster bo-staffel" data-abl-liste data-auswahl={auswahl.size ? "an" : undefined} data-testid={testid}>
      {items.map((d, i) => (
          <li key={d.datei} {...kontext(d)} className={`bo-abl-karte${d._neu ? " bo-neu" : ""}`} data-aktiv={aktiv === d.datei ? "true" : undefined} data-gewaehlt={auswahl.has(d.datei) ? "true" : undefined} {...ziehen(d)} data-testid="abl-karte">
            <button
              type="button"
              className="bo-abl-karte__knopf"
              data-abl-ziel
              aria-label={`${d.dateiname}${statusText(d, user) ? `, ${statusText(d, user)}` : ""}`}
              aria-pressed={aktiv === d.datei}
              onClick={() => onWaehle(d)}
              onDoubleClick={() => router.push(akte(d))}
              onKeyDown={(e) => tasten(e, d, i)}
            />
            <button type="button" role="checkbox" aria-checked={auswahl.has(d.datei)} aria-label={`${d.dateiname} auswählen`} className="bo-abl-karte__auswahl" onClick={() => onAuswahl?.(d)}>
              <Check className="size-3.5" strokeWidth={2.25} />
            </button>
            <div className="bo-abl-karte__bild">
              <Vorschaubild datei={d} officeVorschau={info?.office_vorschau} laden={i < 16 ? "eager" : "lazy"} />
              <Marken d={d} user={user} />
            </div>
            <div className="bo-abl-karte__text">
              <span className="bo-abl-karte__name" title={d.dateiname}>
                {d.dateiname}
              </span>
              {herkunft(d) && <span className="bo-abl-karte__meta">{herkunft(d)}</span>}
              <span className="bo-abl-karte__meta" suppressHydrationWarning title={titelZeit(d.geaendert)}>
                {unter(d)} · {zusatz ? zusatz(d) : wann(d.geaendert)}
              </span>
            </div>
          </li>
      ))}
    </ul>
    {menue}
    </>
  );
}
