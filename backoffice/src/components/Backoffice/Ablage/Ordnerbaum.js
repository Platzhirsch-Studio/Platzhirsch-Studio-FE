"use client";
// Ordnerbaum (Konzept §3.1): Bereichsordner oben, aktueller Zweig aufgeklappt, weitere Ebenen laden beim
// Aufklappen (ordner_baum mit tiefe 1). Tastatur wie Finder: ↑/↓ wandern, → öffnet bzw. springt ins erste Kind,
// ← schließt bzw. springt zum Elternknoten, Enter öffnet den Ordner. Ziehen von Dateien auf einen Knoten
// verschiebt (über onAblegen) – Tastaturweg ist „Verschieben …“ im Menü (Q-I4).

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Folder, FolderLock, FolderOpen, Share2, Trash2, Users } from "lucide-react";
import { ordnerKinderAction } from "@/lib/backoffice/ablage/actions";
import { ordnerName } from "@/lib/backoffice/ablage/regeln";
import { T } from "@/lib/backoffice/ablage/texte";

function mische(wurzeln, zweig) {
  if (!zweig) return wurzeln;
  return wurzeln.map((w) => {
    if (w.ordner === zweig.eltern) return { ...w, kinder: [...(w.kinder || []).filter((k) => k.ordner !== zweig.ordner), zweig].sort((a, b) => ordnerName(a).localeCompare(ordnerName(b), "de")) };
    return w;
  });
}

/**
 * @param {object} p
 * @param {object[]} p.wurzeln
 * @param {object|null} p.zweig        Unterbaum des aktuellen Stammordners
 * @param {string[]} p.kette           IDs von oben bis zum aktuellen Ordner
 * @param {string|null} p.aktiv
 * @param {(ordner:string)=>string} p.href
 * @param {{papierkorb:number, freigaben:number}} p.zaehler
 * @param {string} [p.seite]           "zuletzt" | "freigaben" | "papierkorb"
 * @param {(ordner:object, dateien:string[])=>void} [p.onAblegen]
 */
