"use client";
// Aufgaben aus PH Aufgabe + ToDo in einer Liste (10-konzept-zentrale § 3.2.4 / § 3.6; Lounge § 6 „Tabelle in Kachel“).
// Häkchen erledigt sofort (Ziel 28 px, Touch 32 + Rand), die Zeile bleibt 8 s durchgestrichen mit „Rückgängig“ stehen
// (Leitregel 4, Z-44) und fällt erst danach weg; Rückgängig ruft die Gegenaktion (Q-C3 Variante B).
// Inline-Zeile „Aufgabe hinzufügen …“ mit Titel-Parser (@name, +3, morgen, 12.11.) nur mit create-Recht (Z-39).

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useToast } from "../Toast";
import { Icon } from "../icons";
import Avatar from "../Avatar";
import { Pille } from "../StatusBadge";
import { AUFGABEN, ZENTRALE } from "@/lib/backoffice/zentrale/texte";
import { faelligAnzeige, parseTitel } from "@/lib/backoffice/zentrale/aufgaben";
import { aufgabeAnlegenAction, aufgabeStatusAction } from "@/lib/backoffice/zentrale/actions";
import { doctypeLabel } from "@/lib/backoffice/labels";

const HALTEN_MS = 8000;

function bezugHref(z) {
  if (!z.bezugDoctype || !z.bezugName) return null;
  if (z.bezugDoctype === "PH Aufgabe") return `/aufgaben/${encodeURIComponent(z.bezugName)}`;
  return `/d/${z.bezugDoctype.toLowerCase().replace(/\s+/g, "-")}/${encodeURIComponent(z.bezugName)}`;
}

function zeileHref(z) {
  return z.quelle === "aufgabe" ? `/aufgaben/${encodeURIComponent(z.name)}` : bezugHref(z);
}

/**
 * @param {object} p
 * @param {object[]} p.zeilen            aus zentrale/aufgaben.fuehreZusammen
 * @param {string} p.heute               ISO
 * @param {boolean} [p.darfAnlegen]
 * @param {Array<{user:string,name:string}>} [p.personen]  für @name
 * @param {number} [p.max]               sichtbare Zeilen (Zentrale 5)
 * @param {boolean} [p.mitZustaendig]    Spalte Zuständig (Team-/Alle-Sicht)
 * @param {Record<string,string>} [p.namen]  user → Anzeigename
 */
