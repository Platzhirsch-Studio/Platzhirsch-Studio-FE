// HTTP byte ranges for the demo clip route (single range only, RFC 9110 14.1.2).
// Pure: unit-tested in tests/unit/r5-content.test.mjs.
/** Parses "bytes=a-b" against `size`; null = no/invalid range, false = unsatisfiable. */
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start;
  let end;
  if (m[1] === "") {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return false;
  return { start, end };
}
