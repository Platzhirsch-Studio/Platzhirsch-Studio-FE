"use client";
// MiniKarte (Konzept §3.5.1, §10): Karte im Format 85,6 : 54 in der Stufenfarbe, Wortmarke Bodoni, Nummer
// tabellarisch. Klick dreht auf die Rückseite (QR + Datenschutztext), 240 ms; reduzierte Bewegung: sofort.

import { useState } from "react";
import { stufenStil } from "./StufenKennzeichen";
import { T } from "@/lib/backoffice/kundenkarte/texte";

/** QR aus dem Backend (Feld qr_svg) als Bild – nie als HTML eingesetzt. */
export function QrBild({ svg, nr, className }) {
  if (!svg || !/^\s*<svg[\s>]/i.test(svg) || /<script|on\w+=/i.test(svg)) return null;
  // eslint-disable-next-line @next/next/no-img-element -- QR als data:-SVG vom Kundenkarten-Server
  return <img className={className} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} role="img" alt={`QR-Code der Kundenkarte ${nr}`} />;
}

export default function MiniKarte({ nr, name, stufe, farbe, qrSvg, datenschutz, gross = false, drehbar = true }) {
  const [gedreht, setGedreht] = useState(false);
  const inhalt = (
    <span className="bo-kk-mini__innen" aria-hidden={drehbar ? "true" : undefined}>
      <span className="bo-kk-mini__seite">
        <span className="bo-kk-mini__marke">PLATZHIRSCH</span>
        <span>
          {gross && name && <span className="block text-[13px] font-medium opacity-90">{name}</span>}
          <span className="bo-kk-mini__nr block">{nr}</span>
          <span className="bo-kk-mini__stufe block">{stufe}</span>
        </span>
      </span>
      <span className="bo-kk-mini__seite bo-kk-mini__rueck">
        <QrBild svg={qrSvg} nr={nr} className="bo-kk-mini__qr" />
        {!qrSvg && <span className="bo-kk-mini__nr">{nr}</span>}
        <span className="bo-kk-mini__daten">{datenschutz}</span>
      </span>
    </span>
  );
  if (!drehbar) {
    return (
      <span className="bo-kk-mini" data-gross={gross ? "" : undefined} style={stufenStil(farbe)} role="img" aria-label={`Kundenkarte ${nr}, ${stufe}`}>
        {inhalt}
      </span>
    );
  }
  return (
    <button type="button" className="bo-kk-mini" data-gross={gross ? "" : undefined} data-gedreht={gedreht ? "true" : "false"} style={stufenStil(farbe)} aria-label={gedreht ? T.akte.vorderseite : T.akte.rueckseite} aria-pressed={gedreht} onClick={() => setGedreht((g) => !g)} data-testid="mini-karte">
      {inhalt}
    </button>
  );
}
