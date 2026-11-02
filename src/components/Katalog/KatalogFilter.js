"use client";
// src/components/Katalog/KatalogFilter.js
// Leichte Filter-Insel für die statisch erzeugten Katalog-Übersichten
// (/bad-wellness/produkte, /kuechengeraete/produkte, Markenseiten).
// Die Kacheln rendert der Server vollständig (ohne JS sind alle sichtbar);
// die Insel blendet nur Kacheln per `hidden` aus und hält die Auswahl in der
// URL (?bereich=…&kategorie=…&marke=…), damit Links darauf funktionieren.
// Kein Router, kein Daten-Bundle: Texte und Optionen kommen als Props
// (Namespace „katalog“ ist server-only, clientMessages.js).
import { useEffect, useRef, useState } from "react";
import { LINK_EASE, setTileVisible } from "@/components/Landing/motionLanding";

const readQuery = (names) => {
  try {
    const q = new URLSearchParams(window.location.search);
    return Object.fromEntries(names.map((n) => [n, q.get(n) || ""]));
  } catch {
    return {};
  }
};

/**
 * @param {{
 *   zielId: string,
 *   legend: string,
 *   alleLabel: string,
 *   resetLabel: string,
 *   leerText: string,
 *   trefferTexte: string[],
 *   felder: Array<{name: string, label: string, optionen: Array<{value: string, label: string}>}>
 * }} props
 */
export default function KatalogFilter({ zielId, legend, alleLabel, resetLabel, leerText, trefferTexte, felder }) {
  const names = felder.map((f) => f.name);
  const [wahl, setWahl] = useState({});
  const [anzahl, setAnzahl] = useState(null);
  // Erst nach dem Lesen der URL filtern/schreiben (sonst löscht der erste Lauf die Query, z. B. im Strict Mode).
  const [bereit, setBereit] = useState(false);
  // Motion 01.11.2026: erst ab der ersten Nutzer-Änderung kommen Kacheln mit .ph-arrive zurück
  // (und der Zähler mit ihnen) – beim Laden blendet nichts.
  const ersterLauf = useRef(true);

  // Auswahl aus der URL übernehmen (einmal nach dem Mount).
  useEffect(() => {
    const valid = {};
    const q = readQuery(names);
    for (const f of felder) if (q[f.name] && f.optionen.some((o) => o.value === q[f.name])) valid[f.name] = q[f.name];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Startwert aus der URL, einmal nach dem Mount
    setWahl(valid);
    setBereit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kacheln ein-/ausblenden und URL nachführen.
  useEffect(() => {
    const ziel = document.getElementById(zielId);
    if (!bereit || !ziel) return;
    let n = 0;
    for (const el of ziel.querySelectorAll("[data-kat-item]")) {
      const ok = names.every((k) => !wahl[k] || el.getAttribute(`data-${k}`) === wahl[k]);
      if (setTileVisible(el, ok, ersterLauf.current)) n++;
    }
    ersterLauf.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Zähler folgt dem DOM der Server-Kacheln
    setAnzahl(n);
    try {
      const url = new URL(window.location.href);
      for (const k of names) {
        if (wahl[k]) url.searchParams.set(k, wahl[k]);
        else url.searchParams.delete(k);
      }
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wahl, zielId, bereit]);

  const aktiv = names.some((k) => wahl[k]);

  return (
    <fieldset className="mt-stack-m border-t border-line pt-4" data-kat-filter="">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        {felder.map((f) => (
          <label key={f.name} className="flex min-w-[12rem] flex-col gap-1 text-small text-text-soft">
            <span>{f.label}</span>
            <select
              name={f.name}
              value={wahl[f.name] || ""}
              onChange={(e) => setWahl((w) => ({ ...w, [f.name]: e.target.value }))}
              className={`min-h-11 border border-line-strong bg-surface px-3 text-ui text-text hover:border-ink ${LINK_EASE}`}
              data-kat-select={f.name}
            >
              <option value="">{alleLabel}</option>
              {f.optionen.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {aktiv && (
          <button
            type="button"
            onClick={() => setWahl({})}
            className={`ph-press min-h-11 px-0 text-left text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`}
            data-kat-reset=""
          >
            {resetLabel}
          </button>
        )}
      </div>
      <p className="mt-3 text-small text-text-soft" aria-live="polite" data-kat-count="">
        {/* Neue Zahl: innerer Span neu (.ph-arrive 0,6 → 1), die Live-Region selbst bleibt stehen. */}
        {anzahl === null ? "" : (
          <span key={anzahl} className="ph-arrive">
            {anzahl === 0 ? leerText : trefferTexte[anzahl] || ""}
          </span>
        )}
      </p>
    </fieldset>
  );
}
