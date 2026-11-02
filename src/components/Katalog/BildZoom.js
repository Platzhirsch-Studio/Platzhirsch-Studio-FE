"use client";
// src/components/Katalog/BildZoom.js – Herstellerbild der Katalog-Produktseite
// vergrößern (QM R3 Küche/Bad/Outdoor, 02.11.2026: „nichts ist anklickbar“).
// Kleine Insel: Das Bild (Server-gerendert, children) liegt in einem Knopf; der
// öffnet ein natives <dialog> (showModal = Fokusfalle + Escape) mit dem Bild in
// voller Größe, object-contain, unverändert. Schließen per Knopf, Escape oder
// Klick neben das Bild; der Fokus kehrt zum Knopf zurück. Keine Animation
// (prefers-reduced-motion / data-motion="calm" damit ohnehin erfüllt).
import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

/**
 * @param {{ src: string, width: number, height: number, alt: string, label: string, closeLabel: string, className?: string, children: import("react").ReactNode }} props
 */
export default function BildZoom({ src, width, height, alt, label, closeLabel, className = "", children }) {
  const ref = useRef(null);
  const knopf = useRef(null);
  const auf = () => {
    try {
      ref.current?.showModal();
    } catch {
      /* ohne <dialog>: Bild bleibt im Fluss */
    }
  };
  const zu = () => ref.current?.close();
  return (
    <>
      <button ref={knopf} type="button" onClick={auf} aria-label={label} aria-haspopup="dialog" className={`block cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`} data-kat-zoom="">
        {children}
      </button>
      <dialog
        ref={ref}
        aria-label={alt}
        onClose={() => knopf.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) zu();
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper/95 p-0 backdrop:bg-ink/40"
      >
        <div className="flex h-full w-full items-center justify-center p-4 sm:p-10" onClick={(e) => e.target === e.currentTarget && zu()}>
          <Image src={src} width={width} height={height} alt={alt} sizes="100vw" quality={80} className="block h-auto max-h-full w-auto max-w-full object-contain" data-pin-nopin="true" />
        </div>
        <button type="button" onClick={zu} aria-label={closeLabel} className="absolute top-3 right-3 inline-flex size-11 items-center justify-center border border-line bg-paper text-text hover:border-ink">
          <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
        </button>
      </dialog>
    </>
  );
}
