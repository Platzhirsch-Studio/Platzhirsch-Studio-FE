import { Container, LinkArrow, cx } from "@/components/ui";
import { navFeatures } from "@/components/Navbar/shellNav";

// Querverweise „Planen & Erleben“ auf Produkt- und Markenseiten (Inhaber-
// Entscheidung Nr. 9, Cross-Selling-Regeln in src/lib/crossSell.js). Ruhige
// Linkzeile mit Haarlinie, kein Knopf (die Seite hat ihren Primärknopf).
// Nur Deutsch (die Ziele sind deutsche Seiten). Server-Komponente.

/** Ist das Feature verlinkt (Schalter an, Seite ausgeliefert)? */
export function featureOn() {
  const ids = new Set(navFeatures().map((f) => f.id));
  return (id) => ids.has(id);
}

/**
 * @param {{id: string, href: string, label: string, text: string}[]} links
 * @param {string} [title]
 */
export default function PlanLinks({ links, title = "Planen & Erleben", className }) {
  if (!links?.length) return null;
  return (
    <Container className={cx("py-10 sm:py-12", className)}>
      <section aria-labelledby="plan-links-title" data-plan-links="" className="border-t border-line pt-6">
        <h2 id="plan-links-title" className="text-overline uppercase text-text-accent">
          {title}
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-x-grid gap-y-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {links.map((l) => (
            <li key={l.id} data-plan-link={l.id}>
              <LinkArrow href={l.href} locale="de">
                {l.label}
              </LinkArrow>
              <p className="mt-1 max-w-measure text-small text-text-soft">{l.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-measure text-small text-text-soft">
          Online starten – Harald Menghin zeichnet Ihr Konzept anschließend von Hand.
        </p>
        {/* QM wm-fix2: eigene Zeile – inline brach „Hand.“ allein um und der
            größere Link stand versetzt daneben (iPhone SE). */}
        <p className="mt-2">
          <LinkArrow href="/arbeitsweise" locale="de">
            So arbeiten wir
          </LinkArrow>
        </p>
      </section>
    </Container>
  );
}