export default function Ordnerbaum({ wurzeln = [], zweig = null, kette = [], aktiv = null, href, zaehler = {}, seite, onAblegen }) {
  const start = useMemo(() => mische(wurzeln, zweig), [wurzeln, zweig]);
  const [nachgeladen, setNachgeladen] = useState({});
  const [offen, setOffen] = useState(() => new Set(kette));
  const [ziel, setZiel] = useState(null);
  const baumRef = useRef(null);

  const kinderVon = useCallback((k) => nachgeladen[k.ordner] || k.kinder || [], [nachgeladen]);

  const umschalten = async (k, an) => {
    const neu = new Set(offen);
    const wird = an ?? !neu.has(k.ordner);
    if (wird) neu.add(k.ordner);
    else neu.delete(k.ordner);
    setOffen(neu);
    if (wird && !nachgeladen[k.ordner] && !(k.kinder || []).length && k.hat_kinder !== 0) {
      const r = await ordnerKinderAction({ ordner: k.ordner });
      if (r.ok) setNachgeladen((m) => ({ ...m, [k.ordner]: r.daten }));
    }
  };

  const sichtbar = [];
  const lauf = (liste, tiefe, eltern) => {
    for (const k of liste) {
      sichtbar.push({ k, tiefe, eltern });
      if (offen.has(k.ordner)) lauf(kinderVon(k), tiefe + 1, k);
    }
  };
  lauf(start, 0, null);

  const fokus = (i) => {
    const el = baumRef.current?.querySelectorAll("[data-baum-link]")[i];
    el?.focus();
  };

  const taste = (e, i) => {
    const { k, eltern } = sichtbar[i];
    const kinder = kinderVon(k);
    const hat = kinder.length > 0 || Boolean(k.hat_kinder);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      fokus(Math.min(i + 1, sichtbar.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      fokus(Math.max(i - 1, 0));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (hat && !offen.has(k.ordner)) umschalten(k, true);
      else if (offen.has(k.ordner) && kinder.length) fokus(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (offen.has(k.ordner)) umschalten(k, false);
      else if (eltern) fokus(sichtbar.findIndex((s) => s.k.ordner === eltern.ordner));
    } else if (e.key === "Home") {
      e.preventDefault();
      fokus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      fokus(sichtbar.length - 1);
    }
  };

  const ablegenProps = (k) =>
    onAblegen
      ? {
          onDragOver: (e) => {
            if (!e.dataTransfer.types.includes("application/x-ph-datei")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setZiel(k.ordner);
          },
          onDragLeave: () => setZiel((z) => (z === k.ordner ? null : z)),
          onDrop: (e) => {
            const roh = e.dataTransfer.getData("application/x-ph-datei");
            setZiel(null);
            if (!roh) return;
            e.preventDefault();
            e.stopPropagation();
            try {
              onAblegen(k, JSON.parse(roh));
            } catch {
              /* ungültige Daten ignorieren */
            }
          },
        }
      : {};

  const renderListe = (liste, tiefe) => (
    <ul role={tiefe === 0 ? "tree" : "group"} aria-label={tiefe === 0 ? T.baum.label : undefined}>
      {liste.map((k) => {
        const kinder = kinderVon(k);
        const hat = kinder.length > 0 || Boolean(k.hat_kinder);
        const name = ordnerName(k);
        const istOffen = offen.has(k.ordner);
        const istAktiv = aktiv === k.ordner;
        const i = sichtbar.findIndex((s) => s.k.ordner === k.ordner);
        const Ico = k.effektiver_modus === "leitung" ? FolderLock : istAktiv || istOffen ? FolderOpen : Folder;
        return (
          <li key={k.ordner} role="treeitem" aria-expanded={hat ? istOffen : undefined} aria-selected={istAktiv} aria-level={tiefe + 1}>
            <div className="bo-abl-knoten" data-aktiv={istAktiv ? "true" : undefined} data-ziel={ziel === k.ordner ? "true" : undefined} {...ablegenProps(k)}>
              {hat ? (
                <button type="button" tabIndex={-1} className="bo-abl-knoten__pfeil" aria-expanded={istOffen} aria-label={istOffen ? T.baum.zuklappen(name) : T.baum.aufklappen(name)} onClick={() => umschalten(k)}>
                  <ChevronRight className="size-4" strokeWidth={1.75} />
                </button>
              ) : (
                <span className="bo-abl-knoten__pfeil" aria-hidden="true" />
              )}
              <Link href={href(k.ordner)} data-baum-link className="bo-abl-knoten__link" aria-current={istAktiv ? "page" : undefined} onKeyDown={(e) => taste(e, i)} tabIndex={istAktiv || (!aktiv && i === 0) ? 0 : -1} title={k.titel}>
                <Ico className="bo-abl-knoten__ico size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                <span className="bo-abl-knoten__titel">{name}</span>
                {k.effektiver_modus === "team" && tiefe <= 1 && <Users className="size-3.5 text-bo-text-faint" strokeWidth={1.75} aria-label={T.baum.team} />}
                {k.anzahl_dateien > 0 && <span className="bo-abl-knoten__zahl">{k.anzahl_dateien}</span>}
              </Link>
            </div>
            {hat && istOffen && kinder.length > 0 && renderListe(kinder, tiefe + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="bo-kachel bo-abl-baum" aria-label={T.baum.titel} ref={baumRef} data-testid="abl-baum">
      <p className="bo-abl-baum__titel">{T.baum.titel}</p>
      {start.length ? renderListe(start, 0) : <p className="px-3 py-2 text-sm text-bo-text-soft">{T.baum.leer}</p>}
      <div className="bo-abl-baum__fuss">
        <Link href="/ablage/zuletzt" aria-current={seite === "zuletzt" ? "page" : undefined}>
          <Clock className="size-[18px] text-bo-text-soft" strokeWidth={1.75} aria-hidden="true" />
          {T.baum.zuletzt}
        </Link>
        <Link href="/ablage/freigaben" aria-current={seite === "freigaben" ? "page" : undefined}>
          <Share2 className="size-[18px] text-bo-text-soft" strokeWidth={1.75} aria-hidden="true" />
          {T.baum.freigaben}
          {zaehler.freigaben > 0 && <span className="bo-abl-knoten__zahl">{zaehler.freigaben}</span>}
        </Link>
        <Link href="/ablage/papierkorb" aria-current={seite === "papierkorb" ? "page" : undefined}>
          <Trash2 className="size-[18px] text-bo-text-soft" strokeWidth={1.75} aria-hidden="true" />
          {T.baum.papierkorb}
          {zaehler.papierkorb > 0 && <span className="bo-abl-knoten__zahl">{zaehler.papierkorb}</span>}
        </Link>
      </div>
    </nav>
  );
}
