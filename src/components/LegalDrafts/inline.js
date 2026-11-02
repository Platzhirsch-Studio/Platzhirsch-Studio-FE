// Inline markup of the legal drafts (Marktresearch/recht/*.md) – a small,
// predictable subset, so the texts can be taken over from the drafts almost
// word for word:
//   **fett**   *kursiv*   `code`   <https://…>   [Linktext](https://…|#anker)
//   [ … ]      open point of the draft → <mark> (counted, listed per page)
//   [Verbraucher]  label of the AGB (not an open point) → small badge
// Pure functions (tokenize, openPoints, kindOf) have no React import, so the
// unit test can run them in plain Node.

const LABELS = new Set(["Verbraucher"]);

/** Index of the "]" that closes the "[" at `start` (nested brackets allowed). */
function closingBracket(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Splits a draft string into tokens:
 * {t:"text",v} {t:"b",c:[…]} {t:"i",c:[…]} {t:"code",v} {t:"link",href,c:[…]}
 * {t:"mark",v,c:[…]} {t:"label",v}
 */
export function tokenize(text) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        out.push({ t: "b", c: tokenize(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (ch === "*" && text[i + 1] !== "*" && text[i + 1] !== " ") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && text[end - 1] !== " ") {
        flush();
        out.push({ t: "i", c: tokenize(text.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i) {
        flush();
        out.push({ t: "code", v: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "<" && text.startsWith("<http", i)) {
      const end = text.indexOf(">", i);
      if (end > i) {
        flush();
        const href = text.slice(i + 1, end);
        out.push({ t: "link", href, c: [{ t: "text", v: href.replace(/^https?:\/\//, "") }] });
        i = end + 1;
        continue;
      }
    }
    if (ch === "[") {
      const end = closingBracket(text, i);
      if (end > i) {
        const inner = text.slice(i + 1, end);
        // Markdown link [text](https://…), also mailto:, tel: and in-page
        // anchors (#id, e.g. the section column of "Eingesetzte Dienste")
        if (/^\((https?:|mailto:|tel:|#[\w-])/.test(text.slice(end + 1, end + 9))) {
          const close = text.indexOf(")", end + 1);
          if (close > end) {
            flush();
            out.push({ t: "link", href: text.slice(end + 2, close), c: tokenize(inner) });
            i = close + 1;
            continue;
          }
        }
        flush();
        // [Verbraucher], [MODUL], [MODUL, nur wenn eingesetzt] are labels of the draft, not open points.
        if (LABELS.has(inner) || /^MODUL\b/.test(inner)) out.push({ t: "label", v: inner });
        else out.push({ t: "mark", v: inner, c: tokenize(inner) });
        i = end + 1;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

/** Plain text of a token list (for anchors, counting, tests). */
export function plain(tokens) {
  return tokens
    .map((tk) => (tk.t === "text" || tk.t === "code" ? tk.v : tk.t === "label" ? `[${tk.v}]` : tk.t === "mark" ? `[${plain(tk.c)}]` : plain(tk.c || [])))
    .join("");
}

/**
 * Kind of an open point, from the wording of the draft:
 * "anwalt"  = Rechtsfrage ([anwaltlich prüfen])
 * "inhaber" = Fakt/Entscheidung fehlt ([vom Unternehmen auszufüllen], [●], …)
 * "pruefen" = Anbieterangabe nachlesen ([prüfen])
 */
export function kindOf(text) {
  const s = text.toLowerCase();
  if (s.includes("anwalt") || s.includes("kanzlei")) return "anwalt";
  if (s.includes("unternehmen") || s.includes("inhaber") || s.includes("●") || s.includes("entscheidung") || s.includes("steuerberat")) return "inhaber";
  if (s.includes("prüfen")) return "pruefen";
  // Short placeholders like [14], [3 Jahre], [1–2], [Name], [x.y] are values
  // the company still has to set; longer notes without a keyword are checks.
  return s.length <= 24 ? "inhaber" : "pruefen";
}

/** Number of brackets nested inside a token list (parts of one open point). */
function nestedMarks(tokens) {
  return tokens.reduce((n, tk) => n + (tk.t === "mark" ? 1 : 0) + nestedMarks(tk.c || []), 0);
}

/**
 * All open points in a string. Counting rule: one open point per OUTERMOST
 * bracket; brackets inside it are its `parts`, settled with it and not
 * counted separately.
 */
export function openPoints(text) {
  if (typeof text !== "string") return [];
  return tokenize(text).flatMap(function walk(tk) {
    if (tk.t === "mark") return [{ text: plain(tk.c), kind: kindOf(plain(tk.c)), parts: nestedMarks(tk.c) }];
    return (tk.c || []).flatMap(walk);
  });
}
