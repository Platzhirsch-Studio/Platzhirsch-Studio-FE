import Link from "next/link";
import cx from "./cx";
import { PfeilKnopf } from "./Knopf";
import Zahl from "./Charts/Zahl";

// Kachel, Bento-Raster und Akzentkachel (lounge.md §1, §4, §6): schwebende Flächen ohne Rahmen,
// nur von weichem, mehrlagigem Schatten getragen. Radius 28, Innenabstand 24 (dicht 20, Kiosk
// 20/16), eingelassene Karten 20. Gliederung über Fläche + Schatten + Abstand – nie über Linien.
// Server-tauglich (Akzentkachel nutzt das Client-Kind `Zahl` zum Hochzählen).

/**
 * Kachel mit Kopf (Titel 17 + Unterzeile 13 links, Werkzeuge rechts), Inhalt und Fuß
 * (z. B. Avatar-Reihe links, Pfeil-Knopf rechts).
 * @param {object} p
 * @param {import("react").ReactNode} [p.titel]
 * @param {import("react").ReactNode} [p.unter]       Unterzeile (13 px, gedämpft)
 * @param {import("react").ReactNode} [p.werkzeuge]   rechts im Kopf (Rundknöpfe, Link „Alle“)
 * @param {import("react").ReactNode} [p.fuss]        links im Fuß (Avatar-Reihe, Hinweis)
 * @param {string} [p.href]           Pfeil-Knopf unten rechts (dreht beim Hover der Kachel)
 * @param {string} [p.oeffnenLabel]   Name des Pfeil-Knopfs (Standard „Öffnen“ + Titel)
 * @param {boolean} [p.lift]          hebt sich beim Hover 2 px (nur wenn die Kachel ein Ziel hat)
 * @param {boolean} [p.dicht]         Innenabstand 20
 * @param {boolean} [p.flach]         ohne Innenabstand (Bild/Tabelle randlos)
 * @param {boolean} [p.eingelassen]   eingelassene Karte in einer Kachel (Fläche 2, Radius 20)
 * @param {"section"|"div"|"article"|"li"} [p.as]
 * @param {string} [p.titelId]        id der Überschrift (für aria-labelledby)
 * @param {2|3|4} [p.ebene]           Überschriftenebene (Standard h2)
 */
export default function Kachel({ titel, unter, werkzeuge, fuss, href, oeffnenLabel, lift = false, dicht = false, flach = false, eingelassen = false, as = "section", titelId, ebene = 2, className, children, testid, ...rest }) {
  const Tag = as;
  const H = `h${Math.min(Math.max(ebene, 2), 4)}`;
  const mitKopf = titel || unter || werkzeuge;
  const label = oeffnenLabel || (typeof titel === "string" ? `${titel} öffnen` : "Öffnen");
  return (
    <Tag
      className={cx("bo-kachel", eingelassen && "bo-kachel--eingelassen", dicht && "bo-kachel--dicht", flach && "bo-kachel--flach", (lift || href) && "bo-kachel--lift", className)}
      aria-labelledby={titel && titelId ? titelId : undefined}
      data-testid={testid}
      {...rest}
    >
      {mitKopf && (
        <div className={cx("bo-kachel__kopf", flach && "px-(--bo-kachel-p) pt-(--bo-kachel-p)")}>
          <div className="min-w-0">
            {titel && (
              <H id={titelId} className="bo-kachel__titel">
                {titel}
              </H>
            )}
            {unter && <p className="bo-kachel__unter">{unter}</p>}
          </div>
          {werkzeuge && <div className="bo-kachel__werkzeuge">{werkzeuge}</div>}
        </div>
      )}
      {children}
      {(fuss || href) && (
        <div className={cx("bo-kachel__fuss", flach && "px-(--bo-kachel-p) pb-(--bo-kachel-p)")}>
          <div className="min-w-0">{fuss}</div>
          {href && <PfeilKnopf href={href} label={label} />}
        </div>
      )}
    </Tag>
  );
}

/**
 * Bento-Raster: 12 Spalten, Gutter 24 (Kiosk 16); Kinder setzen ihre Breite mit
 * `md:col-span-*` (unter 768 px einspaltig). Kacheln erscheinen gestaffelt (30 ms, weiche Feder),
 * im Kiosk und bei reduzierter Bewegung ohne Staffel. `einblenden={false}` schaltet das ab
 * (z. B. wenn das Raster nach Filterwechsel neu gerendert wird).
 * @param {object} p
 * @param {boolean} [p.einblenden]
 * @param {"section"|"div"|"ul"} [p.as]
 */
export function Bento({ einblenden = true, as = "div", className, children, testid, ...rest }) {
  const Tag = as;
  return (
    <Tag className={cx("bo-bento", className)} data-einblenden={einblenden ? "" : undefined} data-testid={testid} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Akzentkachel: Materialton vollflächig (Cognac oder Salbei), Bezeichnung oben, kurzer Satz,
 * sehr große leichte Zahl unten links (zählt beim Erscheinen hoch), Pfeil-Knopf unten rechts.
 * Höchstens zwei je Bildschirm (lounge.md §3, §11).
 * @param {object} p
 * @param {"cognac"|"salbei"} [p.ton]
 * @param {string} p.titel                 Bezeichnung („Neu seit gestern“)
 * @param {import("react").ReactNode} [p.text]  kurzer Satz („Anfragen warten auf den Erstkontakt.“)
 * @param {number|string|null} [p.zahl]
 * @param {"zahl"|"dezimal"|"cent"|"cent-rund"|"prozent"} [p.format]
 * @param {string} [p.einheit]
 * @param {string} [p.href]
 * @param {string} [p.oeffnenLabel]
 * @param {boolean} [p.kiosk]
 */
export function Akzentkachel({ ton = "cognac", titel, text, zahl, format = "zahl", einheit, href, oeffnenLabel, kiosk = false, className, testid }) {
  const t = ton === "salbei" ? "salbei" : "cognac";
  const istZahl = typeof zahl === "number" && Number.isFinite(zahl);
  const inhalt = (
    <>
      <p className="bo-akzent__cap">{titel}</p>
      {text && <p className="bo-akzent__text">{text}</p>}
      <div className="mt-auto flex min-w-0 items-end justify-between gap-3 pt-8">
        <p className="bo-akzent__zahl min-w-0 truncate">
          {istZahl ? <Zahl wert={zahl} format={format} kiosk={kiosk} hochzaehlen={!kiosk} /> : (zahl ?? "–")}
          {einheit && <span className="ml-1 text-[22px] tracking-[-0.01em] opacity-80">{einheit}</span>}
        </p>
        {href && <PfeilKnopf nurOptik hell={t === "cognac"} />}
      </div>
    </>
  );
  const klassen = cx("bo-kachel bo-akzent min-h-56", href && "bo-kachel--lift", className);
  if (href) {
    return (
      <Link href={href} className={klassen} data-ton={t} data-testid={testid} title={oeffnenLabel}>
        {inhalt}
      </Link>
    );
  }
  return (
    <div className={klassen} data-ton={t} data-testid={testid}>
      {inhalt}
    </div>
  );
}
