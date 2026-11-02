// QM planer-tools r2: Katalogtitel wie „Arc Dining Table, L250 - H35mm - Coffee
// Black Oak“ standen roh im Moodboard. Für die Anzeige: Produktname, darunter
// die Ausführung ohne Maßangaben. Der Originaltitel bleibt in den Daten.
const DIM = /^(?:[LBHTDØ]\s?\d+(?:[.,]\d+)?\s?(?:mm|cm|m)?|\d+(?:[.,]\d+)?\s?(?:mm|cm|m)|\d+\s?[x×]\s?\d+(?:\s?[x×]\s?\d+)?\s?(?:mm|cm)?)$/i;

// QM r3: Maß mitten im Titel ohne Komma („Camouflage 240 mm Non Dimmable Crema d'Orcia Stone“):
// Name = Teil vor dem Maß, Ausführung = Rest ohne technische Zusätze (Dimmbarkeit, Lichtfarbe).
const INLINE_DIM = /\s(?:[LBHTDØ]\s?)?\d+(?:[.,]\d+)?\s?(?:mm|cm)\b/i;
const TECH = /\b(?:non[- ]?dimmable|dimmable|nicht dimmbar|dimmbar|dali|\d{4}\s?k)\b/gi;
function splitInlineDim(raw) {
  const m = INLINE_DIM.exec(raw);
  if (!m || m.index < 2) return { name: raw, finish: "" };
  const base = raw.slice(0, m.index).trim();
  const finish = raw
    .slice(m.index + m[0].length)
    .replace(TECH, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,–-]+|[\s,–-]+$/g, "");
  return { name: base, finish };
}

export function splitProductName(name) {
  if (typeof name !== "string") return { name: name ?? "", finish: "" };
  const raw = name.trim();
  const comma = raw.indexOf(", ");
  if (comma < 0) return splitInlineDim(raw);
  const base = raw.slice(0, comma).trim();
  const parts = raw
    .slice(comma + 2)
    .split(/\s+[-–]\s+|,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  // nur zerlegen, wenn wirklich Maße im Rest stehen – sonst ist das Komma Teil des Namens
  if (!parts.some((p) => DIM.test(p))) return { name: raw, finish: "" };
  return { name: base, finish: parts.filter((p) => !DIM.test(p)).join(", ") };
}
