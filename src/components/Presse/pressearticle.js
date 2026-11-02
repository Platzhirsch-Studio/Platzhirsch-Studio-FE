import { useTranslations } from "next-intl";
import { Eyebrow, Heading, Section } from "@/components/ui";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { softHyphens } from "@/components/UberUns/softHyphens";

// Press clippings as a text list (Rat 9,5 B5, QA Recht −0,4).
// The former page showed 17 scans of magazine pages and covers. The rights
// lie with the publishers (§ 86 UrhG), none is documented in
// Marktresearch/recht/bildrechte.csv (freigabe "offen"), so the scans are no
// longer shown – only the article titles, plus medium and issue where they
// can be read on the scan itself (masthead and issue line). Nothing is
// guessed: where the scan shows no masthead or date, the line stays empty.
// Origin of each article: the owner confirms (Auftrag in
// qa-screenshots/umsetzung95/t5.md). The files stay in public/Images/Presse
// as evidence for that check; no page references them any more.
export const PRESS_ARTICLES = Object.freeze([
  { title: "New Collections", medium: "Vorarlbergerin", issue: "März/April 2023", scan: "mag1.jpg" },
  { title: "Auf Wolken gebettet", medium: "wd", scan: "mag2.jpg" },
  { title: "Home of Minotti", medium: "LUST", scan: "mag3.jpg" },
  { title: "Minotti 2022 Collection", medium: "Vorarlbergerin", issue: "2022", scan: "mag4.jpg" },
  { title: "Schlafen auf Treca Paris", medium: "Vorarlbergerin", issue: "September/Oktober 2022", scan: "mag5.jpg" },
  { title: "Küchenkultur für Jahre", medium: "wd", scan: "mag6.jpg" },
  { title: "Für ein schönes Zuhause", medium: "LUST", scan: "mag7.jpg" },
  { title: "Design Ton in Ton", medium: "Vorarlbergerin", scan: "mag8.jpg" },
  { title: "Cooler Outdoor-Style", scan: "mag9.jpg" },
  { title: "Mehr als nur Möbel", scan: "mag10.jpg" },
  { title: "Indoor & Outdoor", medium: "Vorarlbergerin", issue: "Mai/Juni 2021", scan: "mag11.jpg" },
  { title: "Talk: Susanne Messmer", scan: "mag12.jpg" },
  { title: "Die individuelle Küche", scan: "mag12.jpg" },
  { title: "Die Platzhirsch(in)", scan: "mag13.jpg" },
  { title: "Stilvolles Kochen", scan: "mag14.jpeg" },
  { title: "In Sommerlaune", scan: "mag14.jpeg" },
  { title: "Neueröffnung: Platzhirsch Home Living", scan: "mag16.jpg" },
]);

// QM wm-fix3: the flat list looked unfinished – a lone "wd" or "LUST" as a
// source line, and many rows without any. The clippings are now grouped by
// the magazine as it reads on the masthead (nothing renamed, nothing
// guessed); clippings without a legible masthead form the last group, with
// one sentence saying why the line is empty instead of a blank per row.
const OTHER = {
  de: { title: "Weitere Beiträge", note: "Auf diesen Ausschnitten sind Magazin und Ausgabe nicht lesbar." },
  en: { title: "Further articles", note: "Magazine and issue cannot be read on these clippings." },
  fr: { title: "Autres articles", note: "Le magazine et le numéro ne sont pas lisibles sur ces extraits." },
  it: { title: "Altri articoli", note: "Su questi ritagli rivista e numero non sono leggibili." },
};

// QM wm-r4: brand names in their own spelling (the magazine set „Treca“).
const BRAND_SPELLING = [[/\bTreca\b/g, "Tréca"]];
export function brandSpelling(text) {
  return BRAND_SPELLING.reduce((t, [re, to]) => t.replace(re, to), String(text ?? ""));
}

/** [{ medium|null, items: [{title, issue}] }] – media in order of first appearance, unknown last. */
export function groupPressArticles(articles, titles = []) {
  const groups = new Map();
  articles.forEach((a, i) => {
    const key = a.medium || null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ title: brandSpelling(titles[i] || a.title), issue: a.issue || "", key: `${a.scan}-${i}` });
  });
  const known = [...groups].filter(([m]) => m).map(([medium, items]) => ({ medium, items }));
  return groups.has(null) ? [...known, { medium: null, items: groups.get(null) }] : known;
}

const PresseArticle = () => {
  const legacy = useTranslations("presse");
  const { t, locale } = useInhalt("press");
  const titles = legacy.has("magazines") ? legacy.raw("magazines") : [];
  const other = OTHER[locale] || OTHER.de;

  return (
    <Section labelledBy="press-archive">
      <div className="max-w-text">
        <Eyebrow className="mb-stack-s">{softHyphens(t("archiveEyebrow"))}</Eyebrow>
        <Heading id="press-archive" level={2}>
          {t("archiveTitle")}
        </Heading>
        <p className="mt-stack-m max-w-measure text-body text-text-soft">{softHyphens(t("archiveText"))}</p>
      </div>

      {/* QM wm-r4: two balanced CSS columns instead of grid rows – beside the
          long "Weitere Beiträge" group a big hole stayed under LUST/wd. */}
      <div className="mt-12 gap-x-grid md:columns-2 lg:mt-16" data-press-list="">
        {groupPressArticles(PRESS_ARTICLES, titles).map((group) => (
          <section key={group.medium || "other"} aria-label={group.medium || other.title} className="mb-12 break-inside-avoid border-t border-line-strong pt-5">
            <h3 className={group.medium ? "font-display text-display-m text-text" : "text-title text-text"} lang={group.medium ? "de" : undefined}>
              {group.medium || other.title}
            </h3>
            {!group.medium && <p className="mt-2 max-w-measure text-small text-text-soft">{other.note}</p>}
            <ul className="mt-4 border-t border-line">
              {group.items.map((item) => (
                // QM wm-r4: the issue always under the title (it stood beside short
                // titles and below long ones).
                <li key={item.key} className="flex flex-col gap-1 border-b border-line py-4">
                  <p className="text-title text-text">{item.title}</p>
                  {item.issue && (
                    <p className="tabular text-small text-text-soft" lang="de">
                      {item.issue}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Section>
  );
};

export default PresseArticle;
