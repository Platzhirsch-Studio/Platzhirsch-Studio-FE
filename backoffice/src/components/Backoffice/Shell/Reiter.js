"use client";
// Pillen-Reiter (G-26, Lounge § 6): Unterbereiche des aktiven Bereichs aus dem Register (navigationFuer,
// nach Rechten gefiltert) als Material-Kapsel; aktive Pille in Tinte gleitet mit Feder (useGleiter).
// Höchstens 6 sichtbar, der Rest unter „Mehr“ (Q-B3); Telefon: waagrecht scrollbar.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGleiter } from "../motion";
import { Menue, MenuePunkt } from "../Overlay/Popover";
import { Icon } from "../icons";
import cx from "../cx";
import { anzeige } from "@/lib/backoffice/labels";
import { aktiveNavigation, teileReiter } from "./navigation";
import { TEXTE } from "./texte";

export default function Reiter({ bereiche }) {
  const pfad = usePathname();
  const { bereich, eintrag } = aktiveNavigation(bereiche, pfad);
  const b = bereiche.find((x) => x.slug === bereich);
  const navigation = b?.navigation || [];
  const { sichtbar, mehr } = teileReiter(navigation, eintrag);
  const { ref, indikator } = useGleiter(`${bereich}:${eintrag}`, { selektor: '[aria-current="page"]' });
  if (navigation.length < 2) return <span className="bo-schale-reiter-platz" aria-hidden="true" />;
  const mehrAktiv = mehr.some((n) => n.href === eintrag);
  return (
    <nav className="bo-schale-reiter" aria-label={b ? `${TEXTE.reiter} ${b.titel}` : TEXTE.reiter} data-testid="reiter">
      <ul ref={ref} className="bo-schale-reiter__liste">
        {indikator && <li role="presentation" {...indikator} className={cx(indikator.className, "bo-schale-reiter__ind")} />}
        {sichtbar.map((n) => {
          const an = n.href === eintrag;
          return (
            <li key={n.href}>
              <Link href={n.href} className={cx("bo-schale-reiter__i", an && "is-an", an && !indikator && "is-flaeche")} aria-current={an ? "page" : undefined}>
                {anzeige(n.titel)}
              </Link>
            </li>
          );
        })}
        {mehr.length > 0 && (
          <li>
            <Menue
              label={TEXTE.reiterMehr}
              platzierung="unten-ende"
              ausloeser={(p) => (
                <button {...p} type="button" className={cx("bo-schale-reiter__i", mehrAktiv && "is-an is-flaeche")}>
                  {TEXTE.reiterMehr}
                  <Icon name="ChevronDown" className="size-3.5" />
                </button>
              )}
            >
              {mehr.map((n) => (
                <MenuePunkt key={n.href} href={n.href} gewaehlt={n.href === eintrag}>
                  {anzeige(n.titel)}
                </MenuePunkt>
              ))}
            </Menue>
          </li>
        )}
      </ul>
    </nav>
  );
}
