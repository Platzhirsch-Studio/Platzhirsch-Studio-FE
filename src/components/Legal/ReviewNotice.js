// ReviewNotice – review-source notice (Masterplan AP2 Nr. 6, UWG/Omnibus:
// consumers must be told whether and how reviews are checked).
//
//   variant "summary" (default): next to shown Google reviews (ReviewSummary,
//     AP6, from ~15 reviews): "Wir zeigen Google-Bewertungen. Google prüft
//     nicht, ob ein Kauf stattfand."
//   variant "link": on /bewerten, where no reviews are shown, only the link to
//     Google – same fact, worded for the person who writes the review.
//
// Texts: namespace "ReviewNotice" in src/messages/*.json (merged from
// Marktresearch/digital/teamleiter/messages-r4-recht.json in round 5 by
// R5-i18n). REVIEW_NOTICE_FALLBACK is the same wording; it stays only because
// tests/unit/r4-recht.test.mjs (other owner) checks the component source for
// the texts – at runtime the messages always win (t.has). Remove it together
// with that test step. Works in server and client components (no state).
import { useLocale, useTranslations } from "next-intl";
import { cx } from "@/components/ui";

export const REVIEW_NOTICE_FALLBACK = {
  de: {
    label: "Hinweis zu Bewertungen",
    summary: "Wir zeigen Google-Bewertungen. Google prüft nicht, ob ein Kauf stattfand.",
    link: "Bewertungen erscheinen öffentlich auf Google. Google prüft nicht, ob ein Kauf stattfand. Für eine Bewertung gibt es von uns keine Gegenleistung.",
  },
  en: {
    label: "About reviews",
    summary: "We show Google reviews. Google does not check whether a purchase took place.",
    link: "Reviews appear publicly on Google. Google does not check whether a purchase took place. We offer nothing in return for a review.",
  },
  fr: {
    label: "À propos des avis",
    summary: "Nous affichons des avis Google. Google ne vérifie pas si un achat a eu lieu.",
    link: "Les avis sont publiés sur Google. Google ne vérifie pas si un achat a eu lieu. Nous n’offrons aucune contrepartie pour un avis.",
  },
  it: {
    label: "Nota sulle recensioni",
    summary: "Mostriamo recensioni Google. Google non verifica se è avvenuto un acquisto.",
    link: "Le recensioni sono pubblicate su Google. Google non verifica se è avvenuto un acquisto. Non offriamo nulla in cambio di una recensione.",
  },
};

export default function ReviewNotice({ variant = "summary", id, className }) {
  const locale = useLocale();
  const t = useTranslations();
  const fallback = REVIEW_NOTICE_FALLBACK[locale] || REVIEW_NOTICE_FALLBACK.de;
  const text = (key) => (t.has(`ReviewNotice.${key}`) ? t(`ReviewNotice.${key}`) : fallback[key]);
  const body = variant === "link" ? "link" : "summary";

  return (
    <p id={id} data-review-notice={body} className={cx("max-w-measure text-small text-text-soft", className)}>
      <span className="font-medium text-text">{text("label")}:</span> {text(body)}
    </p>
  );
}
