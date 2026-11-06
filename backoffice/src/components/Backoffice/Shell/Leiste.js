"use client";
// Schwebende Leiste (G-26, Lounge § 6): Material-Kapsel 72 breit, 16 vom Rand, Radius 36; oben das
// Bodoni-Monogramm „P“ in Tinte; Bereiche als 48-px-Kreise (lucide 20, Strich 1,75), aktiv = gefüllter
// Tinte-Kreis mit Schatten, Tooltip-Pille gleitet mit Feder ein; unten Hell/Dunkel + eigener Avatar
// (Benutzermenü). Strg+B bzw. ] zeigt die Bereichsnamen (Leiste 240 breit), [ blendet sie wieder aus.
// Telefon (< 768 px): schwebende Tab-Kapsel unten, waagrecht scrollbar.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../icons";
import cx from "../cx";
import { useLocalStorage } from "../useLocalStorage";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { aktiveNavigation } from "./navigation";
import BenutzerMenu from "./BenutzerMenu";
import { istDunkel, setzeThema } from "./Thema";
import { TEXTE } from "./texte";

export const BESCHRIFTET_SCHLUESSEL = "ph-bo-leiste-beschriftet";

/**
 * @param {{bereiche:Array<{slug:string,titel:string,icon:string,startseite:string,navigation:Array}>, benutzer:object}} props
 */
export default function Leiste({ bereiche, benutzer }) {
  const pfad = usePathname();
  const { bereich: aktiv } = aktiveNavigation(bereiche, pfad);
  const [beschriftet, setBeschriftet] = useLocalStorage(BESCHRIFTET_SCHLUESSEL, false);

  useKuerzel("global", {
    "global.seitenleiste": () => setBeschriftet(!beschriftet),
    "global.seitenleiste-zu": () => setBeschriftet(false),
    "global.seitenleiste-auf": () => setBeschriftet(true),
  });

  return (
    <nav id="bo-leiste" className="bo-schale-leiste bo-material" aria-label={TEXTE.leiste} data-beschriftet={beschriftet ? "true" : undefined} data-viele={bereiche.length > 9 ? "true" : undefined} data-testid="leiste">
      <Link href="/" className="bo-schale-leiste__logo" aria-label={TEXTE.markeLabel}>
        <span aria-hidden="true">P</span>
      </Link>
      <ul className="bo-schale-leiste__liste">
        {bereiche.map((b) => {
          const an = b.slug === aktiv;
          return (
            <li key={b.slug}>
              <Link href={b.startseite} className={cx("bo-schale-leiste__punkt", an && "is-an")} aria-current={an ? "page" : undefined} data-bereich={b.slug}>
                <Icon name={b.icon} className="size-5" />
                {/* Name als Inhalt (nicht aria-label): kompakt nur für Screenreader, beschriftet sichtbar */}
                <span className="bo-schale-leiste__name">{b.titel}</span>
                <span className="bo-schale-leiste__tip" aria-hidden="true">
                  {b.titel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="bo-schale-leiste__fuss">
        <button
          type="button"
          className="bo-schale-leiste__punkt bo-schale-leiste__klein"
          aria-label={beschriftet ? TEXTE.leisteKompakt : TEXTE.leisteBeschriften}
          aria-pressed={beschriftet}
          aria-keyshortcuts="Control+B"
          onClick={() => setBeschriftet(!beschriftet)}
        >
          <Icon name={beschriftet ? "ChevronLeft" : "ChevronRight"} className="size-4" />
          <span className="bo-schale-leiste__tip" aria-hidden="true">
            {beschriftet ? TEXTE.leisteKompakt : TEXTE.leisteBeschriften}
          </span>
        </button>
        <button type="button" className="bo-schale-leiste__punkt bo-schale-thema" aria-label={TEXTE.themaWechsel} onClick={() => setzeThema(istDunkel() ? "light" : "dark")} data-testid="thema-knopf">
          <span className="bo-schale-thema__mond">
            <Icon name="Moon" className="size-5" />
          </span>
          <span className="bo-schale-thema__sonne">
            <Icon name="Sun" className="size-5" />
          </span>
          <span className="bo-schale-leiste__tip" aria-hidden="true">
            {TEXTE.themaWechsel}
          </span>
        </button>
        <BenutzerMenu {...benutzer} />
      </div>
    </nav>
  );
}
