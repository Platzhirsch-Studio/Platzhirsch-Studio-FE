// Minimal YAML front-matter parser for the Ratgeber articles
// (src/content/ratgeber/*.md). Supports exactly what those files use:
//   key: value            (plain, "double" or 'single' quoted)
//   key:                  followed by "  - item" lines (list of scalars)
//   true / false / null   (as booleans / null)
// Dates stay strings ("2026-10-26"). No dependency on an npm package.
// Pure module: no "@/" imports, no "server-only" (unit-tested with node --test).

function scalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    const inner = v.slice(1, -1);
    return v.startsWith('"') ? inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\") : inner.replace(/''/g, "'");
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  return v;
}

// Returns { data, body }. Without a front-matter block, data is {} and body
// is the whole text.
export function parseFrontmatter(source) {
  const text = String(source ?? "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!text.startsWith("---\n")) return { data: {}, body: text };
  const end = text.indexOf("\n---\n", 3);
  if (end === -1) return { data: {}, body: text };
  const head = text.slice(4, end);
  const body = text.slice(end + 5);

  const data = {};
  let listKey = null;
  for (const line of head.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(scalar(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = scalar(rest);
      listKey = null;
    }
  }
  return { data, body };
}
