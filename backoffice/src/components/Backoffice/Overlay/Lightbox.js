"use client";
// G-08 Lightbox (Team P0-4): Bilder und PDFs eines Objekts, dunkle Bühne in beiden Schemata
// (wie die Fotos-App), Bedienelemente als Glas-Pillen. Pfeile/←→ blättern, Esc schließt,
// Zoom 1×/2× (Klick ins Bild zoomt an der Stelle, gezogen wird mit der Maus oder dem Finger),
// Bildquelle und Freigabestatus als Zeile, Miniaturen zum Springen. „Herunterladen“ erscheint nur
// mit Recht und freigegebenem Umfang (Sortiment) – sonst gar nicht (keine Schein-Knöpfe).

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";
import { useDialogOffen } from "./hilfen";
import { begrenzeVerschiebung, darfHerunterladen, medienArt, naechsterIndex, naechsterZoom } from "./logik";
import { TEXTE } from "./texte";
import "./overlay.css";

const T = TEXTE.lightbox;

/**
 * @typedef {object} Medium
 * @property {string} src
 * @property {string} [titel]
 * @property {"bild"|"pdf"} [typ]          sonst aus der Endung
 * @property {string} [alt]                Alternativtext (Standard: titel)
 * @property {string} [vorschau]           Miniatur-URL (Standard: src)
 * @property {string} [quelle]             Bildquelle („Hersteller · Pressebild 2026“)
 * @property {{text: string, ton?: "ok"|"warn"|"aus", download?: boolean}} [freigabe]
 * @property {boolean} [download]          false = nie herunterladen
 */

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {Medium[]} p.medien
 * @param {number} [p.start]               Index beim Öffnen
 * @param {string} [p.titel]               Bezug („Sofa Ponza · Bilder“)
 * @param {boolean} [p.herunterladen]      Recht zum Herunterladen (Sortiment Freigabe-Umfang)
 * @param {(i: number) => void} [p.onIndex]
 */
