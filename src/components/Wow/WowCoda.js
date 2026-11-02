import { LinkArrow } from "@/components/ui";
import { codaLabel, codaTarget, wowMessages } from "@/lib/wow/messages";
import { TIMELINE } from "@/lib/wow/timeline";
import s from "./Pause.module.css";

// Closing line of the "Pause" hero for PHONES (push r3, luxus-cd #5 Peak-End,
// Wächter #4): "Erst die Linie. Dann Ihr Raum." in the display serif, right
// under "Termin wählen". It cannot sit in the stage on phones: stage + H1 +
// "Termin wählen" must end above 500 px (iPhone 659 px high with the cookie
// banner, Wächter #3). From 640 px the line stands in the stage caption
// (WowStage) and the USP in the hero lead; this block is display: none there,
// so a screen reader meets each once.
// Runde 2, Fix-Team P2 (ux P1-7 / P2-5): one block instead of three levels –
// the serif line, the Kern-USP sentence (Hero passes it) and the link to the
// process page "Unsere Arbeitsweise" (/de/arbeitsweise; outside DE marked
// "in German" with hreflang="de"). The image credit moved onto the photo
// (WowStage figcaption, small chip). Fades in by transform only (CLS 0, no
// opacity → contrast in every frame).
export default function WowCoda({ locale, usp }) {
  const t = wowMessages(locale);
  const coda = codaTarget(locale);
  return (
    <p className={`${s.codaPhone} px-gutter sm:hidden`} data-wow-coda="" style={{ "--w-coda": `${TIMELINE.outro[0]}ms` }}>
      <span className={s.codaText}>{t.coda.text}</span>
      {usp ? (
        <span className={s.codaUsp} data-hero-usp-phone="">
          {usp}
        </span>
      ) : null}
      <LinkArrow href={coda.href} locale={coda.locale} hrefLang={coda.germanOnly ? "de" : undefined}>
        {codaLabel(locale)}
      </LinkArrow>
    </p>
  );
}
