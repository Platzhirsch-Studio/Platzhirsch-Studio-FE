// Small Markdown parser for the Ratgeber articles. Covers the subset the
// articles use and nothing more: ATX headings, paragraphs, bullet and
// numbered lists, pipe tables, block quotes, horizontal rules; inline bold,
// italic, code and links. Raw HTML is never passed through: HTML comments are
// removed, any other tag stays plain text (React escapes it).
// Pure module (no "@/", no "server-only"), unit-tested with node --test.

// ---------------------------------------------------------------- helpers

const UMLAUTS = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue" };

export function slugify(text) {
  return toPlain(text)
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUTS[c])
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Inline Markdown → plain text (for JSON-LD, ids, tests).
export function toPlain(text) {
  return String(text ?? "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(LINK_RE_GLOBAL, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(?!\s)(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------- blocks

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
const TABLE_SEP = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// Removes HTML comments (single- and multi-line). Editorial notes live there.
export function stripComments(text) {
  return String(text ?? "").replace(/<!--[\s\S]*?(?:-->|$)/g, "");
}

// Markdown text → array of blocks:
//   { type: "heading", level, text }
//   { type: "paragraph", text }            (soft line breaks kept as "\n")
//   { type: "list", ordered, start, items: [text] }
//   { type: "table", head: [text], rows: [[text]] }
//   { type: "quote", children: [block] }
//   { type: "hr" }
export function parseBlocks(markdown) {
  const lines = stripComments(markdown).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "paragraph", text: para.join("\n").trim() });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      flush();
      continue;
    }

    const h = line.match(HEADING);
    if (h) {
      flush();
      blocks.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      continue;
    }

    if (HR.test(line) && !para.length) {
      blocks.push({ type: "hr" });
      continue;
    }

    if (/^\s{0,3}>/.test(line)) {
      flush();
      const inner = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        inner.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
        i++;
      }
      i--;
      blocks.push({ type: "quote", children: parseBlocks(inner.join("\n")) });
      continue;
    }

    if (line.trim().startsWith("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1].trim())) {
      flush();
      const head = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      blocks.push({ type: "table", head, rows });
      continue;
    }

    const li = line.match(LIST_ITEM);
    if (li) {
      flush();
      const ordered = /\d/.test(li[2]);
      const items = [];
      const start = ordered ? parseInt(li[2], 10) : 1;
      let current = null;
      for (; i < lines.length; i++) {
        const l = lines[i];
        const m = l.match(LIST_ITEM);
        if (m && /\d/.test(m[2]) === ordered && m[1].length < 2) {
          current = [m[3]];
          items.push(current);
          continue;
        }
        if (!l.trim()) {
          // A blank line ends the list unless the next line continues it.
          const next = lines[i + 1] ?? "";
          const nm = next.match(LIST_ITEM);
          if (nm && /\d/.test(nm[2]) === ordered && nm[1].length < 2) continue;
          break;
        }
        if (/^\s{2,}\S/.test(l) && current) {
          current.push(l.trim());
          continue;
        }
        if (HEADING.test(l) || /^\s{0,3}>/.test(l) || l.trim().startsWith("|")) break;
        // Lazy continuation line.
        if (current) current.push(l.trim());
      }
      i--;
      blocks.push({ type: "list", ordered, start, items: items.map((it) => it.join(" ").trim()) });
      continue;
    }

    para.push(line);
  }
  flush();
  return blocks;
}

// ---------------------------------------------------------------- inline

// [text](url) with one level of balanced parentheses in the URL
// (e.g. https://en.wikipedia.org/wiki/Martindale_(unit)).
const LINK_SRC = String.raw`\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)`;
const LINK_RE = new RegExp(LINK_SRC);
const LINK_RE_GLOBAL = new RegExp(LINK_SRC, "g");

// QM: CommonMark backslash escapes ("\*" → a literal "*"). Emphasis bodies
// take a backslash only together with the next character, so an escaped "*"
// never closes them ("*\*Laut Verfasser …*" rendered a stray "\").
const INLINE_RULES = [
  { type: "escape", re: /\\([\\`*_[\]()#+\-.!|~<>])/ },
  { type: "code", re: /`([^`]+)`/ },
  { type: "link", re: LINK_RE },
  { type: "strong", re: /\*\*(?!\s)((?:\\[\s\S]|[^\\])+?)\*\*/ },
  { type: "em", re: /\*(?![\s*])((?:\\[\s\S]|[^\\])+?)\*/ },
];

// Inline Markdown → nodes:
//   { type: "text", value } | { type: "strong"|"em", children }
//   { type: "code", value } | { type: "link", href, children }
export function parseInline(text) {
  const nodes = [];
  let rest = String(text ?? "");
  while (rest) {
    let best = null;
    for (const rule of INLINE_RULES) {
      const m = rest.match(rule.re);
      if (m && (best === null || m.index < best.m.index)) best = { rule, m };
    }
    if (!best) {
      nodes.push({ type: "text", value: rest });
      break;
    }
    const { rule, m } = best;
    if (m.index > 0) nodes.push({ type: "text", value: rest.slice(0, m.index) });
    if (rule.type === "escape") nodes.push({ type: "text", value: m[1] });
    else if (rule.type === "code") nodes.push({ type: "code", value: m[1] });
    else if (rule.type === "link") nodes.push({ type: "link", href: m[2], children: parseInline(m[1]) });
    else nodes.push({ type: rule.type, children: parseInline(m[1]) });
    rest = rest.slice(m.index + m[0].length);
  }
  return nodes;
}

// Only these link targets are rendered as links; anything else (javascript:,
// data:, …) becomes plain text.
export function classifyHref(href) {
  const h = String(href ?? "").trim();
  if (/^https?:\/\//i.test(h)) return "external";
  if (/^\/(?!\/)/.test(h)) return "internal";
  if (h.startsWith("#")) return "anchor";
  if (/^(mailto|tel):/i.test(h)) return "contact";
  return null;
}
