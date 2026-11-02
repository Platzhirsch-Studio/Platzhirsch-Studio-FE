// Editorial safety net for the Ratgeber: nothing that is still under review
// ever reaches the page.
//
// 1. Internal sections at the end of an article (link lists, image ideas,
//    "Prüfvermerk", "Redaktion: …") are cut off completely, as are HTML
//    comments (handled in markdown.js).
// 2. Review markers – "[prüfen]", "[prüfen: …]", "[Freigabe …]",
//    "[Quelle ergänzen …]", "[Name, Funktion]", "[… eintragen]" – remove the
//    unit they sit in:
//      – a marker at the start of a paragraph or list item → the whole block
//      – a marker standing alone directly under a heading → the whole section
//      – a marker in a heading → the whole section
//      – a marker in a table row → the row (in the header → the table)
//      – otherwise → the sentence it belongs to (a marker right after a
//        sentence end belongs to that preceding sentence)
// 3. Embargo terms (EMBARGO_RE: the Binni cooperation, not agreed yet, see
//    Bericht 26) count as markers wherever they appear: the sentence, list
//    item, table row or the whole FAQ item goes, even without "[prüfen]".
// 4. A final guard drops any block that still contains a marker.
// Pure module (no "@/", no "server-only"), unit-tested with node --test.

// Headings (any level) and paragraph starts that open the internal part.
const INTERNAL_HEADING =
  /^(?:redaktion\b|prüfvermerk|pruefvermerk|interne?\s+link|bildvorschl|prüfliste|pruefliste|faktencheck|lektorat|offene punkte|schema\b|todo\b)/i;
const INTERNAL_PARAGRAPH = /^(?:\*\*)?(?:REDAKTION|PRÜFVERMERK|PRUEFVERMERK|INTERN)\b/;

// Review markers. A bracket followed by "(" is a Markdown link, not a marker.
const MARKER_SRC = String.raw`\[\s*(?:(?:(?:prüfen|pruefen|prüfung|freigabe|quelle\s+ergänzen|quelle\s+ergaenzen|todo|tbd|name\s+aus)\b|name\s*,)[^\]]*|[^\]]*\beintragen\b[^\]]*)\](?!\()`;
export const MARKER_RE = new RegExp(MARKER_SRC, "iu");
const MARKER_ANY = /\[\s*(?:prüfen|pruefen|name\s*,)|prüfen\s*\]|pruefen\s*\]/iu;

// Names that must not appear publicly until the owner releases them.
// Remove a term here only together with the release of its passages.
export const EMBARGO_RE = /binni/iu;

export function hasEmbargo(text) {
  return EMBARGO_RE.test(String(text ?? ""));
}

export function hasMarker(text) {
  const s = String(text ?? "");
  return MARKER_RE.test(s) || MARKER_ANY.test(s) || EMBARGO_RE.test(s);
}

// Drops every sentence that names an embargo term.
function removeEmbargoSentences(input) {
  let text = input;
  for (let guard = 0; guard < 50; guard++) {
    const m = text.match(EMBARGO_RE);
    if (!m) break;
    const start = sentenceStart(text, m.index);
    const end = sentenceEnd(text, m.index + m[0].length);
    text = text.slice(0, start) + text.slice(end);
  }
  return text;
}

// ---------------------------------------------------------------- sentences

const ABBREVIATIONS = new Set([
  "ca", "bzw", "z", "b", "u", "a", "vgl", "ggf", "inkl", "exkl", "zzgl", "nr", "st", "dr", "abs", "art",
  "kat", "evtl", "usw", "etc", "max", "min", "mind", "rd", "s", "bspw", "d", "h", "o", "ä", "sog",
]);

