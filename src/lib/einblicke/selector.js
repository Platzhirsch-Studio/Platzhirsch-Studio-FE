// src/lib/einblicke/selector.js – stabiler Selektor eines Elements (Konzept §2.6).
//
// Reihenfolge, der erste Treffer gilt:
//   1. nächstes [data-eb="<schlüssel>"] (sprachneutral, gezielt gesetzt)
//   2. Landmarke (header, nav, main, aside, footer) › section#id bzw.
//      section[aria-labelledby] › Element-Tag mit Index im Abschnitt,
//      z. B. "main>#marken>a:3"
//   3. nie: Text, Klassen, href, Query
// Unter [data-eb-ignore] → null (nichts wird erfasst). Höchstens 80 Zeichen.
//
// ebSelector ist EINE in sich geschlossene Funktion (keine Importe, keine
// Variablen außerhalb): tools/einblicke/screenshots.mjs injiziert sie per
// `(${ebSelector})(el)` in die Seite, damit Manifest und Sammler denselben
// Selektor bilden.

/** Interaktive Elemente (Klick ist nicht „tot“). tabindex=-1 zählt nicht (main). */
export const INTERACTIVE =
  'a,button,input,select,textarea,label,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=menuitem],[onclick],[tabindex]:not([tabindex="-1"])';

/**
 * ebSelector(el)          → "main>#marken>a:3" | "hero" | null
 * ebSelector(el, "sec")   → Schlüssel des Abschnitts (Aufmerksamkeit), z. B. "main>#marken"
 * ebSelector(el, "pair")  → [selektor, Element der Box] | null
 */
export function ebSelector(el, mode) {
  var INTER =
    'a,button,input,select,textarea,label,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=menuitem],[onclick],[tabindex]:not([tabindex="-1"])';
  var ok = function (s) {
    return /^[A-Za-z][\w-]{0,39}$/.test(s || "") ? s : "";
  };
  if (el && el.nodeType !== 1) el = el.parentElement;
  if (!el || !el.closest || el.closest("[data-eb-ignore]")) return null;
  var svg = el.closest("svg");
  if (svg) el = svg;
  var root, base;
  var eb = el.closest("[data-eb]");
  var key = eb ? ok(eb.getAttribute("data-eb")) : "";
  if (key) {
    root = eb;
    base = key;
  } else {
    var lm = el.closest("header,nav,main,aside,footer");
    var name = lm ? lm.tagName.toLowerCase() : "body";
    var sec = el.closest("section");
    var sid = sec && (!lm || lm.contains(sec)) ? ok(sec.id) || ok(sec.getAttribute("aria-labelledby")) : "";
    if (sid) {
      root = sec;
      base = name + ">#" + sid;
    } else {
      root = lm || el.ownerDocument.body;
      base = name;
    }
  }
  if (mode === "sec") return base.slice(0, 80);
  var t = el.closest(INTER);
  if (t && t !== root && !root.contains(t)) t = null;
  // Nicht interaktiv: auf den nächsten Block (Überschrift, Absatz, Bild …)
  // heben, damit span/strong & Co. stabile, im Manifest auffindbare Ziele sind.
  if (!t) {
    var blk = el.closest("h1,h2,h3,h4,h5,h6,p,li,img,picture,figure,svg,video,blockquote,dt,dd,td,th");
    t = blk && (blk === root || root.contains(blk)) ? blk : el;
  }
  var sel = base;
  if (t !== root) {
    var tag = t.tagName.toLowerCase();
    var list = root.querySelectorAll(tag);
    var i = 0;
    while (i < list.length && list[i] !== t) i++;
    sel = base + ">" + tag + ":" + (i + 1);
  }
  sel = sel.slice(0, 80);
  return mode === "pair" ? [sel, t] : sel;
}
