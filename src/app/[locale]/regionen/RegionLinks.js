// Querverweise unter einer Regionsseite (Rat 9,5 B15, T6): zwei bis drei
// Nachbarorte, der passende Ratgeber, Küche, Hotel & Objekt und der
// Regionen-Hub. Nur Seiten, die index, follow sind (src/lib/seo/regionen.js).
// Eigene Section nach dem Seiteninhalt; das Layout der Regionsseiten selbst
// kommt aus src/components/Landing (T3).
// AP-11 (SEO-Team A, 31.10.2026): jede Orts- und Themenseite verlinkt das
// Minotti Studio, die Küche, Bad & Wellness, die Arbeitsweise und den
// Regionen-Hub – Ankertexte mit dem Suchbegriff statt „mehr“. Themenseiten
// (Interior Design, Küchen, Wohnzimmer, Möbel Bodensee) nutzen dieselbe
// Section; dort stehen statt der Nachbarorte die ersten Regionsseiten.
import { Heading, LinkArrow } from "@/components/ui";
import { REGIONEN_PATH, REGION_GROUPS, neighbourRegions } from "@/lib/seo/regionen";
import { ROUTES } from "@/utils/routing";
import { ARROW_INLINE } from "@/components/Landing/parts";

const groupOf = (path) => REGION_GROUPS.find((g) => g.regions.some((r) => r.path === path));

export function regionLinks(path) {
  const group = groupOf(path);
  const neighbours = neighbourRegions(path, 3).map((r) => ({ href: r.path, label: `Designermöbel ${r.name}` }));
  const topics = [
    group?.guide || null,
    path === "/designermoebel-arlberg" ? { href: "/hotel-objekt", label: "Hotel & Objekt: Chalets und Hotels einrichten" } : null,
    { href: `${ROUTES.marken.de}/minotti`, label: "Minotti Studio in Lochau" },
    { href: "/kuechen-vorarlberg", label: "Küchenstudio in Vorarlberg" },
    { href: "/bad-wellness", label: "Bad & Wellness planen" },
    { href: "/arbeitsweise", label: "So arbeiten wir: Handzeichnung, Modell, 3D" },
    path !== "/designermoebel-arlberg" ? { href: "/hotel-objekt", label: "Hotel & Objekt" } : null,
    { href: REGIONEN_PATH, label: "Alle Regionen rund um den Bodensee" },
  ].filter((l) => l && l.href !== path);
  return { neighbours, topics, isRegion: Boolean(group) };
}

export default function RegionLinks({ path }) {
  const { neighbours, topics, isRegion } = regionLinks(path);
  if (!neighbours.length && !topics.length) return null;
  return (
    // QM R3: Gutter INNERHALB von max-w-page (wie ui/Container) – vorher lag der Block ab
    // 1600 px 80 px weiter links als alle anderen Sektionen (gross: x=240 statt 320).
    <section aria-labelledby="region-links-title" className="border-t border-line bg-surface py-12 lg:py-16">
      <div className="mx-auto grid w-full max-w-page gap-x-grid gap-y-8 px-gutter lg:grid-cols-12" data-region-links="">
        <Heading id="region-links-title" level={2} size="display-m" className="lg:col-span-4">
          Auch in Ihrer Nähe
        </Heading>
        <div className="grid gap-x-grid gap-y-8 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          {neighbours.length > 0 && (
            <div>
              <h3 className="text-small text-text-soft">{isRegion ? "Nachbarregionen" : "Regionen"}</h3>
              <ul className="mt-2">
                {neighbours.map((l) => (
                  <li key={l.href}>
                    <LinkArrow href={l.href} className={ARROW_INLINE}>
                      {l.label}
                    </LinkArrow>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="text-small text-text-soft">Passend dazu</h3>
            <ul className="mt-2">
              {topics.map((l) => (
                <li key={l.href}>
                  <LinkArrow href={l.href} className={ARROW_INLINE}>
                      {l.label}
                    </LinkArrow>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
