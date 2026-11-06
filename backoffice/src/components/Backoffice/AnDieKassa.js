// G-19 `AnDieKassa` (Team P0-5c, Q-C8): Bar, Karte und Gutschein-Verkauf gibt es nur an der Kassa. Jede andere Stelle
// (Shop, Faktura, Logistik, Projekte, Service) zeigt statt eines Bargeld-Felds diese Zeile:
//   [Beleg-Symbol] Bar oder Karte? An der Kassa kassieren →
// Der Link öffnet /kassa?kunde=&beleg= – nur mit Recht auf den Kassa-Arbeitsplatz, sonst nur der Text
// („Das erledigt die Kassa.“). Server- und Client-tauglich (keine Effekte): auf Server-Seiten `session` übergeben,
// in Client-Komponenten `darf` (vom Server berechnet mit darfAnDieKassa(session)).
//
//   <AnDieKassa session={session} kunde="KT-2026-00012" beleg="RE-2026-00042" />
//   <AnDieKassa variante="erstattung" darf={darfKassa} kunde={…} beleg={gutschrift} />
//   <AnDieKassa variante="gutschein" darf={darfKassa} flaeche />

import Link from "next/link";
import cx from "./cx";
import { Icon } from "./icons";
import { erlaubteArbeitsplaetze } from "@/lib/backoffice/auth/rechte";
import { KASSA_TEXTE as T } from "./Informieren/texte";
import { KASSA_VARIANTEN, kassaHref } from "./Informieren/logik";

export { KASSA_VARIANTEN, kassaHref };

const ICON = { zahlung: "Receipt", erstattung: "RotateCcw", gutschein: "Gift" };

/** Darf die Sitzung den Kassa-Arbeitsplatz öffnen? (gleiche Regel wie /arbeitsplatz) */
export function darfAnDieKassa(session) {
  return erlaubteArbeitsplaetze(session).some((a) => a.slug === "kassa");
}

/**
 * @param {object} p
 * @param {"zahlung"|"erstattung"|"gutschein"} [p.variante]
 * @param {string} [p.kunde]       PH Kontakt-Name
 * @param {string} [p.beleg]       Belegnummer (Rechnung, AB, Gutschrift, Bestellung)
 * @param {object} [p.session]     Server: Recht wird hier geprüft
 * @param {boolean} [p.darf]       Client: Ergebnis von darfAnDieKassa(session)
 * @param {boolean} [p.flaeche]    als eingelassene Zeile (in Kacheln/Sheets), sonst schlichte Zeile
 */
export default function AnDieKassa({ variante = "zahlung", kunde, beleg, session, darf, flaeche = false, className, testid = "an-die-kassa" }) {
  const v = KASSA_VARIANTEN.includes(variante) ? variante : "zahlung";
  const t = T[v];
  const mitLink = typeof darf === "boolean" ? darf : session ? darfAnDieKassa(session) : false;
  return (
    <p
      className={cx("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[18px]", flaeche && "rounded-bo-zeile bg-bo-fill px-3 py-2.5", className)}
      data-testid={testid}
      data-variante={v}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-bo-surface text-bo-text-soft shadow-(--bo-sh-btn)" aria-hidden="true">
        <Icon name={ICON[v]} className="size-3.5" />
      </span>
      <span className="text-bo-text-soft">{t.frage}</span>
      {mitLink ? (
        <Link
          href={kassaHref({ kunde, beleg, variante: v })}
          aria-label={T.label(t.aktion)}
          className="group inline-flex items-center gap-1 rounded-pill font-semibold text-bo-text focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none"
          data-testid={`${testid}-link`}
        >
          {t.aktion}
          <Icon name="ArrowRight" className="size-3.5 transition-transform duration-200 ease-(--ease-feder) group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <span className="text-bo-text-faint">{T.ohneRecht}</span>
      )}
    </p>
  );
}
