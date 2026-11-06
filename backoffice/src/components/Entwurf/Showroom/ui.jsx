import Image from "next/image";
import {
  AlertTriangle, Armchair, Bath, BedDouble, Briefcase, Calendar, ChefHat, Droplets, FileSignature, Flower2, Gift,
  Lamp, Layers, Mail, PenTool, PhoneCall, Receipt, Ship, Sofa, Sparkles, TreePine, Truck,
} from "lucide-react";
import { BILD, TEAM } from "./daten";
import { WORTMARKE } from "./marke";

const ICONS = {
  AlertTriangle, Armchair, Bath, BedDouble, Briefcase, Calendar, ChefHat, Droplets, FileSignature, Flower2, Gift,
  Lamp, Layers, Mail, PenTool, PhoneCall, Receipt, Ship, Sofa, Sparkles, TreePine, Truck,
};

export function Ico({ name, ...rest }) {
  const C = ICONS[name] || Sparkles;
  return <C aria-hidden="true" {...rest} />;
}

/** Wortmarke als Kontur (aus dem Website-Logo), Höhe über CSS. */
export function Wortmarke({ className = "", title = "Platzhirsch Home Living" }) {
  const w = Math.ceil(WORTMARKE.width);
  return (
    <svg className={`sr-wordmark ${className}`} viewBox={`0 -1 ${w} 26.5`} role="img" aria-label={title}>
      <path d={WORTMARKE.d} fill="currentColor" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  );
}

/** Monogramm P+H mit Geweihstangen (Website-Logo), für die schmale Leiste. */
export function Monogramm({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 60" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 57V26M33 57V26" />
        <path d="M15 26h6.5a7 7 0 0 1 0 14H15" />
        <path d="M15 47.5h18" />
        <path d="M15 26C15 16.5 11 10 6 3.5M33 26C33 16.5 37 10 42 3.5" />
        <path d="M14.4 20.5L21 16.7M33.6 20.5L27 16.7" />
      </g>
    </svg>
  );
}

export function Av({ kurz, m, size = 32, title, ring }) {
  const p = TEAM[kurz];
  return (
    <span className={`sr-av${ring ? " sr-av--ring" : ""}`} data-m={m || p?.m} style={{ "--av": `${size}px` }} title={title || p?.name}>
      {kurz}
    </span>
  );
}

/** Status als Punkt + Wort – keine Pille. */
export function Status({ m, children }) {
  return <span className="sr-status" data-m={m}>{children}</span>;
}

export function Bild({ src, alt = "", className = "", sizes = "300px", preload, style }) {
  return (
    <span className={`sr-img ${className}`} style={style}>
      <Image src={BILD(src)} alt={alt} fill sizes={sizes} preload={preload} />
    </span>
  );
}

export function Initialen(name) {
  const w = name.replace(/^Dr\.\s+/, "").split(/[\s&]+/).filter(Boolean);
  return (name.includes("&") ? [w[0], w[w.length - 1]] : w.slice(0, 2)).map((x) => x[0]).join("").toUpperCase();
}
