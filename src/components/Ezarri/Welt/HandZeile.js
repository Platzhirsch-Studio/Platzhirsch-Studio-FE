// Kern-USP-Zeile (Inhaber-Entscheidung Nr. 8) in der Sprache der Ezarri-Seite.
// Nur Englisch: Seiten zeigen auf Deutsch die gemeinsame HandBridge
// rein deutsch, nicht Datei dieses Teams). Englisch: dieselbe Zeile mit
// demselben Markup und englischem Text (Welle 2) – nur echtes Material als
// Haralds Arbeit, deshalb kein Bild. Server-Komponente, kein Client-JS.
import { useLocale } from "next-intl";
import { LinkArrow, cx } from "@/components/ui";
import HandBridge from "@/components/Reusable/HandBridge";
import { deLinkProps } from "@/lib/ezarri/deLinks";

// 01.11.2026: dieselbe Zeile auch fr/it (Text, aria-label, „So arbeiten wir“).
const TEXT = {
  en: { text: "Our process applies here too: we look at the site, Harald Menghin draws the concept by hand, then come 3D planning and a rendering.", label: "From hand drawing to rendering", arbeitsweise: "How we work" },
  fr: { text: "Ici aussi, notre méthode s’applique : nous venons voir le lieu, Harald Menghin dessine le concept à la main, puis viennent la planification 3D et le rendu.", label: "Du dessin à la main au rendu", arbeitsweise: "Notre façon de travailler" },
  it: { text: "Anche qui vale il nostro metodo: veniamo a vedere il luogo, Harald Menghin disegna il concept a mano, poi seguono la progettazione 3D e il rendering.", label: "Dal disegno a mano al rendering", arbeitsweise: "Come lavoriamo" },
};

/** @param {{links?: {href:string, label:string}[], className?: string}} props */
export default function HandZeile({ links = [], className }) {
  const locale = useLocale();
  const T = TEXT[locale];
  if (!T) return <HandBridge variant="feld" links={links} className={className} />;
  return (
    <aside aria-label={T.label} data-hand-bridge="feld" lang={locale} className={cx("mx-auto max-w-page px-gutter", className)}>
      <div className="max-w-text border-l-2 border-ink py-1 pl-4">
        <p className="max-w-measure text-body text-text">{T.text}</p>
        <p className="mt-2 flex flex-wrap gap-x-6">
          <LinkArrow href="/arbeitsweise">{T.arbeitsweise}</LinkArrow>
          {links.map((l) => (
            <LinkArrow key={l.href} href={l.href} {...deLinkProps(locale, l.href)}>
              {l.label}
            </LinkArrow>
          ))}
        </p>
      </div>
    </aside>
  );
}
