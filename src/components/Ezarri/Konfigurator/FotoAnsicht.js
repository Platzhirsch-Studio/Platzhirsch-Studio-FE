"use client";
// Ezarri-Konfigurator – „Fotoansicht“: vorgerenderte Visualisierung (Beispielbecken 8 × 4 m)
// als Überblendung über der 3D-/2D-Bühne. Daten: src/lib/ezarri/konfigurator/renders.js.
// Überblendung: das neue Bild lädt unsichtbar über dem alten und blendet erst nach dem
// Laden ein (kein Aufblitzen der Bühne); bei reduzierter Bewegung sofortiger Wechsel.
// Zuschnitt: immer object-cover (QM r1: object-contain ließ ab lg beige Balken über und unter
// dem Rendering stehen – wirkte unfertig). Beschnitt bleibt gering (Bühne ≈ 4:3 bis 16:9).
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FOTO_CAPTION, FOTO_DEKOR_HINWEIS, RENDER_BREITE, RENDER_HOEHE, istDekor, renderSrc } from "@/lib/ezarri/konfigurator/renders";
import { useKonfCopy } from "./useKonfCopy";

const SIZES = "(min-width: 1280px) 62vw, (min-width: 1024px) 56vw, 100vw";
const FADE_MS = 600; // = --duration-section

function Bild({ src, alt, sichtbar, onLoad, priority }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={RENDER_BREITE}
      height={RENDER_HOEHE}
      sizes={SIZES}
      priority={priority}
      onLoad={onLoad}
      className={`absolute inset-0 size-full object-cover transition-opacity duration-(--duration-section) ease-quiet motion-reduce:transition-none ${sichtbar ? "opacity-100" : "opacity-0"}`}
      data-ezk-foto-bild=""
    />
  );
}

/**
 * @param {{render:{file:string}, alt:string, reducedMotion:boolean}} props
 */
export default function FotoAnsicht({ render, alt, reducedMotion }) {
  const { en, t, X } = useKonfCopy();
  const ziel = renderSrc(render);
  const [basis, setBasis] = useState(null); // vollständig sichtbares Bild
  const [geladen, setGeladen] = useState(null); // zuletzt fertig geladenes Bild

  // Nach dem Einblenden wird das neue Bild zur Basis (altes fällt weg)
  useEffect(() => {
    if (geladen !== ziel || basis === ziel) return undefined;
    const id = setTimeout(() => setBasis(ziel), reducedMotion ? 0 : FADE_MS);
    return () => clearTimeout(id);
  }, [geladen, ziel, basis, reducedMotion]);

  const oben = ziel !== basis ? ziel : null;
  // 02.11.: Dekor-/Druckmotive (Standard-Pixel, Standard-Printed) – die Szene zeigt nur die Grundfarbe,
  // nicht die Zeichnung. Zusatz zur Pflicht-Unterschrift, FR/IT vom Server (X.fotoDekorHinweis).
  const dekorHinweis = istDekor(render) ? (X?.fotoDekorHinweis ?? (en ? FOTO_DEKOR_HINWEIS.en : FOTO_DEKOR_HINWEIS.de)) : null;
  // Bis das erste Bild da ist, bleibt die Bühne (3D/2D) sichtbar statt einer leeren Fläche
  const erstesBild = Boolean(basis || geladen);

  // 02.11. (Dekor-Hinweis): Die Höhe der Bildunterschrift wandert als --ezk-caption-h an die Bühne,
  // damit die untere Leiste (Rückgängig · Wiederholen · Vergleich, Stage.js) über der Unterschrift
  // sitzt statt daneben. Vorher brauchte die Unterschrift rechts 9 rem Platz und wurde auf dem
  // iPhone SE sechszeilig (127 px bei 180 px Bühne). Beim Abbau wird die Variable zurückgesetzt.
  const captionRef = useRef(null);
  useEffect(() => {
    const el = captionRef.current;
    const buehne = el?.parentElement?.parentElement; // figcaption → figure → Bühne
    if (!el || !buehne) return undefined;
    const setze = () => buehne.style.setProperty("--ezk-caption-h", `${el.offsetHeight}px`);
    setze();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(setze) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      buehne.style.removeProperty("--ezk-caption-h");
    };
  }, [erstesBild]);
  return (
    <figure className={`absolute inset-0 m-0 flex flex-col ${erstesBild ? "bg-linen" : "bg-transparent"}`} data-ezk-foto="">
      <div className="relative min-h-0 flex-1">
        {basis && <Bild key={basis} src={basis} alt={oben ? "" : alt} sichtbar />}
        {oben && <Bild key={oben} src={oben} alt={alt} sichtbar={geladen === oben} onLoad={() => setGeladen(oben)} priority={!basis} />}
        {!erstesBild && (
          <p className="absolute left-1/2 top-1/2 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 bg-paper px-4 py-2.5 text-small text-text shadow-overlay" role="status" data-ezk-foto-laedt="">
            {t("Fotoansicht wird geladen …", "Loading photo view …")}
          </p>
        )}
      </div>
      {/* QM r1: Bildunterschrift erst mit dem Bild – vorher lag sie halbtransparent über der 2D-Legende (Text auf Text).
          02.11.: volle Breite; die untere Leiste der Bühne weicht per --ezk-caption-h nach oben aus (siehe oben). */}
      {erstesBild && (
        <figcaption ref={captionRef} className="bg-linen px-2 py-1.5 text-small leading-snug text-text-soft" data-ezk-foto-caption="">
          {X?.fotoCaption ?? (en ? FOTO_CAPTION.en : FOTO_CAPTION.de)}
          {/* Dekor-Motive (02.11.): Hinweis kurz und im Fließtext, damit die Unterschrift auf kleinen Handys
              nicht die halbe Bühne einnimmt. */}
          {dekorHinweis && <span data-ezk-foto-dekor=""> · {dekorHinweis}</span>}
        </figcaption>
      )}
    </figure>
  );
}