// End of a sentence: terminal punctuation (plus closing quotes, brackets,
// emphasis) followed by whitespace, or a line break.
const BOUNDARY = /([.!?…])(["“”»)\]*_]*)(\s+|$)|\n/g;

function isBoundary(text, m) {
  if (m[0] === "\n") return true;
  const punct = m[1];
  const after = text.slice(m.index + m[0].length);
  if (!after) return true;
  // "ca. 55", "z. B.", "1. Juli", "Nr. 11": not a sentence end.
  if (punct === ".") {
    const word = text.slice(0, m.index).match(/([\p{L}\d]+)$/u)?.[1] ?? "";
    if (ABBREVIATIONS.has(word.toLowerCase())) return false;
    if (/^\d{1,2}$/.test(word)) return false;
  }
  // Next sentence starts with an uppercase letter, digit, quote, bracket or
  // emphasis – otherwise it is a continuation ("ca. drei", "z. B. bei").
  return /^[\p{Lu}\d„"“(\[*_]/u.test(after);
}

function boundaries(text) {
  const out = [];
  BOUNDARY.lastIndex = 0;
  let m;
  while ((m = BOUNDARY.exec(text))) {
    if (isBoundary(text, m)) out.push({ start: m.index, end: m.index + m[0].length, cut: m.index + m[0].length - (m[3]?.length ?? 1) });
  }
  return out;
}

// Index where the sentence containing position `pos` starts.
function sentenceStart(text, pos) {
  let start = 0;
  for (const b of boundaries(text)) {
    if (b.end <= pos) start = b.end;
    else break;
  }
  return start;
}

// Index right after the sentence containing position `pos` (incl. the
// whitespace that follows it).
function sentenceEnd(text, pos) {
  for (const b of boundaries(text)) {
    if (b.start >= pos) return b.end;
  }
  return text.length;
}

function tidy(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/[ \t]+(\*{1,2})(?=\s|$)/g, "$1")
    .trim();
}

// Removes every sentence that carries a marker. Returns "" when the marker
// opens the text (then the whole block goes).
export function removeMarkedSentences(input) {
  let text = String(input ?? "");
  for (let guard = 0; guard < 50; guard++) {
    const m = text.match(MARKER_RE);
    if (!m) break;
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    if (!before.trim()) return "";
    const trailing = before.match(/[.!?…]["“”»)\]*_]*\s*$/);
    if (trailing) {
      // Marker right after a sentence end → drop that preceding sentence.
      const core = before.slice(0, before.length - trailing[0].length);
      const start = sentenceStart(core, core.length);
      // Keep a trailing sentence end of the marker itself ("… [prüfen].").
      const rest = after.replace(/^[.!?…]?\s*/, "");
      text = before.slice(0, start) + rest;
    } else {
      const start = sentenceStart(before, before.length);
      const endInAfter = sentenceEnd(after, 0);
      text = before.slice(0, start) + after.slice(endInAfter);
    }
    if (!text.trim()) return "";
  }
  // Embargo terms outside the (now removed) markers take their sentence along.
  text = removeEmbargoSentences(text);
  if (!text.trim()) return "";
  let out = tidy(text);
  // A paragraph wrapped in emphasis ("*Stand: … [Name …].*") keeps its
  // closing "*" when the last sentence was removed.
  const wrap = String(input).trim().match(/^(\*{1,2})[^*][\s\S]*[^*]\1$/)?.[1];
  if (wrap && out.startsWith(wrap) && !out.endsWith(wrap)) out += wrap;
  return hasMarker(out) ? "" : out;
}

// ---------------------------------------------------------------- blocks

// Cuts the article at the first internal section.
export function cutInternal(blocks) {
  const idx = blocks.findIndex(
    (b) =>
      (b.type === "heading" && INTERNAL_HEADING.test(b.text.replace(/^\W+/, ""))) ||
      (b.type === "paragraph" && INTERNAL_PARAGRAPH.test(b.text))
  );
  return idx === -1 ? blocks : blocks.slice(0, idx);
}

const FAQ_HEADING = /^(häufige fragen|haeufige fragen|faq|fragen und antworten)/i;

// Turns the "Häufige Fragen" section into one { type: "faq", items } block.
// Supports both article styles: "**Frage?**\nAntwort" paragraphs and
// "### Frage?" headings followed by paragraphs.
export function extractFaq(blocks) {
  const start = blocks.findIndex((b) => b.type === "heading" && b.level === 2 && FAQ_HEADING.test(b.text));
  if (start === -1) return blocks;
  let end = blocks.findIndex((b, i) => i > start && ((b.type === "heading" && b.level <= 2) || b.type === "hr"));
  if (end === -1) end = blocks.length;

  const items = [];
  let current = null;
  for (const b of blocks.slice(start + 1, end)) {
    if (b.type === "heading" && b.level >= 3) {
      current = { q: b.text, a: [] };
      items.push(current);
      continue;
    }
    if (b.type === "paragraph") {
      // A marker may follow the bold question on the same line.
      const m = b.text.match(/^\*\*([^*]+?)\*\*([^\n]*)\n([\s\S]+)$/);
      if (m) {
        const extra = m[2].trim();
        current = { q: extra ? `${m[1].trim()} ${extra}` : m[1].trim(), a: [m[3].trim()] };
        items.push(current);
        continue;
      }
      if (current) current.a.push(b.text);
      continue;
    }
    if (b.type === "list" && current) current.a.push(...b.items.map((t) => `– ${t}`));
  }
  return [...blocks.slice(0, start + 1), { type: "faq", items }, ...blocks.slice(end)];
}

function filterFaq(block) {
  const items = [];
  for (const item of block.items) {
    // Marker in the question or an embargo term in the answer → whole item.
    if (hasMarker(item.q) || item.a.some(hasEmbargo)) continue;
    const a = item.a.map(removeMarkedSentences).filter(Boolean);
    if (a.length) items.push({ q: item.q, a });
  }
  return items.length ? { ...block, items } : null;
}

function filterBlock(block) {
  switch (block.type) {
    case "paragraph": {
      const text = removeMarkedSentences(block.text);
      return text ? { ...block, text } : null;
    }
    case "list": {
      // A list item is one unit: any marker removes the whole item.
      const items = block.items.filter((t) => !hasMarker(t));
      return items.length ? { ...block, items } : null;
    }
    case "table": {
      if (block.head.some(hasMarker)) return null;
      const rows = block.rows.filter((r) => !r.some(hasMarker));
      return rows.length ? { ...block, rows } : null;
    }
    case "quote": {
      const children = filterBlocks(block.children);
      return children.some((c) => c.type !== "heading") ? { ...block, children } : null;
    }
    case "faq":
      return filterFaq(block);
    default:
      return block;
  }
}

// Applies the marker rules to a block list (see file header).
export function filterBlocks(blocks) {
  const out = [];
  let skipLevel = 0; // > 0 while a dropped section runs (its heading level)
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "heading") {
      if (skipLevel && b.level > skipLevel) continue;
      skipLevel = 0;
      const next = blocks[i + 1];
      const flaggedSection =
        hasMarker(b.text) ||
        (next?.type === "paragraph" && MARKER_RE.test(next.text) && !next.text.replace(new RegExp(MARKER_SRC, "giu"), "").trim());
      if (flaggedSection) {
        skipLevel = b.level;
        continue;
      }
      out.push(b);
      continue;
    }
    if (skipLevel) continue;
    const f = filterBlock(b);
    if (f) out.push(f);
  }
  return cleanup(out);
}

function blockText(b) {
  switch (b.type) {
    case "heading":
    case "paragraph":
      return b.text;
    case "list":
      return b.items.join("\n");
    case "table":
      return [...b.head, ...b.rows.flat()].join("\n");
    case "quote":
      return b.children.map(blockText).join("\n");
    case "faq":
      return b.items.map((it) => [it.q, ...it.a].join("\n")).join("\n");
    default:
      return "";
  }
}

// Removes headings without content, leading/trailing/double rules, and – as
// the last guard – any block in which a marker survived.
function cleanup(blocks) {
  let list = blocks.filter((b) => !hasMarker(blockText(b)));
  let changed = true;
  while (changed) {
    changed = false;
    const next = [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.type === "heading") {
        const following = list.slice(i + 1).find(() => true);
        const empty = !following || (following.type === "heading" && following.level <= b.level) || following.type === "hr";
        if (empty && b.level > 1) {
          changed = true;
          continue;
        }
      }
      if (b.type === "hr" && (next.length === 0 || next[next.length - 1].type === "hr" || i === list.length - 1)) {
        changed = true;
        continue;
      }
      next.push(b);
    }
    list = next;
  }
  return list;
}

export { blockText };
