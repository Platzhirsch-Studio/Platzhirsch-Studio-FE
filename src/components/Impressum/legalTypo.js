// src/components/Impressum/legalTypo.js – QM content-legal r3: protected spaces
// the shared typoDe (ui/typo.js) does not set. Pure, relative imports only.
//   „(Art. 6 Abs. / 1 lit. b DSGVO)“, „§ 165 Abs. / 3 TKG“ – a citation keeps
//   each abbreviation with its number/letter;
//   „8,1 / Prozent“, „18 / Uhr“ – a number keeps its spelled-out unit;
//   „(V- / ZUG“, „E- / Mail“ – a one-letter prefix keeps its word (word joiner).
// The words stay exactly as written.
import { NBSP, typoDe } from "../ui/typo.js";

const WJ = "⁠";
const CITE_RE = /(^|[\s(])(Art\.|Abs\.|lit\.|Ziff\.|Nr\.|§§?)[ ](?=[\p{N}\p{L}])/gu;
const UNIT_WORD_RE = /(\p{N})[ ](Prozent|Uhr|Minuten|Stunden|Tage[n]?|Wochen|Monate[n]?|Jahre[n]?|Euro|Franken)(?![\p{L}])/gu;
const LETTER_PREFIX_RE = /(^|[^\p{L}])(\p{L})-(?=\p{L})/gu;
// QM content-legal r3: „Stand: 29. / Oktober 2026“ – a day keeps its month.
const DAY_MONTH_RE = /(^|[^\p{N}])(\d{1,2}\.)[ ](?=(?:Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(?![\p{L}]))/gu;

/** typoDe plus citations, spelled-out units, one-letter prefixes and „29. Oktober“. */
export function legalTypo(text) {
  if (typeof text !== "string" || !text) return text;
  return typoDe(text)
    .replace(CITE_RE, `$1$2${NBSP}`)
    .replace(UNIT_WORD_RE, `$1${NBSP}$2`)
    .replace(LETTER_PREFIX_RE, `$1$2-${WJ}`)
    .replace(DAY_MONTH_RE, `$1$2${NBSP}`);
}

/**
 * Applies `fn` to every string in a React tree (host and component elements
 * alike, through props.children). `isValidElement`/`cloneElement` are passed in
 * so this module stays free of imports for node --test.
 */
export function mapStrings(node, fn, react, depth = 0) {
  if (typeof node === "string") return fn(node);
  if (Array.isArray(node)) {
    // Items keep their key; an item without one gets its position (the array may
    // end up as a list child once inline-rendered parts are flattened).
    return node.map((n, i) => {
      const m = mapStrings(n, fn, react, depth);
      return react.isValidElement(m) && m.key == null ? react.cloneElement(m, { key: `lt${i}` }) : m;
    });
  }
  // Plain synchronous server components (the Abschnitt parts of the privacy
  // policy) are rendered inline so their text is reached too. Client references,
  // async components and class components stay untouched.
  if (react.isValidElement(node) && isPlainComponent(node.type) && depth < 6) {
    try {
      const out = node.type(node.props);
      if (!out || typeof out.then !== "function") {
        const mapped = mapStrings(out, fn, react, depth + 1);
        // Keep the element's key; static children are spread (no key warnings).
        return react.createElement ? react.createElement(react.Fragment, { key: node.key ?? undefined }, ...[].concat(mapped)) : mapped;
      }
    } catch {
      /* render it the normal way */
    }
    return node;
  }
  if (react.isValidElement(node) && node.props && node.props.children !== undefined) {
    return react.cloneElement(node, undefined, ...[].concat(mapStrings(node.props.children, fn, react, depth)));
  }
  return node;
}

const CLIENT_REF = Symbol.for("react.client.reference");
function isPlainComponent(type) {
  return (
    typeof type === "function" &&
    type.$$typeof !== CLIENT_REF &&
    !(type.prototype && type.prototype.isReactComponent) &&
    type.constructor && type.constructor.name === "Function"
  );
}
