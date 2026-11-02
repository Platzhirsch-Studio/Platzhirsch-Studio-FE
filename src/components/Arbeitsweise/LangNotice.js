// Hinweis in der Besuchersprache auf rein deutschen Seiten (R8, gesamtwerk
// P1-2, neuland P1-6). Texte: src/lib/arbeitsweise/langNotice.js.
//
// Zwei Wege, beide ohne Layout-Sprung (CLS 0):
//  - `lang` bekannt (Seite liest searchParams ohnehin, z. B. /de/3d-ansicht):
//    nur dieser Hinweis wird im Server-HTML gerendert;
//  - `lang` unbekannt (statische Seite oder Layout ohne searchParams, z. B.
//    /de/arbeitsweise, /de/ezarri/**): alle drei Fassungen stehen mit
//    `hidden` im HTML, ein kleines Inline-Skript direkt dahinter blendet beim
//    Parsen – vor dem ersten Bild – die passende ein. Die Seite bleibt
//    statisch (searchParams würde sie dynamisch machen).
// Jede Fassung trägt ihr eigenes lang-Attribut. Canonical bleibt DE.
// Server-Komponente, 0 KB Client-JS.
import { Container } from "@/components/ui";
import { NOTICE_LANGS, langNotice } from "@/lib/arbeitsweise/langNotice";

function Notice({ n, hidden }) {
  return (
    <aside id={`ph-lang-${n.lang}`} lang={n.lang} aria-label={n.label} hidden={hidden} data-lang-notice={n.lang} suppressHydrationWarning className="border-b border-line bg-surface-band">
      <Container className="flex flex-col gap-2 py-4 text-small text-text sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="max-w-measure text-pretty">
          <strong className="font-medium">{n.note}</strong> {n.core}
        </p>
        <a href={n.href} hrefLang={n.lang} className="inline-flex min-h-11 shrink-0 items-center gap-2 font-medium underline underline-offset-4 hover:text-text-accent">
          {n.cta}
          <span aria-hidden="true">→</span>
        </a>
      </Container>
    </aside>
  );
}

const REVEAL = `(function(){try{var l=new URLSearchParams(location.search).get("lang");if(/^(en|fr|it)$/.test(l)){var e=document.getElementById("ph-lang-"+l);if(e)e.hidden=false}}catch(e){}})()`;

/** @param {{page: "arbeitsweise"|"ezarri"|"3d-ansicht", lang?: string|null}} props */
export default function LangNotice({ page, lang }) {
  if (lang !== undefined) {
    const n = langNotice(page, lang);
    return n ? <Notice n={n} /> : null;
  }
  return (
    <>
      {NOTICE_LANGS.map((l) => (
        <Notice key={l} n={langNotice(page, l)} hidden />
      ))}
      <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
    </>
  );
}
