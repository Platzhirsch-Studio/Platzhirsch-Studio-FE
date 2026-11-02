"use client";
// Globaler Hinweis „Diese Seite gibt es nur auf Deutsch“ in der Sprache des
// Besuchers (Runde 4, P2 Sprache, gesamtwerk P1-1). Texte und Regeln:
// src/lib/arbeitsweise/langNotice.js (globalNotice, globalNoticeLang).
//
// Wann: /en|fr|it/<reine DE-Seite> leitet per 308 auf /de/<seite>?lang=<l>
// (src/lib/seo/deOnlyRedirects.cjs). Auf jeder deutschen Seite mit ?lang=en|
// fr|it steht dann oben in <main> genau EIN Hinweis in dieser Sprache. Seiten
// mit eigenem Hinweis (/de/arbeitsweise, /de/ezarri/**, /de/3d-ansicht/**,
// Arbeitsweise/LangNotice.js) bekommen keinen zweiten.
//
// Ohne Layout-Sprung (CLS 0): Das Server-HTML enthält nur einen leeren
// Platzhalter. Die drei Fassungen stehen als Daten im kleinen Inline-Skript
// direkt dahinter; es setzt beim Parsen – vor dem ersten Bild – die passende
// ein (wie Arbeitsweise/LangNotice.js). Rat 9,5 A18 (T6): früher standen alle
// drei Fassungen mit `hidden` im HTML jeder deutschen Seite und landeten so im
// Textindex und in Snippet-Kandidaten; jetzt ist dort kein fremdsprachiger
// Text mehr. Die Seiten bleiben statisch (kein searchParams im Layout). Nach
// der Hydratation übernimmt React: Die Sprache wird je Pfad einmal gemerkt,
// deshalb bleibt der Hinweis stehen, wenn eine Seite ihre Adresse danach
// selbst umschreibt (Bodensee-Licht schreibt den Lichtzustand per
// replaceState in die URL), und verschwindet beim Wechsel auf eine andere
// Seite ohne ?lang.
// role="status" + aria-live="polite": Screenreader lesen den Hinweis vor, ohne
// den Fokus zu verschieben. Jede Fassung trägt ihr eigenes lang-Attribut.
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { EN_TWINS, NOTICE_LANGS, OWN_NOTICE_PATH, globalNotice, globalNoticeLang } from "@/lib/arbeitsweise/langNotice";

// Merkt die Sprache zusätzlich als window.__phLang = { p: Pfad, l: Sprache }
// für die Cookie-Leiste (Cookies/cookiecomponent.js, consentLang): Sie kommt
// erst nach der Hydratation, und manche Seiten schreiben ihre Adresse vorher
// um (Bodensee-Licht) – dann fehlte ?lang schon.
const BOX = "border-b border-line bg-surface-band";
const ROW = "mx-auto flex w-full max-w-page flex-col gap-2 px-gutter py-4 text-small text-text sm:flex-row sm:items-center sm:justify-between sm:gap-6";
const LINK = "inline-flex min-h-11 shrink-0 items-center gap-2 font-medium underline underline-offset-4 hover:text-text-accent";
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Gleiches Markup wie die JSX-Fassung unten (das Skript setzt es vor der
// Hydratation ein, React ersetzt es danach durch dieselbe Ausgabe).
function noticeMarkup(l, pathname = "") {
  const n = globalNotice(l, pathname);
  return (
    `<div id="ph-gnotice-${l}" role="status" aria-live="polite" lang="${l}" hidden data-lang-notice="${l}" data-lang-notice-global="" class="${BOX}">` +
    `<div class="${ROW}"><p class="max-w-measure text-pretty"><strong class="font-medium">${esc(n.note)}</strong> ${esc(n.core)}</p>` +
    `<a href="${esc(n.href)}" hreflang="${esc(n.hrefLang)}" class="${LINK}">${esc(n.cta)} <span aria-hidden="true">→</span></a></div></div>`
  );
}
const MARKUP = Object.fromEntries(NOTICE_LANGS.map((l) => [l, noticeMarkup(l)]));
// Yacht team (31.10.2026): pages with an English version (EN_TWINS) get their own markup.
const TWIN_MARKUP = Object.fromEntries(Object.keys(EN_TWINS).map((p) => [p, Object.fromEntries(NOTICE_LANGS.map((l) => [l, noticeMarkup(l, p)]))]));

const REVEAL =
  "(function(){try{var p=location.pathname;if(!/^\\/de(?:\\/|$)/.test(p))return;" +
  'var l=new URLSearchParams(location.search).get("lang");if(!/^(en|fr|it)$/.test(l))return;' +
  `window.__phLang={p:p,l:l};if(${OWN_NOTICE_PATH.toString()}.test(p))return;` +
  `var m=${JSON.stringify(MARKUP).replace(/</g, "\\u003c")};` +
  `var tw=${JSON.stringify(TWIN_MARKUP).replace(/</g, "\\u003c")};var q=p.replace(/\\/+$/,"");if(tw[q])m=tw[q];` +
  'var s=document.getElementById("ph-gnotice-slot");if(!s)return;s.innerHTML=m[l];var e=s.firstChild;if(e)e.hidden=false}catch(e){}})()';

// Sprache je Pfad einmal lesen und merken (siehe oben: replaceState).
// Bei einer Client-Navigation rendert Next die neue Seite, bevor es die
// Adresse umschreibt: Passt window.location noch nicht zum neuen Pfad, gilt
// „kein Hinweis“ (Links tragen nie ?lang), ohne etwas zu merken.
let memo = { path: null, lang: null };
function readLang(pathname) {
  const { pathname: current, search } = window.location;
  if (current !== pathname) return null;
  if (memo.path !== pathname) memo = { path: pathname, lang: globalNoticeLang(pathname, search) };
  return memo.lang;
}
const noSubscribe = () => () => {};
const serverLang = () => undefined;
// true nur im Server-Render und in der Hydratation (Skript-Tag nie im Client neu anlegen).
const isServerPass = () => true;
const isClientPass = () => false;

export default function GermanOnlyNotice() {
  const pathname = usePathname() || "";
  // Server/Hydratation: undefined (leerer Platzhalter, das Skript entscheidet).
  // usePathname im Schlüssel: neuer Pfad → neu lesen.
  const lang = useSyncExternalStore(noSubscribe, () => readLang(pathname), serverLang);
  const ssr = useSyncExternalStore(noSubscribe, isClientPass, isServerPass);
  // Nur deutsche Seiten (gleich in Server-Render und Hydratation).
  if (!/^\/de(?:\/|$)/.test(pathname)) return null;

  // Server-Render und Hydratation: leerer Platzhalter (das Skript füllt ihn,
  // React lässt den Inhalt dabei unberührt).
  if (lang === undefined || ssr) {
    return (
      <>
        <div id="ph-gnotice-slot" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
        {ssr && <script dangerouslySetInnerHTML={{ __html: REVEAL }} />}
      </>
    );
  }
  if (!lang) return null;
  const l = lang;
  const n = globalNotice(l, pathname);
  return (
    <div
      id={`ph-gnotice-${l}`}
      role="status"
      aria-live="polite"
      lang={l}
      hidden={lang !== l}
      data-lang-notice={l}
      data-lang-notice-global=""
      suppressHydrationWarning
      className={BOX}
    >
      <div className={ROW}>
        <p className="max-w-measure text-pretty">
          <strong className="font-medium">{n.note}</strong> {n.core}
        </p>
        <a href={n.href} hrefLang={n.hrefLang} className={LINK}>
          {n.cta} <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
