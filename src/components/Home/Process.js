import { LinkArrow, Section } from "@/components/ui";
import SectionIntro from "./SectionIntro";
import Picto from "./Pictos";
import { f1Copy, getHomeT } from "./copy";
import { SECTION_Y } from "./row";
import { MEDIA } from "@/lib/arbeitsweise/media";
import { WOW_PHASE } from "@/lib/wow/config";
import h from "./home.module.css";
// Tempo (Startseite, Lighthouse mobil): the sketch slot comes through a lazy
// client boundary, see ProcessSketch.js (−4.4 KB gzip in the /de page chunk).
import ProcessSketch from "./ProcessSketch";

// USP-Kapitel der Startseite (Inhaber-Entscheidung Nr. 8, USP-
// Durchdringungsplan 1.1): „Von Hand gezeichnet, bevor es digital wird.“ –
// die sieben Schritte Kennenlernen · Vor Ort · Handzeichnung · Modell ·
// 3D-Planung · Rendering · Umsetzung. Helles Band direkt vor „Haus & Café“
// (das eine Walnut-Kapitel bleibt dort, Jury §3.3).
// R5-USP (gesamtwerk P0-1/P1-2, neuland P1-1, bewusst geändert): bis Haralds
// echtes Material da ist, steht hier KEIN Bild mehr. Die Liniengrafik des
// Showrooms (früher LineStudy mit „keine Handzeichnung“ direkt unter der
// Hand-Headline) widerlegte das Kapitel und war die zweite Sessel-Grafik der
// Seite. Stattdessen eine eigenständige Typo-Komposition „Papier. Modell.
// Raum.“ mit dem Satz „Designs, die leben.“ – nichts davon wird als Haralds
// Arbeit ausgegeben. Der ehrliche Hinweis, was die Linie im Einstiegsbild ist,
// steht einmal klein im Fuß des Kapitels (f1Copy.lineNote).
// Sobald MEDIA.handzeichnung echt eingetragen ist (oder WOW_PHASE "B" gilt und
// ein Scan vorliegt), zeigt das Kapitel den Scan mit seiner Credit-Zeile.
// Schritttexte in text-ui (16 px); eine Nummerierung (die sichtbare Zahl ist
// aria-hidden, die Liste zählt für Screenreader). Server-Komponente, kein JS.
// Texte: HomePage.process.* in allen vier Sprachen; der Link führt auf
// /<locale>/arbeitsweise in der Besuchersprache (R5-fix P2: die Seite ist
// mehrsprachig, kein „(in tedesco)“ mehr – process.link statt process.linkGerman).

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];

// QM shell-home r5 (iPhone SE, 200 % text): "Handzeichnung" was 7–20 px wider
// than its step column. Long compound step names get a soft hyphen at the
// word joint – a visible hyphen only where the name must break.
const SOFT_STEP = { Handzeichnung: "Hand\u00adzeichnung", Kennenlernen: "Kennen\u00adlernen", Realizzazione: "Realizza\u00adzione" };
const softStep = (name) => SOFT_STEP[name] || name;

/** Real sketch for the chapter, or null while media.js is empty (phase A). */
export function processSketch(media = MEDIA, phase = WOW_PHASE) {
  const allEmpty = Object.values(media).every((v) => v == null);
  if (allEmpty && phase === "A") return null;
  return media.handzeichnung?.src ? media.handzeichnung : null;
}

function TypeComposition({ c, className }) {
  const p = c.processType;
  return (
    <div className={`${h.processType} ${className || ""}`} data-process-type="">
      {/* One line on phones, three stacked words from lg. Read once as a phrase. */}
      <p className="font-display-italic text-display-m leading-[1.05] text-text lg:text-display-l">
        <span className="lg:block">{p.a}</span> <span className="lg:block">{p.b}</span> <span className="lg:block">{p.c}</span>
      </p>
      <span aria-hidden="true" className={h.processRule} />
      <p className="text-ui text-text-soft">{p.line}</p>
    </div>
  );
}

export default async function Process({ locale }) {
  const t = await getHomeT(locale);
  const c = f1Copy(locale);
  const sketch = processSketch();
  return (
    <Section tone="band" labelledBy="home-process-title" spacing="none" className={SECTION_Y} data-home-process="">
      <SectionIntro
        id="home-process-title"
        eyebrow={t("process.eyebrow")}
        title={t("process.title")}
        lead={<span className="max-sm:sr-only">{t("process.lead")}</span>}
        aside={
          <LinkArrow href="/arbeitsweise" locale={locale}>
            {t("process.link")}
          </LinkArrow>
        }
      />
      <div className="mt-6 grid grid-cols-1 gap-y-6 sm:mt-12 lg:mt-12 lg:grid-cols-12 lg:gap-x-grid">
        {sketch ? (
          <ProcessSketch slot={sketch}locale={locale} kind="" ratio="3/2" sizes="(min-width: 1024px) 38vw, 100vw" className="lg:col-span-5 lg:self-start" />
        ) : (
          <TypeComposition c={c} className="lg:col-span-5 lg:self-start" />
        )}
        {/* Phones: icon + name in two columns (page length, R3); the short
            sentences from 640 px in text-ui. */}
        {/* QM shell-home r3 (200 % text): the two step columns follow a
            container query in rem (home.module.css .steps) – with enlarged
            text they become one column instead of names running into the
            neighbouring pictogram. */}
        <div className={`${h.stepsWrap} lg:col-span-7 lg:col-start-6`}>
        <ol
          className={`${h.steps} gap-x-4 gap-y-3 sm:gap-x-grid sm:gap-y-0 sm:border-t sm:border-line-strong`}
          role="list"
        >
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 sm:items-start sm:gap-4 sm:border-b sm:border-line sm:py-4">
              <Picto name={s} className="size-9 shrink-0 text-text-accent sm:size-12" />
              <div className="min-w-0">
                <h3 className="text-ui font-medium text-text">
                  <span className="mr-2 tabular-nums text-text-soft max-sm:hidden" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {softStep(t(`process.steps.${s}.name`))}
                </h3>
                <p className="mt-1 hidden text-ui text-text-soft sm:block">{t(`process.steps.${s}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
        </div>
      </div>
      {/* Chapter footer: what the line in the opening image is – once, quietly. */}
      {!sketch && <p className="mt-6 max-w-measure text-small text-text-soft sm:mt-10" data-line-note="">{c.lineNote}</p>}
    </Section>
  );
}
