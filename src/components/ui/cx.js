// Joins class names, skipping falsy values: cx("a", cond && "b").
export default function cx(...parts) {
  return parts.flat().filter(Boolean).join(" ");
}
