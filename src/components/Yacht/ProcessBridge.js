import { LinkArrow, cx } from "@/components/ui";

// English counterpart of src/components/Reusable/HandBridge.js (Kern-USP,
// Inhaber-Entscheidung Nr. 8) for the English pages of team EN-Yacht-Sofa
// (/en/yacht-interior, /en/sofaplaner). Same quiet line with a rule on the
// left, no picture (Harald's real material is still to come – no AI sketches).
// HandBridge itself stays German and untouched; German pages keep using it.
// Server component, no client JS. /arbeitsweise exists in all four languages.

const TEXTS = {
  en: {
    planer: "Start online – Harald Menghin then draws your concept by hand. Only after that do we plan in 3D and show you the room as a photorealistic rendering.",
    feld: "Our process applies here, too: we look at the place, Harald Menghin draws the concept by hand, then 3D planning and rendering follow.",
    label: "From hand drawing to rendering",
    link: "How we work",
  },
  // FR/IT (01.11.2026, /fr|it/yacht-interior). French spacing written directly (U+00A0 before ":").
  fr: {
    planer: "Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main. Ce n’est qu’après que nous planifions en 3D et vous montrons l’espace en rendu photoréaliste.",
    feld: "Notre méthode s’applique ici aussi : nous découvrons le lieu, Harald Menghin dessine le concept à la main, puis suivent la planification 3D et le rendu.",
    label: "Du dessin à la main au rendu",
    link: "Notre méthode",
  },
  it: {
    planer: "Iniziate online – poi Harald Menghin disegna a mano il vostro concept. Solo dopo progettiamo in 3D e vi mostriamo l’ambiente in un rendering fotorealistico.",
    feld: "Il nostro metodo vale anche qui: guardiamo il luogo, Harald Menghin disegna il concept a mano, poi seguono progettazione 3D e rendering.",
    label: "Dal disegno a mano al rendering",
    link: "Il nostro metodo",
  },
};

/**
 * @param {"en"|"fr"|"it"} [locale]
 * @param {"planer"|"feld"} [variant]
 * @param {{href: string, label: string, locale?: string}[]} [links]
 */
export default function ProcessBridge({ locale = "en", variant = "planer", links = [], className }) {
  const t = TEXTS[locale] || TEXTS.en;
  return (
    <aside aria-label={t.label} data-hand-bridge={variant} className={cx("mx-auto max-w-page px-gutter", className)}>
      <div className="max-w-text border-l-2 border-ink py-1 pl-4">
        <p className="max-w-measure text-body text-text">{t[variant] || t.planer}</p>
        <p className="mt-2 flex flex-wrap gap-x-6">
          <LinkArrow href="/arbeitsweise">{t.link}</LinkArrow>
          {links.map((l) => (
            <LinkArrow key={l.href} href={l.href} {...(l.locale ? { locale: l.locale, hrefLang: l.locale } : {})}>
              {l.label}
            </LinkArrow>
          ))}
        </p>
      </div>
    </aside>
  );
}
