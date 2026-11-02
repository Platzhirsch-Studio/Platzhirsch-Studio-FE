// Händler-Zeile + „Termin anfragen“ direkt unter der H1 der Ezarri-Seiten
// (Runde 4 P5, ux P1-4a): auf dem iPhone (393 × 852, mit Cookie-Leiste) im
// ersten Bildschirm, über der Leiste. Server-Komponente, kein JS.
//
// Die Händler-Aussage kommt aus dem Claim-Register (dealerTitleWord() →
// „Vertragshändler“, Inhaber-Entscheidung Nr. 7); solange sie nicht sichtbar
// sein darf, steht die neutrale Zeile da. Ziel: /beratung?thema=ezarri
// (Wizard startet beim Thema Ezarri, src/lib/forms/beratungContext.js).
import { useLocale } from "next-intl";
import { Button } from "@/components/ui";
import { ezCopy, ezLang, ezT } from "@/lib/ezarri/lang";

export const TERMIN_HREF = Object.freeze({ ezarri: "/beratung?thema=ezarri", outdoor: "/beratung?thema=outdoor" });
// Englische Beratungsseite (src/utils/routing.js: beratung → consultation).
export const TERMIN_HREF_EN = Object.freeze({ ezarri: "/consultation?thema=ezarri", outdoor: "/consultation?thema=outdoor" });
// 01.11.2026: französische und italienische Beratungsseite (beratung → conseil / consulenza).
export const TERMIN_HREF_FR = Object.freeze({ ezarri: "/conseil?thema=ezarri", outdoor: "/conseil?thema=outdoor" });
export const TERMIN_HREF_IT = Object.freeze({ ezarri: "/consulenza?thema=ezarri", outdoor: "/consulenza?thema=outdoor" });
const TERMIN_HREFS = { de: TERMIN_HREF, en: TERMIN_HREF_EN, fr: TERMIN_HREF_FR, it: TERMIN_HREF_IT };

/** „Vertragshändler für Ezarri · Showroom Lochau“ oder die neutrale Zeile. */
export function haendlerZeile(locale = "de") {
  const { dealerTitleWord, NEUTRAL_CLAIM } = ezCopy(locale);
  const word = dealerTitleWord();
  if (!word) return NEUTRAL_CLAIM;
  return ezT(locale)(
    `${word} für Ezarri · Muster und Beratung in Lochau`,
    `Ezarri ${word} · samples and advice in Lochau`,
    `${word[0].toUpperCase()}${word.slice(1)} Ezarri · échantillons et conseil à Lochau`,
    `${word[0].toUpperCase()}${word.slice(1)} Ezarri · campioni e consulenza a Lochau`
  );
}

// textClassName: z. B. "lg:hidden", wenn die Seite die volle Händler-Aussage ab lg daneben zeigt.
// children: Design-Jury P2-21 – ein zweiter Inhaltsweg als Textlink in DERSELBEN
// Zeile wie „Termin anfragen“ (statt eines versetzten zweiten Knopfs).
export default function TerminZeile({ thema = "ezarri", className = "", textClassName = "", children = null }) {
  const locale = useLocale();
  const hrefs = TERMIN_HREFS[ezLang(locale)];
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 ${className}`} data-ezarri-termin="">
      <p className={`text-ui text-text ${textClassName}`} data-ezarri-dealer="kopf">
        {haendlerZeile(locale)}
      </p>
      <Button href={hrefs[thema] || hrefs.ezarri} arrow className="self-start">
        {ezT(locale)("Termin anfragen", "Request an appointment", "Demander un rendez-vous", "Richiedere un appuntamento")}
      </Button>
      {children}
    </div>
  );
}
