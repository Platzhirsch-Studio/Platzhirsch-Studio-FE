"use client";
// Küchenplaner – „Fotoansicht“: zum aktuellen Plan das passendste von 66 vorgerenderten
// Bildern (Blender-Renderings, keine Fotos, keine KI-Bilder). Daten und Auswahl:
// src/lib/kuechenplaner/fotoansicht.js (waehleFotoansicht), Texte: copy/fotoansicht.js.
//
// - Grundformen ohne Bild (Zweizeilig, Halbinsel, Frei): nur eine ruhige Zeile, kein Rahmen.
// - Umschalter Dreiviertel/Augenhöhe als echte Knöpfe (aria-pressed, ≥ 44 px).
// - Fester Rahmen 3:2 (Bilder 1600 × 1067) → kein Layout-Sprung; next/image lädt lazy.
// - Bildwechsel: das neue Bild lädt unsichtbar über dem alten und blendet erst nach dem
//   Laden ein (Muster Ezarri/FotoAnsicht.js); bei reduzierter Bewegung ohne Übergang.
// - Pflicht-Bildunterschrift „Visualisierung (Rendering)“ direkt am Bild, dazu der Hinweis,
//   dass Farben/Materialien nur annähernd sind, und die Abweichungen zum Plan (max. 3).
// - Druck: ausgeblendet (print:hidden); die Druckansicht /kuechenplaner/druck nutzt sie nicht.
import { useEffect, useState } from "react";
import Image from "next/image";
import { FRONT_COLORS, FRONT_FINISHES, GRIPS, GRIP_COLORS, SHAPES, WORKTOPS } from "./catalog";
import { useKpT } from "./KpCopy";
import { FOTO_VIEW_DEFAULT, fotoSrc, fotoViewsFuer, hatFotoansicht, waehleFotoansicht } from "../../../lib/kuechenplaner/fotoansicht";

// Panel rechts 460 px (lg), darunter volle Breite abzüglich Rand
const SIZES = "(min-width: 1024px) 460px, 100vw";
const FADE_MS = 400;
const MAX_ABWEICHUNGEN = 3;

const VIEW_LABEL = { dreiviertel: "Dreiviertel", auge: "Augenhöhe" };
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";
const viewBtn = (on) => `inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors duration-150 ${focusRing} ${on ? "border-ink bg-ink text-paper" : "border-ink/20 bg-paper text-ink hover:border-ink/60"}`;

const colorLabel = (finish, color) => FRONT_COLORS[finish]?.[color]?.label || FRONT_COLORS[Object.keys(FRONT_COLORS).find((f) => FRONT_COLORS[f][color])]?.[color]?.label || color;

/** Bezeichnung einer Option (deutsch, Katalog) – tr übersetzt sie bei der Anzeige. */
function optionLabel(key, value, finish) {
  if (key === "finish") return FRONT_FINISHES[value]?.label || value;
  if (key === "color") return colorLabel(finish, value);
  if (key === "top") return WORKTOPS[value]?.label || value;
  if (key === "grip") return GRIPS[value]?.label || value;
  if (key === "gripColor") return GRIP_COLORS[value]?.label || value;
  return value;
}
const WAS = { finish: "Front", color: "Farbe", top: "Arbeitsplatte", grip: "Griff", gripColor: "Griff-Farbe" };