export default function AufgabenListe({ zeilen = [], heute, darfAnlegen = false, personen = [], max = 0, mitZustaendig = false, namen = {}, leerText = ZENTRALE.keineAufgaben, testid = "aufgaben-liste" }) {
  const { zeige } = useToast();
  const [halten, setHalten] = useState({});
  const [optimistisch, setOptimistisch] = useState({});
  const timer = useRef({});

  useEffect(() => {
    const t = timer.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const sicht = useMemo(() => {
    const ids = new Set(Object.keys(halten));
    const basis = zeilen.filter((z) => !ids.has(z.id));
    const out = [...basis];
    for (const [, h] of Object.entries(halten).sort((a, b) => a[1].index - b[1].index)) out.splice(Math.min(h.index, out.length), 0, h.zeile);
    return out.map((z) => (optimistisch[z.id] ? { ...z, status: optimistisch[z.id] } : z));
  }, [zeilen, halten, optimistisch]);

  const angezeigt = max ? sicht.slice(0, max + Object.keys(halten).length) : sicht;

  function loslassen(id) {
    clearTimeout(timer.current[id]);
    delete timer.current[id];
    setHalten((h) => {
      const n = { ...h };
      delete n[id];
      return n;
    });
  }

  async function umschalten(z) {
    const erledigt = z.status === "Erledigt";
    const neu = erledigt ? "Offen" : "Erledigt";
    const index = sicht.findIndex((x) => x.id === z.id);
    setOptimistisch((o) => ({ ...o, [z.id]: neu }));
    if (!erledigt) {
      setHalten((h) => ({ ...h, [z.id]: { zeile: { ...z, status: neu }, index } }));
      clearTimeout(timer.current[z.id]);
      timer.current[z.id] = setTimeout(() => loslassen(z.id), HALTEN_MS);
    }
    const r = await aufgabeStatusAction({ quelle: z.quelle, name: z.name, status: neu });
    if (!r?.ok) {
      setOptimistisch((o) => ({ ...o, [z.id]: z.status }));
      loslassen(z.id);
      zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
      return;
    }
    if (!erledigt) {
      zeige(AUFGABEN.erledigt(z.titel), {
        art: "ok",
        dauer: HALTEN_MS,
        icon: "Check",
        aktion: {
          titel: AUFGABEN.rueckgaengig,
          onClick: async () => {
            const u = await aufgabeStatusAction({ quelle: z.quelle, name: z.name, status: r.undo?.status || "Offen" });
            if (u?.ok) {
              setOptimistisch((o) => ({ ...o, [z.id]: r.undo?.status || "Offen" }));
              loslassen(z.id);
              zeige(AUFGABEN.wiederOffen(z.titel), { art: "info", icon: "Undo2" });
            } else zeige(u?.message || "Das hat nicht geklappt.", { art: "fehler" });
          },
        },
      });
    } else {
      loslassen(z.id);
      zeige(AUFGABEN.wiederOffen(z.titel), { art: "info", icon: "Undo2" });
    }
  }

  return (
    <div data-testid={testid}>
      {angezeigt.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[20px] bg-bo-surface-2 p-5" data-testid="aufgaben-leer">
          <span className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-bo-salbei-soft text-bo-salbei-text">
            <Icon name="Check" className="size-4" />
          </span>
          <p className="text-[15px] font-medium">{leerText}</p>
        </div>
      ) : (
        <ul className="zb-auf">
          {angezeigt.map((z) => {
            const f = faelligAnzeige(z.faellig, heute);
            const href = zeileHref(z);
            const erledigt = z.status === "Erledigt";
            const bHref = bezugHref(z);
            return (
              <li key={z.id} className="zb-auf__i" data-erledigt={erledigt || undefined} data-testid="aufgabe-zeile" data-quelle={z.quelle}>
                <button type="button" className="zb-haken" aria-pressed={erledigt} aria-label={erledigt ? AUFGABEN.wiederOeffnen(z.titel) : AUFGABEN.erledigen(z.titel)} onClick={() => umschalten(z)} data-testid="aufgabe-haken">
                  <Icon name="Check" className="size-4" strokeWidth={2.25} />
                </button>
                <div className="min-w-0">
                  {href ? (
                    <Link href={href} className="zb-auf__titel line-clamp-2 hover:underline hover:underline-offset-2">
                      {z.titel}
                    </Link>
                  ) : (
                    <span className="zb-auf__titel line-clamp-2">{z.titel}</span>
                  )}
                  <div className="zb-auf__unter">
                    {erledigt && halten[z.id] ? (
                      <span>{AUFGABEN.erledigtZeile}</span>
                    ) : (
                      <>
                        {bHref && z.quelle === "aufgabe" && (
                          <Link href={bHref} className="truncate hover:text-bo-text">
                            {doctypeLabel(z.bezugDoctype)} {z.bezugName}
                          </Link>
                        )}
                        {z.system && (
                          <span className="zb-kennz" title={AUFGABEN.systemHilfe}>
                            {AUFGABEN.system}
                          </span>
                        )}
                        {z.prioritaet === "Hoch" && <span className="font-medium text-bo-eiche-text">Hoch</span>}
                        {z.status === "In Arbeit" && <Pille material="see" groesse="xs">In Arbeit</Pille>}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {mitZustaendig && z.zustaendig && <Avatar name={namen[z.zustaendig] || z.zustaendig} groesse={24} />}
                  <span className="zb-faellig" data-ton={erledigt ? undefined : f.ton}>
                    {f.text}
                    {f.ueberfaellig && !erledigt && <span className="sr-only"> (überfällig)</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {darfAnlegen && <Schnellanlage heute={heute} personen={personen} />}
    </div>
  );
}

/** Inline-Zeile „Aufgabe hinzufügen …“ (§ 3.7): Titel + erkannte Steuer-Wörter als Chips, Enter legt an. */
export function Schnellanlage({ heute, personen = [], bezug = null, autoFocus = false }) {
  const { zeige } = useToast();
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const p = useMemo(() => parseTitel(text, { heute, personen }), [text, heute, personen]);

  function senden(e) {
    e.preventDefault();
    if (!p.titel.trim()) {
      setFehler(AUFGABEN.titelPflicht);
      return;
    }
    starte(async () => {
      const r = await aufgabeAnlegenAction({ titel: p.titel, faellig: p.faellig || undefined, zugewiesen_an: p.zustaendig || undefined, referenz_doctype: bezug?.doctype, referenz_name: bezug?.name });
      if (r?.ok) {
        setText("");
        setFehler("");
        zeige(AUFGABEN.angelegt(r.titel), { art: "ok" });
      } else setFehler(r?.message || "Das hat nicht geklappt.");
    });
  }

  return (
    <form className="zb-neu" onSubmit={senden} data-testid="aufgabe-schnellanlage">
      <label className="zb-neu__feld">
        <Icon name="Plus" className="size-4 shrink-0 text-bo-text-soft" />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (fehler) setFehler("");
          }}
          placeholder={ZENTRALE.aufgabeHinzu}
          aria-label={ZENTRALE.aufgabeHinzu}
          aria-describedby="zb-neu-hilfe"
          aria-invalid={fehler ? true : undefined}
          maxLength={180}
          autoFocus={autoFocus}
          disabled={laeuft}
          data-testid="aufgabe-schnellanlage-feld"
        />
        <button type="submit" className="bo-rund bo-rund--s bo-tip" aria-label={AUFGABEN.anlegen} data-tip={AUFGABEN.anlegen} disabled={laeuft || !text.trim()}>
          <Icon name="ArrowUp" className="size-4" />
        </button>
      </label>
      {p.token.length > 0 && (
        <div className="zb-token" aria-live="polite">
          {p.token.map((t) => (
            <Pille key={t.text} material={t.art === "faellig" ? "eiche" : "see"} groesse="sm">
              {t.art === "faellig" ? `${AUFGABEN.faelligFeld}: ${faelligAnzeige(t.wert, heute).text}` : `${AUFGABEN.zustaendigFeld}: ${p.zustaendigName}`}
            </Pille>
          ))}
        </div>
      )}
      <p id="zb-neu-hilfe" className={fehler ? "zb-feld__fehler mt-2" : "sr-only"}>
        {fehler || ZENTRALE.aufgabeHinzuHilfe}
      </p>
    </form>
  );
}