export default function Lightbox({ offen, onSchliessen, medien = [], start = 0, titel, herunterladen = false, onIndex, testid = "lightbox" }) {
  const ref = useRef(null);
  const id = useId();
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState(1);
  const [versatz, setVersatz] = useState({ dx: 0, dy: 0 });
  const [ursprung, setUrsprung] = useState("50% 50%");
  const [fehler, setFehler] = useState({});
  const bild = useRef(null);
  const ziehen = useRef(null);
  useDialogOffen(ref, offen, { fokusAufDialog: true });

  // Beim Öffnen auf den Startindex
  useEffect(() => {
    if (offen) {
      setIndex(Math.min(Math.max(0, start), Math.max(0, medien.length - 1))); // eslint-disable-line react-hooks/set-state-in-effect
      setZoom(1);
      setVersatz({ dx: 0, dy: 0 });
    }
  }, [offen, start, medien.length]);

  const n = medien.length;
  const m = medien[index];
  const art = medienArt(m);

  const gehe = useCallback(
    (schritt) => {
      const neu = naechsterIndex(index, n, schritt);
      if (neu < 0 || neu === index) return;
      setIndex(neu);
      setZoom(1);
      setVersatz({ dx: 0, dy: 0 });
      onIndex?.(neu);
    },
    [index, n, onIndex]
  );

  const springe = (i) => {
    setIndex(i);
    setZoom(1);
    setVersatz({ dx: 0, dy: 0 });
    onIndex?.(i);
  };

  const setzeZoom = (z, punkt) => {
    if (z === 1) {
      setZoom(1);
      setVersatz({ dx: 0, dy: 0 });
      return;
    }
    if (punkt) setUrsprung(punkt);
    setZoom(2);
  };

  // Nachbarbilder vorladen
  useEffect(() => {
    if (!offen) return;
    for (const j of [index - 1, index + 1]) {
      const nb = medien[j];
      if (nb && medienArt(nb) === "bild") {
        const img = new Image();
        img.src = nb.src;
      }
    }
  }, [offen, index, medien]);

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowRight") gehe(1);
    else if (e.key === "ArrowLeft") gehe(-1);
    else if (e.key === "Home") gehe("anfang");
    else if (e.key === "End") gehe("ende");
    else if ((e.key === "+" || e.key === "=") && art === "bild") setzeZoom(naechsterZoom(zoom, "+"));
    else if ((e.key === "-" || e.key === "0") && art === "bild") setzeZoom(naechsterZoom(zoom, "-"));
    else return;
    e.preventDefault();
  };

  // Ziehen im vergrößerten Bild
  const onPointerDown = (e) => {
    if (zoom === 1) return;
    e.preventDefault();
    ziehen.current = { x: e.clientX, y: e.clientY, start: versatz, bewegt: false, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.dataset.ziehen = "true";
  };
  const onPointerMove = (e) => {
    const z = ziehen.current;
    if (!z || e.pointerId !== z.id) return;
    const dx = z.start.dx + (e.clientX - z.x);
    const dy = z.start.dy + (e.clientY - z.y);
    if (Math.abs(e.clientX - z.x) + Math.abs(e.clientY - z.y) > 4) z.bewegt = true;
    const b = bild.current;
    setVersatz(begrenzeVerschiebung({ dx, dy, zoom, breite: b?.offsetWidth || 0, hoehe: b?.offsetHeight || 0 }));
  };
  const onPointerUp = (e) => {
    const z = ziehen.current;
    ziehen.current = null;
    delete e.currentTarget.dataset.ziehen;
    if (z && !z.bewegt) setzeZoom(1);
  };
  const onBildKlick = (e) => {
    if (zoom !== 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setzeZoom(2, `${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  const download = m && darfHerunterladen(m, herunterladen);
  const titelId = `${id}-titel`;

  return (
    <dialog
      ref={ref}
      className="bo-dialog bo-ov-lightbox"
      aria-labelledby={titelId}
      aria-roledescription={T.titel}
      data-testid={testid}
      onCancel={(e) => {
        e.preventDefault();
        onSchliessen?.();
      }}
      onKeyDown={onKeyDown}
    >
      {/* Kopf: Titel + Position, Zoom, Herunterladen, Schließen */}
      <div className="bo-ov-lb__leiste">
        <div className="bo-ov-lb__titel">
          <h2 id={titelId}>{m?.titel || titel || T.titel}</h2>
          <p aria-live="polite" data-testid="lightbox-position">
            {n ? T.position(index + 1, n) : T.leer}
            {titel && m?.titel ? ` · ${titel}` : ""}
          </p>
        </div>
        {art === "bild" && m && !fehler[index] && (
          <div className="bo-ov-lb__zoom bo-ov-lb__glas" role="group" aria-label={T.zoom}>
            <button type="button" aria-pressed={zoom === 1} onClick={() => setzeZoom(1)} data-testid="lightbox-zoom-1">
              {T.zoom1}
            </button>
            <button type="button" aria-pressed={zoom === 2} onClick={() => setzeZoom(2, "50% 50%")} data-testid="lightbox-zoom-2">
              {T.zoom2}
            </button>
          </div>
        )}
        {art === "pdf" && m && (
          <a className="bo-ov-lb__rund bo-ov-lb__glas" href={m.src} target="_blank" rel="noopener" aria-label={T.pdfOeffnen} title={T.pdfOeffnen}>
            <Icon name="ArrowUpRight" />
          </a>
        )}
        {download && (
          <a className="bo-ov-lb__rund bo-ov-lb__glas" href={m.src} download aria-label={T.herunterladen} title={T.herunterladen} data-testid="lightbox-download">
            <Icon name="Download" />
          </a>
        )}
        <button type="button" className="bo-ov-lb__rund bo-ov-lb__glas" aria-label={TEXTE.schliessen} title={TEXTE.schliessen} onClick={() => onSchliessen?.()} data-testid="lightbox-schliessen">
          <Icon name="X" />
        </button>
      </div>

      {/* Bühne */}
      <div className="bo-ov-lb__buehne">
        {offen && m && art === "bild" && !fehler[index] && (
          /* eslint-disable-next-line @next/next/no-img-element -- beliebige Quellen (Frappe-Dateien), Größe unbekannt */
          <img
            ref={bild}
            key={m.src}
            src={m.src}
            alt={m.alt || m.titel || ""}
            className="bo-ov-lb__bild"
            data-zoom={zoom}
            draggable={false}
            style={{ transform: zoom === 2 ? `translate(${versatz.dx}px, ${versatz.dy}px) scale(2)` : undefined, transformOrigin: ursprung }}
            onClick={onBildKlick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onError={() => setFehler((f) => ({ ...f, [index]: true }))}
            data-testid="lightbox-bild"
          />
        )}
        {offen && m && art === "bild" && fehler[index] && (
          <div className="bo-ov-lb__hinweis bo-ov-lb__glas" role="status">
            <Icon name="TriangleAlert" className="size-6" />
            {T.bildFehler}
          </div>
        )}
        {offen && m && art === "pdf" && <iframe key={m.src} src={m.src} title={m.titel || T.titel} className="bo-ov-lb__pdf" data-testid="lightbox-pdf" />}
        {offen && !m && (
          <div className="bo-ov-lb__hinweis bo-ov-lb__glas" role="status">
            {T.leer}
          </div>
        )}
        {n > 1 && (
          <>
            <button type="button" className="bo-ov-lb__rund bo-ov-lb__glas bo-ov-lb__pfeil" data-richtung="zurueck" aria-label={T.vorige} onClick={() => gehe(-1)} disabled={index <= 0} data-testid="lightbox-zurueck">
              <Icon name="ChevronLeft" />
            </button>
            <button type="button" className="bo-ov-lb__rund bo-ov-lb__glas bo-ov-lb__pfeil" data-richtung="weiter" aria-label={T.naechste} onClick={() => gehe(1)} disabled={index >= n - 1} data-testid="lightbox-weiter">
              <Icon name="ChevronRight" />
            </button>
          </>
        )}
      </div>

      {/* Fuß: Quelle · Freigabe, Miniaturen, Tastenhinweis */}
      <div className="bo-ov-lb__fuss">
        {m && (
          <p className="bo-ov-lb__zeile bo-ov-lb__glas" data-testid="lightbox-info">
            <span>
              {T.quelle}: <strong>{m.quelle || T.keineQuelle}</strong>
            </span>
            {m.freigabe?.text && (
              <span>
                {T.freigabe}:{" "}
                <strong>
                  <span className="bo-ov-lb__punkt" data-ton={m.freigabe.ton || "aus"} aria-hidden="true" />
                  {m.freigabe.text}
                </strong>
              </span>
            )}
          </p>
        )}
        {n > 1 && (
          <div className="bo-ov-lb__minis" role="group" aria-label={T.miniaturen}>
            {medien.map((x, i) => (
              <button key={`${x.src}-${i}`} type="button" className="bo-ov-lb__mini" aria-current={i === index ? "true" : undefined} aria-label={`${x.titel || T.titel} · ${T.position(i + 1, n)}`} onClick={() => springe(i)}>
                {medienArt(x) === "pdf" ? (
                  <span className="bo-ov-lb__mini-pdf">
                    <Icon name="FileText" className="size-5" />
                  </span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- Miniatur aus beliebiger Quelle */
                  <img src={x.vorschau || x.src} alt="" loading="lazy" draggable={false} />
                )}
              </button>
            ))}
          </div>
        )}
        <p className="bo-ov-lb__tasten" aria-hidden="true">
          {T.tasten}
        </p>
      </div>
    </dialog>
  );
}