function Bild({ src, alt, sichtbar, onLoad, w, h }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={SIZES}
      onLoad={onLoad}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${sichtbar ? "opacity-100" : "opacity-0"}`}
      data-kp-foto-bild=""
    />
  );
}

export default function Fotoansicht({ plan }) {
  const tr = useKpT();
  const [view, setView] = useState(FOTO_VIEW_DEFAULT);
  const views = fotoViewsFuer(plan.shape);
  const aktiv = views.includes(view) ? view : views[0] || FOTO_VIEW_DEFAULT;
  const wahl = waehleFotoansicht(plan, aktiv);
  const ziel = wahl ? fotoSrc(wahl.bild) : null;
  const [basis, setBasis] = useState(null); // vollständig sichtbares Bild
  const [geladen, setGeladen] = useState(null); // zuletzt fertig geladenes Bild

  useEffect(() => {
    if (!ziel || geladen !== ziel || basis === ziel) return undefined;
    const id = setTimeout(() => setBasis(ziel), FADE_MS);
    return () => clearTimeout(id);
  }, [geladen, ziel, basis]);

  if (!hatFotoansicht(plan.shape) || !wahl) {
    return (
      <p className="text-[0.8125rem] text-ink-soft print:hidden" data-kp-foto-none="">
        {tr("Für diese Grundform gibt es noch keine Fotoansicht.")}
      </p>
    );
  }

  const { bild, abweichungen } = wahl;
  const o = bild.options;
  const shapeName = tr(SHAPES[plan.shape]?.label || plan.shape);
  const alt = tr("{vShape}, Front {vFront} {vColor}, Arbeitsplatte {vTop}, Visualisierung (Rendering)", {
    vShape: shapeName,
    vFront: tr(FRONT_FINISHES[o.front]?.label || o.front),
    vColor: tr(colorLabel(o.front, o.color)),
    vTop: tr(WORKTOPS[o.worktop]?.label || o.worktop),
  });
  const oben = ziel !== basis ? ziel : null;
  const erstesBild = Boolean(basis || geladen);
  const sichtbarAbw = abweichungen.slice(0, MAX_ABWEICHUNGEN).map((a) =>
    tr("{vWas} {vBild} statt {vPlan}", { vWas: tr(WAS[a.key]), vBild: tr(optionLabel(a.key, a.bild, o.front)), vPlan: tr(optionLabel(a.key, a.plan, plan.finish)) }),
  );
  const rest = abweichungen.length - sichtbarAbw.length;

  return (
    <figure className="m-0 min-w-0 space-y-2 print:hidden" data-kp-foto="" data-kp-foto-view={aktiv} data-kp-foto-file={bild.file} aria-label={tr("Fotoansicht: {vShape}", { vShape: shapeName })}>
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#ebe6de]">
        {basis && <Bild key={basis} src={basis} alt={oben ? "" : alt} sichtbar w={bild.w} h={bild.h} />}
        {oben && <Bild key={oben} src={oben} alt={alt} sichtbar={geladen === oben} onLoad={() => setGeladen(oben)} w={bild.w} h={bild.h} />}
        {!erstesBild && (
          <p className="absolute left-1/2 top-1/2 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 bg-paper/95 px-3 py-1.5 text-center text-[0.8125rem] text-ink ring-1 ring-ink/10" role="status" data-kp-foto-laedt="">
            {tr("Fotoansicht wird geladen …")}
          </p>
        )}
      </div>
      {views.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={tr("Blickwinkel")}>
          {views.map((v) => (
            <button key={v} type="button" aria-pressed={aktiv === v} onClick={() => setView(v)} className={viewBtn(aktiv === v)} data-kp-foto-umschalter={v}>
              {tr(VIEW_LABEL[v] || v)}
            </button>
          ))}
        </div>
      )}
      <figcaption className="space-y-1 text-[0.8125rem] leading-snug text-ink" data-kp-foto-caption="">
        <p className="font-medium">{tr("Visualisierung (Rendering)")}</p>
        <p className="text-ink-soft">{tr("Farben und Materialien sind nur annähernd dargestellt. Gezeigt wird die nächstliegende von 66 vorgerenderten Varianten – nicht zwingend genau Ihre Kombination.")}</p>
        {sichtbarAbw.length > 0 && (
          <p className="text-ink-soft" data-kp-foto-abweichungen="">
            {tr("Bild zeigt: {vList}", { vList: sichtbarAbw.join(" · ") })}
            {rest > 0 ? ` ${tr("und {n} weitere", { n: rest })}` : ""}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
