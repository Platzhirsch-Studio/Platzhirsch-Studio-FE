// src/components/Katalog/AusgewaehlteProdukte.js
// Abschnitt „Ausgewählte Produkte“ für die Weltseiten (/bad-wellness, später
// /kuechengeraete): wenige Kacheln aus dem Katalog (zentral: AUSGEWAEHLT in lib/katalog/index.js) und
// ein Link zur Übersicht. Rendert nichts, solange die Welt keine Produkte hat.
import { useTranslations } from "next-intl";
import { Eyebrow, Heading, LinkArrow, Section } from "@/components/ui";
import { KATALOG_MARKEN, ausgewaehlteProdukte } from "@/lib/katalog";
import { produktePath } from "@/lib/katalog/welten";
import ProduktKachel from "./ProduktKachel";

/**
 * @param {{locale: string, welt: "bad-wellness"|"kuechengeraete", tone?: string, n?: number}} props
 */
export default function AusgewaehlteProdukte({ locale, welt, tone = "surface", n = 4 }) {
  const t = useTranslations("katalog");
  const list = ausgewaehlteProdukte(welt, n);
  if (!list.length) return null;
  const nameOf = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;
  const id = `kat-ausgewaehlt-${welt}`;
  return (
    <Section tone={tone} spacing="compact" labelledBy={id} data-kat-ausgewaehlt={welt}>
      <div className="max-w-text">
        <Eyebrow>{t("ausgewaehlt.eyebrow")}</Eyebrow>
        <Heading id={id} level={2} className="mt-stack-s">
          {t("ausgewaehlt.title")}
        </Heading>
      </div>
      <ul className="mt-10 grid grid-cols-1 gap-x-grid gap-y-8 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-4">
        {list.map((p, i) => (
          <ProduktKachel key={p.slug} p={p} index={i} spalten={4} markeName={nameOf(p.marke)} locale={locale} t={t} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" />
        ))}
      </ul>
      <LinkArrow href={produktePath(welt)} className="mt-6" data-kat-alle={welt}>
        {t("ausgewaehlt.alle")}
      </LinkArrow>
    </Section>
  );
}
