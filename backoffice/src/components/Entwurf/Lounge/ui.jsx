"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight, Building2, Flame, Gem, Gift, Lamp, Layers, LayoutGrid, Mail, Palette, PenTool, Ruler, Sparkles,
  Ticket, Truck, Wallet, Wine,
} from "lucide-react";
import { BILD, TEAM } from "./daten";

const ICONS = { Building2, Flame, Gem, Gift, Lamp, Layers, LayoutGrid, Mail, Palette, PenTool, Ruler, Sparkles, Ticket, Truck, Wallet, Wine };

/** lucide mit Lounge-Strichstärke (1.75) und festen Größen 16/20/24. */
export function Ico({ name, size = 20, ...rest }) {
  const C = ICONS[name] || Sparkles;
  return <C aria-hidden="true" size={size} strokeWidth={1.75} {...rest} />;
}

/** Wortmarke: Bodoni Moda, gesperrt – die einzige Serifenstelle der Oberfläche. */
export function Wortmarke({ sub = true }) {
  return (
    <span className="lg-mark">
      <span className="lg-mark__word">PLATZHIRSCH</span>
      {sub && <span className="lg-mark__sub">Home Living · Lochau</span>}
    </span>
  );
}

/** Initialen-Kreis in warmem Materialton – keine Fotos echter Personen. */
export function Av({ kurz, m, size = 32, name, ring = true }) {
  const p = TEAM[kurz];
  return (
    <span className={`lg-av${ring ? " lg-av--ring" : ""}`} data-m={m || p?.m || "travertin"} style={{ "--av": `${size}px` }} title={name || p?.name} role="img" aria-label={name || p?.name}>
      {kurz}
    </span>
  );
}

/** Überlappende Avatar-Reihe mit Zähler (Referenz Sugar CRM / Praxis). */
export function AvReihe({ leute = [], max = 4, size = 28, mehr = 0 }) {
  const sicht = leute.slice(0, max);
  const rest = leute.length - sicht.length + mehr;
  return (
    <span className="lg-avrow" style={{ "--av": `${size}px` }}>
      {sicht.map((k) => <Av key={k} kurz={k} size={size} />)}
      {rest > 0 && <span className="lg-av lg-av--more" style={{ "--av": `${size}px` }}>+{rest}</span>}
    </span>
  );
}

export function Pille({ ton = "stein", children, punkt = true }) {
  return <span className="lg-pill" data-ton={ton}>{punkt && <i aria-hidden="true" />}{children}</span>;
}

export function Bild({ src, alt = "", className = "", sizes = "300px", preload }) {
  return (
    <span className={`lg-img ${className}`}>
      <Image src={BILD(src)} alt={alt} fill sizes={sizes} preload={preload} />
    </span>
  );
}

/** Runder Pfeil-Knopf „öffnen“ – dreht beim Hover der Kachel 45°. */
export function Oeffnen({ label = "Öffnen", hell = false }) {
  return (
    <button type="button" className={`lg-open${hell ? " lg-open--hell" : ""}`} aria-label={label}>
      <ArrowUpRight aria-hidden="true" size={20} strokeWidth={1.75} />
    </button>
  );
}

export function Rund({ label, children, badge, aktiv, onClick, groesse }) {
  return (
    <button type="button" className={`lg-round${aktiv ? " is-on" : ""}${groesse === "s" ? " lg-round--s" : ""}`} aria-label={label} title={label} onClick={onClick}>
      {children}
      {badge ? <span className="lg-badge">{badge}</span> : null}
    </button>
  );
}

/** Zahl zählt beim Erscheinen hoch (Feder-ähnlich ausklingend); bei reduzierter Bewegung sofort. */
export function Zahl({ wert, dez = 0, suffix = "", prefix = "" }) {
  const fmt = (v) => prefix + v.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez }) + suffix;
  const [txt, setTxt] = useState(fmt(wert));
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf; const start = performance.now(); const dauer = 900;
    const schritt = (t) => {
      const x = Math.min(1, (t - start) / dauer);
      const e = 1 - Math.pow(1 - x, 4);
      setTxt(fmt(wert * e));
      if (x < 1) raf = requestAnimationFrame(schritt);
    };
    raf = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert]);
  return <span ref={ref} className="lg-num">{txt}</span>;
}

/** Segmented Control mit gleitendem Indikator (iOS). */
export function Segment({ optionen, wert, onChange, label, gross = false }) {
  const ref = useRef(null);
  const [ind, setInd] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector('[aria-checked="true"]');
    if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth });
  }, [wert, optionen]);
  return (
    <div className={`lg-seg${gross ? " lg-seg--l" : ""}`} role="radiogroup" aria-label={label} ref={ref}>
      {ind && <span className="lg-seg__ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden="true" />}
      {optionen.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={wert === o.id} onClick={() => onChange?.(o.id)}>
          {o.icon}{o.label}{o.n != null && <span className="lg-seg__n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

/** iOS-Schalter. */
export function Schalter({ an, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={an} className="lg-switch" onClick={() => onChange?.(!an)}>
      <span className="lg-switch__label">{label}</span>
      <span className="lg-switch__track" aria-hidden="true"><span className="lg-switch__thumb" /></span>
    </button>
  );
}
